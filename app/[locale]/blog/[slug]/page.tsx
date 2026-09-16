import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPost, listPosts } from '@/lib/seo-autopilot/storage'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { BLOG_LOCALES, isBlogLocale } from '@/lib/blog-locales'
import { withCanonicalHost } from '@/lib/canonical-host'
import { getCachedPosts, type BlogPost } from '../posts'
import { BlogArticleView } from './BlogArticleView'
import { BlogAttributionTracker } from './BlogAttributionTracker'

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
      try {
        const posts = await listPosts(locale)
        return posts.map((post) => ({ locale, slug: post.slug }))
      } catch {
        // Ohne Autopilot-Credentials (lokal, Preview ohne Secrets) oder bei einer
        // nicht erreichbaren DB darf der Build nicht scheitern — dann eben alles
        // on demand rendern statt vorrendern. Gleiche Absicherung wie in app/sitemap.ts.
        return []
      }
    })
  )
  return perLocale.flat()
}

function getCachedPost(locale: string, slug: string) {
  return unstable_cache(
    () => getPost(locale, slug) as Promise<BlogPost | null>,
    [`post-${locale}-${slug}`],
    { tags: [`post:${locale}:${slug}`], revalidate: false }
  )()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params

  // Muss hier passieren, nicht erst in der Page: generateMetadata laeuft vor dem
  // ersten Flush, also kann notFound() den Status noch auf 404 setzen. In der Page
  // ist die Shell schon raus und die Antwort bleibt 200 (Soft-404).
  if (!isBlogLocale(locale)) notFound()

  const post = await getCachedPost(locale, slug)
  if (!post) notFound()

  const siteUrl = getSeoSiteUrl()
  const canonical = `${siteUrl}/${locale}/blog/${slug}`
  const ogImage = post.hero_image_url
    ? [{ url: post.hero_image_url, alt: post.hero_image_alt ?? post.title }]
    : undefined

  return {
    // absolute: ohne das haengt das Root-Layout " | Basaltemperatur" an und die
    // ohnehin schon langen Artikel-Titel reissen die 60-Zeichen-Grenze.
    title: { absolute: post.title },
    description: post.meta_description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.meta_description,
      url: canonical,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at ?? undefined,
      images: ogImage,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description,
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

  const siteUrl = getSeoSiteUrl()
  const canonical = `${siteUrl}/${locale}/blog/${slug}`
  const related = posts.filter((item) => item.slug !== slug).slice(0, 3)

  return (
    <BlogArticleView
      post={post}
      locale={locale}
      related={related}
      beforeContent={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                withCanonicalHost({
                  ...post.schema_jsonld,
                  url: canonical,
                })
              ),
            }}
          />
          <BlogAttributionTracker postId={post.id} slug={post.slug} locale={post.locale} />
        </>
      }
    />
  )
}
