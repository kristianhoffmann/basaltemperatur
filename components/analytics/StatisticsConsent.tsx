'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/traffic'
import { usePathname } from 'next/navigation'
import {
  onOpenStatisticsSettings,
  setStatisticsConsent,
  useStatisticsConsent,
} from '@/lib/analytics-consent'

const GA_MEASUREMENT_ID = 'G-JH7PCJQKCS'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function loadGoogleAnalytics() {
  if (window.gtag) return

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
    page_location: sanitizeUrl(window.location.href),
    page_referrer: sanitizeUrl(document.referrer),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })

  const script = document.createElement('script')
  script.async = true
  script.referrerPolicy = 'origin'
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
  document.head.appendChild(script)
}

export function StatisticsConsent() {
  const pathname = usePathname()
  const consent = useStatisticsConsent()
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => onOpenStatisticsSettings(() => setSettingsOpen(true)), [])

  useEffect(() => {
    if (consent !== 'granted') return
    loadGoogleAnalytics()
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    window.gtag?.('event', 'page_view', {
      page_path: sanitizeUrl(window.location.pathname + window.location.search),
      page_location: sanitizeUrl(window.location.href),
      page_referrer: sanitizeUrl(document.referrer),
      page_title: document.title,
    })
  }, [consent, pathname])

  if (consent === null) return null
  if (consent !== 'unset' && !settingsOpen) return null

  const choose = (granted: boolean) => {
    setSettingsOpen(false)
    setStatisticsConsent(granted)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Einstellungen zur Statistik"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-lg rounded-xl border border-[var(--card-border)] bg-white p-3.5 text-[12.5px] leading-snug text-[var(--text-secondary)] shadow-strong sm:inset-x-4 sm:bottom-4 sm:p-5 sm:text-sm sm:leading-relaxed"
    >
      <p className="font-semibold text-[var(--text)]">Dürfen wir die Nutzung auswerten?</p>
      <p className="mt-1">
        Mit deiner Zustimmung erfassen wir Seitenaufrufe über eine eigene, pseudonyme Statistik
        und Google Analytics. Dafür werden Kennungen in deinem Browser gespeichert. Ohne
        Zustimmung läuft nur das technisch Notwendige. Ändern kannst du das jederzeit über
        „Cookie-Einstellungen“ im Seitenfuß.{' '}
        <Link href="/datenschutz#statistik" className="font-medium text-[var(--text)] underline underline-offset-2">
          Details
        </Link>
      </p>
      {consent !== 'unset' && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Aktuell: {consent === 'granted' ? 'Statistik erlaubt' : 'nur notwendige Speicherung'}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {/* Both choices look the same on purpose: a visually preferred "accept" is nudging. */}
        <button
          type="button"
          onClick={() => choose(false)}
          className="rounded-lg bg-[var(--text)] px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-black"
        >
          Nur notwendige
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          className="rounded-lg bg-[var(--text)] px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-black"
        >
          Statistik erlauben
        </button>
      </div>
    </div>
  )
}
