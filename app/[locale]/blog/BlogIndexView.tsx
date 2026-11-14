import Link from 'next/link'
import { BLOG_PAGE_SIZE } from '@/lib/blog-pagination'
import { BlogTopicsNav } from './BlogDiscovery'
import { BlogFooter, BlogHeader } from './BlogChrome'
import { BlogCtaBand } from './BlogCta'
import { BlogPostCard } from './BlogPostCard'
import type { BlogPostSummary } from './posts'

export function BlogIndexView({ locale, posts, page = 1 }: { locale: string; posts: BlogPostSummary[]; page?: number }) {
  const pageCount = Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE))
  const pagePosts = posts.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE)
  const [featured, ...rest] = pagePosts
  const firstImage = pagePosts.find((post) => post.hero_image_url)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <BlogHeader locale={locale} />
      <main id="inhalt">
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <p className="eyebrow">Ratgeber</p>
          <h1 className="font-display mt-4 max-w-4xl text-4xl text-[var(--text)] sm:text-5xl lg:text-6xl">
            Basaltemperatur messen, Kurve lesen, Zyklus dokumentieren.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            Praxisnahe Artikel zum Messen und Dokumentieren – ohne Heilsversprechen und mit Quellen.
            {posts.length > 0 && <> Aktuell {posts.length} Artikel.</>}
          </p>
          <div className="mt-8"><BlogTopicsNav locale={locale} posts={posts} /></div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {!featured ? (
            <div className="rounded-2xl border border-dashed border-[var(--card-border)] bg-white p-8 text-[var(--text-muted)]">
              Noch keine Artikel vorhanden.
            </div>
          ) : (
            <>
              <BlogPostCard post={featured} featured />
              {rest.length > 0 && (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <BlogPostCard key={post.id} post={post} priority={post === firstImage} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {pageCount > 1 && <nav aria-label="Blogseiten" className="mx-auto mt-10 flex max-w-6xl flex-wrap gap-3 px-4">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Link key={number} aria-current={number === page ? 'page' : undefined} className="rounded-lg border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] aria-[current=page]:border-[var(--text)]" href={number === 1 ? `/${locale}/blog` : `/${locale}/blog?page=${number}`}>Seite {number}</Link>)}
        </nav>}
        <div className="py-20">
          <BlogCtaBand />
        </div>
      </main>
      <BlogFooter />
    </div>
  )
}
