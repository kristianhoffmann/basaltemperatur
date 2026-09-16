import { afterEach, describe, expect, it, vi } from 'vitest'

import { tokenizeInline } from '@/lib/legal/blocks'
import type { LegalCompany, LegalInfrastructure } from '@/lib/legal/config'
import {
  PRODUCT_NAME,
  purchaseConfirmationEmail,
  sendPurchaseConfirmation,
  withdrawalDeadline,
} from '@/lib/purchase-confirmation'

const company: LegalCompany = {
  name: 'Kristian Hoffmann',
  street: 'Karl-Kraut-Straße 15',
  city: '30177 Hannover',
  country: 'Deutschland',
  email: 'moin@kristianhoffmann.de',
  phone: '0151 15538987',
}

const infrastructure: LegalInfrastructure = {
  webProvider: 'Hostinger',
  webLocation: 'Deutschland',
  dbProvider: 'selbst gehostet',
  dbLocation: 'Deutschland',
}

const input = {
  customerEmail: 'kundin@example.com',
  customerName: 'Kim <Kundin>',
  orderNumber: 'pi_test_1',
  purchasedAt: new Date('2026-09-16T21:30:00Z'),
  amountTotal: 999,
  currency: 'eur',
  earlyStartRequestedAt: '2026-09-16T21:29:00Z',
  company,
  infrastructure,
  siteUrl: 'https://www.basaltemperatur.online',
}

describe('Widerrufsfrist in der Kaufbestätigung', () => {
  it('zählt vierzehn Tage ab dem deutschen Kalendertag des Kaufs', () => {
    // 21:30 UTC ist in Berlin schon der 16.09. 23:30 – Fristende 30.09.
    expect(withdrawalDeadline(new Date('2026-09-16T21:30:00Z')).toISOString().slice(0, 10)).toBe('2026-09-30')
    // 22:30 UTC ist in Berlin bereits der 17.09. – Fristende 01.10.
    expect(withdrawalDeadline(new Date('2026-09-16T22:30:00Z')).toISOString().slice(0, 10)).toBe('2026-10-01')
  })
})

describe('purchaseConfirmationEmail', () => {
  const mail = purchaseConfirmationEmail(input)

  it('bestätigt Bestellung, Preis, Frist und sofortigen Beginn', () => {
    expect(mail.subject).toContain('pi_test_1')
    expect(mail.text).toContain(PRODUCT_NAME)
    expect(mail.text).toContain('9,99 €')
    expect(mail.text).toContain('§ 19 UStG')
    expect(mail.text).toContain('bis einschließlich 30.09.2026')
    expect(mail.text).toContain('16.09.2026, 23:29 Uhr ausdrücklich verlangt')
    expect(mail.text).toContain('https://www.basaltemperatur.online/widerruf-ausueben')
  })

  it('gibt Widerrufsbelehrung, Muster-Formular und AGB vollständig wieder', () => {
    for (const fragment of [
      'Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.',
      'Telefon: 0151 15538987',
      'Ende der Widerrufsbelehrung',
      'Hiermit widerrufe(n) ich/wir (*)',
      '§ 1 GELTUNGSBEREICH UND ANBIETER',
      '§ 12 SCHLUSSBESTIMMUNGEN',
      'Vertragsbestätigung mit dem Vertragsinhalt',
    ]) {
      expect(mail.text).toContain(fragment)
    }
    expect(mail.html).toContain('Allgemeine Geschäftsbedingungen')
    expect(mail.html).toContain('href="https://www.basaltemperatur.online/datenschutz"')
  })

  it('escaped Kundendaten im HTML', () => {
    expect(mail.html).toContain('Hallo Kim &lt;Kundin&gt;,')
    expect(mail.html).not.toContain('Kim <Kundin>')
  })
})

describe('tokenizeInline', () => {
  it('erkennt Fett und Links', () => {
    expect(tokenizeInline('a **b** [c](/d) e')).toEqual([
      { kind: 'text', value: 'a ' },
      { kind: 'bold', value: 'b' },
      { kind: 'text', value: ' ' },
      { kind: 'link', value: 'c', href: '/d' },
      { kind: 'text', value: ' e' },
    ])
  })
})

describe('sendPurchaseConfirmation', () => {
  afterEach(() => {
    delete process.env.BREVO_API_KEY
    delete process.env.BREVO_SENDER_EMAIL
  })

  it('meldet fehlende Konfiguration ohne Versandversuch', async () => {
    const fetchImpl = vi.fn()
    expect(await sendPurchaseConfirmation(input, fetchImpl)).toEqual({ ok: false, code: 'configuration' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('schickt die Mail über Brevo an die Käuferin', async () => {
    process.env.BREVO_API_KEY = 'xkeysib-test'
    process.env.BREVO_SENDER_EMAIL = 'info@basaltemperatur.online'
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }))

    expect(await sendPurchaseConfirmation(input, fetchImpl)).toEqual({ ok: true })
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    const body = JSON.parse(String(init.body))
    expect(body.to).toEqual([{ email: 'kundin@example.com', name: 'Kim <Kundin>' }])
    expect(body.sender).toEqual({ name: 'Basaltemperatur', email: 'info@basaltemperatur.online' })
    expect(body.htmlContent).toContain('Widerrufsbelehrung')
  })
})
