// app/api/onboarding/route.ts
// Saves onboarding preferences and marks onboarding as completed

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SENSITIVE_DATA_CONSENT_VERSION = '2026-05-18'

async function getUserForRequest(request: Request): Promise<{ user: User | null; bearerToken: string | null }> {
    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null

    if (bearerToken) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
            return { user: null, bearerToken }
        }

        const userClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${bearerToken}` } },
        })
        const { data: { user }, error } = await userClient.auth.getUser()

        return { user: error ? null : user, bearerToken }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return { user, bearerToken: null }
}

export async function GET(request: Request) {
    const { user, bearerToken } = await getUserForRequest(request)

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = bearerToken ? createAdminClient() : await createClient()
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name, cycle_length_default, sensitive_data_consent_at')
        .eq('id', user.id)
        .maybeSingle()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile })
}

export async function POST(request: Request) {
    const { user, bearerToken } = await getUserForRequest(request)

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (body.sensitive_data_consent !== true) {
        return NextResponse.json({ error: 'Sensitive data consent required' }, { status: 400 })
    }

    const cycleLength = Math.min(Math.max(Number(body.cycle_length_default) || 28, 18), 45)
    const consentTimestamp = new Date().toISOString()

    // Nur überschreiben, wenn der Client explizit einen nicht-leeren Namen geschickt hat.
    const rawName = typeof body.display_name === 'string' ? body.display_name.trim().slice(0, 50) : ''
    const hasDisplayName = rawName.length > 0

    const profileUpdate: Record<string, unknown> = {
        cycle_length_default: cycleLength,
        onboarding_completed: true,
        sensitive_data_consent_at: consentTimestamp,
        sensitive_data_consent_version: SENSITIVE_DATA_CONSENT_VERSION,
        intended_use_acknowledged_at: consentTimestamp,
    }
    if (hasDisplayName) {
        profileUpdate.display_name = rawName
    }

    const supabase = bearerToken ? createAdminClient() : await createClient()
    // upsert statt update: sollte die Profilzeile fehlen (z. B. wenn der
    // on_auth_user_created-Trigger auf auth.users nicht greift), würde ein
    // reines UPDATE 0 Zeilen treffen — onboarding_completed bliebe false und
    // der Nutzer steckte im Onboarding-Redirect fest. Der Insert-Pfad ist per
    // RLS erlaubt (policy "Users can insert own profile": auth.uid() = id).
    const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...profileUpdate }, { onConflict: 'id' })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mirror name into auth metadata so iOS (which reads user_metadata.owner_name) sees it too.
    if (hasDisplayName) {
        if (bearerToken) {
            const admin = createAdminClient()
            await admin.auth.admin.updateUserById(user.id, { user_metadata: { owner_name: rawName } })
        } else {
            await supabase.auth.updateUser({ data: { owner_name: rawName } })
        }
    }

    return NextResponse.json({ success: true })
}
