const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'FOOTBALL_API_KEY not configured' })

  try {
    const { status } = req.query
    const url = status
      ? `https://api.football-data.org/v4/competitions/WC/matches?status=${status}`
      : 'https://api.football-data.org/v4/competitions/WC/matches'
    const upstream = await fetch(url, { headers: { 'X-Auth-Token': apiKey } })
    const json = await upstream.json()
    return res.status(upstream.status).json(json)
  } catch {
    return res.status(502).json({ error: 'Upstream request failed' })
  }
}
