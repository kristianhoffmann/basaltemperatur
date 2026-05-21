import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE } from './route'

const supabaseJsMock = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseJsMock.createClient,
}))

function makeDeleteChain() {
  const eq = vi.fn().mockResolvedValue({ error: null })
  const deleteFn = vi.fn(() => ({ eq }))
  return { delete: deleteFn, eq }
}

describe('DELETE /api/delete-account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  })

  it('rejects requests without a bearer token', async () => {
    const response = await DELETE(new Request('https://app.test/api/delete-account', {
      method: 'DELETE',
    }))

    expect(response.status).toBe(401)
    expect(supabaseJsMock.createClient).not.toHaveBeenCalled()
  })

  it('rejects invalid bearer tokens before deleting data', async () => {
    const userClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('invalid') }),
      },
    }
    supabaseJsMock.createClient.mockReturnValueOnce(userClient)

    const response = await DELETE(new Request('https://app.test/api/delete-account', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer invalid-token' },
    }))

    expect(response.status).toBe(401)
    expect(supabaseJsMock.createClient).toHaveBeenCalledTimes(1)
  })

  it('deletes owned rows and then deletes the auth user', async () => {
    const user = { id: 'user-123' }
    const userClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      },
    }
    const chains = {
      temperature_entries: makeDeleteChain(),
      period_entries: makeDeleteChain(),
      cycles: makeDeleteChain(),
      profiles: makeDeleteChain(),
    }
    const adminClient = {
      from: vi.fn((table: keyof typeof chains) => chains[table]),
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    }

    supabaseJsMock.createClient
      .mockReturnValueOnce(userClient)
      .mockReturnValueOnce(adminClient)

    const response = await DELETE(new Request('https://app.test/api/delete-account', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(adminClient.from).toHaveBeenCalledTimes(4)
    expect(adminClient.from).toHaveBeenNthCalledWith(1, 'temperature_entries')
    expect(adminClient.from).toHaveBeenNthCalledWith(2, 'period_entries')
    expect(adminClient.from).toHaveBeenNthCalledWith(3, 'cycles')
    expect(adminClient.from).toHaveBeenNthCalledWith(4, 'profiles')
    expect(chains.temperature_entries.eq).toHaveBeenCalledWith('user_id', user.id)
    expect(chains.period_entries.eq).toHaveBeenCalledWith('user_id', user.id)
    expect(chains.cycles.eq).toHaveBeenCalledWith('user_id', user.id)
    expect(chains.profiles.eq).toHaveBeenCalledWith('id', user.id)
    expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith(user.id)
  })
})
