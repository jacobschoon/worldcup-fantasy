// ESPN public API — no auth required.
// Fixtures: site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
// Match summary: site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary
// Proxied through /api/fixtures and /api/espnmatch so the browser never hits ESPN directly.

function cacheKey(url) {
  return `wc_cache_${url}`
}
function fromCache(url) {
  try {
    const raw = localStorage.getItem(cacheKey(url))
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
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

function normalizeEspnStatus(comp) {
  const type = comp?.status?.type
  if (!type) return 'NS'
  const { state, completed, name } = type
  if (state === 'post' || completed === true) return 'FT'
  if (state === 'in') {
    if (name === 'STATUS_HALFTIME') return 'HT'
    if (name === 'STATUS_EXTRA_TIME') return 'ET'
    if (name === 'STATUS_SHOOTOUT') return 'P'
    return 'LIVE'
  }
  if (name === 'STATUS_POSTPONED') return 'PST'
  if (name === 'STATUS_CANCELED' || name === 'STATUS_CANCELLED') return 'CANC'
  return 'NS'
}

function formatEspnRound(event) {
  const headline = event.competitions?.[0]?.notes?.[0]?.headline || ''
  if (headline) return headline
  const week = event.week?.number
  return week ? `Group Stage - Matchday ${week}` : 'Unknown'
}

function normalizeMatch(event) {
  const comp = event.competitions?.[0] || {}
  const home = comp.competitors?.find(c => c.homeAway === 'home') || {}
  const away = comp.competitors?.find(c => c.homeAway === 'away') || {}
  const homeScore = home.score != null ? Number(home.score) : null
  const awayScore = away.score != null ? Number(away.score) : null
  const status = normalizeEspnStatus(comp)
  return {
    fixture: {
      id: event.id,
      date: event.date,
      status: { short: status },
    },
    league: { round: formatEspnRound(event) },
    teams: {
      home: { name: home.team?.displayName || '' },
      away: { name: away.team?.displayName || '' },
    },
    goals: {
      home: (status === 'FT' || status === 'LIVE' || status === 'HT' || status === 'ET' || status === 'P') ? homeScore : null,
      away: (status === 'FT' || status === 'LIVE' || status === 'HT' || status === 'ET' || status === 'P') ? awayScore : null,
    },
  }
}

export async function fetchFixtures() {
  const path = '/api/fixtures'
  // Bust stale non-ESPN cache (old format had .matches or .response, ESPN has .events)
  const cached = fromCache(path)
  if (cached !== null && !cached.events) {
    console.log('[fetchFixtures] clearing stale non-ESPN cache')
    localStorage.removeItem(cacheKey(path))
  }
  const data = await internalFetch(path)
  console.log('[fetchFixtures] raw response keys:', Object.keys(data))
  return (data.events || []).map(normalizeMatch)
}

export async function fetchEspnMatchStats(eventId) {
  return internalFetch(`/api/espnmatch?eventId=${eventId}`)
}

// Parse ESPN summary rosters into our scoring format.
// summaryData: full response from GET /api/espnmatch?eventId=ID
// Returns: { [playerName]: { goals, assists, mins, yellow, red, saves, pen_saved, pen_missed, own_goal, clean_team } }
export function parseEspnMatchStats(summaryData, homeScore, awayScore) {
  console.log('[parseEspnMatchStats] homeScore:', homeScore, 'awayScore:', awayScore)
  console.log('[parseEspnMatchStats] roster entries:', summaryData?.rosters?.length ?? 0)

  const result = {}
  const homePlayerNames = new Set()
  const awayPlayerNames = new Set()

  function ensurePlayer(name) {
    if (!result[name]) {
      result[name] = { goals: 0, assists: 0, mins: 0, yellow: 0, red: 0, saves: 0, pen_saved: 0, pen_missed: 0, own_goal: 0, clean_team: false }
    }
  }

  function getStat(stats, statName) {
    const entry = (stats || []).find(s => s.name === statName)
    return entry ? Number(entry.value) : 0
  }

  ;(summaryData?.rosters || []).forEach(roster => {
    const isHome = roster.homeAway === 'home'
    const bucket = isHome ? homePlayerNames : awayPlayerNames

    ;(roster.roster || []).forEach(entry => {
      const name = entry.athlete?.displayName
      if (!name) return
      if (!entry.played && !entry.starter) return

      ensurePlayer(name)
      bucket.add(name)

      const stats = entry.stats || []
      const mins = getStat(stats, 'minutesPlayed') || (entry.starter ? 90 : 0)
      result[name].mins = Math.max(result[name].mins, mins)
      result[name].goals   += getStat(stats, 'goals')
      result[name].assists += getStat(stats, 'assists')
      result[name].yellow  += getStat(stats, 'yellowCards')
      result[name].red     += getStat(stats, 'redCards')
      result[name].saves   += getStat(stats, 'saves')
    })
  })

  const homeClean = awayScore === 0
  const awayClean = homeScore === 0
  homePlayerNames.forEach(name => { if (result[name]) result[name].clean_team = homeClean })
  awayPlayerNames.forEach(name => { if (result[name]) result[name].clean_team = awayClean })

  console.log('[parseEspnMatchStats] players parsed:', Object.keys(result).length)
  return result
}

// Look up a squad player's stats from a parsed stats object.
// Tries exact name match first, then falls back to matching by last name only.
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
