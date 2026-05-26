import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { listPosts } from '@/lib/seo-autopilot/storage'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { BlogFooter, BlogHeader } from './BlogChrome'

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
    <div className="min-h-screen bg-[#f7f7fb] text-slate-950">
      <BlogHeader locale={locale} />
      <main>
        <section className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">Basaltemperatur Blog</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Wissen fuer Zyklustracking, NFP und Temperaturkurven.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Praxisnahe Artikel rund um Basaltemperatur, App-Vergleiche und sichere digitale Zyklusdokumentation.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-500">
              Noch keine Artikel vorhanden.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${locale}/blog/${post.slug}`}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70"
                >
                  {post.hero_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.hero_image_url}
                      alt={post.hero_image_alt ?? post.title}
                      className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  )}
                  <div className="p-6">
                    <p className="text-sm font-medium text-slate-500">
                      {new Date(post.published_at).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <h2 className="mt-3 text-2xl font-bold leading-snug tracking-tight group-hover:text-rose-600">
                      {post.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 leading-7 text-slate-600">{post.meta_description}</p>
                    <p className="mt-5 text-sm font-semibold text-rose-600">Artikel lesen</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <BlogFooter />
    </div>
  )
}
