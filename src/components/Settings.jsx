import { useState } from 'react'
import styles from './Settings.module.css'

export default function Settings() {
  const [showClearPin, setShowClearPin] = useState(false)
  const [clearPinValue, setClearPinValue] = useState('')
  const [clearPinError, setClearPinError] = useState('')

  async function confirmClearTeams() {
    if (clearPinValue !== '2026') {
      setClearPinError('Incorrect PIN')
      setClearPinValue('')
      return
    }
    localStorage.removeItem('wc_teams')
    try {
      await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', pin: '2026' }),
      })
    } catch { /* localStorage already cleared */ }
    window.location.reload()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>API key</h2>
        <p className={styles.sectionDesc}>
          The API key is stored as a server environment variable — it never touches the browser.
          To set it up, add <code style={{ background: 'var(--color-surface2)', padding: '1px 5px', borderRadius: 4, fontSize: 12, color: 'var(--color-accent)' }}>FOOTBALL_API_KEY</code> to your Vercel project under{' '}
          <strong>Project Settings → Environment Variables</strong>, then redeploy.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>How to get your key</h2>
        <ol className={styles.steps}>
          <li>Go to <a href="https://rapidapi.com" target="_blank" rel="noopener noreferrer">rapidapi.com</a> and create a free account</li>
          <li>Search for <strong>API-Football</strong> and open the listing</li>
          <li>Click <strong>Subscribe to Test</strong> → select the <strong>Free plan</strong></li>
          <li>Go to the <strong>Endpoints</strong> tab → find your key in the header panel on the right</li>
          <li>Copy the <strong>X-RapidAPI-Key</strong> value and add it as <strong>FOOTBALL_API_KEY</strong> in your Vercel project settings, then redeploy</li>
        </ol>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Data notes</h2>
        <ul className={styles.notes}>
          <li>World Cup 2026 identifier: <code>league=1</code>, <code>season=2026</code></li>
          <li>Free plan: 100 requests/day — more than enough for a friends league</li>
          <li>Stats are cached after each fetch so the same game never costs more than 1 request</li>
          <li>Live data becomes available after matches finish — hit Refresh on the leaderboard</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Reset data</h2>
        <div className={styles.resetRow}>

          {!showClearPin && (
            <button onClick={() => { setShowClearPin(true); setClearPinValue(''); setClearPinError('') }}>
              Clear all teams
            </button>
          )}

          {showClearPin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  autoFocus
                  type="password"
                  maxLength={4}
                  placeholder="Commissioner PIN"
                  value={clearPinValue}
                  onChange={e => { setClearPinValue(e.target.value.replace(/\D/g, '')); setClearPinError('') }}
                  onKeyDown={e => e.key === 'Enter' && confirmClearTeams()}
                  style={{ width: 140, letterSpacing: '0.25em', textAlign: 'center' }}
                />
                <button onClick={confirmClearTeams}>Confirm</button>
                <button onClick={() => { setShowClearPin(false); setClearPinError('') }}>Cancel</button>
              </div>
              {clearPinError && (
                <span style={{ color: 'red', fontSize: 13 }}>{clearPinError}</span>
              )}
            </div>
          )}

          <button onClick={() => {
            Object.keys(localStorage).filter(k => k.startsWith('wc_stats_') || k.startsWith('wc_cache_')).forEach(k => localStorage.removeItem(k))
            window.location.reload()
          }}>
            Clear cached stats
          </button>
          <button onClick={() => { localStorage.removeItem('wc_rules'); window.location.reload() }}>
            Reset scoring rules
          </button>
        </div>
      </div>
    </div>
  )
}
