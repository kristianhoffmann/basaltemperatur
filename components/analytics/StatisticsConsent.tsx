'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })

  const script = document.createElement('script')
  script.async = true
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
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
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
      className="fixed inset-x-3 bottom-3 z-[1000] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 text-[13px] text-slate-700 shadow-2xl sm:inset-x-4 sm:bottom-4 sm:p-5 sm:text-sm"
    >
      <p className="font-semibold text-slate-950">Dürfen wir die Nutzung auswerten?</p>
      <p className="mt-1.5 leading-relaxed">
        Mit deiner Zustimmung erfassen wir Seitenaufrufe über eine eigene, pseudonyme Statistik
        und Google Analytics und merken uns, über welchen Blogartikel du gekommen bist. Dafür
        werden Kennungen in deinem Browser gespeichert. Ohne Zustimmung läuft nur das technisch
        Notwendige. Du kannst deine Wahl jederzeit über „Cookie-Einstellungen“ im Seitenfuß
        ändern.{' '}
        <Link href="/datenschutz#statistik" className="font-medium text-slate-950 underline underline-offset-2">
          Details
        </Link>
      </p>
      {consent !== 'unset' && (
        <p className="mt-2 text-xs text-slate-500">
          Aktuell: {consent === 'granted' ? 'Statistik erlaubt' : 'nur notwendige Speicherung'}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* Both choices look the same on purpose: a visually preferred "accept" is nudging. */}
        <button
          type="button"
          onClick={() => choose(false)}
          className="rounded-full bg-slate-950 px-4 py-2 font-medium text-white hover:bg-slate-800"
        >
          Nur notwendige
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          className="rounded-full bg-slate-950 px-4 py-2 font-medium text-white hover:bg-slate-800"
        >
          Statistik erlauben
        </button>
      </div>
    </div>
  )
}
