// app/(dashboard)/statistiken/page.tsx
// Zyklusstatistiken – Durchschnitte, Trends, Historie

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { differenceInDays, parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
    BarChart3,
    Thermometer,
    CalendarHeart,
    Sparkles,
    TrendingUp,
    Activity,
    ShieldCheck,
    AlertTriangle,
    Lock,
} from 'lucide-react'
import { detectAllOvulations, getPredictionReadiness } from '@/lib/ovulation'
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
            .select('date, temperature, disturbed, exclude_from_analysis')
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
        return (
            <div className="space-y-6 pb-20 pt-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                        Statistiken
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Zyklusdaten, Messqualität und Trends.
                    </p>
                </div>

                <div className="card text-center py-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
                        <Lock className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                        Statistiken sind Premium
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Der Vollzugang schaltet Auswertbarkeit, Zyklus-Stabilität, Messqualität,
                        Temperaturtrends und den Verlauf deiner Zyklen frei.
                    </p>
                    <Link href="/dashboard" className="mt-5 inline-flex">
                        <button className="btn btn-glow">Vollzugang ansehen</button>
                    </Link>
                </div>
            </div>
        )
    }

    // Calculate cycle starts (>3 day gap = new cycle, consistent with ovulation.ts)
    const cyclePeriodDates = periodEntries
        .filter(p => p.flow_intensity !== 'spotting')
        .map(p => p.date)
        .sort()
    const periodDates = periodEntries.map(p => p.date).sort()
    const cycleStarts: string[] = []
    // Also track period blocks (consecutive days with ≤1 day gap) for averagePeriodLength.
    const periodBlocks: number[] = []
    let currentBlockLength = 0

    for (let i = 0; i < cyclePeriodDates.length; i++) {
        if (i === 0) {
            cycleStarts.push(cyclePeriodDates[i])
            currentBlockLength = 1
        } else {
            const diff = differenceInDays(parseISO(cyclePeriodDates[i]), parseISO(cyclePeriodDates[i - 1]))
            if (diff > 3) {
                cycleStarts.push(cyclePeriodDates[i])
            }
            if (diff <= 1) {
                currentBlockLength += 1
            } else {
                periodBlocks.push(currentBlockLength)
                currentBlockLength = 1
            }
        }
    }
    if (currentBlockLength > 0) periodBlocks.push(currentBlockLength)

    // Calculate cycle lengths with date ranges
    const cycleDetails: { start: string; end: string; length: number; label: string }[] = []
    for (let i = 0; i < cycleStarts.length - 1; i++) {
        const length = differenceInDays(parseISO(cycleStarts[i + 1]), parseISO(cycleStarts[i]))
        if (length > 0 && length < 60) {
            const startDate = parseISO(cycleStarts[i])
            const endDate = new Date(parseISO(cycleStarts[i + 1]).getTime())
            // End date is day before next cycle start
            endDate.setDate(endDate.getDate() - 1)
            const label = `${format(startDate, 'd. MMM', { locale: de })} – ${format(endDate, 'd. MMM', { locale: de })}`
            cycleDetails.push({ start: cycleStarts[i], end: cycleStarts[i + 1], length, label })
        }
    }
    const cycleLengths = cycleDetails.map(c => c.length)

    // Temperature stats
    const usableEntries = entries.filter(e => !e.disturbed && !e.exclude_from_analysis)
    const temps = usableEntries.map(e => Number(e.temperature))
    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null
    const minTemp = temps.length > 0 ? Math.min(...temps) : null
    const maxTemp = temps.length > 0 ? Math.max(...temps) : null
    const disturbedCount = entries.filter(e => e.disturbed).length
    const excludedCount = entries.filter(e => e.exclude_from_analysis).length
    const affectedCount = entries.filter(e => e.disturbed || e.exclude_from_analysis).length
    const affectedRate = entries.length > 0 ? Math.round((affectedCount / entries.length) * 100) : 0

    // Cycle length stats
    const avgCycleLength = cycleLengths.length > 0
        ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
        : null
    const shortestCycle = cycleLengths.length > 0 ? Math.min(...cycleLengths) : null
    const longestCycle = cycleLengths.length > 0 ? Math.max(...cycleLengths) : null

    // Period length: average of consecutive-day blocks (filter implausible outliers)
    const totalPeriodDays = periodDates.length
    const validBlocks = periodBlocks.filter(length => length >= 2 && length <= 10)
    const avgPeriodLength = validBlocks.length > 0
        ? Math.round(validBlocks.reduce((a, b) => a + b, 0) / validBlocks.length)
        : null

    // Tracking stats
    const totalEntries = entries.length
    const streakDays = calculateStreak(entries.map(e => e.date))
    const coverageDays = calculateCoverage(entries.map(e => e.date), 30)
    const coverageRate = Math.round((coverageDays / 30) * 100)
    const regularity = calculateStandardDeviation(cycleLengths)
    const lastThreeAvg = average(cycleLengths.slice(-3))
    const previousThreeAvg = average(cycleLengths.slice(-6, -3))
    const cycleTrend = lastThreeAvg !== null && previousThreeAvg !== null
        ? Math.round(lastThreeAvg - previousThreeAvg)
        : null
    const predictionReadiness = getPredictionReadiness(entries, periodEntries)
    const detectedRises = detectAllOvulations(entries)
    const phaseShift = calculateAveragePhaseShift(entries, detectedRises.map(result => result.ovulationDate).filter(Boolean) as string[])

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
            subtitle: `${coverageRate}% Abdeckung der letzten 30 Tage`,
            color: '#10B981',
        },
        {
            icon: ShieldCheck,
            label: 'Auswertbare Werte',
            value: totalEntries > 0 ? `${usableEntries.length}/${totalEntries}` : '–',
            subtitle: affectedCount > 0 ? `${affectedRate}% mit Störfaktor oder ausgeschlossen` : 'Keine Störfaktoren markiert',
            color: affectedRate > 35 ? '#F59E0B' : '#10B981',
        },
        {
            icon: TrendingUp,
            label: 'Temperaturanstiege',
            value: detectedRises.length > 0 ? `${detectedRises.length}` : '–',
            subtitle: phaseShift !== null ? `Ø +${phaseShift.toFixed(2)}° Hochlage` : 'Noch nicht berechenbar',
            color: '#8B5CF6',
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

            <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    {predictionReadiness.ready ? (
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                    Auswertbarkeit
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <QualityMetric label="Zyklen" value={`${predictionReadiness.completedCycleCount}/3`} />
                    <QualityMetric label="Temperaturwerte" value={`${predictionReadiness.usableTemperatureCount}`} />
                    <QualityMetric label="30-Tage-Abdeckung" value={`${coverageRate}%`} />
                    <QualityMetric label="Störquote" value={`${affectedRate}%`} />
                </div>
                {!predictionReadiness.ready && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {predictionReadiness.reasons.map((reason) => (
                            <span key={reason} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                                {reason}
                            </span>
                        ))}
                    </div>
                )}
                <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Die Statistik bewertet nur deine Eingaben. Sie ist keine Diagnose und sagt nicht sicher voraus,
                    wann fruchtbare Tage oder die nächste Periode eintreten.
                </p>
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

            {cycleLengths.length >= 2 && (
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                        <Activity className="h-5 w-5 text-rose-400" />
                        Zyklus-Stabilität
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <QualityMetric label="Schwankung" value={regularity !== null ? `±${regularity.toFixed(1)}d` : '–'} />
                        <QualityMetric label="Kürzester Zyklus" value={shortestCycle ? `${shortestCycle}d` : '–'} />
                        <QualityMetric label="Längster Zyklus" value={longestCycle ? `${longestCycle}d` : '–'} />
                        <QualityMetric
                            label="Trend"
                            value={cycleTrend === null ? '–' : `${cycleTrend > 0 ? '+' : ''}${cycleTrend}d`}
                        />
                    </div>
                    <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Je kleiner die Schwankung und je regelmäßiger die Einträge, desto nachvollziehbarer werden Prognosen.
                        Stark variable Zyklen werden weiterhin zurückhaltend angezeigt.
                    </p>
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
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t border-[var(--border-subtle)] pt-4">
                        <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Störfaktoren</p>
                            <p className="text-lg font-bold text-amber-600">{disturbedCount}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Ausgeschlossen</p>
                            <p className="text-lg font-bold text-amber-600">{excludedCount}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Auswertbar</p>
                            <p className="text-lg font-bold text-emerald-600">{usableEntries.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function QualityMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {label}
            </p>
            <p className="mt-1 text-lg font-bold" style={{ color: 'var(--text)' }}>
                {value}
            </p>
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

function calculateCoverage(dates: string[], days: number): number {
    const uniqueDates = new Set(dates)
    let count = 0
    for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        if (uniqueDates.has(format(date, 'yyyy-MM-dd'))) {
            count++
        }
    }
    return count
}

function average(values: number[]): number | null {
    if (values.length === 0) return null
    return values.reduce((sum, value) => sum + value, 0) / values.length
}

function calculateStandardDeviation(values: number[]): number | null {
    const avg = average(values)
    if (avg === null || values.length < 2) return null
    const variance = values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length
    return Math.sqrt(variance)
}

function calculateAveragePhaseShift(
    entries: { date: string; temperature: number; disturbed?: boolean; exclude_from_analysis?: boolean }[],
    riseDates: string[]
): number | null {
    const usable = entries
        .filter(entry => !entry.disturbed && !entry.exclude_from_analysis)
        .sort((a, b) => a.date.localeCompare(b.date))

    const shifts: number[] = []
    for (const riseDate of riseDates) {
        const index = usable.findIndex(entry => entry.date === riseDate)
        if (index < 6 || index + 3 >= usable.length) continue

        const before = usable.slice(index - 6, index).map(entry => Number(entry.temperature))
        const after = usable.slice(index + 1, index + 4).map(entry => Number(entry.temperature))
        const beforeAvg = average(before)
        const afterAvg = average(after)
        if (beforeAvg !== null && afterAvg !== null && afterAvg > beforeAvg) {
            shifts.push(afterAvg - beforeAvg)
        }
    }

    return average(shifts)
}
