const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { fixture } = req.query
  if (!fixture) return res.status(400).json({ error: 'Missing fixture query param' })

  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'FOOTBALL_API_KEY not configured' })

  try {
    const upstream = await fetch(
      `https://v3.football.api-sports.io/fixtures/players?fixture=${fixture}`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
      }
    )
    const json = await upstream.json()
    return res.status(upstream.status).json(json)
  } catch {
    return res.status(502).json({ error: 'Upstream request failed' })
  }
}
