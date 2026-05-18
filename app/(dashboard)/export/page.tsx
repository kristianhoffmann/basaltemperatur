// app/(dashboard)/export/page.tsx
// PDF-Export – Zykluskurve für die persönliche Dokumentation

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExportClient } from './ExportClient'
import { detectAllOvulations } from '@/lib/ovulation'
import { format } from 'date-fns'
import type { Profile, TemperatureEntry } from '@/types/database'

export const metadata = {
    title: 'Export',
    description: 'Exportiere deine Zykluskurve als PDF.',
}

export default async function ExportPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Last 90 days of data
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)
    const startDateStr = format(startDate, 'yyyy-MM-dd')

    const [tempResult, periodResult, profileResult] = await Promise.all([
        supabase
            .from('temperature_entries')
            .select('date, temperature, notes, cervical_mucus, measurement_time, sleep_hours, disturbed, disturbance_reason, exclude_from_analysis')
            .eq('user_id', user.id)
            .gte('date', startDateStr)
            .order('date', { ascending: true }),
        supabase
            .from('period_entries')
            .select('date, flow_intensity')
            .eq('user_id', user.id)
            .gte('date', startDateStr)
            .order('date', { ascending: true }),
        supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),
    ])

    const entries = tempResult.data || []
    const periodEntries = periodResult.data || []
    const profile = profileResult.data as Profile | null
    const hasLifetimeAccess = Boolean(profile?.has_lifetime_access)

    if (!hasLifetimeAccess) {
        redirect('/dashboard')
    }

    const ovulationInput: (Pick<TemperatureEntry, 'date' | 'temperature'> & Partial<Pick<TemperatureEntry, 'disturbed' | 'exclude_from_analysis'>>)[] = entries.map((entry) => ({
        date: entry.date,
        temperature: Number(entry.temperature),
        disturbed: entry.disturbed,
        exclude_from_analysis: entry.exclude_from_analysis,
    }))
    const ovulations = detectAllOvulations(ovulationInput)

    return (
        <div className="space-y-6 pb-20 pt-4">
            <ExportClient
                entries={entries}
                periodEntries={periodEntries}
                ovulations={ovulations.map(o => ({
                    ovulationDate: o.ovulationDate,
                    coverLineTemp: o.coverLineTemp,
                }))}
            />
        </div>
    )
}
