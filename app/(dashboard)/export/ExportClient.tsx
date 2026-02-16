// app/(dashboard)/export/ExportClient.tsx
// Client-Komponente für PDF-Export – Professionell für den Frauenarzt
'use client'

import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Printer } from 'lucide-react'

interface OvulationInfo {
    ovulationDate: string | null
    coverLineTemp: number | null
}

interface ExportClientProps {
    entries: { date: string; temperature: number; notes: string | null; cervical_mucus: string | null }[]
    periodEntries: { date: string; flow_intensity: string }[]
    ovulations: OvulationInfo[]
    userEmail: string
}

const mucusLabels: Record<string, string> = {
    dry: 'Trocken',
    sticky: 'Klebrig',
    creamy: 'Cremig',
    watery: 'Wässrig',
    eggwhite: 'Spinnbar',
}

export function ExportClient({ entries, periodEntries, ovulations, userEmail }: ExportClientProps) {
    const handlePrint = () => window.print()

    const periodSet = useMemo(() => new Set(periodEntries.map(p => p.date)), [periodEntries])
    const periodFlowMap = useMemo(() => {
        const map = new Map<string, string>()
        periodEntries.forEach(p => map.set(p.date, p.flow_intensity))
        return map
    }, [periodEntries])

    // All ovulation dates as a set for quick lookup
    const ovulationDates = useMemo(() => new Set(ovulations.map(o => o.ovulationDate).filter(Boolean) as string[]), [ovulations])

    // Use cover line from the most recent ovulation that has one
    const coverLine = useMemo(() => {
        for (let i = ovulations.length - 1; i >= 0; i--) {
            if (ovulations[i].coverLineTemp) return ovulations[i].coverLineTemp
        }
        return null
    }, [ovulations])

    // Chart dimensions
    const width = 760
    const height = 300
    const padding = { top: 25, right: 25, bottom: 40, left: 50 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const temps = entries.map(e => Number(e.temperature))
    const minTemp = temps.length > 0 ? Math.floor(Math.min(...temps) * 10) / 10 - 0.1 : 36.0
    const maxTemp = temps.length > 0 ? Math.ceil(Math.max(...temps) * 10) / 10 + 0.1 : 37.5

    const xScale = (i: number) => padding.left + (i / Math.max(entries.length - 1, 1)) * chartW
    const yScale = (temp: number) => padding.top + chartH - ((temp - minTemp) / (maxTemp - minTemp)) * chartH

    const yTicks: number[] = []
    for (let t = minTemp; t <= maxTemp; t += 0.1) {
        yTicks.push(Math.round(t * 10) / 10)
    }

    const labelEvery = entries.length <= 20 ? 2 : entries.length <= 40 ? 3 : entries.length <= 60 ? 5 : 7

    const pathData = useMemo(() => {
        if (entries.length < 2) return ''
        return entries.map((e, i) =>
            `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(Number(e.temperature))}`
        ).join(' ')
    }, [entries])

    const dateRange = entries.length > 0
        ? `${format(parseISO(entries[0].date), 'd. MMMM yyyy', { locale: de })} – ${format(parseISO(entries[entries.length - 1].date), 'd. MMMM yyyy', { locale: de })}`
        : 'Keine Daten'

    return (
        <>
            {/* Actions Bar */}
            <div className="flex items-center justify-between no-print">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                        Zykluskurve exportieren
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Drucke oder speichere als PDF für deinen Frauenarzt.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
                            boxShadow: '0 4px 16px rgba(232, 120, 138, 0.3)',
                        }}
                    >
                        <Printer className="h-4 w-4" />
                        Drucken / Als PDF speichern
                    </button>
                </div>
            </div>

            {/* ==================== PRINTABLE DOCUMENT ==================== */}
            <div className="print-area bg-white" style={{
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
            }}>
                {/* Document Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #E8788A 0%, #D4566A 100%)',
                    padding: '24px 32px',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                                Basaltemperaturkurve
                            </h2>
                            <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>
                                {dateRange}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '11px', opacity: 0.75 }}>
                            <div>Erstellt: {format(new Date(), 'd. MMMM yyyy', { locale: de })}</div>
                            <div style={{ marginTop: '2px' }}>basaltemperatur.online</div>
                        </div>
                    </div>
                </div>

                {entries.length > 0 ? (
                    <div style={{ padding: '24px 32px' }}>
                        {/* Summary Stats */}
                        <div style={{
                            display: 'flex',
                            gap: '24px',
                            marginBottom: '20px',
                            flexWrap: 'wrap',
                        }}>
                            <StatBox label="Einträge" value={`${entries.length}`} />
                            <StatBox label="⌀ Temperatur" value={`${(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2)}°C`} />
                            {coverLine && <StatBox label="Hilfslinie" value={`${coverLine.toFixed(2)}°C`} />}
                            <StatBox
                                label={ovulationDates.size === 1 ? 'Eisprung erkannt' : 'Eisprünge erkannt'}
                                value={ovulationDates.size > 0
                                    ? ovulations
                                        .filter(o => o.ovulationDate)
                                        .map(o => format(parseISO(o.ovulationDate!), 'd. MMM', { locale: de }))
                                        .join(', ')
                                    : '–'
                                }
                            />
                            <StatBox label="Periode-Tage" value={`${periodEntries.length}`} />
                        </div>

                        {/* SVG Chart */}
                        <div style={{
                            border: '1px solid #f0f0f0',
                            borderRadius: '12px',
                            padding: '12px 8px 4px 8px',
                            marginBottom: '24px',
                            background: '#fafafa',
                        }}>
                            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', display: 'block' }}>
                                {/* Background grid */}
                                {yTicks.map(t => (
                                    <g key={t}>
                                        <line
                                            x1={padding.left} y1={yScale(t)}
                                            x2={width - padding.right} y2={yScale(t)}
                                            stroke={t === Math.round(t) ? '#e5e7eb' : '#f3f4f6'}
                                            strokeWidth={t === Math.round(t) ? 0.8 : 0.4}
                                        />
                                        <text x={padding.left - 8} y={yScale(t) + 3.5} textAnchor="end" fontSize="9" fill="#9ca3af" fontFamily="system-ui">
                                            {t.toFixed(1)}
                                        </text>
                                    </g>
                                ))}

                                {/* Period bands */}
                                {entries.map((e, i) => (
                                    periodSet.has(e.date) && (
                                        <rect
                                            key={`period-${i}`}
                                            x={xScale(i) - (chartW / entries.length) / 2}
                                            y={padding.top}
                                            width={Math.max(chartW / entries.length, 6)}
                                            height={chartH}
                                            fill="#E8788A"
                                            opacity={0.08}
                                        />
                                    )
                                ))}

                                {/* Cover line */}
                                {coverLine && (
                                    <g>
                                        <line
                                            x1={padding.left} y1={yScale(coverLine)}
                                            x2={width - padding.right} y2={yScale(coverLine)}
                                            stroke="#E8788A"
                                            strokeWidth={1}
                                            strokeDasharray="8,4"
                                            opacity={0.6}
                                        />
                                        <text
                                            x={width - padding.right + 2}
                                            y={yScale(coverLine) + 3}
                                            fontSize="8"
                                            fill="#E8788A"
                                            fontFamily="system-ui"
                                        >
                                            {coverLine.toFixed(2)}°
                                        </text>
                                    </g>
                                )}

                                {/* Temperature area fill */}
                                {entries.length > 1 && (
                                    <path
                                        d={`${pathData} L ${xScale(entries.length - 1)} ${yScale(minTemp)} L ${xScale(0)} ${yScale(minTemp)} Z`}
                                        fill="url(#tempGrad)"
                                        opacity={0.3}
                                    />
                                )}

                                <defs>
                                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#E8788A" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#E8788A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                {/* Temperature line */}
                                <path
                                    d={pathData}
                                    fill="none"
                                    stroke="#E8788A"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Data points */}
                                {entries.map((e, i) => {
                                    const isOvulation = ovulationDates.has(e.date)
                                    const isPeriod = periodSet.has(e.date)
                                    return (
                                        <g key={i}>
                                            <circle
                                                cx={xScale(i)}
                                                cy={yScale(Number(e.temperature))}
                                                r={isOvulation ? 5 : 3}
                                                fill={isOvulation ? '#8B5CF6' : isPeriod ? '#E8788A' : '#fff'}
                                                stroke={isOvulation ? '#8B5CF6' : '#E8788A'}
                                                strokeWidth={isOvulation ? 2 : 1.5}
                                            />
                                            {isOvulation && (
                                                <text
                                                    x={xScale(i)}
                                                    y={yScale(Number(e.temperature)) - 10}
                                                    textAnchor="middle"
                                                    fontSize="8"
                                                    fill="#8B5CF6"
                                                    fontWeight="600"
                                                    fontFamily="system-ui"
                                                >
                                                    Eisprung
                                                </text>
                                            )}
                                        </g>
                                    )
                                })}

                                {/* X-axis date labels */}
                                {entries.map((e, i) => (
                                    i % labelEvery === 0 && (
                                        <text
                                            key={`label-${i}`}
                                            x={xScale(i)}
                                            y={height - 12}
                                            textAnchor="middle"
                                            fontSize="8"
                                            fill="#9ca3af"
                                            fontFamily="system-ui"
                                        >
                                            {format(parseISO(e.date), 'd.M.')}
                                        </text>
                                    )
                                ))}

                                {/* Period indicators at bottom */}
                                {entries.map((e, i) => (
                                    periodSet.has(e.date) && (
                                        <circle
                                            key={`pdot-${i}`}
                                            cx={xScale(i)}
                                            cy={height - 4}
                                            r={2.5}
                                            fill="#E8788A"
                                        />
                                    )
                                ))}
                            </svg>

                            {/* Chart Legend */}
                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                justifyContent: 'center',
                                padding: '8px 0 4px 0',
                                fontSize: '10px',
                                color: '#9ca3af',
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8788A', display: 'inline-block' }} />
                                    Temperatur
                                </span>
                                {coverLine && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ width: '16px', height: '0', borderTop: '1px dashed #E8788A', display: 'inline-block' }} />
                                        Hilfslinie ({coverLine.toFixed(2)}°C)
                                    </span>
                                )}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6', display: 'inline-block' }} />
                                    Eisprung ({ovulationDates.size})
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8788A', opacity: 0.3, display: 'inline-block' }} />
                                    Periode
                                </span>
                            </div>
                        </div>

                        {/* Data Table */}
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '11px',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ ...thStyle, textAlign: 'left' }}>Datum</th>
                                    <th style={{ ...thStyle, textAlign: 'left' }}>Tag</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Temp. (°C)</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Periode</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Zervixschleim</th>
                                    <th style={{ ...thStyle, textAlign: 'left' }}>Notizen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((e, i) => {
                                    const isPeriod = periodSet.has(e.date)
                                    const isOvulation = ovulationDates.has(e.date)
                                    const flow = periodFlowMap.get(e.date)
                                    return (
                                        <tr
                                            key={i}
                                            style={{
                                                borderBottom: '1px solid #f3f4f6',
                                                backgroundColor: isOvulation ? '#f5f3ff' : isPeriod ? '#fef2f4' : 'transparent',
                                            }}
                                        >
                                            <td style={{ ...tdStyle, fontWeight: 500, color: '#111827' }}>
                                                {format(parseISO(e.date), 'dd.MM.yyyy')}
                                            </td>
                                            <td style={{ ...tdStyle, color: '#6b7280' }}>
                                                {format(parseISO(e.date), 'EEE', { locale: de })}
                                            </td>
                                            <td style={{
                                                ...tdStyle,
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                fontVariantNumeric: 'tabular-nums',
                                                color: isOvulation ? '#7c3aed' : '#111827',
                                            }}>
                                                {Number(e.temperature).toFixed(2)}
                                                {isOvulation && ' ●'}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                {isPeriod ? (
                                                    <span style={{ color: '#E8788A' }}>
                                                        {flow === 'heavy' ? '●●●' : flow === 'medium' ? '●●' : flow === 'light' ? '●' : '·'}
                                                    </span>
                                                ) : '–'}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>
                                                {e.cervical_mucus ? mucusLabels[e.cervical_mucus] || e.cervical_mucus : '–'}
                                            </td>
                                            <td style={{ ...tdStyle, color: '#6b7280', maxWidth: '160px' }}>
                                                {e.notes || '–'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '48px 32px' }}>
                        <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📄</span>
                        <p style={{ color: '#9ca3af' }}>Noch keine Daten zum Exportieren.</p>
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    padding: '16px 32px',
                    borderTop: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    color: '#9ca3af',
                    background: '#fafafa',
                }}>
                    <span>
                        Erstellt am {format(new Date(), 'd. MMMM yyyy', { locale: de })} • basaltemperatur.online
                    </span>
                    <span>
                        Hinweis: Diese Kurve dient der Unterstützung des Arztgesprächs und ersetzt keine medizinische Diagnose.
                    </span>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { 
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-area { 
                        box-shadow: none !important; 
                        border: none !important;
                        border-radius: 0 !important;
                        margin: 0 !important;
                    }
                    nav, header, footer, .mobile-nav, .bottom-nav { display: none !important; }
                    main { padding: 0 !important; }
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                }
            `}</style>
        </>
    )
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            padding: '8px 14px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #f0f0f0',
        }}>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{value}</div>
        </div>
    )
}

const thStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontWeight: 600,
    color: '#6b7280',
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
    padding: '6px 10px',
}
