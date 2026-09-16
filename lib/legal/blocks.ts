// Legal texts as data, so the website and the purchase confirmation mail
// (§ 312f Abs. 2 BGB) always carry the identical wording.
// Inline markup: **bold** and [label](href); hrefs starting with "/" are site-relative.

export type LegalBlock =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string; tone?: 'small' | 'note' }
  | { type: 'ul'; items: string[] }
  | { type: 'hr' }
  | { type: 'form'; lines: string[] }

export type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'link'; value: string; href: string }

const INLINE_PATTERN = /\*\*([^*]+)\*\*|\[([^\]]+)]\(([^)\s]+)\)/g

export function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let lastIndex = 0
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) tokens.push({ kind: 'text', value: text.slice(lastIndex, index) })
    if (match[1] !== undefined) tokens.push({ kind: 'bold', value: match[1] })
    else tokens.push({ kind: 'link', value: match[2] ?? '', href: match[3] ?? '' })
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) tokens.push({ kind: 'text', value: text.slice(lastIndex) })
  return tokens
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function absoluteHref(href: string, siteUrl: string): string {
  return href.startsWith('/') ? `${siteUrl}${href}` : href
}

const MAIL_STYLE = {
  h2: 'margin:28px 0 8px;color:#0F1029;font-size:17px;line-height:1.3;',
  p: 'margin:0 0 12px;color:#344054;font-size:14px;line-height:1.6;',
  small: 'margin:0 0 12px;color:#667085;font-size:12px;line-height:1.6;',
  li: 'margin:0 0 6px;color:#344054;font-size:14px;line-height:1.6;',
  link: 'color:#C2526E;',
  form: 'margin:12px 0;padding:16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;',
  hr: 'margin:24px 0;border:0;border-top:1px solid #E2E8F0;',
}

function inlineToHtml(text: string, siteUrl: string): string {
  return tokenizeInline(text)
    .map((token) => {
      if (token.kind === 'bold') return `<strong>${escapeHtml(token.value)}</strong>`
      if (token.kind === 'link') {
        return `<a href="${escapeHtml(absoluteHref(token.href, siteUrl))}" style="${MAIL_STYLE.link}">${escapeHtml(token.value)}</a>`
      }
      return escapeHtml(token.value)
    })
    .join('')
}

export function legalBlocksToHtml(blocks: LegalBlock[], siteUrl: string): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h2':
          return `<h2 style="${MAIL_STYLE.h2}">${inlineToHtml(block.text, siteUrl)}</h2>`
        case 'p':
          return `<p style="${block.tone ? MAIL_STYLE.small : MAIL_STYLE.p}">${inlineToHtml(block.text, siteUrl)}</p>`
        case 'ul':
          return `<ul style="margin:0 0 12px;padding-left:20px;">${block.items.map((item) => `<li style="${MAIL_STYLE.li}">${inlineToHtml(item, siteUrl)}</li>`).join('')}</ul>`
        case 'hr':
          return `<hr style="${MAIL_STYLE.hr}">`
        case 'form':
          return `<div style="${MAIL_STYLE.form}">${block.lines.map((line) => `<p style="${MAIL_STYLE.p}">${inlineToHtml(line, siteUrl)}</p>`).join('')}</div>`
      }
    })
    .join('\n')
}

function inlineToText(text: string, siteUrl: string): string {
  return tokenizeInline(text)
    .map((token) => {
      if (token.kind === 'link') {
        const href = absoluteHref(token.href, siteUrl)
        return href.replace(/^mailto:/, '') === token.value ? token.value : `${token.value} (${href.replace(/^mailto:/, '')})`
      }
      return token.value
    })
    .join('')
}

export function legalBlocksToText(blocks: LegalBlock[], siteUrl: string): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h2':
          return `\n${inlineToText(block.text, siteUrl).toUpperCase()}`
        case 'p':
          return inlineToText(block.text, siteUrl)
        case 'ul':
          return block.items.map((item) => `- ${inlineToText(item, siteUrl)}`).join('\n')
        case 'hr':
          return '----------------------------------------'
        case 'form':
          return block.lines.map((line) => `  ${inlineToText(line, siteUrl)}`).join('\n')
      }
    })
    .join('\n\n')
}
