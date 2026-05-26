import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPost } from '@/lib/seo-autopilot/storage'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { BlogFooter, BlogHeader } from '../BlogChrome'
import { BlogArticleBody } from './BlogArticleBody'
import { BlogAttributionTracker } from './BlogAttributionTracker'

interface Props {
  params: Promise<{ locale: string; slug: string }>
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
  const post = await getCachedPost(locale, slug)
  if (!post) return {}

  const siteUrl = getSeoSiteUrl()
  const canonical = `${siteUrl}/${locale}/blog/${slug}`
  const ogImage = post.hero_image_url
    ? [{ url: post.hero_image_url, alt: post.hero_image_alt ?? post.title }]
    : undefined

  return {
    title: post.title,
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
  const post = await getCachedPost(locale, slug)
  if (!post) notFound()

  const siteUrl = getSeoSiteUrl()
  const canonical = `${siteUrl}/${locale}/blog/${slug}`

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...post.schema_jsonld,
            url: canonical,
          }),
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
                Zurueck zum Blog
              </Link>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
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
                className="aspect-[16/9] w-full rounded-3xl object-cover shadow-xl shadow-slate-200/70"
              />
            </figure>
          )}

          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-8 md:px-10">
            <BlogArticleBody source={post.mdx_body} />
          </div>
        </article>
      </main>

      <BlogFooter />
    </div>
  )
}
