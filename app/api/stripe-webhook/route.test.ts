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
    expect(await response.json()).toEqual({ received: true })
    expect(update).not.toHaveBeenCalled()
  })

  it('grants lifetime access for paid checkout sessions with the expected price', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
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
      data: [{ price: { id: 'price_lifetime' } }],
    })

    const response = await POST(webhookRequest({ 'stripe-signature': 'sig' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })
    expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      has_lifetime_access: true,
      entitlement_source: 'stripe',
    }))
    expect(eq).toHaveBeenCalledWith('id', 'user-123')
  })
})
