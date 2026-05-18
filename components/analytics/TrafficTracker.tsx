'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const VISITOR_KEY = 'bt_visitor_id'
const SESSION_KEY = 'bt_session_id'
const LAST_URL_KEY = 'bt_last_url'

function getOrCreateStorageId(storage: Storage, key: string) {
  const existing = storage.getItem(key)
  if (existing) return existing

  const value = crypto.randomUUID()
  storage.setItem(key, value)
  return value
}

export function TrafficTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const trackedUrl = useRef<string | null>(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'false') return
    if (!pathname || pathname.startsWith('/api')) return

    const search = searchParams.toString()
    const currentUrl = `${window.location.origin}${pathname}${search ? `?${search}` : ''}`
    if (trackedUrl.current === currentUrl) return
    trackedUrl.current = currentUrl

    const visitorId = getOrCreateStorageId(window.localStorage, VISITOR_KEY)
    const sessionId = getOrCreateStorageId(window.sessionStorage, SESSION_KEY)
    const previousUrl = window.sessionStorage.getItem(LAST_URL_KEY)
    window.sessionStorage.setItem(LAST_URL_KEY, currentUrl)

    const payload = {
      eventType: 'pageview',
      visitorId,
      sessionId,
      path: pathname,
      url: currentUrl,
      search,
      title: document.title,
      referrer: previousUrl || document.referrer || null,
      language: navigator.language,
      languages: navigator.languages,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      connectionType: 'connection' in navigator
        ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType
        : null,
    }

    const body = JSON.stringify(payload)
    const blob = new Blob([body], { type: 'application/json' })
    const sent = navigator.sendBeacon('/api/traffic', blob)
    if (!sent) {
      fetch('/api/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined)
    }
  }, [pathname, searchParams])

  return null
}
