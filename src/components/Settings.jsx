import { useState } from 'react'
import styles from './Settings.module.css'

export default function Settings() {
  const [key, setKey]       = useState(localStorage.getItem('wc_api_key') || '')
  const [saved, setSaved]   = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState('')

  function save() {
    localStorage.setItem('wc_api_key', key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function clear() {
    localStorage.removeItem('wc_api_key')
    setKey('')
    setTestResult('')
  }

  async function testKey() {
    if (!key.trim()) { setTestResult('Enter a key first'); return }
    setTesting(true); setTestResult('')
    try {
      const res = await fetch('https://v3.football.api-sports.io/status', {
        headers: { 'x-rapidapi-key': key.trim(), 'x-rapidapi-host': 'v3.football.api-sports.io' }
      })
      const json = await res.json()
      if (json.response?.account) {
        setTestResult(`✓ Connected — ${json.response.requests?.current || 0} / ${json.response.requests?.limit_day || 100} requests used today`)
      } else {
        setTestResult('✗ Invalid key — check and try again')
      }
    } catch {
      setTestResult('✗ Connection failed — check your key')
    }
    setTesting(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>API key</h2>
        <p className={styles.sectionDesc}>
          Get a free key from <a href="https://rapidapi.com/api-sports/api/api-football" target="_blank" rel="noopener noreferrer">RapidAPI → API-Football</a>.
          Subscribe to the free plan (100 req/day). Paste your key below.
          It's stored only in your browser — your friends never see it.
        </p>
        <div className={styles.keyRow}>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Paste your RapidAPI key here"
          />
          <button onClick={testKey} disabled={testing}>{testing ? 'Testing...' : 'Test'}</button>
          <button className="primary" onClick={save}>Save</button>
        </div>
        {testResult && (
          <div className={`${styles.testResult} ${testResult.startsWith('✓') ? styles.ok : styles.err}`}>
            {testResult}
          </div>
        )}
        {saved && <div className={styles.savedMsg}>✓ Key saved!</div>}
        {key && <button className={styles.clearBtn} onClick={clear}>Remove key</button>}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>How to get your key</h2>
        <ol className={styles.steps}>
          <li>Go to <a href="https://rapidapi.com" target="_blank" rel="noopener noreferrer">rapidapi.com</a> and create a free account</li>
          <li>Search for <strong>API-Football</strong> and open the listing</li>
          <li>Click <strong>Subscribe to Test</strong> → select the <strong>Free plan</strong></li>
          <li>Go to the <strong>Endpoints</strong> tab → find your key in the header panel on the right</li>
          <li>Copy the <strong>X-RapidAPI-Key</strong> value and paste it above</li>
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
          <button onClick={() => { if (confirm('Clear all saved teams?')) { localStorage.removeItem('wc_teams'); window.location.reload() } }}>
            Clear all teams
          </button>
          <button onClick={() => { if (confirm('Clear all match stats?')) {
            Object.keys(localStorage).filter(k => k.startsWith('wc_stats_') || k.startsWith('wc_cache_')).forEach(k => localStorage.removeItem(k))
            window.location.reload()
          }}}>
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
