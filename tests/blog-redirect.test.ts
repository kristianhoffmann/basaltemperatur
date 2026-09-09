import { describe, expect, it } from 'vitest'

import { GET as blogIndexRedirect } from '@/app/blog/route'
import { GET as blogPostRedirect } from '@/app/blog/[slug]/route'

/**
 * Am 09.09.2026 antwortete `/blog/<slug>` in Produktion mit
 * `308 -> https://0.0.0.0:3000/de/blog/<slug>`.
 *
 * Ursache: Die Route baute das Ziel mit `new URL(pfad, request.url)`. Hinter
 * dem Caddy traegt `request.url` im Route-Handler die Bind-Adresse des
 * Containers, nicht den angefragten Host. In der Middleware ist das anders,
 * deshalb war der Fehler an den Login-Weiterleitungen nie zu sehen.
 *
 * Der Test faehrt die Route mit genau so einer internen Adresse an. Kaeme der
 * Host wieder aus der Anfrage, stuende er im Ergebnis.
 */
const INTERNAL_REQUEST_URL = 'https://0.0.0.0:3000/blog/zyklus-app-finden-kriterien'

describe('Weiterleitung vom Pfad ohne Sprachpraefix', () => {
  it('schickt einen Beitrag auf den oeffentlichen Host, nicht auf die Bind-Adresse', async () => {
    const response = await blogPostRedirect(new Request(INTERNAL_REQUEST_URL), {
      params: Promise.resolve({ slug: 'zyklus-app-finden-kriterien' }),
    })

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe(
      'https://www.basaltemperatur.online/de/blog/zyklus-app-finden-kriterien'
    )
  })

  it('schickt die Uebersicht auf den oeffentlichen Host', () => {
    const response = blogIndexRedirect()

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://www.basaltemperatur.online/de/blog')
  })
})
