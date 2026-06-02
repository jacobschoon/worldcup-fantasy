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

function hashPin(pin) {
  let h = 0
  for (let i = 0; i < pin.length; i++) { h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0 }
  return h.toString()
}

// req.body is auto-parsed in CJS Vercel functions but not always in ESM — stream as fallback
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data)) }
      catch (e) { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    try {
      const teams = (await redis.get('wc_teams')) || []
      console.log('[api/teams] GET — returning', teams.length, 'team(s)')
      return res.status(200).json(teams)
    } catch (e) {
      console.error('[api/teams] GET error:', e.message)
      return res.status(503).json({ error: 'Redis unavailable' })
    }
  }

  if (req.method === 'POST') {
    try {
      // Use pre-parsed body if available, otherwise stream it
      let body
      if (req.body && typeof req.body === 'object') {
        body = req.body
        console.log('[api/teams] POST — body via req.body:', JSON.stringify(body).slice(0, 200))
      } else {
        body = await readBody(req)
        console.log('[api/teams] POST — body via stream:', JSON.stringify(body).slice(0, 200))
      }

      const { pin: rawPin, action, ...team } = body

      if (action === 'clear') {
        if (String(rawPin) !== '2026') {
          console.log('[api/teams] POST clear — PIN mismatch')
          return res.status(401).json({ error: 'Incorrect PIN' })
        }
        await redis.del('wc_teams')
        console.log('[api/teams] POST — wc_teams cleared')
        return res.status(200).json({ ok: true, cleared: true })
      }

      console.log('[api/teams] POST — manager:', team.manager, '| pin present:', !!rawPin)

      const teams = (await redis.get('wc_teams')) || []
      const existing = teams.find(t => t.manager === team.manager)
      if (existing) {
        if (String(rawPin) !== '2026' && existing.pinHash && existing.pinHash !== hashPin(String(rawPin || ''))) {
          console.log('[api/teams] POST — PIN mismatch for manager:', team.manager)
          return res.status(401).json({ error: 'Incorrect PIN' })
        }
      }

      const idx = teams.findIndex(t => t.manager === team.manager)
      if (idx > -1) teams[idx] = team; else teams.push(team)
      await redis.set('wc_teams', teams)
      console.log('[api/teams] POST — saved OK, total teams:', teams.length)
      return res.status(200).json({ ok: true })
    } catch (e) {
      console.error('[api/teams] POST error:', e.message)
      return res.status(503).json({ error: e.message || 'Redis unavailable' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
