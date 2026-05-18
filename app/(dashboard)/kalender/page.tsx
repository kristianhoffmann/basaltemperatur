// app/(dashboard)/kalender/page.tsx
// Kalender-Ansicht mit Monatsübersicht und Fruchtbarkeitsfenster

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarClient } from './CalendarClient'
import { getFutureWindows } from '@/lib/ovulation'
import { differenceInDays, parseISO, format, addDays } from 'date-fns'
import type { Profile } from '@/types/database'

function buildCycleStats(
    periodEntries: { date: string; flow_intensity?: string }[],
    fallbackCycleLength: number
) {
    const sortedDates = periodEntries
        .filter(p => p.flow_intensity !== 'spotting')
        .map(p => p.date)
        .sort()

    if (sortedDates.length === 0) {
        return {
            cycleStarts: [] as string[],
            completedCycleCount: 0,
            averageCycleLength: fallbackCycleLength,
            averagePeriodLength: 5,
        }
    }

    // Zyklusstart = >3 Tage Lücke (konsistent mit ovulation.ts und allen anderen Seiten).
    // Periodenblock = aufeinanderfolgende Tage (≤1 Tag Lücke), wird separat getrackt
    // damit averagePeriodLength nicht von der Zyklusgrenze beeinflusst wird.
    const cycleStarts: string[] = [sortedDates[0]]
    const periodBlocks: number[] = []
    let currentBlockLength = 1

    for (let i = 1; i < sortedDates.length; i++) {
        const diff = differenceInDays(parseISO(sortedDates[i]), parseISO(sortedDates[i - 1]))

        // Block-Tracking (für Periodenlänge)
        if (diff <= 1) {
            currentBlockLength += 1
        } else {
            periodBlocks.push(currentBlockLength)
            currentBlockLength = 1
        }

        // Zyklusstart-Erkennung (für Vorhersagen)
        if (diff > 3) {
            cycleStarts.push(sortedDates[i])
        }
    }
    periodBlocks.push(currentBlockLength)

    const cycleLengths: number[] = []
    for (let i = 0; i < cycleStarts.length - 1; i++) {
        const diff = differenceInDays(parseISO(cycleStarts[i + 1]), parseISO(cycleStarts[i]))
        if (diff >= 21 && diff <= 45) {
            cycleLengths.push(diff)
        }
    }

    const validPeriodLengths = periodBlocks.filter(length => length >= 2 && length <= 8)

    const averageCycleLength = cycleLengths.length > 0
        ? Math.round(cycleLengths.reduce((sum, value) => sum + value, 0) / cycleLengths.length)
        : fallbackCycleLength

    const averagePeriodLength = validPeriodLengths.length > 0
        ? Math.round(validPeriodLengths.reduce((sum, value) => sum + value, 0) / validPeriodLengths.length)
        : 5

    return {
        cycleStarts,
        completedCycleCount: cycleLengths.length,
        averageCycleLength,
        averagePeriodLength,
    }
}

export default async function CalendarPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const tempStartDate = new Date()
    tempStartDate.setDate(tempStartDate.getDate() - 120)
    const tempStartDateStr = format(tempStartDate, 'yyyy-MM-dd')

    const periodHistoryStartDate = new Date()
    periodHistoryStartDate.setDate(periodHistoryStartDate.getDate() - 365)
    const periodHistoryStartDateStr = format(periodHistoryStartDate, 'yyyy-MM-dd')

    const [tempResult, periodResult, profileResult] = await Promise.all([
        supabase
            .from('temperature_entries')
            .select('date, temperature')
            .eq('user_id', user.id)
            .gte('date', tempStartDateStr)
            .order('date', { ascending: true }),
        supabase
            .from('period_entries')
            .select('date, flow_intensity')
            .eq('user_id', user.id)
            .gte('date', periodHistoryStartDateStr)
            .order('date', { ascending: true }),
        supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),
    ])

    const profile = profileResult.data as Profile | null
    const hasLifetimeAccess = Boolean(profile?.has_lifetime_access)
    const cycleLength = profile?.cycle_length_default || 28
    const lutealPhase = profile?.luteal_phase_default || 14
    const periodEntries = periodResult.data || []

    // Nutzt reale Verlaufsdaten (wenn vorhanden) statt nur Default-Werten.
    const {
        cycleStarts,
        completedCycleCount,
        averageCycleLength,
        averagePeriodLength,
    } = buildCycleStats(periodEntries, cycleLength)
    const lastPeriodStart = cycleStarts.length > 0 ? cycleStarts[cycleStarts.length - 1] : null
    const predictionBaselineReady = completedCycleCount >= 3

    const fertileDates: string[] = []
    const peakDates: string[] = []
    const predictedPeriodDates: string[] = []

    if (lastPeriodStart && hasLifetimeAccess && predictionBaselineReady) {
        const windows = getFutureWindows(lastPeriodStart, averageCycleLength, lutealPhase)
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

        // Prognose: nächste Periodenblöcke (Start + durchschnittliche Zykluslänge).
        const lastStartDate = parseISO(lastPeriodStart)
        const forecastUntil = addDays(new Date(), 180)

        for (let cycleIndex = 1; cycleIndex <= 8; cycleIndex++) {
            const predictedStart = addDays(lastStartDate, averageCycleLength * cycleIndex)
            if (predictedStart > forecastUntil) break

            for (let offset = 0; offset < averagePeriodLength; offset++) {
                predictedPeriodDates.push(format(addDays(predictedStart, offset), 'yyyy-MM-dd'))
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
                predictedPeriodDates={predictedPeriodDates}
                hasLifetimeAccess={hasLifetimeAccess}
                predictionBaselineReady={predictionBaselineReady}
                completedCycleCount={completedCycleCount}
            />
        </div>
    )
}
