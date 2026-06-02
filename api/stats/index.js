import { kv } from '@vercel/kv'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    try {
      const stats = (await kv.get('wc_stats')) || {}
      return res.status(200).json(stats)
    } catch {
      return res.status(503).json({ error: 'KV unavailable' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { round, stats } = req.body
      const all = (await kv.get('wc_stats')) || {}
      all[round] = { ...(all[round] || {}), ...stats }
      await kv.set('wc_stats', all)
      return res.status(200).json({ ok: true })
    } catch {
      return res.status(503).json({ error: 'KV unavailable' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
