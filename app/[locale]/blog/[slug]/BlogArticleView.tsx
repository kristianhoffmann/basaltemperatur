import Link from 'next/link'
import { ChevronRight, Clock, ListOrdered } from 'lucide-react'
import { BlogFooter, BlogHeader } from '../BlogChrome'
import { BlogCtaBand, BlogCtaCard } from '../BlogCta'
import { BlogPostCard } from '../BlogPostCard'
import { formatBlogDate, type BlogPost, type BlogPostSummary } from '../posts'
import { BlogArticleBody, estimateReadingMinutes, extractHeadings, type ArticleHeading } from './BlogArticleBody'
import { MedicalDisclaimer } from './MedicalDisclaimer'

const HERO_GRADIENT = 'linear-gradient(135deg, #0F1029 0%, #1A0F2E 45%, #0D1B2A 100%)'

// The autopilot writes updated_at on every publish, often equal to published_at.
// "Zuletzt aktualisiert" only earns its place when the day actually differs.
function isMeaningfullyUpdated(publishedAt: string, updatedAt?: string | null) {
  if (!updatedAt) return false
  return new Date(publishedAt).toDateString() !== new Date(updatedAt).toDateString()
}

function TableOfContents({ headings }: { headings: ArticleHeading[] }) {
  return (
    <ol className="space-y-1 text-sm">
      {headings.map((heading, index) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className="flex gap-3 rounded-xl px-3 py-2 leading-snug text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            <span className="w-5 shrink-0 font-semibold tabular-nums text-rose-500">{String(index + 1).padStart(2, '0')}</span>
            <span>{heading.text}</span>
          </a>
        </li>
      ))}
    </ol>
  )
}

export function BlogArticleView({
  post,
  locale,
  related,
  beforeContent,
}: {
  post: BlogPost
  locale: string
  related: BlogPostSummary[]
  beforeContent?: React.ReactNode
}) {
  const headings = extractHeadings(post.mdx_body)
  const readingMinutes = estimateReadingMinutes(post.mdx_body)
  const authorName = post.author?.name
  const updated = isMeaningfullyUpdated(post.published_at, post.updated_at)

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-950">
      {beforeContent}
      <BlogHeader locale={locale} />

      <main>
        <article>
          <header className="relative overflow-hidden text-white" style={{ background: HERO_GRADIENT }}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-rose-400/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 h-[24rem] w-[24rem] rounded-full bg-violet-500/20 blur-3xl" />
            <div className={`relative mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8 ${post.hero_image_url ? 'pb-40 sm:pb-56' : 'pb-16 sm:pb-20'}`}>
              <nav aria-label="Brotkrümelnavigation" className="flex items-center gap-1.5 text-sm text-white/55">
                <Link href="/" className="transition-colors hover:text-white">Start</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={`/${locale}/blog`} className="transition-colors hover:text-white">Blog</Link>
              </nav>

              <h1 className="mt-8 max-w-4xl text-[2.25rem] font-extrabold leading-[1.08] tracking-tight !text-white sm:text-5xl lg:text-[3.5rem]">
                {post.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70 sm:text-xl">
                {post.meta_description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/60">
                {authorName && (
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-violet-500 text-xs font-bold text-white">
                      {authorName.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium text-white/85">{authorName}</span>
                  </span>
                )}
                <time dateTime={post.published_at}>{formatBlogDate(post.published_at)}</time>
                {updated && post.updated_at && (
                  <span>
                    Aktualisiert am <time dateTime={post.updated_at}>{formatBlogDate(post.updated_at)}</time>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {readingMinutes} Min. Lesezeit
                </span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {post.hero_image_url && (
              <figure className="relative -mt-28 sm:-mt-44">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.hero_image_url}
                  alt={post.hero_image_alt ?? post.title}
                  width={1792}
                  height={1024}
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[16/9] w-full rounded-[1.75rem] object-cover shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 lg:aspect-[21/9]"
                />
              </figure>
            )}

            {/* grid-cols-1 (minmax(0,1fr)) matters: an implicit auto track would grow to the table's min width on phones. */}
            <div className="mt-10 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                {headings.length > 1 && (
                  <details className="group mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-slate-950">
                      <span className="flex items-center gap-2">
                        <ListOrdered className="h-4 w-4 text-rose-500" />
                        Inhalt ({headings.length} Abschnitte)
                      </span>
                      <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="border-t border-slate-100 px-2 py-3">
                      <TableOfContents headings={headings} />
                    </div>
                  </details>
                )}

                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white px-5 py-9 shadow-sm sm:px-10 sm:py-12 lg:px-14">
                  <BlogArticleBody source={post.mdx_body} />
                  <MedicalDisclaimer />
                </div>
              </div>

              <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
                {headings.length > 1 && (
                  <nav aria-label="Inhalt" className="hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm lg:block">
                    <p className="flex items-center gap-2 px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <ListOrdered className="h-4 w-4 text-rose-500" />
                      Inhalt
                    </p>
                    <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
                      <TableOfContents headings={headings} />
                    </div>
                  </nav>
                )}
                <BlogCtaCard />
              </aside>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section aria-labelledby="weiterlesen" className="mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <h2 id="weiterlesen" className="text-3xl font-extrabold tracking-tight text-slate-950">Weiterlesen</h2>
              <Link href={`/${locale}/blog`} className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                Alle Artikel
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <BlogPostCard key={item.id} post={item} headingLevel="h3" />
              ))}
            </div>
          </section>
        )}

        <div className="py-20">
          <BlogCtaBand />
        </div>
      </main>

      <BlogFooter />
    </div>
  )
}
