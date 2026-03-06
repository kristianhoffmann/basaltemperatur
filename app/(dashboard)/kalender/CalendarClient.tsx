// app/(dashboard)/kalender/CalendarClient.tsx
// Client-seitige Kalender-Komponente mit Fruchtbarkeitsfenster
'use client'

import { useState, useMemo, type CSSProperties } from 'react'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    addMonths,
    subMonths,
    isToday,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react'
import Link from 'next/link'

interface CalendarClientProps {
    entries: { date: string; temperature: number }[]
    periodEntries: { date: string; flow_intensity: string }[]
    fertileDates?: string[]
    peakDates?: string[]
    predictedPeriodDates?: string[]
    hasLifetimeAccess?: boolean
}

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function CalendarClient({
    entries,
    periodEntries,
    fertileDates = [],
    peakDates = [],
    predictedPeriodDates = [],
    hasLifetimeAccess = false,
}: CalendarClientProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const entryMap = useMemo(() => {
        const map = new Map<string, number>()
        entries.forEach(e => map.set(e.date, Number(e.temperature)))
        return map
    }, [entries])

    const periodMap = useMemo(() => {
        const map = new Map<string, string>()
        periodEntries.forEach(e => map.set(e.date, e.flow_intensity))
        return map
    }, [periodEntries])

    const fertileSet = useMemo(() => new Set(fertileDates), [fertileDates])
    const peakSet = useMemo(() => new Set(peakDates), [peakDates])
    const predictedPeriodSet = useMemo(() => new Set(predictedPeriodDates), [predictedPeriodDates])

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const startDayOffset = (getDay(monthStart) + 6) % 7

    return (
        <div className="card">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                    {format(currentMonth, 'MMMM yyyy', { locale: de })}
                </h2>
                <button
                    onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
            </div>

            {/* Wochentage */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Kalender-Grid */}
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const temp = entryMap.get(dateStr)
                    const isPeriod = periodMap.has(dateStr)
                    const isPredictedPeriod = hasLifetimeAccess && !isPeriod && predictedPeriodSet.has(dateStr)
                    const isFertile = hasLifetimeAccess && fertileSet.has(dateStr)
                    const isPeak = hasLifetimeAccess && peakSet.has(dateStr)
                    const today = isToday(day)

                    let bgClass = 'hover:bg-gray-50'
                    let dayStyle: CSSProperties | undefined

                    if (isPeriod) {
                        bgClass = ''
                        dayStyle = {
                            backgroundColor: '#fbd5dd',
                            border: '1px solid rgba(184, 77, 101, 0.55)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
                        }
                    } else if (isPredictedPeriod) {
                        bgClass = ''
                        dayStyle = {
                            backgroundColor: '#fff4f7',
                            border: '1px dashed rgba(212, 99, 122, 0.7)',
                        }
                    } else if (isPeak) {
                        bgClass = ''
                        dayStyle = { backgroundColor: '#fef3c720', border: '1px solid #f59e0b40' }
                    } else if (isFertile) {
                        bgClass = ''
                        dayStyle = { backgroundColor: '#d1fae520', border: '1px solid #10b98130' }
                    }
                    else if (temp !== undefined) bgClass = 'bg-primary-50'

                    return (
                        <Link
                            key={dateStr}
                            href={`/eintrag?date=${dateStr}`}
                            className={`aspect-square rounded-2xl p-1 flex flex-col items-center justify-center 
                                transition-all duration-200 hover:scale-105 relative
                                ${today ? 'ring-2 ring-primary' : ''}
                                ${bgClass}
                            `}
                            style={dayStyle}
                        >
                            <span className={`text-sm font-medium ${today ? 'text-primary' :
                                    isPeriod ? 'text-period' :
                                        isPredictedPeriod ? 'text-rose-500' :
                                        isPeak ? 'text-amber-600' :
                                            isFertile ? 'text-emerald-600' :
                                                'text-gray-700'
                                }`}>
                                {format(day, 'd')}
                            </span>

                            {temp !== undefined && (
                                <span className={`text-[10px] leading-none mt-0.5 ${isPeriod
                                    ? 'text-rose-700'
                                    : isPredictedPeriod
                                        ? 'text-rose-500'
                                        : 'text-gray-500'
                                    }`}>
                                    {temp.toFixed(1)}°
                                </span>
                            )}

                            {isPeriod && (
                                <Droplets className="h-3.5 w-3.5 text-rose-700 absolute bottom-1" />
                            )}

                            {isPredictedPeriod && (
                                <Droplets className="h-3 w-3 text-rose-400 absolute bottom-1" />
                            )}

                            {isPeak && !isPeriod && !isPredictedPeriod && (
                                <span className="absolute bottom-0.5 text-[8px]">⚡</span>
                            )}

                            {isFertile && !isPeak && !isPeriod && !isPredictedPeriod && (
                                <span className="absolute bottom-0.5 text-[8px]">🌱</span>
                            )}
                        </Link>
                    )
                })}
            </div>

            {/* Legende */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-primary-50 border border-primary-100" />
                    Temperatur
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: '#fbd5dd', border: '1px solid rgba(184, 77, 101, 0.55)' }} />
                    Periode
                </span>
                {hasLifetimeAccess && (
                    <>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#fff4f7', border: '1px dashed rgba(212, 99, 122, 0.7)' }} />
                            Periode (Prognose)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded border" style={{ backgroundColor: '#d1fae520', borderColor: '#10b98140' }} />
                            Fruchtbar
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded border" style={{ backgroundColor: '#fef3c720', borderColor: '#f59e0b40' }} />
                            Peak ⚡
                        </span>
                    </>
                )}
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded ring-2 ring-primary" />
                    Heute
                </span>
            </div>

            {!hasLifetimeAccess && (
                <div className="mt-3 text-center text-xs text-[var(--text-muted)]">
                    Prognosen (Fruchtbar, Peak, vorhergesagte Periode) sind im Vollzugang enthalten.
                </div>
            )}
        </div>
    )
}
