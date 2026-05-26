import type { ReactNode } from 'react'

type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }

export function BlogArticleBody({ source }: { source: string }) {
  const blocks = parseMarkdown(source)
  return (
    <div className="space-y-7 text-[1.05rem] leading-8 text-slate-700">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  )
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? ''
    if (!line || line === '---' || /^import\s|^export\s/.test(line)) {
      index++
      continue
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line)
    if (heading) {
      blocks.push({
        type: 'heading',
        level: Math.min(heading[1]?.length ?? 2, 4) as 1 | 2 | 3 | 4,
        text: (heading[2] ?? '').trim(),
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

function renderBlock(block: MarkdownBlock, index: number): ReactNode {
  if (block.type === 'heading') {
    if (block.level <= 2) {
      return <h2 key={index} className="pt-6 text-3xl font-bold leading-tight tracking-tight text-slate-950">{renderInline(block.text)}</h2>
    }
    if (block.level === 3) {
      return <h3 key={index} className="pt-4 text-2xl font-bold leading-snug text-slate-950">{renderInline(block.text)}</h3>
    }
    return <h4 key={index} className="pt-2 text-xl font-semibold text-slate-950">{renderInline(block.text)}</h4>
  }
  if (block.type === 'quote') {
    return <blockquote key={index} className="rounded-2xl border-l-4 border-rose-300 bg-rose-50 px-5 py-4 text-slate-700">{renderInline(block.text)}</blockquote>
  }
  if (block.type === 'ul') {
    return <ul key={index} className="list-disc space-y-2 pl-6 marker:text-rose-400">{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ul>
  }
  if (block.type === 'ol') {
    return <ol key={index} className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-rose-500">{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ol>
  }
  if (block.type === 'table') {
    return (
      <div key={index} className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-950">
            <tr>
              {block.header.map((cell, cellIndex) => (
                <th key={cellIndex} className="px-4 py-3 font-semibold">{renderInline(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top">{renderInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
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
      nodes.push(<code key={nodes.length} className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-900">{match[4]}</code>)
    } else if (match[5] && match[6]) {
      const href = match[6]
      nodes.push(
        <a key={nodes.length} href={href} className="font-medium text-rose-600 underline underline-offset-4" rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
          {match[5]}
        </a>,
      )
    }
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
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
