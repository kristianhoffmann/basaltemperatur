'use client'

import { useSyncExternalStore } from 'react'

// v2 covers own analytics, Google Analytics and blog attribution together. The v1
// key only covered Google Analytics, so a v1 "granted" must be asked again; a v1
// "denied" still stands.
const CONSENT_KEY = 'bt_statistics_consent_v2'
const LEGACY_CONSENT_KEY = 'kh_google_analytics_consent_v1'
const CHANGE_EVENT = 'bt-statistics-consent-change'
const OPEN_EVENT = 'bt-statistics-consent-open'

const ANALYTICS_STORAGE_KEYS = ['bt_visitor_id', 'bt_analytics_opt_out']
const ANALYTICS_SESSION_KEYS = ['bt_session_id', 'bt_last_url']

export type ConsentState = 'granted' | 'denied' | 'unset'

function readConsent(): ConsentState {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY)
    if (value === 'granted' || value === 'denied') return value
    if (window.localStorage.getItem(LEGACY_CONSENT_KEY) === 'denied') return 'denied'
  } catch {
    return 'unset'
  }
  return 'unset'
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

export function useStatisticsConsent(): ConsentState | null {
  return useSyncExternalStore<ConsentState | null>(subscribe, readConsent, () => null)
}

export function hasStatisticsConsent(): boolean {
  return typeof window !== 'undefined' && readConsent() === 'granted'
}

function deleteGoogleAnalyticsCookies() {
  const hostParts = window.location.hostname.split('.')
  const domains = ['', window.location.hostname]
  for (let i = 1; i < hostParts.length - 1; i++) {
    domains.push(`.${hostParts.slice(i).join('.')}`)
  }
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim()
    if (!name || !(name === '_ga' || name.startsWith('_ga_') || name === '_gid')) continue
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}

export function setStatisticsConsent(granted: boolean) {
  const wasGranted = readConsent() === 'granted'
  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied')
    window.localStorage.removeItem(LEGACY_CONSENT_KEY)
    if (!granted) {
      ANALYTICS_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key))
      ANALYTICS_SESSION_KEYS.forEach((key) => window.sessionStorage.removeItem(key))
    }
  } catch {
    // Storage blocked: the choice cannot persist, trackers stay off anyway.
  }
  if (!granted) {
    deleteGoogleAnalyticsCookies()
    void fetch('/api/seo-autopilot/attribution', { method: 'DELETE' }).catch(() => undefined)
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
  // gtag.js cannot be unloaded; a reload is the only way to stop it for this page.
  if (wasGranted && !granted) window.location.reload()
}

export function openStatisticsSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function onOpenStatisticsSettings(callback: () => void) {
  window.addEventListener(OPEN_EVENT, callback)
  return () => window.removeEventListener(OPEN_EVENT, callback)
}
