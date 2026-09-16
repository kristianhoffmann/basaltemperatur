import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const supabaseJsMock = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

const stripeMock = vi.hoisted(() => {
  const constructEvent = vi.fn()
  const listLineItems = vi.fn()
  const Stripe = vi.fn(function Stripe() {
    return {
    webhooks: { constructEvent },
    checkout: {
      sessions: { listLineItems },
    },
    }
  })
  return { Stripe, constructEvent, listLineItems }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseJsMock.createClient,
}))

vi.mock('stripe', () => ({
  default: stripeMock.Stripe,
}))

const mailMock = vi.hoisted(() => ({ sendPurchaseConfirmation: vi.fn() }))
vi.mock('@/lib/purchase-confirmation', () => mailMock)
vi.mock('@/lib/seo-autopilot/attribution', () => ({ trackConversion: vi.fn() }))

function webhookRequest(headers: HeadersInit = {}) {
  return new Request('https://app.test/api/stripe-webhook', {
    method: 'POST',
    headers,
    body: '{"id":"evt_test"}',
  })
}

describe('POST /api/stripe-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'
    process.env.STRIPE_PRICE_ID = 'price_lifetime'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  })

  it('fails closed when Stripe webhook configuration is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET

    const response = await POST(webhookRequest({ 'stripe-signature': 'sig' }))

    expect(response.status).toBe(500)
    expect(stripeMock.Stripe).not.toHaveBeenCalled()
    expect(supabaseJsMock.createClient).not.toHaveBeenCalled()
  })

  it('rejects requests without a Stripe signature', async () => {
    supabaseJsMock.createClient.mockReturnValue({})

    const response = await POST(webhookRequest())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing signature' })
  })

  it('ignores completed checkout sessions for the wrong price', async () => {
    const update = vi.fn()
    const supabaseAdmin = {
      from: vi.fn(() => ({ update })),
    }
    supabaseJsMock.createClient.mockReturnValue(supabaseAdmin)
    stripeMock.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          mode: 'payment',
          payment_status: 'paid',
          client_reference_id: 'user-123',
          metadata: { user_id: 'user-123' },
        },
      },
    })
    stripeMock.listLineItems.mockResolvedValue({
      data: [{ price: { id: 'price_other' } }],
    })

    const response = await POST(webhookRequest({ 'stripe-signature': 'sig' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true, ignored: true })
    expect(update).not.toHaveBeenCalled()
  })

  function paidSession(overrides: Record<string, unknown> = {}) {
    return {
      type: 'checkout.session.completed',
      created: 1_789_000_000,
      data: {
        object: {
          id: 'cs_test_1',
          mode: 'payment',
          payment_status: 'paid',
          payment_intent: 'pi_test_1',
          amount_total: 999,
          currency: 'eur',
          client_reference_id: 'user-123',
          customer_details: { email: 'kundin@example.com', name: 'Kim Kundin' },
          metadata: { user_id: 'user-123', early_start_requested_at: '2026-09-16T10:00:00.000Z' },
          ...overrides,
        },
      },
    }
  }

  function profilesTable(grantedRows: Array<Record<string, unknown>>, existingAccess = true) {
    const select = vi.fn().mockResolvedValue({ data: grantedRows, error: null })
    const not = vi.fn(() => ({ select }))
    const eq = vi.fn(() => ({ not }))
    const update = vi.fn(() => ({ eq }))
    const maybeSingle = vi.fn().mockResolvedValue({ data: { has_lifetime_access: existingAccess } })
    const lookup = { select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) }
    return { update, eq, not, select, table: { update, select: lookup.select } }
  }

  it('grants lifetime access once and sends the contract confirmation', async () => {
    const profiles = profilesTable([{ id: 'user-123', display_name: 'Kim' }])
    const supabaseAdmin = { from: vi.fn(() => profiles.table) }
    supabaseJsMock.createClient.mockReturnValue(supabaseAdmin)
    stripeMock.constructEvent.mockReturnValue(paidSession())
    stripeMock.listLineItems.mockResolvedValue({ data: [{ price: { id: 'price_lifetime' } }] })
    mailMock.sendPurchaseConfirmation.mockResolvedValue({ ok: true })

    const response = await POST(webhookRequest({ 'stripe-signature': 'sig' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })
    expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles')
    expect(profiles.update).toHaveBeenCalledWith(expect.objectContaining({
      has_lifetime_access: true,
      entitlement_source: 'stripe',
    }))
    expect(profiles.eq).toHaveBeenCalledWith('id', 'user-123')
    expect(profiles.not).toHaveBeenCalledWith('has_lifetime_access', 'is', true)
    expect(mailMock.sendPurchaseConfirmation).toHaveBeenCalledTimes(1)
    expect(mailMock.sendPurchaseConfirmation).toHaveBeenCalledWith(expect.objectContaining({
      customerEmail: 'kundin@example.com',
      customerName: 'Kim Kundin',
      orderNumber: 'pi_test_1',
      amountTotal: 999,
      earlyStartRequestedAt: '2026-09-16T10:00:00.000Z',
      purchasedAt: new Date(1_789_000_000 * 1000),
    }))
  })

  it('does not resend the confirmation when Stripe redelivers the event', async () => {
    const profiles = profilesTable([], true)
    supabaseJsMock.createClient.mockReturnValue({ from: vi.fn(() => profiles.table) })
    stripeMock.constructEvent.mockReturnValue(paidSession())
    stripeMock.listLineItems.mockResolvedValue({ data: [{ price: { id: 'price_lifetime' } }] })

    const response = await POST(webhookRequest({ 'stripe-signature': 'sig' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true, duplicate: true })
    expect(mailMock.sendPurchaseConfirmation).not.toHaveBeenCalled()
  })

  it('keeps access granted when the confirmation mail fails', async () => {
    const profiles = profilesTable([{ id: 'user-123', display_name: null }])
    supabaseJsMock.createClient.mockReturnValue({ from: vi.fn(() => profiles.table) })
    stripeMock.constructEvent.mockReturnValue(paidSession())
    stripeMock.listLineItems.mockResolvedValue({ data: [{ price: { id: 'price_lifetime' } }] })
    mailMock.sendPurchaseConfirmation.mockResolvedValue({ ok: false, code: 'provider' })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await POST(webhookRequest({ 'stripe-signature': 'sig' }))

    expect(response.status).toBe(200)
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('not sent: provider'))
    consoleError.mockRestore()
  })
})
