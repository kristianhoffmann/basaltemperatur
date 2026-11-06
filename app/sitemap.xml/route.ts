import sitemap from '@/lib/seo-autopilot/sitemap'
import { contentUnavailable } from '@/lib/seo-autopilot/unavailable'
export const dynamic = 'force-dynamic'
const escapeXml = (value: string) => value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!)
export async function GET() {
  try {
    const entries = await sitemap()
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.map((entry) =>
      `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${escapeXml(entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified)}</lastmod>` : ''}</url>`).join('') + '</urlset>'
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' } })
  } catch { return contentUnavailable() }
}
