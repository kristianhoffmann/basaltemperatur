import Link from 'next/link'
import type { ReactNode } from 'react'
import { tokenizeInline, type LegalBlock } from '@/lib/legal/blocks'

function Inline({ text }: { text: string }) {
  return (
    <>
      {tokenizeInline(text).map((token, index): ReactNode => {
        if (token.kind === 'bold') return <strong key={index}>{token.value}</strong>
        if (token.kind === 'link') {
          return token.href.startsWith('/')
            ? <Link key={index} href={token.href}>{token.value}</Link>
            : <a key={index} href={token.href}>{token.value}</a>
        }
        return token.value
      })}
    </>
  )
}

export function LegalBlocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h2':
            return <h2 key={index}><Inline text={block.text} /></h2>
          case 'p':
            return (
              <p key={index} className={block.tone === 'note' ? 'text-sm italic' : block.tone === 'small' ? 'text-sm' : undefined}>
                <Inline text={block.text} />
              </p>
            )
          case 'ul':
            return <ul key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}><Inline text={item} /></li>)}</ul>
          case 'hr':
            return <hr key={index} className="my-8" />
          case 'form':
            return (
              <div key={index} className="my-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
                {block.lines.map((line, lineIndex) => <p key={lineIndex}><Inline text={line} /></p>)}
              </div>
            )
        }
      })}
    </>
  )
}
