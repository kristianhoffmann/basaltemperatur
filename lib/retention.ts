import type { SupabaseClient } from '@supabase/supabase-js'

// These periods are promised in app/(legal)/datenschutz/page.tsx — change both together.
export const TRAFFIC_RETENTION_MONTHS = 14
export const WITHDRAWAL_RETENTION_YEARS = 3

const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000
let lastPruneAt = 0

export function trafficCutoff(now: Date): Date {
  const cutoff = new Date(now)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - TRAFFIC_RETENTION_MONTHS)
  return cutoff
}

// Claims from a withdrawal become time-barred three years after the end of the
// year they arose in (§§ 195, 199 BGB), so a declaration from 2026 may go on 1 Jan 2030.
export function withdrawalCutoff(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear() - WITHDRAWAL_RETENTION_YEARS, 0, 1))
}

export async function pruneExpiredRecords(admin: SupabaseClient, now = new Date()): Promise<void> {
  if (now.getTime() - lastPruneAt < PRUNE_INTERVAL_MS) return
  lastPruneAt = now.getTime()

  const [traffic, withdrawals] = await Promise.all([
    admin.from('traffic_events').delete().lt('created_at', trafficCutoff(now).toISOString()),
    admin.from('withdrawal_declarations').delete().lt('received_at', withdrawalCutoff(now).toISOString()),
  ])
  if (traffic.error) console.error('[retention] traffic_events prune failed', traffic.error.message)
  if (withdrawals.error) console.error('[retention] withdrawal_declarations prune failed', withdrawals.error.message)
}

// Stored only to recognise repeated submissions, so the host part is dropped first
// and the hash cannot be turned back into a full address.
export function anonymizeIp(ip: string): string {
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::'
  const parts = ip.split('.')
  return parts.length === 4 ? `${parts.slice(0, 3).join('.')}.0` : ip
}
