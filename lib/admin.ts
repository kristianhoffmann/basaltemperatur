import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isConfiguredAdminEmail } from '@/lib/adminAccess'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin/traffic')
  }

  if (!isConfiguredAdminEmail(user.email)) {
    redirect('/dashboard')
  }

  return { user, role: 'owner' }
}
