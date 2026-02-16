// app/(dashboard)/eintrag/page.tsx
// Temperatur-Eintrag Seite

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { EntryPageClient } from './EntryPageClient'
import type { TemperatureEntry, PeriodEntry } from '@/types/database'

interface Props {
    searchParams: Promise<{ date?: string }>
}

export default async function EntryPage({ searchParams }: Props) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const params = await searchParams
    // Use date from URL query param (from calendar), fallback to today
    const targetDate = params.date || format(new Date(), 'yyyy-MM-dd')

    const { data: tempData } = await supabase
        .from('temperature_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', targetDate)
        .maybeSingle()

    const { data: periodData } = await supabase
        .from('period_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', targetDate)
        .maybeSingle()

    const temp = tempData as TemperatureEntry | null
    const period = periodData as PeriodEntry | null

    return (
        <div className="max-w-md mx-auto py-4">
            <EntryPageClient
                initialDate={targetDate}
                initialTemperature={temp?.temperature ? Number(temp.temperature) : undefined}
                initialNotes={temp?.notes || ''}
                initialHasPeriod={!!period}
                initialFlowIntensity={period?.flow_intensity || 'medium'}
                initialCervicalMucus={temp?.cervical_mucus || null}
            />
        </div>
    )
}
