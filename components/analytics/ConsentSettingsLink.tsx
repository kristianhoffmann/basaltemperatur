'use client'

import { openStatisticsSettings } from '@/lib/analytics-consent'

export function ConsentSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openStatisticsSettings} className={className}>
      Cookie-Einstellungen
    </button>
  )
}
