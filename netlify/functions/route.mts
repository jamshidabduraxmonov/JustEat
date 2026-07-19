import type { Config, Context } from '@netlify/functions'

const ORS_ENDPOINT = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson'

export default async (req: Request, _context: Context) => {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const coordinates = (payload as { coordinates?: unknown })?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return Response.json(
      { error: 'Expected a "coordinates" array with at least two [lon, lat] points' },
      { status: 400 },
    )
  }

  const apiKey = Netlify.env.get('ORS_API_KEY')
  if (!apiKey) {
    return Response.json({ error: 'Routing service is not configured' }, { status: 500 })
  }

  const upstream = await fetch(ORS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: apiKey,
    },
    body: JSON.stringify({ coordinates }),
  })

  const result = await upstream.text()

  return new Response(result, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config: Config = {
  path: '/api/route',
  method: 'POST',
}
