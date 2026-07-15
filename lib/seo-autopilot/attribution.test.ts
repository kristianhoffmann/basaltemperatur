import { describe, expect, it } from 'vitest'
import { buildConversionPayload } from './attribution'

describe('buildConversionPayload', () => {
  it('uses the canonical purchase event name and a full ISO occurrence timestamp', () => {
    const occurredAt = new Date('2026-07-14T20:30:00.000Z')
    const payload = buildConversionPayload(
      '16802323-34a0-4eaa-9836-61f53596c916',
      { eventName: 'purchase', revenue: 9.99, idempotencyKey: 'stripe:purchase:cs_123' },
      { slug: 'basaltemperatur-richtig-messen', locale: 'de' },
      occurredAt,
    )

    expect(payload.eventName).toBe('purchase')
    expect(payload.occurredOn).toBe('2026-07-14T20:30:00.000Z')
    expect(payload.idempotencyKey).toBe('stripe:purchase:cs_123')
  })
})
