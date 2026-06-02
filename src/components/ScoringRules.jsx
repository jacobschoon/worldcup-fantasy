import { useState } from 'react'
import { DEFAULT_RULES } from '../data.js'
import styles from './ScoringRules.module.css'

const RULE_DEFS = [
  { group: 'Playing time', rules: [
    { id: 'play_short', label: '1–60 mins played',  desc: 'Any player on the pitch',          min: 0, max: 3  },
    { id: 'play_long',  label: '61+ mins played',   desc: 'Any player on the pitch',          min: 0, max: 3  },
  ]},
  { group: 'Goals & assists', rules: [
    { id: 'goal_fwd',  label: 'Goal / pen — FWD slot', desc: 'Scored or converted pen in FWD slot', min: 1, max: 15 },
    { id: 'goal_mid',  label: 'Goal / pen — MID slot', desc: 'Scored or converted pen in MID slot', min: 1, max: 15 },
    { id: 'goal_def',  label: 'Goal / pen — DEF slot', desc: 'DEF scores or converts pen',          min: 1, max: 15 },
    { id: 'goal_gk',   label: 'Goal / pen — GK',       desc: 'GK scores or converts pen',           min: 1, max: 15 },
    { id: 'assist',    label: 'Assist',                 desc: 'Any position',                        min: 0, max: 10 },
    { id: 'pen_miss',  label: 'Penalty missed',         desc: 'Any position',                        min: -5, max: 0 },
  ]},
  { group: 'Clean sheets', rules: [
    { id: 'clean_gk',  label: 'Clean sheet — GK',       desc: '45+ mins, team concedes 0',                    min: 0, max: 10 },
    { id: 'clean_def', label: 'Clean sheet — DEF slot',  desc: '45+ mins, team concedes 0',                    min: 0, max: 10 },
    { id: 'clean_mid', label: 'Clean sheet — MID slot',  desc: '45+ mins, team concedes 0 (incl. wingers in MID)', min: 0, max: 6  },
  ]},
  { group: 'Goalkeeping', rules: [
    { id: 'save',      label: 'Saves (per 3)',    desc: 'Every 3 saves = points',   min: 0, max: 5  },
    { id: 'pen_save',  label: 'Penalty saved',    desc: 'GK stops a penalty',       min: 0, max: 10 },
  ]},
  { group: 'Disciplinary', rules: [
    { id: 'yellow',    label: 'Yellow card', desc: 'Any position', min: -5, max: 0 },
    { id: 'red',       label: 'Red card',    desc: 'Any position', min: -5, max: 0 },
    { id: 'own_goal',  label: 'Own goal',    desc: 'Any position', min: -5, max: 0 },
  ]},
]

export default function ScoringRules() {
  const stored = (() => { try { return JSON.parse(localStorage.getItem('wc_rules')) || DEFAULT_RULES } catch { return DEFAULT_RULES } })()
  const [values, setValues] = useState({ ...DEFAULT_RULES, ...stored })
  const [saved, setSaved]   = useState(false)

  function adjust(id, delta) {
    const def = RULE_DEFS.flatMap(g => g.rules).find(r => r.id === id)
    setValues(v => ({ ...v, [id]: Math.max(def.min, Math.min(def.max, v[id] + delta)) }))
  }

  function save() {
    localStorage.setItem('wc_rules', JSON.stringify(values))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Live example — Mbappé 90 mins, 1 goal (FWD slot), 1 assist, France keep clean sheet
  const exLines = [
    { label: '90 mins (61+)',      pts: values.play_long  },
    { label: '1 goal (FWD slot)',  pts: values.goal_fwd   },
    { label: '1 assist',           pts: values.assist     },
  ]
  const exTotal = exLines.reduce((s, l) => s + l.pts, 0)

  return (
    <div className={styles.wrap}>
      <div className={styles.infoBox}>
        <span>⏱</span>
        <span><strong>Playing time</strong> — 1–60 mins = 1 pt · 61+ mins = 2 pts</span>
      </div>
      <div className={styles.infoBox} style={{ background: 'var(--color-green-dim)', borderColor: 'var(--color-green)', color: 'var(--color-green)' }}>
        <span>🛡</span>
        <span><strong>Clean sheet</strong> — GK, DEF and MID slots only. 45+ mins, team concedes 0. Wingers count in whichever slot they fill.</span>
      </div>
      <div className={styles.infoBox} style={{ background: 'var(--color-purple-dim)', borderColor: 'var(--color-purple)', color: 'var(--color-purple)' }}>
        <span>⚽</span>
        <span><strong>Penalty scored</strong> = same points as a goal for that slot. No separate row needed.</span>
      </div>

      {RULE_DEFS.map(group => (
        <div key={group.group} className={styles.group}>
          <div className={styles.groupLabel}>{group.group}</div>
          <div className={styles.ruleList}>
            {group.rules.map(rule => {
              const v = values[rule.id]
              return (
                <div key={rule.id} className={styles.ruleRow}>
                  <div className={styles.ruleInfo}>
                    <span className={styles.ruleLabel}>{rule.label}</span>
                    <span className={styles.ruleDesc}>{rule.desc}</span>
                  </div>
                  <div className={styles.stepper}>
                    <button onClick={() => adjust(rule.id, -1)}>−</button>
                    <span className={`${styles.val} ${v > 0 ? styles.pos : v < 0 ? styles.neg : styles.zero}`}>{v}</span>
                    <button onClick={() => adjust(rule.id, 1)}>+</button>
                  </div>
                  <span className={styles.ptsLabel}>pts</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className={styles.example}>
        <div className={styles.exTitle}>Live example — Mbappé · FWD slot · 90 mins · 1 goal · 1 assist</div>
        {exLines.map(l => (
          <div key={l.label} className={styles.exLine}>
            <span>{l.label}</span>
            <span className={styles.pos}>+{l.pts}</span>
          </div>
        ))}
        <div className={styles.exTotal}>
          <span>Total</span>
          <span>{exTotal} pts</span>
        </div>
      </div>

      <div className={styles.cta}>
        <button className="primary" onClick={save}>Lock in rules</button>
        {saved && <span className={styles.savedMsg}>✓ Rules saved!</span>}
      </div>
    </div>
  )
}
