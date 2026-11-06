import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Templates run again on navigation. Keep database-backed consent checks here,
// while the proxy only validates authentication and supplies a trusted pathname.
export default async function DashboardGate({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-app-path')
  if (pathname === '/onboarding') return children
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) redirect('/login')
  const { data: profile, error } = await supabase.from('profiles')
    .select('onboarding_completed, sensitive_data_consent_at').eq('id', user.id).maybeSingle()
  if (error) throw error
  if (!profile?.onboarding_completed || !profile?.sensitive_data_consent_at) redirect('/onboarding')
  return children
}
