// app/api/onboarding/route.ts
// Saves onboarding preferences and marks onboarding as completed

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SENSITIVE_DATA_CONSENT_VERSION = '2026-05-18'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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

    const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mirror name into auth metadata so iOS (which reads user_metadata.owner_name) sees it too.
    if (hasDisplayName) {
        await supabase.auth.updateUser({ data: { owner_name: rawName } })
    }

    return NextResponse.json({ success: true })
}
