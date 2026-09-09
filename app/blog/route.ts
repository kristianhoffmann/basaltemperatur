import { NextResponse } from 'next/server'
import { getSeoSiteUrl } from '@/lib/seo-site-url'

/** Siehe app/blog/[slug]/route.ts: das Ziel darf nicht aus `request.url` kommen. */
export function GET() {
  return NextResponse.redirect(new URL('/de/blog', getSeoSiteUrl()), 308)
}
