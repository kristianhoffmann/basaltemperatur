import { describe, expect, it } from 'vitest'

import { anonymizeIp, trafficCutoff, withdrawalCutoff } from '@/lib/retention'

describe('Löschfristen aus der Datenschutzerklärung', () => {
  it('hält Statistikdaten 14 Monate', () => {
    expect(trafficCutoff(new Date('2026-09-16T10:00:00Z')).toISOString()).toBe('2025-07-16T10:00:00.000Z')
  })

  it('löscht Widerrufe erst nach Ablauf der Verjährung zum Jahresende', () => {
    // Eine Erklärung aus 2026 verjährt mit Ablauf 2029 und darf am 01.01.2030 weg.
    expect(withdrawalCutoff(new Date('2029-12-31T23:00:00Z')).toISOString()).toBe('2026-01-01T00:00:00.000Z')
    expect(withdrawalCutoff(new Date('2030-01-01T00:30:00Z')).toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })
})

describe('anonymizeIp', () => {
  it('kürzt IPv4 auf das /24-Netz', () => {
    expect(anonymizeIp('203.0.113.77')).toBe('203.0.113.0')
  })

  it('kürzt IPv6 auf die ersten drei Gruppen', () => {
    expect(anonymizeIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3::')
  })
})
