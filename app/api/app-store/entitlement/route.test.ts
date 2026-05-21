import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const supabaseJsMock = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

const appStoreMock = vi.hoisted(() => ({
  verifyAppStoreJws: vi.fn(),
  isLifetimeTransaction: vi.fn(),
  originalTransactionId: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseJsMock.createClient,
}))

vi.mock('@/lib/appStore/server', () => ({
  verifyAppStoreJws: appStoreMock.verifyAppStoreJws,
  isLifetimeTransaction: appStoreMock.isLifetimeTransaction,
  originalTransactionId: appStoreMock.originalTransactionId,
}))

function jsonRequest(body: unknown, headers: HeadersInit = {}) {
  return new Request('https://app.test/api/app-store/entitlement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/app-store/entitlement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  })

  it('requires a bearer token', async () => {
    const response = await POST(jsonRequest({ signedTransactionInfo: 'jws' }))

    expect(response.status).toBe(401)
    expect(supabaseJsMock.createClient).not.toHaveBeenCalled()
  })

  it('rejects ineligible transactions without updating the profile', async () => {
    const userClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
      },
    }
    supabaseJsMock.createClient.mockReturnValueOnce(userClient)
    appStoreMock.verifyAppStoreJws.mockReturnValue({
      bundleId: 'de.basaltemperatur.app',
      productId: 'other-product',
      type: 'Non-Consumable',
    })
    appStoreMock.isLifetimeTransaction.mockReturnValue(false)

    const response = await POST(jsonRequest(
      { signedTransactionInfo: 'signed-jws' },
      { Authorization: 'Bearer token' },
    ))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Transaction not eligible' })
    expect(supabaseJsMock.createClient).toHaveBeenCalledTimes(1)
  })

  it('grants lifetime access for a verified lifetime transaction', async () => {
    const user = { id: 'user-123' }
    const payload = {
      bundleId: 'de.basaltemperatur.app',
      productId: 'de.basaltemperatur.lifetime',
      type: 'Non-Consumable',
      originalTransactionId: 'tx-original-1',
    }
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    const adminClient = {
      from: vi.fn(() => ({ update })),
    }
    const userClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      },
    }

    supabaseJsMock.createClient
      .mockReturnValueOnce(userClient)
      .mockReturnValueOnce(adminClient)
    appStoreMock.verifyAppStoreJws.mockReturnValue(payload)
    appStoreMock.isLifetimeTransaction.mockReturnValue(true)
    appStoreMock.originalTransactionId.mockReturnValue(payload.originalTransactionId)

    const response = await POST(jsonRequest(
      { signedTransactionInfo: 'signed-jws' },
      { Authorization: 'Bearer token' },
    ))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(adminClient.from).toHaveBeenCalledWith('profiles')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      has_lifetime_access: true,
      entitlement_source: 'app_store',
      app_store_original_transaction_id: payload.originalTransactionId,
      app_store_product_id: payload.productId,
    }))
    expect(eq).toHaveBeenCalledWith('id', user.id)
  })
})
