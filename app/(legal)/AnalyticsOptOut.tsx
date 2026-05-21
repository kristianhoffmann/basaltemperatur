'use client'

import { useSyncExternalStore } from 'react'

const VISITOR_KEY = 'bt_visitor_id'
const SESSION_KEY = 'bt_session_id'
const LAST_URL_KEY = 'bt_last_url'
const ANALYTICS_OPT_OUT_KEY = 'bt_analytics_opt_out'
const ANALYTICS_OPT_OUT_EVENT = 'bt-analytics-opt-out-change'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(ANALYTICS_OPT_OUT_EVENT, callback)

  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(ANALYTICS_OPT_OUT_EVENT, callback)
  }
}

function getSnapshot() {
  return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === 'true'
}

function getServerSnapshot() {
  return false
}

export function AnalyticsOptOut() {
  const optedOut = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function updateOptOut(nextValue: boolean) {
    if (nextValue) {
      window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, 'true')
      window.localStorage.removeItem(VISITOR_KEY)
      window.sessionStorage.removeItem(SESSION_KEY)
      window.sessionStorage.removeItem(LAST_URL_KEY)
    } else {
      window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY)
    }
    window.dispatchEvent(new Event(ANALYTICS_OPT_OUT_EVENT))
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
      <p className="mb-3 text-sm">
        Status in diesem Browser:{' '}
        <strong>{optedOut ? 'Nutzungsanalyse deaktiviert' : 'Nutzungsanalyse aktiv'}</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateOptOut(true)}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Nutzungsanalyse deaktivieren
        </button>
        <button
          type="button"
          onClick={() => updateOptOut(false)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Wieder aktivieren
        </button>
      </div>
    </div>
  )
}
