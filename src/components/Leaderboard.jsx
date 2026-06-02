import { useState, useEffect } from 'react'
import { DEFAULT_RULES, calcPlayerPts, displayName, shortTeam } from '../data.js'
import { fetchFixtures, fetchFixtureStats, parseMatchStats, groupFixturesByMatchday } from '../api.js'
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
  const [, forceUpdate]         = useState(0)

  const [editTarget, setEditTarget] = useState(null)
  const [editPin, setEditPin]       = useState('')
  const [editError, setEditError]   = useState('')
  const [apiTeams, setApiTeams]     = useState(null)
  const [apiStats, setApiStats]     = useState({})
  const [teamsLoading, setTeamsLoading] = useState(true)

  async function loadFromApi() {
    setTeamsLoading(true)
    try {
      const [tr, sr] = await Promise.all([fetch('/api/teams'), fetch('/api/stats')])
      if (tr.ok) { const d = await tr.json(); if (Array.isArray(d)) setApiTeams(d) }
      if (sr.ok) { const d = await sr.json(); if (d && !d.error) setApiStats(d) }
    } catch { /* fall back to localStorage */ }
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

  const hasKey = !!localStorage.getItem('wc_api_key')

  async function refresh() {
    if (!hasKey) { setApiStatus('No API key — add it in Settings'); return }
    setLoading(true); setApiStatus('')
    try {
      const fixtures = await fetchFixtures()
      setFixtures(fixtures)
      const finished = fixtures.filter(f => f.fixture.status.short === 'FT')
      for (const f of finished) {
        const cacheKey = `wc_stats_fixture_${f.fixture.id}`
        if (localStorage.getItem(cacheKey)) continue
        const statsRes = await fetchFixtureStats(f.fixture.id)
        const parsed = parseMatchStats(statsRes, f.goals.home, f.goals.away)
        // Merge into matchday store
        const round = f.league.round || 'Unknown'
        const existing = getStats(round)
        Object.assign(existing, parsed)
        localStorage.setItem(`wc_stats_${round}`, JSON.stringify(existing))
        localStorage.setItem(cacheKey, '1')
        try {
          await fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ round, stats: existing }),
          })
        } catch { /* localStorage fallback already saved */ }
      }
      try {
        const [tr, sr] = await Promise.all([fetch('/api/teams'), fetch('/api/stats')])
        if (tr.ok) { const d = await tr.json(); if (Array.isArray(d)) setApiTeams(d) }
        if (sr.ok) { const d = await sr.json(); if (d && !d.error) setApiStats(d) }
      } catch { /* ignore */ }
      setApiStatus('Updated just now')
      forceUpdate(n => n + 1)
    } catch (e) {
      setApiStatus('Error fetching data — check your API key in Settings')
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
    if (liveStatKeys.length > 0) {
      const pts = liveStatKeys.reduce((s, k) => {
        const st = getStats(k)
        return s + calcPlayerPts(p, st[p.name] || null, rules).pts
      }, 0)
      return { pts, breakdown: [] }
    }
    return calcPlayerPts(p, usingMock ? (MOCK_STATS[p.name] || null) : null, rules)
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
                            <div key={p.name} className={styles.playerChip} title={breakdown.map(b => `${b.label}: ${b.pts > 0 ? '+' : ''}${b.pts}`).join(' | ')}>
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
