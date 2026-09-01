'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { adminDeleteUser, type AdminDeleteResult } from '@/lib/admin-delete-user'

/**
 * Löscht ein Konto aus der Admin-Nutzerliste.
 *
 * `requireAdmin()` zuerst und ohne Ausnahme: Eine Server-Action ist ein
 * öffentlicher Endpunkt, auch wenn der Knopf dazu nur auf einer geschützten
 * Seite steht.
 */
export async function deleteUserAction(
  _previous: AdminDeleteResult | null,
  formData: FormData,
): Promise<AdminDeleteResult> {
  await requireAdmin()

  const userId = String(formData.get('userId') ?? '')
  const confirmEmail = String(formData.get('confirmEmail') ?? '')
  if (!userId) return { ok: false, reason: 'user_not_found' }

  const result = await adminDeleteUser({ userId, confirmEmail })
  if (result.ok) revalidatePath('/admin/users')
  return result
}
