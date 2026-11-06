import Link from 'next/link'
import { getArticleCta, withFrom } from '@/lib/seo-autopilot/source'
import type { BlogPost } from './posts'

export function ArticleCta({ post }: { post: BlogPost }) {
  const cta = getArticleCta(post)
  return <aside aria-label="Passend zum Artikel" className="my-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-slate-900">
    <p className="font-bold">{cta.title}</p>
    <p className="mt-2 text-base">{cta.text}</p>
    <Link href={withFrom(cta.href, post.slug)} className="mt-3 inline-block font-semibold text-rose-800 underline">{cta.label}</Link>
  </aside>
}
