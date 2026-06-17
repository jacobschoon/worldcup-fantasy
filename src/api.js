// API-Football v3 — requests are proxied through our own serverless functions
// so the API key never touches the browser. See api/fixtures.js and api/matchstats.js.
// World Cup 2026: league=1, season=2026

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

// Get all fixtures for WC 2026
export async function fetchFixtures() {
  const data = await internalFetch('/api/fixtures')
  return data.response || []
}

// Get player stats for a specific fixture
export async function fetchFixtureStats(fixtureId) {
  const data = await internalFetch(`/api/matchstats?fixture=${fixtureId}`)
  return data.response || []
}

// Parse API-Football player stats into our scoring format
// Returns: { [playerName]: { goals, assists, mins, yellow, red, saves, pen_saved, pen_missed, own_goal, clean_team } }
export function parseMatchStats(fixtureStatsResponse, homeScore, awayScore) {
  const result = {}

  fixtureStatsResponse.forEach(teamData => {
    const isHome = teamData.team.id === teamData.team.id // always true, used for clean sheet
    const teamGoals = teamData.team.id // we'll resolve clean sheet from scores passed in

    teamData.players.forEach(({ player, statistics }) => {
      const s = statistics[0]
      if (!s) return

      const mins = s.games?.minutes || 0
      if (mins === 0) return // didn't play

      result[player.name] = {
        goals:      s.goals?.total        || 0,
        assists:    s.goals?.assists       || 0,
        mins,
        yellow:     s.cards?.yellow       || 0,
        red:        (s.cards?.red || 0) + (s.cards?.yellowred || 0),
        saves:      s.goals?.saves        || 0,
        pen_saved:  s.penalty?.saved      || 0,
        pen_missed: s.penalty?.missed     || 0,
        own_goal:   s.goals?.owngoals     || 0,
        // clean_team resolved per team below
        clean_team: false,
      }
    })
  })

  // Resolve clean sheets: if a team scored 0, their players get clean_team=true
  fixtureStatsResponse.forEach(teamData => {
    // Determine if this team's opponents scored 0
    // homeScore / awayScore passed from fixture data
    const isHome = fixtureStatsResponse.indexOf(teamData) === 0
    const conceded = isHome ? awayScore : homeScore
    const cleanSheet = conceded === 0

    teamData.players.forEach(({ player }) => {
      if (result[player.name]) {
        result[player.name].clean_team = cleanSheet
      }
    })
  })

  return result
}

// Get status of all WC fixtures, grouped by matchday
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
      status: f.fixture.status.short, // FT, NS, 1H, 2H, HT etc
      date: f.fixture.date,
      round,
    })
  })
  return groups
}
