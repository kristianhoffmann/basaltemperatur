import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatBlogDate, type BlogPostSummary } from './posts'

export function BlogPostCard({
  post,
  featured = false,
  headingLevel = 'h2',
}: {
  post: BlogPostSummary
  featured?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const href = `/${post.locale}/blog/${post.slug}`
  const Heading = headingLevel

  return (
    <Link
      href={href}
      className={`group flex overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-300/40 ${
        featured ? 'flex-col lg:grid lg:grid-cols-[1.35fr_1fr]' : 'flex-col'
      }`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-violet-100 to-rose-100 lg:aspect-auto">
        {post.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.hero_image_url}
            alt={post.hero_image_alt ?? post.title}
            width={1792}
            height={1024}
            loading={featured ? 'eager' : 'lazy'}
            decoding="async"
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${featured ? 'lg:min-h-[340px]' : 'aspect-[16/9]'}`}
          />
        )}
      </div>
      <div className={`flex flex-1 flex-col ${featured ? 'p-7 sm:p-10 lg:justify-center' : 'p-6'}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {featured && <span className="mr-2 rounded-full bg-rose-50 px-2.5 py-1 text-rose-600">Neu</span>}
          <time dateTime={post.published_at}>{formatBlogDate(post.published_at)}</time>
        </p>
        <Heading
          className={`mt-3 font-extrabold leading-snug tracking-tight text-slate-950 transition-colors group-hover:text-rose-600 ${
            featured ? 'text-2xl sm:text-3xl lg:text-[2.1rem] lg:leading-tight' : 'text-xl'
          }`}
        >
          {post.title}
        </Heading>
        <p className={`mt-3 text-slate-600 ${featured ? 'line-clamp-4 leading-7 sm:text-lg' : 'line-clamp-3 text-[0.9375rem] leading-relaxed'}`}>
          {post.meta_description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-rose-600">
          Artikel lesen
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
