import { unstable_cache } from 'next/cache'
import { getPost, listPosts } from '@/lib/seo-autopilot/storage'

export interface BlogPostSummary {
  id: string
  slug: string
  locale: string
  title: string
  meta_description: string
  hero_image_url: string | null
  hero_image_alt: string | null
  tags: string[] | null
  author: { name?: string } | null
  internal_links?: { targetSlug: string; anchorText: string }[] | null
  updated_at?: string | null
  published_at: string
}

export interface BlogPost extends BlogPostSummary {
  mdx_body: string
  updated_at: string | null
  schema_jsonld: Record<string, unknown> | null
  author: { name?: string; jobTitle?: string | null; bio?: string | null } | null
}

// Same cache key and tag for the index and the "Weiterlesen" block, so one
// revalidation of blog-index:<locale> refreshes both.
export function getCachedPosts(locale: string): Promise<BlogPostSummary[]> {
  return unstable_cache(async (): Promise<BlogPostSummary[]> => {
    return listPosts(locale)
  }, [`blog-index-${locale}`], {
    tags: [`blog-index:${locale}`],
    revalidate: 300,
  })()
}

// Optional article modules must not take their surrounding page offline.
// Catch outside unstable_cache so a failed read never caches an empty index.
export async function getOptionalPosts(locale: string): Promise<BlogPostSummary[]> {
  try {
    return await getCachedPosts(locale)
  } catch (error) {
    console.error('[seo] Optional articles unavailable:', error)
    return []
  }
}

export function formatBlogDate(value: string) {
  return new Date(value).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getCachedPost(locale: string, slug: string) {
  return unstable_cache(() => getPost(locale, slug) as Promise<BlogPost | null>,
    [`post-${locale}-${slug}`], { tags: [`post:${locale}:${slug}`], revalidate: 60 })()
}
