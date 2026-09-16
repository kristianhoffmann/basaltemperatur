import { BlogFooter, BlogHeader } from './BlogChrome'
import { BlogCtaBand } from './BlogCta'
import { BlogPostCard } from './BlogPostCard'
import type { BlogPostSummary } from './posts'

const HERO_GRADIENT = 'linear-gradient(135deg, #0F1029 0%, #1A0F2E 45%, #0D1B2A 100%)'

export function BlogIndexView({ locale, posts }: { locale: string; posts: BlogPostSummary[] }) {
  const [featured, ...rest] = posts

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-950">
      <BlogHeader locale={locale} />
      <main>
        <section className="relative overflow-hidden text-white" style={{ background: HERO_GRADIENT }}>
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-rose-400/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 h-[24rem] w-[24rem] rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6 sm:pb-36 sm:pt-16 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">Basaltemperatur Blog</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight !text-white sm:text-5xl lg:text-6xl">
              Wissen für Zyklustracking, NFP und Temperaturkurven.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              Praxisnahe Artikel rund um Basaltemperatur, App-Vergleiche und sichere digitale Zyklusdokumentation.
            </p>
            {posts.length > 0 && (
              <p className="mt-8 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/70">
                {posts.length} Artikel
              </p>
            )}
          </div>
        </section>

        <section className="relative mx-auto -mt-16 max-w-6xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
          {!featured ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-500">
              Noch keine Artikel vorhanden.
            </div>
          ) : (
            <>
              <BlogPostCard post={featured} featured />
              {rest.length > 0 && (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <div className="py-20">
          <BlogCtaBand />
        </div>
      </main>
      <BlogFooter />
    </div>
  )
}
