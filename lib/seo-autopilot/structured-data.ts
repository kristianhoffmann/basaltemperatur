import type { BlogPost } from '@/app/[locale]/blog/posts'
import { authorPath, blogUrl } from '@/lib/blog-urls'
import { getSeoSiteUrl } from '@/lib/seo-site-url'

export function articleSchema(post: BlogPost) {
  const site = getSeoSiteUrl()
  const url = blogUrl(post.locale, post.slug)
  // Build trusted identity fields from the same row as the visible article.
  // Incoming schema may contain invented credentials, stale dates or unrelated URLs.
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting', '@id': `${url}#article`, url,
        headline: post.title, description: post.meta_description,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        inLanguage: 'de-DE', datePublished: post.published_at,
        dateModified: post.updated_at ?? post.published_at,
        ...(post.hero_image_url ? { image: post.hero_image_url } : {}),
        ...(post.author?.name ? { author: { '@type': 'Person', name: post.author.name,
          '@id': `${site}${authorPath(post.author.name, post.locale)}#person`,
          url: `${site}${authorPath(post.author.name, post.locale)}` } } : {}),
        publisher: { '@id': `${site}/#organization` },
      },
      { '@type': 'Organization', '@id': `${site}/#organization`, name: 'Basaltemperatur', url: `${site}/` },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Start', item: `${site}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: blogUrl(post.locale) },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ] },
    ],
  }
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function siteSchema() {
  const site = getSeoSiteUrl()
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': `${site}/#organization`, name: 'Basaltemperatur', url: `${site}/` },
    { '@type': 'WebSite', '@id': `${site}/#website`, name: 'Basaltemperatur', url: `${site}/`,
      inLanguage: 'de-DE', publisher: { '@id': `${site}/#organization` } },
  ] }
}
