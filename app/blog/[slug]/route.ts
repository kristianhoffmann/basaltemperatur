import { NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params
  return NextResponse.redirect(new URL(`/de/blog/${slug}`, request.url), 308)
}
