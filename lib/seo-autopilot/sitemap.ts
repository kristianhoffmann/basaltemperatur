import { BLOG_PAGE_SIZE } from '@/lib/blog-pagination'
import type { MetadataRoute } from 'next'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { authorPath, blogUrl, topicPath } from '@/lib/blog-urls'
import { BLOG_TOPICS, topicPosts } from '@/lib/seo-autopilot/discovery'
import { getCachedPosts } from '@/app/[locale]/blog/posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getCachedPosts('de')
  const site = getSeoSiteUrl()
  const latest = (items: typeof posts) => items.map((post) => post.updated_at ?? post.published_at).sort().at(-1)
  const authors = [...new Set(posts.flatMap((post) => post.author?.name ? [post.author.name] : []))]
  return [
    // No reliable revision dates exist for static pages; omit lastmod instead of fabricating today's date.
    ...['/', '/ueber-uns', '/werkzeuge/temperatur-hilfslinie', '/widerruf-ausueben', '/impressum', '/datenschutz', '/agb', '/widerruf', '/support'].map((path) => ({ url: `${site}${path}` })),
    ...Array.from({ length: Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE)) }, (_, index) => ({ url: `${blogUrl('de')}${index ? `?page=${index + 1}` : ''}`, lastModified: latest(posts.slice(index * BLOG_PAGE_SIZE, (index + 1) * BLOG_PAGE_SIZE)) })),
    ...BLOG_TOPICS.map((topic) => ({ url: `${site}${topicPath(topic.slug)}`, lastModified: latest(topicPosts(posts, topic.slug)) })),
    ...authors.map((name) => ({ url: `${site}${authorPath(name)}`, lastModified: latest(posts.filter((post) => post.author?.name === name)) })),
    ...posts.map((post) => ({ url: blogUrl(post.locale, post.slug), lastModified: post.updated_at ?? post.published_at })),
  ]
}
