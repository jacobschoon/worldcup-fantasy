import { useState, useEffect } from 'react'
import { DEFAULT_RULES, calcPlayerPts, displayName, shortTeam } from '../data.js'
import { fetchFixtures, fetchEspnMatchStats, parseEspnMatchStats, lookupPlayerStats } from '../api.js'
import styles from './Leaderboard.module.css'

const MOCK_TEAMS = [
  { manager: 'Jacob', teamName: 'The Invincibles', formation: '4-3-3', squad: [
    { name: 'Alisson Becker',         pos: 'GK',   flag: '🇧🇷', slot: 'GK'  },
    { name: 'Trent Alexander-Arnold', pos: 'DEF',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slot: 'DEF' },
    { name: 'Virgil van Dijk',        pos: 'DEF',  flag: '🇳🇱', slot: 'DEF' },
    { name: 'Rúben Dias',             pos: 'DEF',  flag: '🇵🇹', slot: 'DEF' },
    { name: 'Theo Hernandez',         pos: 'DEF',  flag: '🇫🇷', slot: 'DEF' },
    { name: 'Jude Bellingham',        pos: 'AMID', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slot: 'MID' },
    { name: 'Kevin De Bruyne',        pos: 'AMID', flag: '🇧🇪', slot: 'MID' },
    { name: 'Pedri',                  pos: 'AMID', flag: '🇪🇸', slot: 'MID' },
    { name: 'Kylian Mbappé',          pos: 'ST',   flag: '🇫🇷', slot: 'FWD' },
    { name: 'Erling Haaland',         pos: 'ST',   flag: '🇳🇴', slot: 'FWD' },
    { name: 'Bukayo Saka',            pos: 'WIN',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slot: 'FWD' },
  ]},
  { manager: 'Mike', teamName: 'Tiki Taka FC', formation: '3-5-2', squad: [
    { name: 'Emiliano Martínez', pos: 'GK',   flag: '🇦🇷', slot: 'GK'  },
    { name: 'Josko Gvardiol',    pos: 'DEF',  flag: '🇭🇷', slot: 'DEF' },
    { name: 'William Saliba',    pos: 'DEF',  flag: '🇫🇷', slot: 'DEF' },
    { name: 'Antonio Rüdiger',   pos: 'DEF',  flag: '🇩🇪', slot: 'DEF' },
    { name: 'Phil Foden',        pos: 'AMID', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slot: 'MID' },
    { name: 'Declan Rice',       pos: 'MID',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slot: 'MID' },
    { name: 'Luka Modric',       pos: 'MID',  flag: '🇭🇷', slot: 'MID' },
    { name: 'Bukayo Saka',       pos: 'WIN',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slot: 'MID' },
    { name: 'Vinicius Jr.',      pos: 'WIN',  flag: '🇧🇷', slot: 'MID' },
    { name: 'Harry Kane',        pos: 'ST',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slot: 'FWD' },
    { name: 'Lionel Messi',      pos: 'ST',   flag: '🇦🇷', slot: 'FWD' },
  ]},
  { manager: 'Sarah', teamName: 'Golden Boots', formation: '4-4-2', squad: [
    { name: 'Gianluigi Donnarumma', pos: 'GK',   flag: '🇮🇹', slot: 'GK'  },
    { name: 'Achraf Hakimi',        pos: 'DEF',  flag: '🇲🇦', slot: 'DEF' },
    { name: 'Virgil van Dijk',      pos: 'DEF',  flag: '🇳🇱', slot: 'DEF' },
    { name: 'Alessandro Bastoni',   pos: 'DEF',  flag: '🇮🇹', slot: 'DEF' },
    { name: 'Alphonso Davies',      pos: 'DEF',  flag: '🇨🇦', slot: 'DEF' },
    { name: 'Lamine Yamal',         pos: 'WIN',  flag: '🇪🇸', slot: 'MID' },
    { name: 'Bruno Fernandes',      pos: 'AMID', flag: '🇵🇹', slot: 'MID' },
    { name: 'Rodri',                pos: 'MID',  flag: '🇪🇸', slot: 'MID' },
    { name: 'Ousmane Dembélé',      pos: 'WIN',  flag: '🇫🇷', slot: 'MID' },
    { name: 'Kylian Mbappé',        pos: 'ST',   flag: '🇫🇷', slot: 'FWD' },
    { name: 'Harry Kane',           pos: 'ST',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slot: 'FWD' },
  ]},
  { manager: 'Tom', teamName: 'Route One', formation: '3-4-3', squad: [
    { name: 'Thibaut Courtois', pos: 'GK',   flag: '🇧🇪', slot: 'GK'  },
    { name: 'Dani Carvajal',    pos: 'DEF',  flag: '🇪🇸', slot: 'DEF' },
    { name: 'Raphaël Varane',   pos: 'DEF',  flag: '🇫🇷', slot: 'DEF' },
    { name: 'Rúben Dias',       pos: 'DEF',  flag: '🇵🇹', slot: 'DEF' },
    { name: 'Kevin De Bruyne',  pos: 'AMID', flag: '🇧🇪', slot: 'MID' },
    { name: 'Gavi',             pos: 'AMID', flag: '🇪🇸', slot: 'MID' },
    { name: 'Frenkie de Jong',  pos: 'MID',  flag: '🇳🇱', slot: 'MID' },
    { name: 'Declan Rice',      pos: 'MID',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slot: 'MID' },
    { name: 'Lionel Messi',     pos: 'ST',   flag: '🇦🇷', slot: 'FWD' },
    { name: 'Erling Haaland',   pos: 'ST',   flag: '🇳🇴', slot: 'FWD' },
    { name: 'Nico Williams',    pos: 'WIN',  flag: '🇪🇸', slot: 'FWD' },
  ]},
]

const MOCK_STATS = {
  'Kylian Mbappé':            { goals:2, assists:1, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:true  },
  'Erling Haaland':           { goals:1, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Jude Bellingham':          { goals:1, assists:1, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Bukayo Saka':              { goals:1, assists:2, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Harry Kane':               { goals:2, assists:1, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Lionel Messi':             { goals:1, assists:1, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:true  },
  'Lamine Yamal':             { goals:0, assists:1, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Vinicius Jr.':             { goals:0, assists:0, mins:72, yellow:1, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Kevin De Bruyne':          { goals:0, assists:1, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Pedri':                    { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Virgil van Dijk':          { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Rúben Dias':               { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Theo Hernandez':           { goals:0, assists:1, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:true  },
  'Alisson Becker':           { goals:0, assists:0, mins:90, yellow:0, red:0, saves:3, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Emiliano Martínez':        { goals:0, assists:0, mins:90, yellow:0, red:0, saves:4, pen_saved:0, pen_missed:0, own_goal:0, clean_team:true  },
  'Thibaut Courtois':         { goals:0, assists:0, mins:90, yellow:0, red:0, saves:2, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Gianluigi Donnarumma':     { goals:0, assists:0, mins:90, yellow:0, red:0, saves:1, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Trent Alexander-Arnold':   { goals:0, assists:1, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Achraf Hakimi':            { goals:0, assists:0, mins:90, yellow:1, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Declan Rice':              { goals:0, assists:1, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Luka Modric':              { goals:0, assists:0, mins:62, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Phil Foden':               { goals:1, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Ousmane Dembélé':          { goals:0, assists:1, mins:75, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:true  },
  'Rodri':                    { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Bruno Fernandes':          { goals:0, assists:0, mins:90, yellow:1, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Gavi':                     { goals:0, assists:0, mins:55, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Frenkie de Jong':          { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Josko Gvardiol':           { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'William Saliba':           { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Antonio Rüdiger':          { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Alessandro Bastoni':       { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Alphonso Davies':          { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Dani Carvajal':            { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Raphaël Varane':           { goals:0, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
  'Nico Williams':            { goals:1, assists:0, mins:90, yellow:0, red:0, saves:0, pen_saved:0, pen_missed:0, own_goal:0, clean_team:false },
}

function getRules() {
  try { return { ...DEFAULT_RULES, ...(JSON.parse(localStorage.getItem('wc_rules')) || {}) } } catch { return DEFAULT_RULES }
}
function getTeams() {
  try { const s = JSON.parse(localStorage.getItem('wc_teams') || '[]'); return s.length ? s : MOCK_TEAMS } catch { return MOCK_TEAMS }
}
function hashPin(pin) {
  let h = 0
  for (let i = 0; i < pin.length; i++) { h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0 }
  return h.toString()
}

export default function Leaderboard({ onEditTeam, setTab }) {
  const [view, setView]         = useState('total')
  const [expanded, setExpanded] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading]   = useState(false)
  const [apiStatus, setApiStatus] = useState('')

  const [editTarget, setEditTarget] = useState(null)
  const [editPin, setEditPin]       = useState('')
  const [editError, setEditError]   = useState('')
  const [apiTeams, setApiTeams]     = useState(null)
  const [apiStats, setApiStats]     = useState({})
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  async function loadFromApi() {
    setTeamsLoading(true)
    try {
      console.log('[Leaderboard] fetching /api/teams and /api/stats')
      const [tr, sr] = await Promise.all([fetch('/api/teams'), fetch('/api/stats')])
      console.log('[Leaderboard] /api/teams status:', tr.status)
      if (tr.ok) {
        const d = await tr.json()
        console.log('[Leaderboard] GET /api/teams:', d)
        if (Array.isArray(d)) setApiTeams(d)
        else console.warn('[Leaderboard] /api/teams returned non-array:', d)
      } else {
        console.warn('[Leaderboard] GET /api/teams status:', tr.status)
      }
      if (sr.ok) { const d = await sr.json(); if (d && !d.error) setApiStats(d) }
    } catch (e) {
      console.warn('[Leaderboard] loadFromApi error:', e)
    }
    setTeamsLoading(false)
  }

  useEffect(() => { loadFromApi() }, [])

  function openEditModal(e, team) {
    e.stopPropagation()
    setEditTarget(team)
    setEditPin('')
    setEditError('')
  }

  function confirmEdit() {
    if (editPin !== '2026' && editTarget.pinHash && editTarget.pinHash !== hashPin(editPin)) {
      setEditError('Incorrect PIN')
      setEditPin('')
      return
    }
    setEditTarget(null)
    onEditTeam(editTarget.manager)
    setTab('squad')
  }

  async function refresh() {
    setLoading(true); setApiStatus('')
    try {
      const allFixtures = await fetchFixtures()
      setFixtures(allFixtures)
      const finished = allFixtures.filter(f => f.fixture.status.short === 'FT')
      console.log(`[refresh] ${finished.length} finished of ${allFixtures.length} total fixtures`)

      const roundStats = {}
      for (const f of finished) {
        const summary = await fetchEspnMatchStats(f.fixture.id)
        const parsed = parseEspnMatchStats(summary, f.goals.home ?? 0, f.goals.away ?? 0)
        const round = f.league.round || 'Unknown'
        if (!roundStats[round]) roundStats[round] = {}
        Object.assign(roundStats[round], parsed)
        console.log(`[refresh] ${f.teams.home.name} v ${f.teams.away.name} (${round}): ${Object.keys(parsed).length} players`)
      }

      console.log('[refresh] rounds with stats:', Object.keys(roundStats))
      setApiStats(roundStats)

      Object.entries(roundStats).forEach(([round, stats]) => {
        localStorage.setItem(`wc_stats_${round}`, JSON.stringify(stats))
      })
      Object.entries(roundStats).forEach(([round, stats]) => {
        fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ round, stats }),
        }).catch(() => {})
      })

      // Refresh team list
      try {
        const tr = await fetch('/api/teams')
        if (tr.ok) { const d = await tr.json(); if (Array.isArray(d)) setApiTeams(d) }
      } catch { /* ignore */ }

      // Log team totals
      const currentRules = getRules()
      const currentTeams = (apiTeams && apiTeams.length > 0)
        ? apiTeams
        : (() => { try { return JSON.parse(localStorage.getItem('wc_teams') || '[]') } catch { return [] } })()
      const teamsForLog = currentTeams.length ? currentTeams : MOCK_TEAMS
      console.log('[refresh] team totals:')
      teamsForLog.forEach(team => {
        const total = team.squad.reduce((sum, p) => {
          const pts = Object.keys(roundStats).reduce((s, k) =>
            s + calcPlayerPts(p, lookupPlayerStats(roundStats[k], p.name), currentRules).pts, 0)
          return sum + pts
        }, 0)
        console.log(`  ${team.manager} (${team.teamName || '—'}): ${total} pts`)
      })

      setApiStatus('Updated just now')
    } catch (e) {
      console.error('[refresh] error:', e)
      setApiStatus('Error fetching match data — check the console for details')
    }
    setLoading(false)
  }

  const rules = getRules()
  function getStats(key) {
    if (Object.keys(apiStats).length > 0) return apiStats[key] || {}
    try { return JSON.parse(localStorage.getItem(`wc_stats_${key}`) || '{}') } catch { return {} }
  }
  const localStoredTeams = (() => { try { return JSON.parse(localStorage.getItem('wc_teams') || '[]') } catch { return [] } })()
  const resolvedTeams = (apiTeams && apiTeams.length > 0) ? apiTeams : localStoredTeams
  const usingMock = resolvedTeams.length === 0
  const teams = usingMock ? MOCK_TEAMS : resolvedTeams

  const liveStatKeys = Object.keys(apiStats).length > 0
    ? Object.keys(apiStats)
    : Object.keys(localStorage)
        .filter(k => k.startsWith('wc_stats_') && !k.includes('fixture_'))
        .map(k => k.replace('wc_stats_', ''))

  function playerTotalResult(p) {
    if (liveStatKeys.length === 0) {
      return calcPlayerPts(p, usingMock ? (MOCK_STATS[p.name] || null) : null, rules)
    }

    // Accumulate breakdown items across all rounds, merging by semantic category
    const cats = new Map()
    let totalPts = 0
    liveStatKeys.forEach(k => {
      const st = getStats(k)
      const { pts, breakdown } = calcPlayerPts(p, lookupPlayerStats(st, p.name), rules)
      totalPts += pts
      breakdown.forEach(({ label, pts: bPts }) => {
        const cat = /min/i.test(label) ? 'mins'
          : /goal/i.test(label) && !/own/i.test(label) ? 'goals'
          : /assist/i.test(label) ? 'assists'
          : /clean/i.test(label) ? 'clean'
          : /pen saved/i.test(label) ? 'pen_saved'
          : /save/i.test(label) ? 'saves'
          : /yellow/i.test(label) ? 'yellow'
          : /red card/i.test(label) ? 'red'
          : /own/i.test(label) ? 'own_goal'
          : /pen miss/i.test(label) ? 'pen_missed'
          : label
        cats.set(cat, (cats.get(cat) || 0) + bPts)
      })
    })

    const gPts = p.slot === 'GK' ? rules.goal_gk : p.slot === 'DEF' ? rules.goal_def : p.slot === 'MID' ? rules.goal_mid : rules.goal_fwd
    const csPts = p.slot === 'GK' ? rules.clean_gk : p.slot === 'DEF' ? rules.clean_def : rules.clean_mid

    function makeLabel(cat, pts) {
      const n = (r) => r !== 0 ? Math.abs(Math.round(pts / r)) : 0
      switch (cat) {
        case 'mins':       return 'Minutes played'
        case 'goals':      { const c = n(gPts);          return `${c} goal${c !== 1 ? 's' : ''}` }
        case 'assists':    { const c = n(rules.assist);   return `${c} assist${c !== 1 ? 's' : ''}` }
        case 'clean':      { const c = n(csPts);          return `${c} clean sheet${c !== 1 ? 's' : ''}` }
        case 'saves':      return 'Saves'
        case 'pen_saved':  { const c = n(rules.pen_save); return `${c} pen${c !== 1 ? 's' : ''} saved` }
        case 'yellow':     { const c = n(rules.yellow);   return `${c} yellow card${c !== 1 ? 's' : ''}` }
        case 'red':        { const c = n(rules.red);      return `${c} red card${c !== 1 ? 's' : ''}` }
        case 'own_goal':   { const c = n(rules.own_goal); return `${c} own goal${c !== 1 ? 's' : ''}` }
        case 'pen_missed': { const c = n(rules.pen_miss); return `${c} pen${c !== 1 ? 's' : ''} missed` }
        default:           return cat
      }
    }

    const breakdown = Array.from(cats.entries())
      .filter(([, pts]) => pts !== 0)
      .map(([cat, pts]) => ({ label: makeLabel(cat, pts), pts }))

    return { pts: totalPts, breakdown }
  }

  function calcTeamTotal(team) {
    return team.squad.reduce((sum, p) => sum + playerTotalResult(p).pts, 0)
  }

  const ranked = [...teams].map(t => ({ ...t, total: calcTeamTotal(t) })).sort((a, b) => b.total - a.total)
  const avg = ranked.length ? Math.round(ranked.reduce((s, t) => s + t.total, 0) / ranked.length) : 0

  const medals = ['🥇', '🥈', '🥉']

  return (
    <>
    <div className={styles.wrap}>
      {teamsLoading && apiTeams === null && (
        <div className={styles.mockBanner}>Loading teams…</div>
      )}
      {!teamsLoading && usingMock && (
        <div className={styles.mockBanner}>
          Showing mock data — teams saved in the squad builder will appear here
        </div>
      )}

      {ranked.length >= 2 && (
        <div className={styles.podium}>
          {ranked.slice(0, 3).map((t, i) => (
            <div key={t.manager} className={`${styles.podiumCard} ${i === 0 ? styles.podiumFirst : ''}`}>
              <div className={styles.podiumMedal}>{medals[i]}</div>
              <div className={styles.podiumTeam}>{shortTeam(t)}</div>
              <div className={styles.podiumManager}>({t.manager})</div>
              <div className={styles.podiumPts}>{t.total}</div>
              <div className={styles.podiumForm}>{t.formation}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Leader</div>
          <div className={styles.statVal}>{ranked[0]?.total || 0} pts</div>
          <div className={styles.statSub}>{ranked[0] ? shortTeam(ranked[0]) : '—'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Average</div>
          <div className={styles.statVal}>{avg} pts</div>
          <div className={styles.statSub}>{ranked.length} teams</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Matches played</div>
          <div className={styles.statVal}>{fixtures.filter(f => f.fixture?.status?.short === 'FT').length || '—'}</div>
          <div className={styles.statSub}>of 104</div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <select value={view} onChange={e => setView(e.target.value)} className={styles.viewSelect}>
          <option value="total">Total points</option>
          {/* Matchday options added dynamically when live data arrives */}
        </select>
        <button onClick={refresh} disabled={loading} className={styles.refreshBtn}>
          {loading ? 'Updating...' : '↻ Refresh'}
        </button>
        {apiStatus && <span className={styles.apiStatus}>{apiStatus}</span>}
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>#</span><span>Team</span><span>Total</span><span></span>
        </div>
        {ranked.map((t, i) => {
          const bySlot = {}
          t.squad.forEach(p => { if (!bySlot[p.slot]) bySlot[p.slot] = []; bySlot[p.slot].push(p) })
          return (
            <div key={t.manager}>
              <div
                className={`${styles.tableRow} ${expanded === i ? styles.tableRowExpanded : ''}`}
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <span className={styles.rankNum}>{i + 1}</span>
                <div className={styles.teamCol}>
                  <span className={styles.teamNameDisplay}>{shortTeam(t)}</span>
                  <span className={styles.managerDisplay}>({t.manager}) · {t.formation}</span>
                </div>
                <span className={styles.ptsDisplay}>{t.total}</span>
                <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {onEditTeam && setTab && (
                    <button
                      style={{ fontSize:12, padding:'2px 8px', cursor:'pointer' }}
                      onClick={e => openEditModal(e, t)}
                    >Edit</button>
                  )}
                  <span className={styles.chevron}>{expanded === i ? '▲' : '▼'}</span>
                </span>
              </div>
              {expanded === i && (
                <div className={styles.squadExpand}>
                  {['GK','DEF','MID','FWD'].filter(s => bySlot[s]).map(s => (
                    <div key={s} className={styles.squadSection}>
                      <div className={styles.squadSectionLabel}>{s}</div>
                      <div className={styles.squadPlayers}>
                        {bySlot[s].map(p => {
                          const { pts, breakdown } = playerTotalResult(p)
                          return (
                            <div
                              key={p.name}
                              className={styles.playerChip}
                              onClick={e => { e.stopPropagation(); setSelectedPlayer({ name: p.name, flag: p.flag, slot: p.slot, pts, breakdown }) }}
                            >
                              {p.flag} {p.name.split(' ').slice(-1)[0]}
                              <span className={`${styles.chipPts} ${pts < 0 ? styles.chipNeg : ''}`}>{pts > 0 ? '+' : ''}{pts}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>

    {selectedPlayer && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={() => setSelectedPlayer(null)}>
        <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:24, width:320, maxWidth:'90vw' }} onClick={e => e.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
            <span style={{ fontSize:20 }}>{selectedPlayer.flag}</span>
            <span style={{ fontWeight:600, fontSize:16, color:'var(--color-text)' }}>{selectedPlayer.name}</span>
          </div>
          <div style={{ fontSize:12, color:'var(--color-text-tertiary)', marginBottom:16 }}>{selectedPlayer.slot}</div>

          {selectedPlayer.breakdown.length === 0 ? (
            <div style={{ color:'var(--color-text-secondary)', fontSize:13, marginBottom:16 }}>No stats recorded yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:16 }}>
              {selectedPlayer.breakdown.map(({ label, pts }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
                  <span style={{ color:'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight:600, color: pts > 0 ? 'var(--color-green)' : pts < 0 ? 'var(--color-red)' : 'var(--color-text-tertiary)' }}>
                    {pts > 0 ? '+' : ''}{pts}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--color-border)', paddingTop:12, marginBottom:16 }}>
            <span style={{ fontWeight:600, fontSize:13, color:'var(--color-text)' }}>Total</span>
            <span style={{ fontWeight:700, fontSize:18, color: selectedPlayer.pts > 0 ? 'var(--color-green)' : selectedPlayer.pts < 0 ? 'var(--color-red)' : 'var(--color-text)' }}>
              {selectedPlayer.pts > 0 ? '+' : ''}{selectedPlayer.pts} pts
            </span>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={() => setSelectedPlayer(null)}>Close</button>
          </div>
        </div>
      </div>
    )}

    {editTarget && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={() => setEditTarget(null)}>
        <div style={{ background:'white', borderRadius:12, padding:24, width:320, maxWidth:'90vw' }} onClick={e => e.stopPropagation()}>
          <h3 style={{ margin:'0 0 6px' }}>Edit {editTarget.teamName}</h3>
          <p style={{ margin:'0 0 16px', color:'#666', fontSize:14 }}>Enter {editTarget.manager}'s team PIN</p>
          <input
            autoFocus
            type="password"
            maxLength={4}
            placeholder="4-digit PIN"
            value={editPin}
            onChange={e => { setEditPin(e.target.value.replace(/\D/g, '')); setEditError('') }}
            onKeyDown={e => e.key === 'Enter' && confirmEdit()}
            style={{ width:'100%', boxSizing:'border-box', textAlign:'center', fontSize:20, letterSpacing:'0.3em', marginBottom:8, padding:'8px 12px' }}
          />
          {editError && <div style={{ color:'red', fontSize:13, marginBottom:8 }}>{editError}</div>}
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={() => setEditTarget(null)}>Cancel</button>
            <button className="primary" onClick={confirmEdit}>Edit team</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
