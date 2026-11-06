import { createClient } from '@supabase/supabase-js'
import type { PublishPayload } from './schema'
import { WITHDRAWN_SLUGS } from '@/lib/blog-urls'

function firstNonBlank(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean)
}

function storageCredentials() {
  return {
    url: firstNonBlank(
      process.env.SEO_AUTOPILOT_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    key: firstNonBlank(
      process.env.SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  }
}

export function hasStorageCredentials(): boolean {
  const { url, key } = storageCredentials()
  return Boolean(url && key)
}

function adminClient() {
  const { url, key } = storageCredentials()
  if (!url || !key) {
    throw new Error('SEO Autopilot Supabase credentials are required.')
  }
  return createClient(url, key, { global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) } })
}

function siteId() {
  const value = process.env.SEO_AUTOPILOT_SITE_ID?.trim()
  if (!value) throw new Error('Storage configuration: SEO_AUTOPILOT_SITE_ID is required.')
  return value
}

const TABLE = () => process.env.SEO_AUTOPILOT_POSTS_TABLE || 'seo_autopilot_posts'

export async function upsertPost(payload: PublishPayload): Promise<void> {
  const { error } = await adminClient()
    .from(TABLE())
    .upsert(
      {
        id: payload.postId,
        site_id: payload.siteId,
        slug: payload.slug,
        locale: payload.locale,
        title: payload.title,
        meta_description: payload.metaDescription,
        mdx_body: payload.mdxBody,
        hero_image_url: payload.heroImageUrl,
        hero_image_alt: payload.heroImageAlt,
        schema_jsonld: payload.schemaJsonLd,
        internal_links: payload.internalLinks,
        tags: payload.tags,
        author: payload.author,
        published_at: payload.publishedAt,
        updated_at: payload.updatedAt,
        is_refresh: payload.isRefresh,
        geo_score: payload.geoScore ?? null,
        external_url: null,
        received_at: new Date().toISOString(),
      },
      { onConflict: 'site_id,locale,slug' }
    )

  if (error) throw new Error(`Storage error: ${error.message}`)
}

export async function getPost(locale: string, slug: string) {
  const { data, error } = await adminClient()
    .from(TABLE())
    .select('*')
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('site_id', siteId())
    .maybeSingle()
  if (error) throw new Error(`Storage read error: ${error.message}`)
  return data && !WITHDRAWN_SLUGS.has(data.slug) ? data : null
}

export async function listPosts(locale: string) {
  const client = adminClient()
  const readPage = (start: number) => client.from(TABLE()).select(
    'id, slug, locale, title, meta_description, hero_image_url, hero_image_alt, tags, author, published_at, updated_at, internal_links'
  ).eq('locale', locale).eq('site_id', siteId())
    .order('published_at', { ascending: false }).order('id', { ascending: true }).range(start, start + 499)
  const posts: NonNullable<Awaited<ReturnType<typeof readPage>>['data']> = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await readPage(offset)
    if (error) throw new Error(`Storage list error: ${error.message}`)
    posts.push(...(data ?? []))
    if (!data || data.length < 500) break
  }
  return posts.filter((post) => !WITHDRAWN_SLUGS.has(post.slug))
}
