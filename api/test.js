import { Redis } from '@upstash/redis'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  const env_url   = !!process.env.KV_REST_API_URL
  const env_token = !!process.env.KV_REST_API_TOKEN

  try {
    const redis = new Redis({
      url:   process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
    await redis.set('test', 'hello')
    const value = await redis.get('test')
    return res.status(200).json({ success: true, value, env_url, env_token })
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message, env_url, env_token })
  }
}
