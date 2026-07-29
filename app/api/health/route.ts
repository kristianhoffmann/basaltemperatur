export const dynamic = 'force-dynamic'

export function GET(): Response {
  return Response.json(
    {
      ok: true,
      service: 'basaltemperatur',
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}
