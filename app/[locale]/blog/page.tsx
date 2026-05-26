import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { listPosts } from '@/lib/seo-autopilot/storage'
import { getSeoSiteUrl } from '@/lib/seo-site-url'

const SUPPORTED_LOCALES = ['de']

const getCachedPosts = (locale: string) =>
  unstable_cache(() => listPosts(locale), [`blog-index-${locale}`], {
    tags: [`blog-index:${locale}`],
    revalidate: false,
  })()

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Blog | Basaltemperatur',
    description: 'Alle Artikel rund um Basaltemperatur und Zyklusgesundheit.',
    alternates: {
      canonical: `${getSeoSiteUrl()}/${locale}/blog`,
    },
  }
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params

  if (!SUPPORTED_LOCALES.includes(locale)) notFound()

  const posts = await getCachedPosts(locale)

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Blog</h1>
      {posts.length === 0 && (
        <p className="text-gray-500">Noch keine Artikel vorhanden.</p>
      )}
      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/${locale}/blog/${post.slug}`}
              className="group block"
            >
              {post.hero_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.hero_image_url}
                  alt={post.hero_image_alt ?? post.title}
                  className="mb-3 h-48 w-full rounded-lg object-cover"
                />
              )}
              <h2 className="text-xl font-semibold group-hover:underline">
                {post.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {new Date(post.published_at).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="mt-2 text-gray-700">{post.meta_description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
