export const ADMIN_EMAIL = 'kristian.hoffmann@me.com'

export function isConfiguredAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === ADMIN_EMAIL
}
