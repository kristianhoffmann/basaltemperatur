'use client'

// Hero of the start page. The whole stage is one thermometer: move today's value
// and the field shifts from cool (low reading) to warm (high reading) while the
// curve follows. Example data only — nothing here is stored or sent anywhere.
//
// The headline is passed in as server-rendered children and animated in CSS, so
// the text is visible without waiting for this component to hydrate.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  MotionConfig,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { EXAMPLE_GUIDE_LINE, EXAMPLE_RISE_INDEX, EXAMPLE_TEMPS, formatTemp } from './example-cycle'

const MIN = 36.2
const MAX = 37.0
const STEP = 0.05
const LAST = EXAMPLE_TEMPS.length - 1

export function HeroStage({ headline, children }: { headline: ReactNode; children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)
  const [today, setToday] = useState(EXAMPLE_TEMPS[LAST])
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const element = wrapRef.current
    if (!element) return
    const update = () => setWidth(Math.max(320, element.clientWidth))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const compact = width < 640
  const height = compact ? 220 : 300
  const pad = { left: compact ? 34 : 56, right: compact ? 14 : 40, top: 26, bottom: 34 }

  const geometry = useMemo(() => {
    const x = (index: number) => pad.left + (index * (width - pad.left - pad.right)) / LAST
    const y = (temp: number) => pad.top + ((MAX - temp) / (MAX - MIN)) * (height - pad.top - pad.bottom)
    const path = (temps: number[]) =>
      temps.map((temp, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(temp).toFixed(1)}`).join(' ')
    return { x, y, path }
  }, [width, height, pad.left, pad.right, pad.top, pad.bottom])

  // One motion value drives everything that reacts to today's reading.
  const temp = useMotionValue(EXAMPLE_TEMPS[LAST])
  const eased = useSpring(temp, { stiffness: 170, damping: 22, mass: 0.7 })
  useEffect(() => {
    temp.set(today)
  }, [today, temp])

  const field = useTransform(eased, [MIN, 36.55, MAX], ['#C9D4FF', '#FFD9D2', '#FF9E8F'])
  const sunY = useTransform(eased, [MIN, MAX], ['38%', '-6%'])
  const sunOpacity = useTransform(eased, [MIN, 36.5, MAX], [0.25, 0.7, 1])
  const readout = useTransform(eased, (value) => formatTemp(value, 2))
  const linePath = useTransform(eased, (value) => geometry.path([...EXAMPLE_TEMPS.slice(0, LAST), value]))
  const todayY = useTransform(eased, (value) => geometry.y(value))

  const delta = today - EXAMPLE_GUIDE_LINE
  const relation =
    Math.abs(delta) < 0.005
      ? 'genau auf der Hilfslinie'
      : `${formatTemp(Math.abs(delta), 2)} °C ${delta > 0 ? 'über' : 'unter'} der Hilfslinie`

  const dayStep = geometry.x(1) - geometry.x(0)
  const hoverTemp = hover === null ? null : hover === LAST ? today : EXAMPLE_TEMPS[hover]

  return (
    <MotionConfig reducedMotion="user">
      <section className="relative isolate overflow-hidden">
        <motion.div aria-hidden className="absolute inset-0 -z-20" style={{ backgroundColor: field }} />
        {/* The "sun": rises as the reading gets warmer. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-[18%] bottom-0 -z-10 aspect-square w-[78%] rounded-full sm:w-[58%]"
          style={{
            y: sunY,
            opacity: sunOpacity,
            background: 'radial-gradient(circle at 50% 50%, #FFF3D6 0%, rgba(255,201,150,0.85) 34%, rgba(255,158,143,0) 70%)',
          }}
        />

        <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">{headline}</div>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-4 pt-8 sm:px-6 lg:grid-cols-[1fr_minmax(0,25rem)] lg:items-end lg:gap-16 lg:px-8 lg:pt-8">
          <div>{children}</div>

          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[28px] bg-white/75 p-5 shadow-strong ring-1 ring-white/70 backdrop-blur-md sm:p-6"
          >
            <div className="flex items-baseline justify-between text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text)]">Heute, Zyklustag 28</span>
              <span>Beispiel</span>
            </div>
            <p className="font-display mt-3 flex items-start text-[4.6rem] tabular-nums text-[var(--text)] sm:text-[5.5rem]">
              <motion.span>{readout}</motion.span>
              <span className="ml-1 mt-2 text-3xl sm:text-4xl">°C</span>
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]" aria-live="polite">{relation}</p>

            <label htmlFor="hero-temp" className="mt-5 block text-sm font-semibold text-[var(--text)]">
              Probier es aus: Wert für heute verschieben
            </label>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                aria-label="Wert um 0,05 Grad senken"
                onClick={() => setToday((value) => Math.max(MIN, Math.round((value - STEP) * 100) / 100))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl font-semibold text-[var(--text)] shadow-soft ring-1 ring-black/5 transition-transform active:scale-90"
              >
                −
              </button>
              <input
                id="hero-temp"
                type="range"
                min={MIN}
                max={MAX}
                step={STEP}
                value={today}
                onChange={(event) => setToday(Number(event.target.value))}
                aria-valuetext={`${formatTemp(today, 2)} Grad Celsius`}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--ink)]/15 accent-[var(--ink)]"
              />
              <button
                type="button"
                aria-label="Wert um 0,05 Grad erhöhen"
                onClick={() => setToday((value) => Math.min(MAX, Math.round((value + STEP) * 100) / 100))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl font-semibold text-[var(--text)] shadow-soft ring-1 ring-black/5 transition-transform active:scale-90"
              >
                +
              </button>
            </div>
          </motion.div>
        </div>

        {/* Full-bleed curve */}
        <div ref={wrapRef} className="relative mx-auto max-w-[1500px]">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block w-full touch-pan-y select-none"
            role="img"
            aria-label={`Beispiel einer Temperaturkurve über 28 Tage: fünf Periodentage, Tieflage um 36,4 Grad, Anstieg an Tag 16, Hochlage um 36,8 Grad. Hilfslinie bei ${formatTemp(EXAMPLE_GUIDE_LINE, 2)} Grad. Der Wert für heute beträgt ${formatTemp(today, 2)} Grad.`}
            onPointerMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect()
              const ratio = (event.clientX - box.left - (pad.left * box.width) / width) / (((width - pad.left - pad.right) * box.width) / width)
              setHover(Math.min(LAST, Math.max(0, Math.round(ratio * LAST))))
            }}
            onPointerLeave={() => setHover(null)}
          >
            {/* Period */}
            <motion.rect
              x={geometry.x(0) - dayStep / 2}
              y={pad.top}
              width={dayStep * 5}
              height={height - pad.top - pad.bottom}
              rx={14}
              fill="#fff"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.42 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            <text x={geometry.x(2)} y={pad.top + 20} textAnchor="middle" fontSize={compact ? 11 : 13} fontWeight={700} fill="#C8324A">
              Periode
            </text>

            {[36.2, 36.4, 36.6, 36.8, 37.0].map((tick) => (
              <g key={tick}>
                <line x1={pad.left} x2={width - pad.right} y1={geometry.y(tick)} y2={geometry.y(tick)} stroke="#1B1233" strokeOpacity={0.09} />
                <text x={pad.left - 10} y={geometry.y(tick) + 4} textAnchor="end" fontSize={compact ? 10 : 12} fill="#1B1233" fillOpacity={0.6}>
                  {formatTemp(tick, 1)}
                </text>
              </g>
            ))}
            {[1, 7, 14, 21, 28].map((day) => (
              <text key={day} x={geometry.x(day - 1)} y={height - 10} textAnchor="middle" fontSize={compact ? 10 : 12} fill="#1B1233" fillOpacity={0.6}>
                {day}
              </text>
            ))}

            {/* Guide line sweeps in once the low phase is drawn */}
            <motion.line
              x1={pad.left}
              x2={width - pad.right}
              y1={geometry.y(EXAMPLE_GUIDE_LINE)}
              y2={geometry.y(EXAMPLE_GUIDE_LINE)}
              stroke="#1B1233"
              strokeWidth={2}
              strokeDasharray="2 9"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.75 }}
              transition={{ duration: 1.1, delay: 1.9, ease: 'easeOut' }}
            />
            <motion.text
              x={width - pad.right}
              y={geometry.y(EXAMPLE_GUIDE_LINE) + (compact ? 16 : 20)}
              textAnchor="end"
              fontSize={compact ? 11 : 13}
              fontWeight={700}
              fill="#1B1233"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 2.8 }}
            >
              Hilfslinie {formatTemp(EXAMPLE_GUIDE_LINE, 2)} °C
            </motion.text>

            {/* The curve draws itself */}
            <motion.path
              d={linePath}
              fill="none"
              stroke="#1B1233"
              strokeWidth={compact ? 3 : 4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.2, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
            />

            {EXAMPLE_TEMPS.slice(0, LAST).map((value, index) => {
              const isRise = index === EXAMPLE_RISE_INDEX
              return (
                <motion.circle
                  key={index}
                  cx={geometry.x(index)}
                  cy={geometry.y(value)}
                  r={isRise ? (compact ? 6 : 8) : compact ? 3.5 : 5}
                  fill={isRise ? '#1B1233' : '#fff'}
                  stroke="#1B1233"
                  strokeWidth={compact ? 2 : 2.5}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: hover === index ? 1.6 : 1 }}
                  transition={hover === null ? { type: 'spring', stiffness: 420, damping: 16, delay: 0.7 + index * 0.075 } : { type: 'spring', stiffness: 420, damping: 18 }}
                />
              )
            })}
            <motion.text
              x={geometry.x(EXAMPLE_RISE_INDEX) - (compact ? 10 : 14)}
              y={geometry.y(EXAMPLE_TEMPS[EXAMPLE_RISE_INDEX]) - 4}
              textAnchor="end"
              fontSize={compact ? 11 : 14}
              fontWeight={700}
              fill="#1B1233"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.3, duration: 0.5 }}
            >
              Anstieg
            </motion.text>

            {/* Today's reading: follows the slider */}
            <motion.circle
              cx={geometry.x(LAST)}
              cy={todayY}
              r={compact ? 16 : 22}
              fill="#CC3026"
              fillOpacity={0.18}
              animate={{ scale: [1, 1.45, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
            <motion.circle
              cx={geometry.x(LAST)}
              cy={todayY}
              r={compact ? 7 : 9}
              fill="#CC3026"
              stroke="#fff"
              strokeWidth={3}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 2.9 }}
            />

            {hover !== null && hoverTemp !== null && (
              <g pointerEvents="none">
                <line x1={geometry.x(hover)} x2={geometry.x(hover)} y1={pad.top} y2={height - pad.bottom} stroke="#1B1233" strokeOpacity={0.35} strokeDasharray="3 5" />
                <g transform={`translate(${Math.min(width - 150, Math.max(8, geometry.x(hover) - 70))}, 2)`}>
                  <rect width={140} height={24} rx={12} fill="#1B1233" />
                  <text x={70} y={16.5} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">
                    Tag {hover + 1}: {formatTemp(hoverTemp, 2)} °C
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>
      </section>
    </MotionConfig>
  )
}
