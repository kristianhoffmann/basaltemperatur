'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const GA_MEASUREMENT_ID = 'G-JH7PCJQKCS'
const CONSENT_KEY = 'kh_google_analytics_consent_v1'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function loadGoogleAnalytics() {
  if (typeof window === 'undefined' || window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args)
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
  document.head.appendChild(script)
}

function getStoredConsent(): boolean | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(CONSENT_KEY)
  if (value === 'granted') return true
  if (value === 'denied') return false
  return null
}

export function GoogleAnalyticsConsent() {
  const pathname = usePathname()
  const [consent, setConsent] = useState<boolean | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setConsent(getStoredConsent()), 0)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (consent !== true) return
    loadGoogleAnalytics()
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    window.gtag?.('event', 'page_view', {
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [consent, pathname])

  const saveConsent = (value: boolean) => {
    window.localStorage.setItem(CONSENT_KEY, value ? 'granted' : 'denied')
    setConsent(value)
  }

  if (consent !== null) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-[1000] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
      <p className="font-semibold text-slate-950 dark:text-white">Analytics-Einwilligung</p>
      <p className="mt-1">
        Wir nutzen Google Analytics nur nach deiner Zustimmung, um Reichweite und Nutzung der Seite zu verstehen.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => saveConsent(false)} className="rounded-full border border-slate-300 px-4 py-2 font-medium">
          Nur notwendige
        </button>
        <button type="button" onClick={() => saveConsent(true)} className="rounded-full bg-slate-950 px-4 py-2 font-medium text-white">
          Analytics erlauben
        </button>
      </div>
    </div>
  )
}
