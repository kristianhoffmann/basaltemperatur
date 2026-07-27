import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPost, listPosts } from '@/lib/seo-autopilot/storage'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { BLOG_LOCALES, isBlogLocale } from '@/lib/blog-locales'
import { withCanonicalHost } from '@/lib/canonical-host'
import { BlogFooter, BlogHeader } from '../BlogChrome'
import { BlogArticleBody } from './BlogArticleBody'
import { BlogAttributionTracker } from './BlogAttributionTracker'
import { MedicalDisclaimer } from './MedicalDisclaimer'

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Der Autopilot schreibt updated_at bei jedem Publish mit, oft identisch zu
// published_at. Ein "Zuletzt aktualisiert" nur zeigen, wenn sich das Datum auch
// wirklich unterscheidet — sonst ist es ein leeres Vertrauenssignal.
function isMeaningfullyUpdated(publishedAt: string, updatedAt?: string | null) {
  if (!updatedAt) return false
  const published = new Date(publishedAt).toDateString()
  const updated = new Date(updatedAt).toDateString()
  return published !== updated
}

function getCachedPost(locale: string, slug: string) {
  return unstable_cache(
    () => getPost(locale, slug),
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
      modifiedTime: post.updated_at,
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

  const post = await getCachedPost(locale, slug)
  if (!post) notFound()

  const siteUrl = getSeoSiteUrl()
  const canonical = `${siteUrl}/${locale}/blog/${slug}`

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-950">
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

      <BlogAttributionTracker
        postId={post.id}
        slug={post.slug}
        locale={post.locale}
      />

      <BlogHeader locale={locale} />

      <main>
        <article>
          <header className="border-b border-slate-200/80 bg-white">
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
              <Link href={`/${locale}/blog`} className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                Zurück zum Blog
              </Link>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <time dateTime={post.published_at}>
                  {formatDate(post.published_at)}
                </time>
                {isMeaningfullyUpdated(post.published_at, post.updated_at) && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span>
                      Zuletzt aktualisiert am{' '}
                      <time dateTime={post.updated_at}>{formatDate(post.updated_at)}</time>
                    </span>
                  </>
                )}
                {post.author?.name && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span>{post.author.name}</span>
                  </>
                )}
              </div>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">{post.title}</h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">{post.meta_description}</p>
            </div>
          </header>

          {post.hero_image_url && (
            <figure className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.hero_image_url}
                alt={post.hero_image_alt ?? post.title}
                width={1792}
                height={1024}
                fetchPriority="high"
                decoding="async"
                className="aspect-[16/9] w-full rounded-3xl object-cover shadow-xl shadow-slate-200/70"
              />
            </figure>
          )}

          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-8 md:px-10">
            <BlogArticleBody source={post.mdx_body} />
          </div>

          <MedicalDisclaimer />
        </article>
      </main>

      <BlogFooter />
    </div>
  )
}
