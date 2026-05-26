const CANONICAL_SITE_URL = 'https://basaltemperatur.online'

export function getSeoSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (configured && /\.?basaltemperatur\.online$/i.test(new URL(configured).hostname)) {
    return configured
  }
  return CANONICAL_SITE_URL
}
