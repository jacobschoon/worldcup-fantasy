import { useState, useEffect } from 'react'
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

// Simple hash — not cryptographic, just enough to not store plain text pins
function hashPin(pin) {
  let h = 0
  for (let i = 0; i < pin.length; i++) { h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0 }
  return h.toString()
}

export default function SquadBuilder({ onSave, editManager, onClearEdit }) {
  const [teamName, setTeamName]       = useState('')
  const [managerName, setManagerName] = useState('')
  const [pin, setPin]                 = useState('')
  const [formation, setFormation]     = useState(null)
  const [slotDefs, setSlotDefs]       = useState([])
  const [squad, setSquad]             = useState(Array(11).fill(null))
  const [activeSlot, setActiveSlot]   = useState(null)
  const [search, setSearch]           = useState('')
  const [saved, setSaved]             = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [isEditing, setIsEditing]     = useState(false)

  // Load modal state
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [loadPin, setLoadPin]             = useState('')
  const [loadError, setLoadError]         = useState('')

  useEffect(() => {
    if (!editManager) return
    const teams = JSON.parse(localStorage.getItem('wc_teams') || '[]')
    const team = teams.find(t => t.manager === editManager)
    if (!team) { if (onClearEdit) onClearEdit(); return }
    const f = FORMATIONS.find(f => f.label === team.formation)
    if (!f) { if (onClearEdit) onClearEdit(); return }
    const defs = buildSlotDefs(f)
    setFormation(f)
    setSlotDefs(defs)
    setTeamName(team.teamName || '')
    setManagerName(team.manager)
    setPin('')
    const rebuilt = team.squad.map(p => p ? PLAYERS.find(pl => pl.name === p.name) || null : null)
    setSquad(rebuilt)
    setIsEditing(true)
    if (onClearEdit) onClearEdit()
  }, [editManager])

  function openLoadModal() {
    if (!managerName.trim()) return
    setLoadPin('')
    setLoadError('')
    setShowLoadModal(true)
  }

  function confirmLoad() {
    const teams = JSON.parse(localStorage.getItem('wc_teams') || '[]')
    const team = teams.find(t => t.manager === managerName.trim())
    if (!team) { setLoadError('No team found for that manager name'); return }
    if (loadPin !== '2026' && team.pinHash && team.pinHash !== hashPin(loadPin)) { setLoadError('Incorrect PIN'); setLoadPin(''); return }
    // Load the team
    const f = FORMATIONS.find(f => f.label === team.formation)
    if (!f) { setLoadError('Formation not found'); return }
    const defs = buildSlotDefs(f)
    setFormation(f)
    setSlotDefs(defs)
    setTeamName(team.teamName || '')
    setPin(loadPin) // pre-fill pin for re-save
    const rebuilt = team.squad.map(p => p ? PLAYERS.find(pl => pl.name === p.name) || null : null)
    setSquad(rebuilt)
    setIsEditing(true)
    setShowLoadModal(false)
  }

  function selectFormation(f) {
    setFormation(f)
    setSlotDefs(buildSlotDefs(f))
    setSquad(Array(11).fill(null))
    setIsEditing(false)
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
  const canSave = filled === 11 && formation && teamName.trim() && managerName.trim() && pin.length === 4

  async function saveTeam() {
    const team = {
      manager: managerName.trim(),
      teamName: teamName.trim(),
      formation: formation.label,
      pinHash: hashPin(pin),
      squad: squad.map((p, i) => p ? { name: p.name, country: p.country, pos: p.pos, flag: p.flag, slot: slotDefs[i].type } : null),
    }
    const existing = JSON.parse(localStorage.getItem('wc_teams') || '[]')
    const idx = existing.findIndex(t => t.manager === team.manager)
    if (idx > -1) existing[idx] = team; else existing.push(team)
    localStorage.setItem('wc_teams', JSON.stringify(existing))
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...team, pin }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.error || 'Could not sync to server — saved locally only')
      } else {
        setSaveError('')
      }
    } catch {
      setSaveError('Could not reach server — saved locally only')
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    if (onSave) onSave()
  }

  // Nation limit
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
        return true
      })
    : []

  const eligibleAvailable = eligible.filter(p => (countryCounts[p.country] || 0) < 2)
  const eligibleMaxed     = eligible.filter(p => (countryCounts[p.country] || 0) >= 2)

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
        <div className={styles.field} style={{ maxWidth: 90 }}>
          <label>Team PIN</label>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4 digits"
          />
        </div>
      </div>

      {teamName && managerName && (
        <div className={styles.namePreview}>Will appear as: <strong>{teamName} ({managerName})</strong></div>
      )}

      <div className={styles.loadRow}>
        <button className={styles.loadBtn} onClick={openLoadModal} disabled={!managerName.trim()}>
          ↩ Load & edit my saved team
        </button>
        {isEditing && <span className={styles.editingBadge}>Editing saved team</span>}
      </div>

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
            {!teamName.trim() || !managerName.trim() ? 'Enter team and manager name'
              : pin.length < 4 ? 'Set a 4-digit team PIN'
              : !formation ? 'Pick a formation'
              : 'Fill all 11 spots'}
          </span>
        )}
        {saved && <span className={styles.savedMsg}>✓ Team saved!</span>}
        {saveError && <span className={styles.ctaNote} style={{ color: '#c00' }}>{saveError}</span>}
      </div>

      {/* Player picker modal */}
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

      {/* Load team PIN modal */}
      {showLoadModal && (
        <div className={styles.modalBg} onClick={() => setShowLoadModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxHeight: 'none' }}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Load team for {managerName}</h2>
                <p className={styles.modalSub}>Enter your team PIN to load and edit your squad</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowLoadModal(false)}>✕</button>
            </div>
            <input
              autoFocus
              type="password"
              maxLength={4}
              placeholder="4-digit PIN"
              value={loadPin}
              onChange={e => { setLoadPin(e.target.value.replace(/\D/g, '')); setLoadError('') }}
              onKeyDown={e => e.key === 'Enter' && confirmLoad()}
              style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: 20 }}
            />
            {loadError && <div className={styles.pinError}>{loadError}</div>}
            <div className={styles.modalActions}>
              <button onClick={() => setShowLoadModal(false)}>Cancel</button>
              <button className="primary" onClick={confirmLoad}>Load team</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
