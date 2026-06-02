import { useState } from 'react'
import { PLAYERS, FORMATIONS, eligibleForSlot, buildSlotDefs } from '../data.js'
import styles from './SquadBuilder.module.css'

const POS_LABEL = { GK: 'GK', DEF: 'DEF', MID: 'MID', AMID: 'AMID', WIN: 'WIN', ST: 'ST' }

function slotSubtitle(slotType) {
  if (slotType === 'GK')  return 'Goalkeepers only'
  if (slotType === 'DEF') return 'Defenders only'
  if (slotType === 'MID') return 'Midfielders, attacking mids and wingers'
  return 'Wingers and strikers only'
}

function filledClass(slotType) {
  return { GK: styles.filledGk, DEF: styles.filledDef, MID: styles.filledMid, FWD: styles.filledFwd }[slotType] || ''
}

export default function SquadBuilder({ onSave }) {
  const [teamName, setTeamName]         = useState('')
  const [managerName, setManagerName]   = useState('')
  const [formation, setFormation]       = useState(null)
  const [slotDefs, setSlotDefs]         = useState([])
  const [squad, setSquad]               = useState(Array(11).fill(null))
  const [activeSlot, setActiveSlot]     = useState(null)
  const [search, setSearch]             = useState('')
  const [saved, setSaved]               = useState(false)

  function selectFormation(f) {
    setFormation(f)
    setSlotDefs(buildSlotDefs(f))
    setSquad(Array(11).fill(null))
  }

  function openModal(i) { setActiveSlot(i); setSearch('') }
  function closeModal() { setActiveSlot(null) }

  function selectPlayer(player) {
    const next = [...squad]
    next[activeSlot] = player
    setSquad(next)
    closeModal()
  }

  function removePlayer(i) {
    const next = [...squad]
    next[i] = null
    setSquad(next)
  }

  const filled = squad.filter(Boolean).length
  const canSave = filled === 11 && formation && teamName.trim() && managerName.trim()

  function saveTeam() {
    const team = {
      manager: managerName.trim(),
      teamName: teamName.trim(),
      formation: formation.label,
      squad: squad.map((p, i) => p ? { name: p.name, country: p.country, pos: p.pos, flag: p.flag, slot: slotDefs[i].type } : null),
    }
    const existing = JSON.parse(localStorage.getItem('wc_teams') || '[]')
    const idx = existing.findIndex(t => t.manager === team.manager)
    if (idx > -1) existing[idx] = team; else existing.push(team)
    localStorage.setItem('wc_teams', JSON.stringify(existing))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    if (onSave) onSave()
  }

  // Count players per country in current squad (excluding the slot being replaced)
  const countryCounts = {}
  squad.forEach((p, i) => {
    if (p && i !== activeSlot) {
      countryCounts[p.country] = (countryCounts[p.country] || 0) + 1
    }
  })

  const eligible = activeSlot !== null
    ? PLAYERS.filter(p => {
        if (!eligibleForSlot(p.pos, slotDefs[activeSlot]?.type)) return false
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.country.toLowerCase().includes(search.toLowerCase())) return false
        // Max 2 per nation — grey out if already at limit
        return true
      })
    : []

  // Separate into available and maxed out
  const eligibleAvailable = eligible.filter(p => (countryCounts[p.country] || 0) < 2)
  const eligibleMaxed     = eligible.filter(p => (countryCounts[p.country] || 0) >= 2)

  // Build rows for pitch display
  const rows = formation ? [
    slotDefs.slice(0, 1),
    slotDefs.slice(1, 1 + formation.def),
    slotDefs.slice(1 + formation.def, 1 + formation.def + formation.mid),
    slotDefs.slice(1 + formation.def + formation.mid),
  ] : []

  let slotIdx = 0

  return (
    <div className={styles.wrap}>
      <div className={styles.nameRow}>
        <div className={styles.field}>
          <label>Team name</label>
          <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. The Gooners" />
        </div>
        <div className={styles.field}>
          <label>Your name</label>
          <input value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="e.g. Jacob" />
        </div>
      </div>
      {teamName && managerName && (
        <div className={styles.namePreview}>Will appear as: <strong>{teamName} ({managerName})</strong></div>
      )}

      <div className={styles.section}>
        <label>Formation — min. 3 defenders</label>
        <div className={styles.formationBtns}>
          {FORMATIONS.map(f => (
            <button
              key={f.label}
              className={`${styles.fBtn} ${formation?.label === f.label ? styles.fBtnActive : ''}`}
              onClick={() => selectFormation(f)}
            >{f.label}</button>
          ))}
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendGk}>■ GK</span>
        <span className={styles.legendDef}>■ DEF</span>
        <span className={styles.legendMid}>■ MID / AMID</span>
        <span className={styles.legendWin}>■ WIN (MID or FWD)</span>
        <span className={styles.legendSt}>■ ST</span>
      </div>

      <div className={styles.pitch}>
        {!formation && <div className={styles.pitchEmpty}>Select a formation above to begin</div>}
        {rows.map((row, ri) => {
          const rowElements = row.map((sd) => {
            const i = slotIdx++
            const p = squad[i]
            const initials = p ? (p.name.split(' ')[0][0] + (p.name.split(' ').slice(-1)[0][0] || '')).toUpperCase() : ''
            return (
              <div key={i} className={styles.slot}>
                <div
                  className={`${styles.circle} ${p ? filledClass(sd.type) : ''}`}
                  onClick={() => openModal(i)}
                >
                  {!p && <span className={styles.plusIcon}>+</span>}
                  {p && <span className={styles.initials}>{initials}</span>}
                  {p && (
                    <button className={styles.removeBtn} onClick={e => { e.stopPropagation(); removePlayer(i) }}>×</button>
                  )}
                </div>
                <div className={styles.slotLabel}>{sd.label}</div>
                <div className={styles.slotName}>{p ? p.name.split(' ').slice(-1)[0] : '—'}</div>
              </div>
            )
          })
          slotIdx -= row.length; row.forEach(() => slotIdx++)
          return <div key={ri} className={styles.pitchRow}>{rowElements}</div>
        })}
      </div>

      <div className={styles.progress}>
        <div className={styles.progressLabel}>{filled} of 11 players selected</div>
        <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${Math.round(filled / 11 * 100)}%` }} /></div>
      </div>

      <div className={styles.cta}>
        <button className="primary" onClick={saveTeam} disabled={!canSave}>Save team</button>
        {!canSave && !saved && (
          <span className={styles.ctaNote}>
            {!teamName.trim() || !managerName.trim() ? 'Enter team and manager name' : !formation ? 'Pick a formation' : 'Fill all 11 spots'}
          </span>
        )}
        {saved && <span className={styles.savedMsg}>✓ Team saved!</span>}
      </div>

      {activeSlot !== null && (
        <div className={styles.modalBg} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Pick a {slotDefs[activeSlot]?.label}</h2>
                <p className={styles.modalSub}>{slotSubtitle(slotDefs[activeSlot]?.type)}</p>
              </div>
              <button className={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>
            <input
              autoFocus
              placeholder="Search by name or country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className={styles.playerList}>
              {eligible.length === 0 && <div className={styles.empty}>No players found</div>}
              {eligibleAvailable.map(p => (
                <div key={p.name} className={styles.playerItem} onClick={() => selectPlayer(p)}>
                  <span className={styles.playerFlag}>{p.flag}</span>
                  <div className={styles.playerInfo}>
                    <strong>{p.name}</strong>
                    <span>{p.country}</span>
                  </div>
                  <span className={`${styles.posBadge} ${styles['pos' + p.pos]}`}>{POS_LABEL[p.pos]}</span>
                </div>
              ))}
              {eligibleMaxed.length > 0 && (
                <>
                  <div className={styles.maxedDivider}>Max 2 per nation reached</div>
                  {eligibleMaxed.map(p => (
                    <div key={p.name} className={`${styles.playerItem} ${styles.playerItemMaxed}`}>
                      <span className={styles.playerFlag}>{p.flag}</span>
                      <div className={styles.playerInfo}>
                        <strong>{p.name}</strong>
                        <span>{p.country}</span>
                      </div>
                      <span className={`${styles.posBadge} ${styles['pos' + p.pos]}`}>{POS_LABEL[p.pos]}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
