import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPost } from '@/lib/seo-autopilot/storage'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
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
    <>
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

      <main className="mx-auto max-w-3xl px-4 py-12">
        {post.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.hero_image_url}
            alt={post.hero_image_alt ?? post.title}
            className="mb-8 h-64 w-full rounded-xl object-cover"
          />
        )}

        <h1 className="mb-4 text-4xl font-bold leading-tight">{post.title}</h1>

        <div className="mb-8 flex items-center gap-3 text-sm text-gray-500">
          {post.author?.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.avatarUrl}
              alt={post.author.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <span>{post.author?.name}</span>
          <span>·</span>
          <time dateTime={post.published_at}>
            {new Date(post.published_at).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>

        <article className="prose prose-gray max-w-none">
          <MDXRemote source={post.mdx_body} />
        </article>
      </main>
    </>
  )
}
