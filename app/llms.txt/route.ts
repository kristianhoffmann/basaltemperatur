import { getCachedPosts } from '@/app/[locale]/blog/posts'
import { contentUnavailable } from '@/lib/seo-autopilot/unavailable'
import { renderLlms } from '@/lib/seo-autopilot/llms'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return new Response(renderLlms(await getCachedPosts('de')), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
    })
  } catch { return contentUnavailable() }
}
