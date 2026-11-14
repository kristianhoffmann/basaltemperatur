// components/curve/CurveSheet.tsx
// A printable basal temperature sheet as plain SVG: grid, axis labels and the
// rows a paper chart usually carries (Datum, Messzeit, Periode, Störung).
// Server-safe (no hooks), so the empty template is part of the HTML and prints
// without JavaScript. With `values` it draws the typed readings as a curve.

import { formatCelsius, type Reading } from '@/lib/curve-sheet'

type Props = {
  days: number
  low: number
  high: number
  values?: Reading[]
  title: string
  id?: string
}

const LEFT = 64
const RIGHT = 12
const TOP = 16
const PLOT_HEIGHT = 330
const ROW_HEIGHT = 22
const ROWS = ['Datum', 'Messzeit', 'Periode', 'Störung']
const COLUMN = 18

export function CurveSheet({ days, low, high, values, title, id }: Props) {
  const width = LEFT + RIGHT + days * COLUMN
  const steps = Math.round((high - low) / 0.05)
  const stepHeight = PLOT_HEIGHT / steps
  const plotBottom = TOP + PLOT_HEIGHT
  const height = plotBottom + 26 + ROWS.length * ROW_HEIGHT + 8
  const x = (day: number) => LEFT + (day - 0.5) * COLUMN
  const y = (value: number) => TOP + ((high - value) / (high - low)) * PLOT_HEIGHT

  // Gaps stay gaps: a missing day breaks the line instead of bridging it.
  const segments: string[] = []
  let current: string[] = []
  ;(values ?? []).forEach((value, index) => {
    if (value === null) { if (current.length) segments.push(current.join(' ')); current = []; return }
    current.push(`${current.length ? 'L' : 'M'}${x(index + 1).toFixed(1)},${y(value).toFixed(1)}`)
  })
  if (current.length) segments.push(current.join(' '))

  return (
    <svg
      id={id}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title}
      className="h-auto w-full text-[var(--ink)]"
      preserveAspectRatio="xMinYMin meet"
    >
      <title>{title}</title>
      <rect x={0} y={0} width={width} height={height} fill="#fff" />
      {Array.from({ length: steps + 1 }, (_, index) => {
        const value = Math.round((high - index * 0.05) * 100) / 100
        const major = Math.round(value * 100) % 10 === 0
        return (
          <g key={`h${index}`}>
            <line x1={LEFT} x2={width - RIGHT} y1={TOP + index * stepHeight} y2={TOP + index * stepHeight}
              stroke={major ? '#B9AEA4' : '#E6DDD5'} strokeWidth={major ? 0.9 : 0.5} />
            {major && <text x={LEFT - 6} y={TOP + index * stepHeight + 3.5} fontSize={10} textAnchor="end" fill="currentColor">{formatCelsius(value, 1)}</text>}
          </g>
        )
      })}
      {Array.from({ length: days + 1 }, (_, index) => (
        <line key={`v${index}`} x1={LEFT + index * COLUMN} x2={LEFT + index * COLUMN} y1={TOP} y2={plotBottom + ROWS.length * ROW_HEIGHT + 26}
          stroke={index % 7 === 0 ? '#B9AEA4' : '#E6DDD5'} strokeWidth={index % 7 === 0 ? 0.9 : 0.5} />
      ))}
      <text x={6} y={TOP + 10} fontSize={10} fill="currentColor">°C</text>
      {Array.from({ length: days }, (_, index) => (
        <text key={`d${index}`} x={x(index + 1)} y={plotBottom + 16} fontSize={9} textAnchor="middle" fill="currentColor">{index + 1}</text>
      ))}
      <text x={6} y={plotBottom + 16} fontSize={9} fill="currentColor">Zyklustag</text>
      {ROWS.map((label, row) => {
        const top = plotBottom + 26 + row * ROW_HEIGHT
        return (
          <g key={label}>
            <line x1={0} x2={width - RIGHT} y1={top} y2={top} stroke="#B9AEA4" strokeWidth={0.8} />
            <text x={6} y={top + 15} fontSize={10} fill="currentColor">{label}</text>
          </g>
        )
      })}
      <line x1={0} x2={width - RIGHT} y1={plotBottom + 26 + ROWS.length * ROW_HEIGHT} y2={plotBottom + 26 + ROWS.length * ROW_HEIGHT} stroke="#B9AEA4" strokeWidth={0.8} />
      {segments.map((path, index) => <path key={`s${index}`} d={path} fill="none" stroke="#1B1233" strokeWidth={1.6} strokeLinejoin="round" />)}
      {(values ?? []).map((value, index) => value === null ? null : (
        <circle key={`p${index}`} cx={x(index + 1)} cy={y(value)} r={3} fill="#FF9E8F" stroke="#1B1233" strokeWidth={1}>
          <title>{`Tag ${index + 1}: ${formatCelsius(value)} °C`}</title>
        </circle>
      ))}
    </svg>
  )
}
