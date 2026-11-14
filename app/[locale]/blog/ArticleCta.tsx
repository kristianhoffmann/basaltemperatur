import Link from 'next/link'
import { getArticleCta, withFrom } from '@/lib/seo-autopilot/source'
import type { BlogPost } from './posts'

export function ArticleCta({ post }: { post: BlogPost }) {
  const cta = getArticleCta(post)
  return <aside aria-label="Passend zum Artikel" className="my-6 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5 text-[var(--text)]">
    <p className="font-bold">{cta.title}</p>
    <p className="mt-2 text-base">{cta.text}</p>
    <Link href={withFrom(cta.href, post.slug)} className="link-quiet mt-3 inline-block font-semibold">{cta.label}</Link>
  </aside>
}
