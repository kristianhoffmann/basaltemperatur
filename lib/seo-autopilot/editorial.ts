import type { PublishPayload } from './schema'
import { getPostTopics, relatedPosts } from './discovery'

export function reviewSubmission(
  payload: PublishPayload,
  existing: { slug: string; title: string; tags: string[] | null }[],
) {
  const candidate = { slug: payload.slug, title: payload.title, tags: payload.tags, locale: payload.locale }
  const topics = getPostTopics(candidate)
  const contentIssues = articleContentIssues(payload.mdxBody)
  const overlappingSlugs = relatedPosts(candidate, existing.map((item) => ({ ...item, locale: payload.locale })), 5, 0).map((post) => post.slug)
  return { topics, overlappingSlugs, contentIssues }
}

// Structural checks supplement the human, content-bound review; they cannot verify a source's truth.
export function articleContentIssues(markdown: string): string[] {
  const blocks = markdown.trim().split(/\n\s*\n/).map((block) => block.trim())
  const first = blocks.find((block) => !/^(?:#|[-*] |\d+\. |>|\||import |export )/.test(block)) ?? ''
  const lead = first.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  const sentences = lead.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/).filter(Boolean)
  const issues: string[] = []
  if (sentences.length < 2 || sentences.length > 3 || !/[.!?]$/.test(lead)) issues.push('Kurzantwort mit 2–3 Sätzen am Artikelanfang fehlt.')
  for (const block of blocks) {
    const numericClaim = /\d+(?:[.,]\d+)?\s*(?:%|°C|Prozent|Tage|Monate|Jahre|Stunden|Minuten|Euro|€)/i.test(block)
    if (numericClaim && !/\[[^\]]+\]\(https?:\/\//i.test(block)) issues.push('Zahlenangabe ohne verlinkte Quelle im selben Absatz.')
  }
  return [...new Set(issues)]
}
