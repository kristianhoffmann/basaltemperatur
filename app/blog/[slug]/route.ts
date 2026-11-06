import { NextResponse } from 'next/server'
import { blogUrl } from '@/lib/blog-urls'

type RouteContext = {
  params: Promise<{ slug: string }>
}

/**
 * Der Pfad ohne Sprachpraefix ist der aeltere. Er bleibt als Weiterleitung
 * bestehen, weil eingehende Verweise und aeltere Adressen ihn tragen.
 *
 * Das Ziel wird NICHT aus `request.url` gebaut. Hinter dem Caddy sieht der
 * Container als eigene Adresse seine Bind-Adresse, und Next uebernimmt sie in
 * `request.url`. Bis zum 09.09.2026 antwortete die Route deshalb mit
 * `308 -> https://0.0.0.0:3000/de/blog/<slug>`: fuer jeden Besucher und jeden
 * Crawler eine tote Adresse. Der kanonische Host steht in `getSeoSiteUrl()`
 * und ist die einzige verlaessliche Quelle dafuer.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params
  return NextResponse.redirect(new URL(blogUrl('de', slug)), 308)
}
