// Shared by server-rendered CTAs and forms. No browser persistence or tracking APIs.
export function internalRedirect(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return fallback
  try {
    const url = new URL(value, 'https://internal.invalid')
    if (url.origin !== 'https://internal.invalid' || url.pathname.startsWith('//')) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch { return fallback }
}

export function normalizeFrom(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 200 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : undefined
}

export function withFrom(path: string, value: unknown): string {
  const from = normalizeFrom(value)
  if (!from) return path
  const url = new URL(path, 'https://source.invalid')
  url.searchParams.set('from', from)
  return `${url.pathname}${url.search}${url.hash}`
}

export function getArticleCta(post: { title: string; slug: string; tags: string[] | null }) {
  const text = `${post.title} ${post.slug} ${(post.tags ?? []).join(' ')}`
  if (/export|pdf|statistik|analyse|vergleich/i.test(text)) return {
    href: '/werkzeuge/temperatur-hilfslinie#analyse', title: 'Die Analyse zuerst am Beispiel verstehen',
    text: 'Sieh dir die Hilfslinien-Berechnung und die Methodik der Analyse an, bevor du Funktionen freischaltest.', label: 'Methodik und Beispiel ansehen',
  }
  if (/periode|perioden|zyklus|tagebuch|kalender/i.test(text) && !/app|ohne anmeldung/i.test(text)) return {
    href: '/registrieren', title: 'Deinen Zyklus im Tagebuch dokumentieren',
    text: 'Erfasse Temperatur und Periodentage im kostenlosen Tagebuch. Eine Analyse kannst du später optional freischalten.', label: 'Temperatur und Periode erfassen',
  }
  return { href: '/werkzeuge/temperatur-hilfslinie', title: 'Temperaturwerte ohne Konto ausprobieren',
    text: 'Berechne die Hilfslinie aus sechs Temperaturwerten und lerne die Grundlage der Kurvendarstellung kennen.', label: 'Hilfslinie kostenlos berechnen' }
}
