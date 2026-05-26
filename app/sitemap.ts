import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { getSeoSiteUrl } from '@/lib/seo-site-url'

const siteUrl = getSeoSiteUrl()

const LOCALES = ['de']

async function getBlogPosts() {
  try {
    const url =
      process.env.SEO_AUTOPILOT_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key =
      process.env.SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(url, key)
    const table = process.env.SEO_AUTOPILOT_POSTS_TABLE || 'seo_autopilot_posts'

    const { data } = await supabase
      .from(table)
      .select('slug, locale, updated_at')
      .eq('site_id', process.env.SEO_AUTOPILOT_SITE_ID || '')
      .order('published_at', { ascending: false })

    return data ?? []
  } catch {
    return []
  }
}

const getCachedBlogPosts = unstable_cache(getBlogPosts, ['sitemap-blog-posts'], {
  tags: LOCALES.map((l) => `sitemap:${l}`),
  revalidate: false,
})

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const posts = await getCachedBlogPosts()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/impressum`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/datenschutz`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/agb`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/widerruf`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/support`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const blogIndexEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${siteUrl}/${locale}/blog`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/${post.locale}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...blogIndexEntries, ...postEntries]
}
