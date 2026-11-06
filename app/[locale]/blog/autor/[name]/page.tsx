import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { authorPath } from '@/lib/blog-urls'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { isBlogLocale } from '@/lib/blog-locales'
import { getCachedPosts, getCachedPost } from '../../posts'
import { BlogHeader, BlogFooter } from '../../BlogChrome'
import { BlogPostCard } from '../../BlogPostCard'

type Props = { params: Promise<{ locale: string; name: string }> }
async function authorData(params: Props['params']) {
  const { locale, name } = await params
  if (!isBlogLocale(locale)) notFound()
  const posts = (await getCachedPosts(locale)).filter((post) => post.author?.name?.trim().toLocaleLowerCase('de-DE') === name)
  // Use the stored author data from an actual article, never inferred credentials.
  if (!posts.length) notFound()
  const article = await getCachedPost(locale, posts[0].slug)
  if (!article?.author?.name) notFound()
  return { locale, posts, author: article.author }
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, author } = await authorData(params)
  if (!author) return { title: 'Autoren im Blog' }
  return { title: `Artikel von ${author.name}`, alternates: { canonical: `${getSeoSiteUrl()}${authorPath(author.name!, locale)}` } }
}
export default async function AuthorPage({ params }: Props) {
  const { locale, posts, author } = await authorData(params)
  return <div className="min-h-screen bg-[#f7f7fb] text-slate-950"><BlogHeader locale={locale} />
    <main className="mx-auto max-w-6xl px-4 py-12"><h1 className="text-4xl font-extrabold">{author?.name ?? 'Autoren im Blog'}</h1>
      {author?.jobTitle && <p className="mt-4 text-lg">{author.jobTitle}</p>}
      {author?.bio && <p className="mt-4 max-w-3xl leading-8">{author.bio}</p>}
      <h2 className="mt-12 text-2xl font-bold">Veröffentlichte Artikel</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogPostCard key={post.id} post={post} headingLevel="h3" />)}</div>
    </main><BlogFooter /></div>
}
