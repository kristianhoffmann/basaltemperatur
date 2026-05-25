'use client'

import { useEffect } from 'react'

interface Props {
  postId: string
  slug: string
  locale: string
}

export function BlogAttributionTracker({ postId, slug, locale }: Props) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const keyword = params.get('kw') ?? undefined

    fetch('/api/seo-autopilot/attribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, slug, locale, keyword }),
    }).catch(() => {})
  }, [postId, slug, locale])

  return null
}
