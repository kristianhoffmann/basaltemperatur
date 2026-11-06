import { resolveBlogMetadata } from "@/lib/seo-autopilot/metadata-overrides";
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { hasStorageCredentials, listPosts } from '@/lib/seo-autopilot/storage'
import { BLOG_LOCALES, isBlogLocale } from '@/lib/blog-locales'
import { blogUrl } from '@/lib/blog-urls'
import { relatedPosts } from '@/lib/seo-autopilot/discovery'
import { articleSchema, serializeJsonLd } from '@/lib/seo-autopilot/structured-data'
import { getCachedPosts, getCachedPost } from '../posts'
import { BlogArticleView } from './BlogArticleView'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

// Ohne generateStaticParams behandelt Next.js die Route als rein dynamisch und
// schickt `Cache-Control: private, no-cache, no-store` — jeder Artikel-Request ging
// bisher an die Origin (x-vercel-cache: MISS bei jedem Aufruf), obwohl der Inhalt
// statisch ist. Mit den bekannten Slugs wird zur Build-Zeit vorgerendert; neue Posts
// funktionieren weiter, weil dynamicParams standardmaessig true bleibt und der
// Autopilot per Tag revalidiert.
export async function generateStaticParams() {
  const perLocale = await Promise.all(
    BLOG_LOCALES.map(async (locale) => {
      if (!hasStorageCredentials()) return []
      try {
        const posts = await listPosts(locale)
        return posts.map((post) => ({ locale, slug: post.slug }))
      } catch (error) {
        console.error('[seo] Cannot prerender articles:', error)
        // No failed lookup is cached. A request retries through the shared cache;
        // the proxy distinguishes missing articles from temporary storage failures.
        return []
      }
    })
  )
  return perLocale.flat()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params

  // Defense in depth; the proxy determines the HTTP status before streaming.
  if (!isBlogLocale(locale)) notFound()

  const post = await getCachedPost(locale, slug)
  if (!post) notFound()

  const metadata = resolveBlogMetadata(locale, slug, post.title, post.meta_description)

  const canonical = blogUrl(locale, slug)
  const ogImage = post.hero_image_url
    ? [{ url: post.hero_image_url, alt: post.hero_image_alt ?? post.title }]
    : undefined

  return {
    // absolute: ohne das haengt das Root-Layout " | Basaltemperatur" an und die
    // ohnehin schon langen Artikel-Titel reissen die 60-Zeichen-Grenze.
    title: { absolute: metadata.title },
    description: metadata.description,
    alternates: { canonical },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonical,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at ?? undefined,
      images: ogImage,
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: ogImage?.map((i) => i.url),
    },
    robots: { index: true, follow: true },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isBlogLocale(locale)) notFound()

  const [post, posts] = await Promise.all([getCachedPost(locale, slug), getCachedPosts(locale)])
  if (!post) notFound()

  const related = relatedPosts(post, posts)

  return (
    <BlogArticleView
      post={post}
      locale={locale}
      related={related}
      posts={posts}
      beforeContent={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeJsonLd(articleSchema(post)),
            }}
          />
        </>
      }
    />
  )
}
