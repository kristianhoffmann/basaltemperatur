import { NextResponse } from 'next/server'
import { blogUrl } from '@/lib/blog-urls'

/** Siehe app/blog/[slug]/route.ts: das Ziel darf nicht aus `request.url` kommen. */
export function GET() {
  return NextResponse.redirect(new URL(blogUrl()), 308)
}
