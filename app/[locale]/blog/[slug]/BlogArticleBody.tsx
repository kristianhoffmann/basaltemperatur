import type { ReactNode } from 'react'

type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }

export interface ArticleHeading {
  id: string
  text: string
}

export function BlogArticleBody({ source }: { source: string }) {
  const blocks = parseMarkdown(source)
  const firstParagraph = blocks.findIndex((block) => block.type === 'paragraph')
  return (
    <div className="space-y-6 text-[1.0625rem] leading-[1.8] text-slate-700">
      {blocks.map((block, index) => renderBlock(block, index, index === firstParagraph))}
    </div>
  )
}

export function extractHeadings(source: string): ArticleHeading[] {
  return parseMarkdown(source)
    .filter((block): block is Extract<MarkdownBlock, { type: 'heading' }> => block.type === 'heading' && block.level <= 2)
    .map(({ id, text }) => ({ id, text: stripInline(text) }))
}

export function estimateReadingMinutes(source: string): number {
  const words = source.replace(/[#>*`|_-]/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  const usedIds = new Map<string, number>()
  let index = 0

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? ''
    if (!line || line === '---' || /^import\s|^export\s/.test(line)) {
      index++
      continue
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line)
    if (heading) {
      const text = (heading[2] ?? '').trim()
      blocks.push({
        type: 'heading',
        level: Math.min(heading[1]?.length ?? 2, 4) as 1 | 2 | 3 | 4,
        text,
        id: uniqueId(slugify(stripInline(text)), usedIds),
      })
      index++
      continue
    }

    if (isTableStart(lines, index)) {
      const tableLines: string[] = []
      while (index < lines.length && /^\s*\|.+\|\s*$/.test(lines[index] ?? '')) {
        tableLines.push(lines[index] ?? '')
        index++
      }
      const [headerLine, , ...rowLines] = tableLines
      blocks.push({
        type: 'table',
        header: splitTableRow(headerLine),
        rows: rowLines.map(splitTableRow),
      })
      continue
    }

    if (/^>\s?/.test(line)) {
      const parts: string[] = []
      while (index < lines.length && /^\s*>\s?/.test(lines[index] ?? '')) {
        parts.push((lines[index] ?? '').replace(/^\s*>\s?/, '').trim())
        index++
      }
      blocks.push({ type: 'quote', text: parts.join(' ') })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index] ?? '')) {
        items.push((lines[index] ?? '').replace(/^\s*[-*]\s+/, '').trim())
        index++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index] ?? '')) {
        items.push((lines[index] ?? '').replace(/^\s*\d+\.\s+/, '').trim())
        index++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    const paragraph: string[] = [line]
    index++
    while (index < lines.length && (lines[index]?.trim() ?? '') && !startsSpecialBlock(lines, index)) {
      paragraph.push((lines[index] ?? '').trim())
      index++
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
  }

  return blocks
}

function renderBlock(block: MarkdownBlock, index: number, isLead: boolean): ReactNode {
  if (block.type === 'heading') {
    // scroll-mt keeps the heading clear of the viewport edge when jumped to from the TOC.
    if (block.level <= 2) {
      return (
        <h2 key={index} id={block.id} className="scroll-mt-8 !mt-14 border-t border-slate-100 pt-10 text-[1.75rem] font-extrabold leading-tight text-slate-950 first:!mt-0 first:border-0 first:pt-0 sm:text-[2rem]">
          {renderInline(block.text)}
        </h2>
      )
    }
    if (block.level === 3) {
      return <h3 key={index} id={block.id} className="scroll-mt-8 !mt-10 text-xl font-bold leading-snug tracking-tight text-slate-950 sm:text-[1.375rem]">{renderInline(block.text)}</h3>
    }
    return <h4 key={index} id={block.id} className="scroll-mt-8 !mt-8 text-lg font-bold tracking-tight text-slate-950">{renderInline(block.text)}</h4>
  }
  if (block.type === 'quote') {
    return (
      <blockquote key={index} className="rounded-2xl border-l-4 border-violet-400 bg-gradient-to-r from-violet-50 to-rose-50/60 px-6 py-5 text-slate-800">
        {renderInline(block.text)}
      </blockquote>
    )
  }
  if (block.type === 'ul') {
    return (
      <ul key={index} className="space-y-2.5 pl-1">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex} className="relative pl-7 before:absolute before:left-1 before:top-[0.7em] before:h-2 before:w-2 before:rounded-full before:bg-gradient-to-br before:from-rose-400 before:to-violet-500">
            {renderInline(item)}
          </li>
        ))}
      </ul>
    )
  }
  if (block.type === 'ol') {
    return (
      <ol key={index} className="space-y-3">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex} className="flex gap-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {itemIndex + 1}
            </span>
            <span className="min-w-0">{renderInline(item)}</span>
          </li>
        ))}
      </ol>
    )
  }
  if (block.type === 'table') {
    return (
      // Bleeds to the card edges (negative margins mirror the card padding in
      // BlogArticleView); German compounds only wrap with hyphenation.
      <div key={index} className="!my-10 -mx-5 overflow-x-auto border-y border-slate-200 sm:-mx-10 lg:-mx-14">
        <table className="w-full min-w-[560px] border-collapse text-left text-[0.9375rem] leading-relaxed [hyphenate-limit-chars:10_4_4] [hyphens:auto]">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              {block.header.map((cell, cellIndex) => (
                <th key={cellIndex} scope="col" className="px-3 py-3.5 font-semibold first:min-w-[8.5rem] first:pl-5 sm:first:min-w-[11.5rem] lg:first:min-w-[13.25rem] last:pr-5 sm:first:pl-10 sm:last:pr-10 lg:first:pl-14 lg:last:pr-14">{renderInline(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-4 align-top first:min-w-[8.5rem] first:pl-5 sm:first:min-w-[11.5rem] lg:first:min-w-[13.25rem] first:font-semibold first:text-slate-950 last:pr-5 sm:first:pl-10 sm:last:pr-10 lg:first:pl-14 lg:last:pr-14">{renderInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (isLead) {
    return <p key={index} className="text-lg leading-[1.8] text-slate-800 sm:text-xl sm:leading-[1.75]">{renderInline(block.text)}</p>
  }
  return <p key={index}>{renderInline(block.text)}</p>
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|\[([^\]]+)]\((https?:\/\/[^)]+|\/[^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    if (match[2]) {
      nodes.push(<strong key={nodes.length} className="font-semibold text-slate-950">{match[2]}</strong>)
    } else if (match[4]) {
      nodes.push(<code key={nodes.length} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-900">{match[4]}</code>)
    } else if (match[5] && match[6]) {
      const href = match[6]
      nodes.push(
        <a key={nodes.length} href={href} className="font-medium text-rose-600 underline decoration-rose-300 underline-offset-4 transition-colors hover:text-rose-700 hover:decoration-rose-500" rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
          {match[5]}
        </a>,
      )
    }
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function stripInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'abschnitt'
}

function uniqueId(base: string, used: Map<string, number>): string {
  const count = used.get(base) ?? 0
  used.set(base, count + 1)
  return count === 0 ? base : `${base}-${count + 1}`
}

function startsSpecialBlock(lines: string[], index: number): boolean {
  const line = lines[index]?.trim() ?? ''
  return /^(#{1,4})\s+/.test(line)
    || /^>\s?/.test(line)
    || /^[-*]\s+/.test(line)
    || /^\d+\.\s+/.test(line)
    || isTableStart(lines, index)
}

function isTableStart(lines: string[], index: number): boolean {
  return /^\s*\|.+\|\s*$/.test(lines[index] ?? '')
    && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] ?? '')
}

function splitTableRow(line = ''): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}
