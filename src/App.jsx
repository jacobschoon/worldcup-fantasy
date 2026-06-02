import { useState } from 'react'
import SquadBuilder from './components/SquadBuilder.jsx'
import ScoringRules from './components/ScoringRules.jsx'
import Leaderboard  from './components/Leaderboard.jsx'
import Settings     from './components/Settings.jsx'
import styles from './App.module.css'

const TABS = [
  { id: 'squad',    label: '⚽ Build squad' },
  { id: 'rules',    label: '📋 Scoring rules' },
  { id: 'board',    label: '🏆 Leaderboard' },
  { id: 'settings', label: '⚙️ Settings' },
]

export default function App() {
  const [tab, setTab] = useState('board')

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚽</span>
            <div>
              <div className={styles.logoTitle}>World Cup Fantasy</div>
              <div className={styles.logoSub}>2026</div>
            </div>
          </div>
        </div>
      </header>

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.navBtn} ${tab === t.id ? styles.navBtnActive : ''}`}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.content}>
          {tab === 'squad'    && (
            <>
              <div className={styles.pageHeader}>
                <h1>Build your squad</h1>
                <p>Name your team, pick a formation, fill your 11</p>
              </div>
              <SquadBuilder onSave={() => setTab('board')} />
            </>
          )}
          {tab === 'rules' && (
            <>
              <div className={styles.pageHeader}>
                <h1>Scoring rules</h1>
                <p>Adjust values and lock in before the tournament starts</p>
              </div>
              <ScoringRules />
            </>
          )}
          {tab === 'board' && (
            <>
              <div className={styles.pageHeader}>
                <h1>Leaderboard</h1>
                <p>World Cup 2026 · Kicks off June 11</p>
              </div>
              <Leaderboard />
            </>
          )}
          {tab === 'settings' && (
            <>
              <div className={styles.pageHeader}>
                <h1>Settings</h1>
                <p>API key and data management</p>
              </div>
              <Settings />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
