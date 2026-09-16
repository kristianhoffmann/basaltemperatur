'use client'

import { useEffect } from 'react'
import { useStatisticsConsent } from '@/lib/analytics-consent'

interface Props {
  postId: string
  slug: string
  locale: string
}

export function BlogAttributionTracker({ postId, slug, locale }: Props) {
  const consent = useStatisticsConsent()

  useEffect(() => {
    // The attribution cookie is marketing measurement, not strictly necessary (§ 25 TDDDG).
    if (consent !== 'granted') return
    const params = new URLSearchParams(window.location.search)
    const keyword = params.get('kw') ?? undefined

    fetch('/api/seo-autopilot/attribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, slug, locale, keyword }),
    }).catch(() => {})
  }, [postId, slug, locale, consent])

  return null
}
