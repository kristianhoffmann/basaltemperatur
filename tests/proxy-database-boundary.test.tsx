import { beforeEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ path: '/dashboard', read: vi.fn(), user: vi.fn(), from: vi.fn() }))
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-app-path': state.path }) }))
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`) } }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: state.user }, from: state.from }) }))
import Gate from '@/app/(dashboard)/template'
beforeEach(() => {
  vi.clearAllMocks()
  state.path = '/dashboard'
  state.user.mockResolvedValue({ data: { user: { id: 'local' } } })
  state.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: state.read }) }) })
  state.read.mockResolvedValue({ data: { onboarding_completed: true, sensitive_data_consent_at: 'yes' }, error: null })
})
it('keeps onboarding and sensitive-data consent gating outside middleware', async () => {
  state.read.mockResolvedValueOnce({ data: { onboarding_completed: false }, error: null })
  await expect(Gate({ children: 'private' })).rejects.toThrow('redirect:/onboarding')
  expect(await Gate({ children: 'private' })).toBe('private')
})
it('allows onboarding itself without a profile lookup', async () => {
  state.path = '/onboarding'
  expect(await Gate({ children: 'onboarding' })).toBe('onboarding')
  expect(state.from).not.toHaveBeenCalled()
})
it('fails closed when the profile database cannot be read', async () => {
  state.read.mockResolvedValue({ data: null, error: new Error('offline') })
  await expect(Gate({ children: 'private' })).rejects.toThrow('offline')
})
