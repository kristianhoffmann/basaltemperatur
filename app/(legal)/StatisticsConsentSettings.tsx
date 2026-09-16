'use client'

import { setStatisticsConsent, useStatisticsConsent } from '@/lib/analytics-consent'

const STATUS_LABEL = {
  granted: 'Statistik erlaubt',
  denied: 'Nur notwendige Speicherung',
  unset: 'Noch keine Auswahl getroffen (Statistik aus)',
} as const

export function StatisticsConsentSettings() {
  const consent = useStatisticsConsent()

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="!my-0 text-sm">
        Status in diesem Browser: <strong>{consent ? STATUS_LABEL[consent] : '…'}</strong>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatisticsConsent(true)}
          disabled={consent === 'granted'}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          Statistik erlauben
        </button>
        <button
          type="button"
          onClick={() => setStatisticsConsent(false)}
          disabled={consent === 'denied'}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          Einwilligung widerrufen
        </button>
      </div>
    </div>
  )
}
