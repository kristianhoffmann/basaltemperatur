// app/(dashboard)/kalender/page.tsx
// Kalender-Ansicht mit Monatsübersicht und Fruchtbarkeitsfenster

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarClient } from './CalendarClient'
import { getFutureWindows } from '@/lib/ovulation'
import { differenceInDays, parseISO, format, addDays } from 'date-fns'
import type { Profile } from '@/types/database'

export default async function CalendarPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)
    const startDateStr = startDate.toISOString().split('T')[0]

    const [tempResult, periodResult, profileResult] = await Promise.all([
        supabase
            .from('temperature_entries')
            .select('date, temperature')
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

    const profile = profileResult.data as Profile | null
    const cycleLength = profile?.cycle_length_default || 28
    const periodEntries = periodResult.data || []

    // Berechne Fruchtbarkeitsfenster basierend auf letzter Periode
    const periodDates = periodEntries.map(p => p.date).sort()
    let lastPeriodStart: string | null = null
    if (periodDates.length > 0) {
        lastPeriodStart = periodDates[periodDates.length - 1]
        for (let i = periodDates.length - 2; i >= 0; i--) {
            const diff = differenceInDays(parseISO(periodDates[i + 1]), parseISO(periodDates[i]))
            if (diff <= 1) {
                lastPeriodStart = periodDates[i]
            } else {
                break
            }
        }
    }

    let fertileDates: string[] = []
    let peakDates: string[] = []

    if (lastPeriodStart) {
        const windows = getFutureWindows(lastPeriodStart, cycleLength)
        for (const window of windows) {
            // Generate all dates in fertile window
            const start = parseISO(window.start)
            const end = parseISO(window.end)
            for (let d = start; d <= end; d = addDays(d, 1)) {
                fertileDates.push(format(d, 'yyyy-MM-dd'))
            }
            // Generate peak dates
            const peakStart = parseISO(window.peakStart)
            const peakEnd = parseISO(window.peakEnd)
            for (let d = peakStart; d <= peakEnd; d = addDays(d, 1)) {
                peakDates.push(format(d, 'yyyy-MM-dd'))
            }
        }
    }

    return (
        <div className="py-4">
            <CalendarClient
                entries={tempResult.data || []}
                periodEntries={periodEntries}
                fertileDates={fertileDates}
                peakDates={peakDates}
            />
        </div>
    )
}
