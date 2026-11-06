import { NextResponse } from 'next/server'
import { rememberArticleSource } from '@/lib/actions/auth'
import { getSeoSiteUrl } from '@/lib/seo-site-url'

// Preserve the existing signed-in article-source flow outside the proxy.
export async function GET(request: Request) {
  await rememberArticleSource(new URL(request.url).searchParams.get('from'))
  return NextResponse.redirect(new URL('/dashboard', getSeoSiteUrl()))
}
