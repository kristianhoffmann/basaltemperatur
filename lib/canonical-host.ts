// lib/canonical-host.ts
// Normalisiert Host-Varianten in gespeichertem JSON-LD auf den kanonischen Host.
//
// Hintergrund: Das JSON-LD der Blog-Posts kommt fertig aus der seo_autopilot_posts-
// Tabelle und referenziert dort durchgaengig https://basaltemperatur.online (ohne
// www). Kanonisch ist aber https://www.basaltemperatur.online — die Nicht-www-Variante
// antwortet nur mit 308. Da @id-Werte Identitaets-Schluessel sind, wuerde Google die
// Entitaeten sonst von der www-basierten Organization der Startseite trennen.
//
// Die Normalisierung passiert beim Rendern, damit sie ohne Backfill der Bestandsdaten
// wirkt und auch bei kuenftig gelieferten Posts greift.

import { getSeoSiteUrl } from './seo-site-url'

const NON_CANONICAL_HOST = /https?:\/\/(?:www\.)?basaltemperatur\.online/g

export function withCanonicalHost<T>(value: T): T {
  const siteUrl = getSeoSiteUrl()

  const walk = (node: unknown): unknown => {
    if (typeof node === 'string') {
      return node.replace(NON_CANONICAL_HOST, siteUrl)
    }
    if (Array.isArray(node)) {
      return node.map(walk)
    }
    if (node && typeof node === 'object') {
      return Object.fromEntries(
        Object.entries(node as Record<string, unknown>).map(([k, v]) => [k, walk(v)])
      )
    }
    return node
  }

  return walk(value) as T
}
