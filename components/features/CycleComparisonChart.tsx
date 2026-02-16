// components/features/CycleComparisonChart.tsx
// Zyklusvergleich – Mehrere Zyklen übereinander
'use client'

import { useMemo } from 'react'

interface CycleData {
    cycleNumber: number
    startDate: string
    entries: { cycleDay: number; temperature: number }[]
    color: string
}

interface CycleComparisonChartProps {
    cycles: CycleData[]
}

const COLORS = [
    '#E8788A', // rose
    '#8B5CF6', // violet
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EC4899', // pink
]

export function CycleComparisonChart({ cycles }: CycleComparisonChartProps) {
    const chartData = useMemo(() => {
        if (cycles.length === 0) return null

        const maxDay = Math.max(...cycles.flatMap(c => c.entries.map(e => e.cycleDay)))
        const allTemps = cycles.flatMap(c => c.entries.map(e => e.temperature))
        const minTemp = Math.floor(Math.min(...allTemps) * 10) / 10 - 0.1
        const maxTemp = Math.ceil(Math.max(...allTemps) * 10) / 10 + 0.1

        return { maxDay: Math.min(maxDay, 45), minTemp, maxTemp }
    }, [cycles])

    if (!chartData || cycles.length === 0) {
        return (
            <div className="card p-8 text-center">
                <span className="text-4xl mb-3 block">📊</span>
                <p className="font-semibold text-gray-900">Noch keine Zyklusdaten</p>
                <p className="text-sm text-gray-500 mt-1">
                    Trage mindestens zwei Zyklen ein, um sie vergleichen zu können.
                </p>
            </div>
        )
    }

    const width = 600
    const height = 300
    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const xScale = (day: number) => padding.left + (day / chartData.maxDay) * chartW
    const yScale = (temp: number) => padding.top + chartH - ((temp - chartData.minTemp) / (chartData.maxTemp - chartData.minTemp)) * chartH

    // Y-axis ticks
    const yTicks: number[] = []
    for (let t = chartData.minTemp; t <= chartData.maxTemp; t += 0.2) {
        yTicks.push(Math.round(t * 10) / 10)
    }

    // X-axis ticks
    const xTicks: number[] = []
    for (let d = 1; d <= chartData.maxDay; d += 5) {
        xTicks.push(d)
    }

    return (
        <div className="card">
            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full min-w-[500px]"
                    style={{ maxHeight: '350px' }}
                >
                    {/* Grid */}
                    {yTicks.map(t => (
                        <g key={t}>
                            <line
                                x1={padding.left}
                                y1={yScale(t)}
                                x2={width - padding.right}
                                y2={yScale(t)}
                                stroke="#f3f4f6"
                                strokeWidth={1}
                            />
                            <text
                                x={padding.left - 8}
                                y={yScale(t) + 4}
                                textAnchor="end"
                                className="text-[10px] fill-gray-400"
                            >
                                {t.toFixed(1)}
                            </text>
                        </g>
                    ))}

                    {xTicks.map(d => (
                        <text
                            key={d}
                            x={xScale(d)}
                            y={height - 10}
                            textAnchor="middle"
                            className="text-[10px] fill-gray-400"
                        >
                            Tag {d}
                        </text>
                    ))}

                    {/* Cycle lines */}
                    {cycles.map((cycle, ci) => {
                        const sorted = [...cycle.entries].sort((a, b) => a.cycleDay - b.cycleDay)
                        if (sorted.length < 2) return null

                        const pathD = sorted
                            .map((e, i) => `${i === 0 ? 'M' : 'L'} ${xScale(e.cycleDay)} ${yScale(e.temperature)}`)
                            .join(' ')

                        return (
                            <g key={ci}>
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={COLORS[ci % COLORS.length]}
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity={0.8}
                                />
                                {sorted.map((e, i) => (
                                    <circle
                                        key={i}
                                        cx={xScale(e.cycleDay)}
                                        cy={yScale(e.temperature)}
                                        r={2.5}
                                        fill={COLORS[ci % COLORS.length]}
                                        opacity={0.9}
                                    />
                                ))}
                            </g>
                        )
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100">
                {cycles.map((cycle, ci) => (
                    <div key={ci} className="flex items-center gap-2 text-xs text-gray-600">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[ci % COLORS.length] }}
                        />
                        Zyklus {cycle.cycleNumber} ({cycle.startDate})
                    </div>
                ))}
            </div>
        </div>
    )
}
