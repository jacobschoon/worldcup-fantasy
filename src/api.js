// football-data.org v4 — requests are proxied through our own serverless functions
// so the API key never touches the browser. See api/fixtures.js and api/matchstats.js.
// World Cup 2026: competition code WC

// Cache results in localStorage to avoid burning requests
function cacheKey(url) {
  return `wc_cache_${url}`
}
function fromCache(url) {
  try {
    const raw = localStorage.getItem(cacheKey(url))
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    // Cache valid for 3 hours
    if (Date.now() - ts < 3 * 60 * 60 * 1000) return data
  } catch { /* ignore */ }
  return null
}
function toCache(url, data) {
  try {
    localStorage.setItem(cacheKey(url), JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore */ }
}

async function internalFetch(path) {
  const cached = fromCache(path)
  if (cached) return cached
  const res = await fetch(path)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json()
  toCache(path, json)
  return json
}

function normalizeStatus(status) {
  const map = {
    FINISHED: 'FT', IN_PLAY: 'LIVE', PAUSED: 'HT',
    EXTRA_TIME: 'ET', PENALTY_SHOOTOUT: 'P',
    SCHEDULED: 'NS', TIMED: 'NS',
    POSTPONED: 'PST', SUSPENDED: 'SUSP', CANCELLED: 'CANC',
  }
  return map[status] || status
}

function formatRound(m) {
  if (m.stage === 'GROUP_STAGE') return `Group Stage - Matchday ${m.matchday}`
  const stages = {
    LAST_16: 'Round of 16',
    QUARTER_FINALS: 'Quarter-finals',
    SEMI_FINALS: 'Semi-finals',
    THIRD_PLACE: 'Third-place play-off',
    FINAL: 'Final',
  }
  return stages[m.stage] || m.stage || 'Unknown'
}

// Normalize a football-data.org match into the shape the rest of the app expects
function normalizeMatch(m) {
  return {
    fixture: {
      id: m.id,
      date: m.utcDate,
      status: { short: normalizeStatus(m.status) },
    },
    league: { round: formatRound(m) },
    teams: {
      home: { name: m.homeTeam?.name || '' },
      away: { name: m.awayTeam?.name || '' },
    },
    goals: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
    },
  }
}

// Get all fixtures for WC 2026
export async function fetchFixtures() {
  const data = await internalFetch('/api/fixtures')
  return (data.matches || []).map(normalizeMatch)
}

// Get match data (goals, lineups, bookings) for a specific fixture
export async function fetchFixtureStats(fixtureId) {
  return internalFetch(`/api/matchstats?fixture=${fixtureId}`)
}

// Parse football-data.org match data into our scoring format.
// matchData: the full match object from GET /matches/{id}
// Returns: { [playerName]: { goals, assists, mins, yellow, red, saves, pen_saved, pen_missed, own_goal, clean_team } }
export function parseMatchStats(matchData, homeScore, awayScore) {
  console.log('[parseMatchStats] match', matchData.id,
    '|', matchData.homeTeam?.name, homeScore, '-', awayScore, matchData.awayTeam?.name)
  console.log('[parseMatchStats] goals array:', JSON.stringify(matchData.goals))
  console.log('[parseMatchStats] bookings array:', JSON.stringify(matchData.bookings))
  console.log('[parseMatchStats] scorer names from API:',
    (matchData.goals || []).map(g => g.scorer?.name).filter(Boolean))

  const result = {}
  const homeId = matchData.homeTeam?.id
  const homePlayerNames = new Set()
  const awayPlayerNames = new Set()

  function ensurePlayer(name) {
    if (!result[name]) {
      result[name] = { goals: 0, assists: 0, mins: 0, yellow: 0, red: 0, saves: 0, pen_saved: 0, pen_missed: 0, own_goal: 0, clean_team: false }
    }
  }

  // Starters from lineups — set mins to 90 when lineup data is present
  if (Array.isArray(matchData.lineups)) {
    matchData.lineups.forEach(lineup => {
      const isHome = lineup.team?.id === homeId
      const bucket = isHome ? homePlayerNames : awayPlayerNames
      ;(lineup.startXI || []).forEach(({ player }) => {
        if (!player?.name) return
        ensurePlayer(player.name)
        result[player.name].mins = 90
        bucket.add(player.name)
      })
    })
  }

  // Goals and assists
  ;(matchData.goals || []).forEach(({ type, team, scorer, assist }) => {
    if (scorer?.name) {
      ensurePlayer(scorer.name)
      const isHome = team?.id === homeId
      ;(isHome ? homePlayerNames : awayPlayerNames).add(scorer.name)
      if (!result[scorer.name].mins) result[scorer.name].mins = 90
      if (type === 'OWN_GOAL') {
        result[scorer.name].own_goal += 1
      } else {
        result[scorer.name].goals += 1
      }
    }
    if (assist?.name) {
      ensurePlayer(assist.name)
      result[assist.name].assists += 1
      if (!result[assist.name].mins) result[assist.name].mins = 90
    }
  })

  // Yellow and red cards — football-data.org card strings are YELLOW_CARD / RED_CARD / YELLOW_RED_CARD
  ;(matchData.bookings || []).forEach(({ player, card, team }) => {
    if (!player?.name) return
    ensurePlayer(player.name)
    const isHome = team?.id === homeId
    ;(isHome ? homePlayerNames : awayPlayerNames).add(player.name)
    if (!result[player.name].mins) result[player.name].mins = 90
    if (card === 'YELLOW_CARD') result[player.name].yellow += 1
    else if (card === 'RED_CARD' || card === 'YELLOW_RED_CARD') result[player.name].red += 1
  })

  // Clean sheets — team conceded 0 goals
  const homeClean = awayScore === 0
  const awayClean = homeScore === 0
  homePlayerNames.forEach(name => { if (result[name]) result[name].clean_team = homeClean })
  awayPlayerNames.forEach(name => { if (result[name]) result[name].clean_team = awayClean })

  console.log('[parseMatchStats] result keys:', Object.keys(result))
  return result
}

// Look up a squad player's stats from a parsed stats object.
// Tries exact name match first, then falls back to matching by last name only
// to handle API name variants (e.g. "K. Mbappé" vs "Kylian Mbappé",
// "Erling Braut Haaland" vs "Erling Haaland").
export function lookupPlayerStats(statsObj, playerName) {
  if (statsObj[playerName]) return statsObj[playerName]
  const lastName = playerName.split(' ').slice(-1)[0].toLowerCase()
  const key = Object.keys(statsObj).find(
    k => k.split(' ').slice(-1)[0].toLowerCase() === lastName
  )
  if (key) {
    console.log(`[lookupPlayerStats] fuzzy match: "${playerName}" → "${key}"`)
  }
  return key ? statsObj[key] : null
}

// Group normalised fixtures by matchday round string
export function groupFixturesByMatchday(fixtures) {
  const groups = {}
  fixtures.forEach(f => {
    const round = f.league.round || 'Unknown'
    if (!groups[round]) groups[round] = []
    groups[round].push({
      id: f.fixture.id,
      home: f.teams.home.name,
      homeflag: '',
      away: f.teams.away.name,
      awayflag: '',
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      status: f.fixture.status.short,
      date: f.fixture.date,
      round,
    })
  })
  return groups
}
