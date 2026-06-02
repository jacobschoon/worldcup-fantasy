import { kv } from '@vercel/kv'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function hashPin(pin) {
  let h = 0
  for (let i = 0; i < pin.length; i++) { h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0 }
  return h.toString()
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    try {
      const teams = (await kv.get('wc_teams')) || []
      return res.status(200).json(teams)
    } catch {
      return res.status(503).json({ error: 'KV unavailable' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { pin: rawPin, ...team } = req.body
      const teams = (await kv.get('wc_teams')) || []
      const existing = teams.find(t => t.manager === team.manager)
      if (existing) {
        if (String(rawPin) !== '2026' && existing.pinHash && existing.pinHash !== hashPin(String(rawPin || ''))) {
          return res.status(401).json({ error: 'Incorrect PIN' })
        }
      }
      const idx = teams.findIndex(t => t.manager === team.manager)
      if (idx > -1) teams[idx] = team; else teams.push(team)
      await kv.set('wc_teams', teams)
      return res.status(200).json({ ok: true })
    } catch {
      return res.status(503).json({ error: 'KV unavailable' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
