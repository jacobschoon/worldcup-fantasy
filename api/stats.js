import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

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
      const stats = (await redis.get('wc_stats')) || {}
      return res.status(200).json(stats)
    } catch {
      return res.status(503).json({ error: 'Redis unavailable' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { round, stats } = req.body
      const all = (await redis.get('wc_stats')) || {}
      all[round] = { ...(all[round] || {}), ...stats }
      await redis.set('wc_stats', all)
      return res.status(200).json({ ok: true })
    } catch {
      return res.status(503).json({ error: 'Redis unavailable' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
