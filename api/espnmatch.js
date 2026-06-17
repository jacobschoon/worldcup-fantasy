const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { eventId } = req.query
  if (!eventId) return res.status(400).json({ error: 'Missing eventId query param' })

  try {
    const upstream = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`
    )
    const json = await upstream.json()
    return res.status(upstream.status).json(json)
  } catch {
    return res.status(502).json({ error: 'Upstream request failed' })
  }
}
