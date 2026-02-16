// app/(dashboard)/statistiken/page.tsx
// Zyklusstatistiken – Durchschnitte, Trends, Historie

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { detectOvulation } from '@/lib/ovulation'
import { differenceInDays, parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
    BarChart3,
    Thermometer,
    CalendarHeart,
    Sparkles,
    TrendingUp,
    Activity,
} from 'lucide-react'
import type { Profile } from '@/types/database'

export const metadata = {
    title: 'Statistiken',
    description: 'Deine Zyklusstatistiken und Trends.',
}

export default async function StatisticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 365)
    const startDateStr = format(startDate, 'yyyy-MM-dd')

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

    const entries = tempResult.data || []
    const periodEntries = periodResult.data || []
    const profile = profileResult.data as Profile | null

    // Calculate cycle starts
    const periodDates = periodEntries.map(p => p.date).sort()
    const cycleStarts: string[] = []

    for (let i = 0; i < periodDates.length; i++) {
        if (i === 0) {
            cycleStarts.push(periodDates[i])
        } else {
            const diff = differenceInDays(parseISO(periodDates[i]), parseISO(periodDates[i - 1]))
            if (diff > 3) {
                cycleStarts.push(periodDates[i])
            }
        }
    }

    // Calculate cycle lengths with date ranges
    const cycleDetails: { start: string; end: string; length: number; label: string }[] = []
    for (let i = 0; i < cycleStarts.length - 1; i++) {
        const length = differenceInDays(parseISO(cycleStarts[i + 1]), parseISO(cycleStarts[i]))
        if (length > 0 && length < 60) {
            const startDate = parseISO(cycleStarts[i])
            const endDate = parseISO(cycleStarts[i + 1])
            // End date is day before next cycle start
            endDate.setDate(endDate.getDate() - 1)
            const label = `${format(startDate, 'd. MMM', { locale: de })} – ${format(endDate, 'd. MMM', { locale: de })}`
            cycleDetails.push({ start: cycleStarts[i], end: cycleStarts[i + 1], length, label })
        }
    }
    const cycleLengths = cycleDetails.map(c => c.length)

    // Temperature stats
    const temps = entries.map(e => Number(e.temperature))
    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null
    const minTemp = temps.length > 0 ? Math.min(...temps) : null
    const maxTemp = temps.length > 0 ? Math.max(...temps) : null

    // Cycle length stats
    const avgCycleLength = cycleLengths.length > 0
        ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
        : null
    const shortestCycle = cycleLengths.length > 0 ? Math.min(...cycleLengths) : null
    const longestCycle = cycleLengths.length > 0 ? Math.max(...cycleLengths) : null

    // Period days per cycle
    const totalPeriodDays = periodDates.length
    const avgPeriodLength = cycleLengths.length > 0
        ? Math.round(totalPeriodDays / Math.max(cycleStarts.length, 1))
        : null

    // Tracking stats
    const totalEntries = entries.length
    const streakDays = calculateStreak(entries.map(e => e.date))

    const statCards = [
        {
            icon: CalendarHeart,
            label: 'Ø Zykluslänge',
            value: avgCycleLength ? `${avgCycleLength} Tage` : '–',
            subtitle: cycleLengths.length > 0
                ? `${shortestCycle}–${longestCycle} Tage (${cycleLengths.length} Zyklen)`
                : 'Noch keine Zyklusdaten',
            color: '#E8788A',
        },
        {
            icon: Thermometer,
            label: 'Ø Temperatur',
            value: avgTemp ? `${avgTemp.toFixed(2)}°C` : '–',
            subtitle: minTemp && maxTemp ? `${minTemp.toFixed(2)}° – ${maxTemp.toFixed(2)}°` : 'Keine Daten',
            color: '#E8788A',
        },
        {
            icon: Sparkles,
            label: 'Ø Periodenlänge',
            value: avgPeriodLength ? `${avgPeriodLength} Tage` : '–',
            subtitle: `${totalPeriodDays} Periodentage gesamt`,
            color: '#D4637A',
        },
        {
            icon: Activity,
            label: 'Tracking-Streak',
            value: streakDays > 0 ? `${streakDays} Tage` : '–',
            subtitle: `${totalEntries} Einträge gesamt`,
            color: '#10B981',
        },
    ]

    return (
        <div className="space-y-6 pb-20 pt-4">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    Statistiken
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Deine Zyklusdaten auf einen Blick.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
                {statCards.map((stat) => (
                    <div key={stat.label} className="card p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                            <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                {stat.label}
                            </span>
                        </div>
                        <div className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                            {stat.value}
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            {stat.subtitle}
                        </p>
                    </div>
                ))}
            </div>

            {/* Cycle Length History */}
            {cycleLengths.length > 0 && (
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                        <BarChart3 className="h-5 w-5 text-rose-400" />
                        Zykluslängen
                    </h2>
                    <div className="space-y-2">
                        {cycleDetails.map((cycle, i) => {
                            const maxLen = Math.max(...cycleLengths)
                            const percentage = (cycle.length / maxLen) * 100

                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs w-32 shrink-0" style={{ color: 'var(--text-muted)' }}>
                                        {cycle.label}
                                    </span>
                                    <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                        <div
                                            className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
                                            style={{
                                                width: `${percentage}%`,
                                                background: 'linear-gradient(135deg, #E8788A, #D4637A)',
                                                minWidth: '40px',
                                            }}
                                        >
                                            <span className="text-xs font-medium text-white">{cycle.length}d</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Temperature Range */}
            {entries.length > 0 && (
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                        <TrendingUp className="h-5 w-5 text-rose-400" />
                        Temperaturbereich
                    </h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Minimum</p>
                            <p className="text-lg font-bold text-blue-500">{minTemp?.toFixed(2)}°</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Durchschnitt</p>
                            <p className="text-lg font-bold text-gray-700">{avgTemp?.toFixed(2)}°</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Maximum</p>
                            <p className="text-lg font-bold text-rose-500">{maxTemp?.toFixed(2)}°</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0

    const sorted = [...dates].sort().reverse()
    const today = format(new Date(), 'yyyy-MM-dd')

    // Check if the latest entry is today or yesterday
    if (sorted[0] !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        if (sorted[0] !== format(yesterday, 'yyyy-MM-dd')) {
            return 0
        }
    }

    let streak = 1
    for (let i = 1; i < sorted.length; i++) {
        const diff = differenceInDays(parseISO(sorted[i - 1]), parseISO(sorted[i]))
        if (diff === 1) {
            streak++
        } else {
            break
        }
    }

    return streak
}
