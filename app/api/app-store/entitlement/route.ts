// Verifies a StoreKit 2 signed transaction and grants lifetime access.

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
    isLifetimeTransaction,
    originalTransactionId,
    type AppStoreTransactionPayload,
    verifyAppStoreJws,
} from '@/lib/appStore/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
        return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const token = authHeader.slice('Bearer '.length)
    const userClient = createAdminClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { signedTransactionInfo } = await request.json()
    if (typeof signedTransactionInfo !== 'string') {
        return NextResponse.json({ error: 'Missing signed transaction' }, { status: 400 })
    }

    let payload: AppStoreTransactionPayload
    try {
        payload = verifyAppStoreJws<AppStoreTransactionPayload>(signedTransactionInfo)
    } catch (error) {
        console.error('StoreKit transaction verification failed:', error)
        return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 })
    }

    if (!isLifetimeTransaction(payload)) {
        return NextResponse.json({ error: 'Transaction not eligible' }, { status: 400 })
    }

    const transactionId = originalTransactionId(payload)
    if (!transactionId) {
        return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey)
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            has_lifetime_access: true,
            entitlement_source: 'app_store',
            lifetime_access_granted_at: new Date().toISOString(),
            app_store_original_transaction_id: transactionId,
            app_store_product_id: payload.productId,
        })
        .eq('id', user.id)

    if (error) {
        console.error('Failed to grant App Store entitlement:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
