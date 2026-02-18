// app/api/onboarding/route.ts
// Saves onboarding preferences and marks onboarding as completed

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const cycleLength = Math.min(Math.max(Number(body.cycle_length_default) || 28, 18), 45)
    const displayName = typeof body.display_name === 'string' ? body.display_name.slice(0, 50) : null

    const { error } = await supabase
        .from('profiles')
        .update({
            display_name: displayName,
            cycle_length_default: cycleLength,
            onboarding_completed: true,
        })
        .eq('id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
