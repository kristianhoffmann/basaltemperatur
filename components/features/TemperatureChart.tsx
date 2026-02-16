// components/features/TemperatureChart.tsx
'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import { format, parseISO, subMonths, isAfter } from 'date-fns'
import { de } from 'date-fns/locale'
import { detectAllOvulations, combineOvulationsWithPredictions } from '@/lib/ovulation'
import type { TemperatureEntry, PeriodEntry } from '@/types/database'

interface TemperatureChartProps {
    entries: Pick<TemperatureEntry, 'date' | 'temperature'>[]
    periodEntries: Pick<PeriodEntry, 'date' | 'flow_intensity'>[]
    className?: string
}

const CHART = {
    width: 800,
    height: 280,
    padding: { top: 24, right: 16, bottom: 36, left: 44 },
}

const TEMP_RANGE = { min: 35.8, max: 37.5 }

function tempToY(temp: number): number {
    const plotHeight = CHART.height - CHART.padding.top - CHART.padding.bottom
    const ratio = (temp - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min)
    return CHART.height - CHART.padding.bottom - (ratio * plotHeight)
}

function dateToX(index: number, total: number): number {
    const plotWidth = CHART.width - CHART.padding.left - CHART.padding.right
    if (total <= 1) return CHART.padding.left + plotWidth / 2
    return CHART.padding.left + (index / (total - 1)) * plotWidth
}

type ChartRange = '1M' | '3M' | '6M' | 'MAX'

export function TemperatureChart({ entries, periodEntries, className }: TemperatureChartProps) {
    const [range, setRange] = useState<ChartRange>('3M')
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const svgRef = useRef<SVGSVGElement>(null)

    const allSortedEntries = useMemo(() =>
        [...entries].sort((a, b) => a.date.localeCompare(b.date)),
        [entries]
    )

    const detectedOvulations = useMemo(() =>
        detectAllOvulations(allSortedEntries),
        [allSortedEntries]
    )

    const ovulations = useMemo(() =>
        combineOvulationsWithPredictions(detectedOvulations, periodEntries),
        [detectedOvulations, periodEntries]
    )

    const sortedEntries = useMemo(() => {
        if (range === 'MAX') return allSortedEntries

        const now = new Date()
        let startDate: Date
        switch (range) {
            case '1M': startDate = subMonths(now, 1); break
            case '3M': startDate = subMonths(now, 3); break
            case '6M': startDate = subMonths(now, 6); break
        }

        return allSortedEntries.filter(e => isAfter(parseISO(e.date), startDate))
    }, [allSortedEntries, range])

    const periodDates = useMemo(() =>
        new Set(periodEntries.map(p => p.date)),
        [periodEntries]
    )

    // Find closest data point to mouse position
    const findClosestIndex = useCallback((clientX: number) => {
        if (!svgRef.current || sortedEntries.length === 0) return null
        const svgRect = svgRef.current.getBoundingClientRect()
        const svgX = ((clientX - svgRect.left) / svgRect.width) * CHART.width
        const total = sortedEntries.length

        let closestIdx = 0
        let closestDist = Infinity
        for (let i = 0; i < total; i++) {
            const x = dateToX(i, total)
            const dist = Math.abs(svgX - x)
            if (dist < closestDist) {
                closestDist = dist
                closestIdx = i
            }
        }
        return closestDist < 40 ? closestIdx : null
    }, [sortedEntries])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            const idx = findClosestIndex(e.clientX)
            if (idx !== null) setSelectedIndex(idx)
        }
    }, [isDragging, findClosestIndex])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        const idx = findClosestIndex(e.clientX)
        setSelectedIndex(idx)
    }, [findClosestIndex])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false)
        setSelectedIndex(null)
    }, [])

    if (sortedEntries.length === 0) {
        return (
            <div className="chart-container">
                <div className="empty-state py-12">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="empty-state-title">Noch keine Daten</p>
                    <p className="empty-state-description">
                        Trage deine erste Basaltemperatur ein, um die Temperaturkurve zu sehen.
                    </p>
                </div>
            </div>
        )
    }

    const total = sortedEntries.length

    const linePoints = sortedEntries.map((entry, i) => ({
        x: dateToX(i, total),
        y: tempToY(Number(entry.temperature)),
    }))

    const bottomY = CHART.height - CHART.padding.bottom
    const linePath = linePoints.map((p, i) => i === 0 ? `M${p.x},${p.y} ` : `L${p.x},${p.y} `).join(' ')
    const areaPath = `${linePath} L${linePoints[linePoints.length - 1].x},${bottomY} L${linePoints[0].x},${bottomY} Z`

    const yLabels: number[] = []
    for (let t = TEMP_RANGE.min; t <= TEMP_RANGE.max; t += 0.2) {
        yLabels.push(Math.round(t * 10) / 10)
    }
    const xLabelInterval = Math.max(1, Math.floor(total / 8))

    const selectedEntry = selectedIndex !== null ? sortedEntries[selectedIndex] : null
    const selectedPoint = selectedIndex !== null ? linePoints[selectedIndex] : null

    return (
        <div className={`chart-container ${className || ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-semibold text-[var(--text)]">Temperaturkurve</h3>
                    <div className="flex bg-[var(--surface-hover)] rounded-lg p-0.5">
                        {(['1M', '3M', '6M', 'MAX'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => { setRange(r); setSelectedIndex(null) }}
                                className={`
                                    text-[10px] font-medium px-2 py-0.5 rounded-md transition-all
                                    ${range === r
                                        ? 'bg-white text-rose-500 shadow-sm'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                                    }
                                `}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-period-400" />
                        Periode
                    </span>
                    {ovulations.length > 0 && ovulations[ovulations.length - 1].ovulationDate && (
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-violet-400" />
                            Eisprung
                        </span>
                    )}
                    {ovulations.some(o => o.coverLineTemp) && (
                        <span className="flex items-center gap-1">
                            <span className="w-4 border-t border-dashed border-gold-400" />
                            Cover-Linie
                        </span>
                    )}
                </div>
            </div>

            {/* SVG with tooltip */}
            <div className="relative">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${CHART.width} ${CHART.height}`}
                    className="w-full select-none"
                    aria-label="Temperaturkurve"
                    role="img"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: isDragging ? 'crosshair' : 'default' }}
                >
                    <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-rose-400)" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="var(--color-rose-400)" stopOpacity="0.01" />
                        </linearGradient>
                    </defs>

                    {/* Grid */}
                    {yLabels.map((t) => (
                        <g key={t}>
                            <line x1={CHART.padding.left} y1={tempToY(t)} x2={CHART.width - CHART.padding.right} y2={tempToY(t)} stroke="var(--chart-grid)" strokeWidth="1" />
                            <text x={CHART.padding.left - 8} y={tempToY(t)} textAnchor="end" dominantBaseline="middle" fill="var(--chart-label)" fontSize="10">
                                {t.toFixed(1)}
                            </text>
                        </g>
                    ))}

                    {/* Period backgrounds */}
                    {sortedEntries.map((entry, i) => {
                        if (!periodDates.has(entry.date)) return null
                        const x = dateToX(i, total)
                        const barWidth = total > 1 ? (CHART.width - CHART.padding.left - CHART.padding.right) / (total - 1) : 40
                        return (
                            <rect
                                key={`p-${entry.date}`}
                                x={x - barWidth / 2} y={CHART.padding.top}
                                width={barWidth} height={CHART.height - CHART.padding.top - CHART.padding.bottom}
                                rx="4" className="chart-period-bg"
                            />
                        )
                    })}

                    {/* Cover line */}
                    {/* Cover lines */}
                    {ovulations.map((ov) => {
                        if (!ov.coverLineTemp || !ov.ovulationDate) return null

                        // Find start index (Ovulation Date)
                        const startIndex = sortedEntries.findIndex(e => e.date === ov.ovulationDate)
                        if (startIndex === -1) return null // Ovulation not in visible range

                        // Find end index (Next period or end of chart)
                        const nextPeriodEntry = sortedEntries.slice(startIndex).find(e => periodDates.has(e.date))
                        const endIndex = nextPeriodEntry
                            ? sortedEntries.indexOf(nextPeriodEntry)
                            : sortedEntries.length - 1

                        const x1 = dateToX(startIndex, total)
                        const x2 = dateToX(endIndex, total)
                        const y = tempToY(ov.coverLineTemp)

                        // Don't draw if points are weird
                        if (x2 <= x1) return null

                        return (
                            <line
                                key={`cover-${ov.ovulationDate}`}
                                x1={x1} y1={y}
                                x2={x2} y2={y}
                                className="chart-cover-line"
                            />
                        )
                    })}

                    {/* Area + Line */}
                    <path d={areaPath} fill="url(#areaGrad)" />
                    <polyline
                        points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
                        className="chart-temp-line" strokeLinecap="round" strokeLinejoin="round"
                    />

                    {/* Dots */}
                    {sortedEntries.map((entry, i) => {
                        const x = dateToX(i, total)
                        const y = tempToY(Number(entry.temperature))
                        const isOvulation = ovulations.some(o => o.ovulationDate === entry.date)
                        const isSelected = selectedIndex === i
                        return (
                            <g key={entry.date}>
                                {isOvulation ? (
                                    <>
                                        <circle cx={x} cy={y} r="10" className="chart-ovulation-marker" opacity="0.15" />
                                        <circle cx={x} cy={y} r={isSelected ? 7 : 5} className="chart-ovulation-marker" />
                                    </>
                                ) : (
                                    <circle cx={x} cy={y} r={isSelected ? 5.5 : 3.5} className="chart-temp-dot" />
                                )}
                            </g>
                        )
                    })}

                    {/* Selected point crosshair */}
                    {selectedPoint && selectedEntry && (
                        <>
                            <line
                                x1={selectedPoint.x} y1={CHART.padding.top}
                                x2={selectedPoint.x} y2={CHART.height - CHART.padding.bottom}
                                stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"
                            />
                            <circle
                                cx={selectedPoint.x} cy={selectedPoint.y}
                                r="6" fill="var(--color-rose-500)" stroke="white" strokeWidth="2"
                            />
                        </>
                    )}

                    {/* X labels */}
                    {sortedEntries.map((entry, i) => {
                        if (i % xLabelInterval !== 0 && i !== total - 1) return null
                        return (
                            <text key={`x-${entry.date}`} x={dateToX(i, total)} y={CHART.height - 8}
                                textAnchor="middle" fill="var(--chart-label)" fontSize="10">
                                {format(parseISO(entry.date), 'd.M.', { locale: de })}
                            </text>
                        )
                    })}

                    {/* Invisible hit areas for each point (better click targets) */}
                    {sortedEntries.map((entry, i) => {
                        const x = dateToX(i, total)
                        const y = tempToY(Number(entry.temperature))
                        return (
                            <circle
                                key={`hit-${entry.date}`}
                                cx={x} cy={y} r="12"
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => {
                                    if (!isDragging) setSelectedIndex(i)
                                }}
                                onMouseLeave={() => {
                                    if (!isDragging) setSelectedIndex(null)
                                }}
                            />
                        )
                    })}
                </svg>

                {/* Tooltip overlay (HTML, rendered outside SVG for better styling) */}
                {selectedEntry && selectedPoint && svgRef.current && (() => {
                    const svgRect = svgRef.current!.getBoundingClientRect()
                    const scaleX = svgRect.width / CHART.width
                    const scaleY = svgRect.height / CHART.height
                    const tooltipX = selectedPoint.x * scaleX
                    const tooltipY = selectedPoint.y * scaleY
                    const isOvulation = ovulations.some(o => o.ovulationDate === selectedEntry.date)
                    const isPeriod = periodDates.has(selectedEntry.date)

                    // Keep tooltip in bounds
                    const clampedX = Math.min(Math.max(tooltipX, 70), svgRect.width - 70)

                    return (
                        <div
                            className="absolute pointer-events-none z-10"
                            style={{
                                left: clampedX,
                                top: Math.max(tooltipY - 55, 4),
                                transform: 'translateX(-50%)',
                            }}
                        >
                            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-center">
                                <div className="text-[11px] font-semibold text-gray-900">
                                    {Number(selectedEntry.temperature).toFixed(2)}°C
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    {format(parseISO(selectedEntry.date), 'd. MMM yyyy', { locale: de })}
                                </div>
                                {isPeriod && (
                                    <div className="text-[9px] text-rose-500 font-medium mt-0.5">Periode</div>
                                )}
                                {isOvulation && (
                                    <div className="text-[9px] text-violet-500 font-medium mt-0.5">🥚 Eisprung</div>
                                )}
                            </div>
                        </div>
                    )
                })()}
            </div>
        </div>
    )
}
