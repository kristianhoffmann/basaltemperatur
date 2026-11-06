export function contentUnavailable() {
  return new Response('Inhalte vorübergehend nicht verfügbar. Bitte später erneut versuchen.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60', 'Cache-Control': 'no-store' },
  })
}
