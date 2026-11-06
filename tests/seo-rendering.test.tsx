import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BlogArticleBody } from '@/app/[locale]/blog/[slug]/BlogArticleBody'
import { serializeJsonLd } from '@/lib/seo-autopilot/structured-data'
import nextConfig from '@/next.config'
import robots from '@/app/robots'

it('renders relative Markdown links without nofollow and rejects unsafe schemes', () => {
  const html = renderToStaticMarkup(<BlogArticleBody source={'[Kurve](./kurve) und [Tagebuch](../tagebuch) und [Abschnitt](#messen) und [Unsicher](javascript:alert)'} />)
  expect(html).toContain('href="./kurve"')
  expect(html).toContain('href="../tagebuch"')
  expect(html).toContain('href="#messen"')
  expect(html).not.toContain('nofollow')
  expect(html).not.toContain('href="javascript:')
})

it('escapes script closing tags inside JSON-LD', () => {
  expect(serializeJsonLd({ headline: '</script><script>alert(1)</script>' })).not.toContain('</script>')
})

describe('crawler access', () => {
  it.each(['Googlebot', 'Bingbot', 'Slackbot', 'Twitterbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'])('retains blocking metadata for %s', (bot) => {
    expect(nextConfig.htmlLimitedBots?.test(bot)).toBe(true)
  })
  it('does not block rendering assets or public pages', () => {
    const rules = robots().rules as { disallow: string[] }[]
    expect(rules[0].disallow.some((path) => path.includes('_next'))).toBe(false)
    expect(rules[0].disallow).not.toContain('/de/blog')
  })
})
it('explicitly names the fleet search and AI crawlers in robots rules', () => {
  const rules = robots().rules
  const entries = (Array.isArray(rules) ? rules : [rules]).flatMap((rule) => Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent])
  for (const bot of ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended']) expect(entries).toContain(bot)
})
