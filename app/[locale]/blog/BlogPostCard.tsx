import Link from 'next/link'
import { blogPath } from '@/lib/blog-urls'
import { ArrowRight } from 'lucide-react'
import { formatBlogDate, type BlogPostSummary } from './posts'

export function BlogPostCard({
  post,
  featured = false,
  priority = featured,
  headingLevel = 'h2',
}: {
  post: BlogPostSummary
  featured?: boolean
  priority?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const href = blogPath(post.locale, post.slug)
  const Heading = headingLevel

  return (
    <Link
      href={href}
      className={`group flex overflow-hidden rounded-2xl border border-[var(--card-border)] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[var(--text-muted)] hover:shadow-card ${
        featured ? 'flex-col lg:grid lg:grid-cols-[1.35fr_1fr]' : 'flex-col'
      }`}
    >
      {post.hero_image_url && (
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--bg-secondary)] lg:aspect-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.hero_image_url}
            alt={post.hero_image_alt ?? post.title}
            width={1792}
            height={1024}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.02] ${featured ? 'lg:min-h-[340px]' : 'aspect-[16/9]'}`}
          />
        </div>
      )}
      <div className={`flex flex-1 flex-col ${featured ? 'p-7 sm:p-10 lg:justify-center' : 'p-6'}`}>
        <p className="text-xs font-medium text-[var(--text-muted)]">
          {featured && <span className="mr-2 font-semibold text-[var(--rose)]">Neu ·</span>}
          <time dateTime={post.published_at}>{formatBlogDate(post.published_at)}</time>
        </p>
        <Heading
          className={`mt-3 font-semibold leading-snug tracking-tight text-[var(--text)] transition-colors group-hover:text-[var(--rose-dark)] ${
            featured ? 'text-2xl sm:text-3xl lg:text-[2.1rem] lg:leading-tight' : 'text-xl'
          }`}
        >
          {post.title}
        </Heading>
        <p className={`mt-3 text-[var(--text-secondary)] ${featured ? 'line-clamp-4 leading-7 sm:text-lg' : 'line-clamp-3 text-[0.9375rem] leading-relaxed'}`}>
          {post.meta_description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[var(--rose)]">
          Artikel lesen
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
