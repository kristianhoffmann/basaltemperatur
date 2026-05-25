import { createClient } from '@supabase/supabase-js'
import type { PublishPayload } from './schema'

function adminClient() {
  const url =
    process.env.SEO_AUTOPILOT_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
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
  const { data } = await adminClient()
    .from(TABLE())
    .select('*')
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('site_id', process.env.SEO_AUTOPILOT_SITE_ID || '')
    .single()
  return data
}

export async function listPosts(locale: string) {
  const { data } = await adminClient()
    .from(TABLE())
    .select(
      'id, slug, locale, title, meta_description, hero_image_url, hero_image_alt, tags, author, published_at'
    )
    .eq('locale', locale)
    .eq('site_id', process.env.SEO_AUTOPILOT_SITE_ID || '')
    .order('published_at', { ascending: false })
  return data ?? []
}
