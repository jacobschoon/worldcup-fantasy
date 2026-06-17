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
  console.log('[fetchEspnMatchStats] fetching eventId:', eventId)
  return internalFetch(`/api/espnmatch?eventId=${eventId}`)
}

// Parse ESPN summary rosters into our scoring format.
// summaryData: full response from GET /api/espnmatch?eventId=ID
// Returns: { [playerName]: { goals, assists, mins, yellow, red, saves, pen_saved, pen_missed, own_goal, clean_team } }
export function parseEspnMatchStats(summaryData, homeScore, awayScore) {
  const comp = summaryData?.header?.competitions?.[0]
  const eventId = summaryData?.header?.id || comp?.id || '?'
  console.log('[parseEspnMatchStats] eventId:', eventId, '| homeScore:', homeScore, 'awayScore:', awayScore)
  console.log('[parseEspnMatchStats] rosters:', summaryData?.rosters?.length ?? 'missing',
    '| keyEvents:', summaryData?.keyEvents?.length ?? 'missing')

  // Log details array so we can verify goal/card event structure
  const details = comp?.details || []
  console.log('[parseEspnMatchStats] details count:', details.length)
  if (details.length > 0) {
    const first = details[0]
    console.log('[parseEspnMatchStats] first detail keys:', Object.keys(first),
      '| scoringPlay:', first.scoringPlay, '| ownGoal:', first.ownGoal,
      '| scorer:', first.participants?.[0]?.athlete?.displayName)
  }

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

  // Build substitution clock map from keyEvents.
  // participants[0] = player coming ON, participants[1] = player going OFF.
  const subOutMinute = {}  // athleteId -> minute when subbed off
  const subInMinute  = {}  // athleteId -> minute when subbed on
  ;(summaryData?.keyEvents || []).forEach(e => {
    if (e.type?.type !== 'substitution') return
    const mins  = Math.ceil((e.clock?.value || 0) / 60) || 1
    const inId  = e.participants?.[0]?.athlete?.id
    const outId = e.participants?.[1]?.athlete?.id
    if (inId)  subInMinute[inId]  = mins
    if (outId) subOutMinute[outId] = mins
  })

  ;(summaryData?.rosters || []).forEach(roster => {
    const isHome = roster.homeAway === 'home'
    const bucket = isHome ? homePlayerNames : awayPlayerNames
    const teamName = roster.team?.displayName || (isHome ? 'home' : 'away')

    // Log every player name so name mismatches are visible in the console
    const playedNames = (roster.roster || [])
      .filter(e => e.starter || e.subbedIn)
      .map(e => e.athlete?.displayName?.trim())
      .filter(Boolean)
    console.log(`[parseEspnMatchStats] ${teamName} roster (${playedNames.length}):`, playedNames.join(', '))

    ;(roster.roster || []).forEach(entry => {
      // Trim to handle ESPN's trailing-space names like 'Pedri ', 'Rodri ', 'Gavi '
      const name      = entry.athlete?.displayName?.trim()
      const athleteId = entry.athlete?.id
      if (!name) return

      // Derive minutes from starter/sub flags + substitution clock data
      let mins
      if (entry.starter) {
        mins = subOutMinute[athleteId] ?? 90
      } else if (entry.subbedIn) {
        mins = Math.max(1, 90 - (subInMinute[athleteId] ?? 90))
      } else {
        return  // unused squad member — didn't play
      }

      ensurePlayer(name)
      bucket.add(name)
      result[name].mins = Math.max(result[name].mins, mins)

      const stats = entry.stats || []
      // ESPN stat names: totalGoals, goalAssists, yellowCards, redCards, saves, ownGoals
      result[name].goals     += getStat(stats, 'totalGoals')
      result[name].assists   += getStat(stats, 'goalAssists')
      result[name].yellow    += getStat(stats, 'yellowCards')
      result[name].red       += getStat(stats, 'redCards')
      result[name].saves     += getStat(stats, 'saves')
      result[name].own_goal  += getStat(stats, 'ownGoals')
    })
  })

  const homeClean = awayScore === 0
  const awayClean = homeScore === 0
  homePlayerNames.forEach(name => { if (result[name]) result[name].clean_team = homeClean })
  awayPlayerNames.forEach(name => { if (result[name]) result[name].clean_team = awayClean })

  const scorers = Object.entries(result).filter(([, s]) => s.goals > 0).map(([n, s]) => `${n}(${s.goals}g)`)
  console.log('[parseEspnMatchStats] players parsed:', Object.keys(result).length,
    '| scorers:', scorers.length ? scorers.join(', ') : 'none')
  return result
}

// Strip diacritics, lowercase, trim: 'Vinícius Júnior' → 'vinicius junior'
function normName(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Tokens that carry no identity weight (suffixes, initials)
const NAME_SUFFIXES = new Set(['jr.', 'jr', 'sr.', 'sr', 'ii', 'iii', 'iv'])
const isInitial = (t) => /^[a-z]\.?$/.test(t)  // single letter with optional period

// Look up a squad player's stats from a parsed stats object.
// Falls back through six strategies to bridge ESPN name variants:
//   accent differences, Jr./Júnior suffixes, initials ("K. Mbappé"), abbreviated
//   first names ("Vini" → "Vinicius"), and single-name players.
export function lookupPlayerStats(statsObj, playerName) {
  // 1. Exact match
  if (statsObj[playerName]) return statsObj[playerName]

  const normTarget = normName(playerName)
  const keys = Object.keys(statsObj)

  // 2. Normalized exact match — 'Theo Hernandez' ↔ 'Theo Hernández', 'Ruben Dias' ↔ 'Rúben Dias'
  const normExact = keys.find(k => normName(k) === normTarget)
  if (normExact) {
    console.log(`[lookupPlayerStats] accent match: "${playerName}" → "${normExact}"`)
    return statsObj[normExact]
  }

  const targetTokens = normTarget.split(' ').filter(Boolean)

  // 3. Last-name match (normalized), skipping suffix tokens like Jr./Júnior
  const meaningfulLast = [...targetTokens].reverse().find(t => !NAME_SUFFIXES.has(t) && !isInitial(t) && t.length > 2)
  if (meaningfulLast) {
    const lastMatch = keys.find(k => {
      const kt = normName(k).split(' ').filter(t => !NAME_SUFFIXES.has(t) && !isInitial(t))
      return kt.length > 0 && kt[kt.length - 1] === meaningfulLast
    })
    if (lastMatch) {
      console.log(`[lookupPlayerStats] last-name match: "${playerName}" → "${lastMatch}"`)
      return statsObj[lastMatch]
    }
  }

  // 4. Exact token match (≥5 chars, must be unique in statsObj) —
  //    'Vinicius Jr.' ↔ 'Vinícius Júnior' via shared token 'vinicius'
  const longTokens = targetTokens.filter(t => t.length >= 5 && !NAME_SUFFIXES.has(t) && !isInitial(t))
  for (const token of longTokens) {
    const matches = keys.filter(k => normName(k).split(' ').includes(token))
    if (matches.length === 1) {
      console.log(`[lookupPlayerStats] token match "${token}": "${playerName}" → "${matches[0]}"`)
      return statsObj[matches[0]]
    }
  }

  // 5. Prefix match (≥4 chars, unique) — ESPN abbreviated first names like 'Vini' → 'Vinicius'
  const prefixTokens = targetTokens.filter(t => t.length >= 4 && !NAME_SUFFIXES.has(t) && !isInitial(t))
  for (const token of prefixTokens) {
    const matches = keys.filter(k =>
      normName(k).split(' ').some(kt => kt.startsWith(token) || token.startsWith(kt))
    )
    if (matches.length === 1) {
      console.log(`[lookupPlayerStats] prefix match "${token}": "${playerName}" → "${matches[0]}"`)
      return statsObj[matches[0]]
    }
  }

  // 6. Initial-stripping match — 'K. Mbappé' style: drop initials and match on remaining tokens
  const substantive = targetTokens.filter(t => !isInitial(t) && !NAME_SUFFIXES.has(t))
  if (substantive.length > 0 && substantive.length < targetTokens.length) {
    const initMatch = keys.find(k => {
      const kt = normName(k).split(' ').filter(t => !isInitial(t) && !NAME_SUFFIXES.has(t))
      return substantive.every(t => kt.includes(t))
    })
    if (initMatch) {
      console.log(`[lookupPlayerStats] initial-strip match: "${playerName}" → "${initMatch}"`)
      return statsObj[initMatch]
    }
  }

  console.log(`[lookupPlayerStats] no match for: "${playerName}"`)
  return null
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
