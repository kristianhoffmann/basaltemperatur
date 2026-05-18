// Handles App Store Server Notifications V2 for StoreKit entitlement changes.

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  isLifetimeTransaction,
  originalTransactionId,
  type AppStoreNotificationPayload,
  type AppStoreTransactionPayload,
  verifyAppStoreJws,
} from '@/lib/appStore/server'

export const runtime = 'nodejs'

const REVOKE_NOTIFICATION_TYPES = new Set(['REFUND', 'REVOKE'])
const GRANT_NOTIFICATION_TYPES = new Set(['REFUND_REVERSED'])

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const signedPayload = body?.signedPayload

  if (typeof signedPayload !== 'string') {
    return NextResponse.json({ error: 'Missing signed payload' }, { status: 400 })
  }

  let notification: AppStoreNotificationPayload
  try {
    notification = verifyAppStoreJws<AppStoreNotificationPayload>(signedPayload)
  } catch (error) {
    console.error('App Store notification verification failed:', error)
    return NextResponse.json({ error: 'Invalid notification' }, { status: 400 })
  }

  if (!notification.data?.signedTransactionInfo) {
    return NextResponse.json({ success: true, ignored: 'missing transaction' })
  }

  let transaction: AppStoreTransactionPayload
  try {
    transaction = verifyAppStoreJws<AppStoreTransactionPayload>(notification.data.signedTransactionInfo)
  } catch (error) {
    console.error('App Store transaction in notification verification failed:', error)
    return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 })
  }

  if (!isLifetimeTransaction(transaction, { allowRevoked: true })) {
    return NextResponse.json({ success: true, ignored: 'not lifetime product' })
  }

  const transactionId = originalTransactionId(transaction)
  if (!transactionId) {
    return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey)
  const shouldRevoke = REVOKE_NOTIFICATION_TYPES.has(notification.notificationType || '')
    || Boolean(transaction.revocationDate)
  const shouldGrant = GRANT_NOTIFICATION_TYPES.has(notification.notificationType || '')

  if (!shouldRevoke && !shouldGrant) {
    return NextResponse.json({ success: true, ignored: notification.notificationType || 'unknown' })
  }

  const update = shouldRevoke
    ? {
      has_lifetime_access: false,
      entitlement_source: 'none' as const,
      lifetime_access_granted_at: null,
      app_store_product_id: transaction.productId,
    }
    : {
      has_lifetime_access: true,
      entitlement_source: 'app_store' as const,
      lifetime_access_granted_at: new Date().toISOString(),
      app_store_product_id: transaction.productId,
    }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(update)
    .eq('app_store_original_transaction_id', transactionId)

  if (error) {
    console.error('Failed to apply App Store notification:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    notificationType: notification.notificationType,
    transactionId,
    action: shouldRevoke ? 'revoked' : 'granted',
  })
}
