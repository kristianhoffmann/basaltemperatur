'use client'

// Scroll story: one example cycle builds up day by day while the three steps
// scroll past. The text is plain HTML and never depends on this animation; the
// chart is an illustration of it (aria-hidden).

import { useRef, useState, type ReactNode } from 'react'
import { MotionConfig, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { EXAMPLE_GUIDE_LINE, EXAMPLE_PERIOD_DAYS, EXAMPLE_RISE_INDEX, EXAMPLE_TEMPS, formatTemp } from './example-cycle'

const W = 560
const H = 360
const PAD = { left: 44, right: 20, top: 26, bottom: 36 }
const MIN = 36.2
const MAX = 37.0
const N = EXAMPLE_TEMPS.length
const x = (index: number) => PAD.left + (index * (W - PAD.left - PAD.right)) / (N - 1)
const y = (temp: number) => PAD.top + ((MAX - temp) / (MAX - MIN)) * (H - PAD.top - PAD.bottom)
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export type StoryStep = { label: string; title: string; body: ReactNode }

export function CycleStory({ steps }: { steps: StoryStep[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.6'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })

  // Days appear over the first half of the section (steps one and two).
  const [days, setDays] = useState(0)
  useMotionValueEvent(progress, 'change', (value) => {
    const next = Math.max(0, Math.min(N, Math.round((value / 0.5) * N)))
    setDays((current) => (current === next ? current : next))
  })

  const guide = useTransform(progress, [0.54, 0.66], [0, 1])
  const riseOpacity = useTransform(progress, [0.64, 0.72], [0, 1])
  const statsOpacity = useTransform(progress, [0.7, 0.8], [0, 1])
  const statsY = useTransform(progress, [0.7, 0.8], [18, 0])
  const pdfOpacity = useTransform(progress, [0.8, 0.9], [0, 1])
  const pdfY = useTransform(progress, [0.8, 0.9], [18, 0])
  const dayLabel = useTransform(progress, (value) => `Tag ${Math.max(1, Math.min(N, Math.round((value / 0.5) * N)))}`)

  const shown = EXAMPLE_TEMPS.slice(0, days)
  const path = shown.map((temp, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(temp).toFixed(1)}`).join(' ')
  const last = shown.length ? shown[shown.length - 1] : null
  const dayStep = x(1) - x(0)

  return (
    <MotionConfig reducedMotion="user">
      <div ref={ref} className="mx-auto grid max-w-6xl gap-x-16 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        {/* Sticky chart */}
        <div className="sticky top-[6.25rem] z-10 -mx-4 self-start bg-[var(--ink)] px-4 pb-4 pt-2 sm:-mx-6 sm:px-6 lg:top-24 lg:mx-0 lg:px-0 lg:pb-0 lg:pt-0" aria-hidden>
          <div className="relative overflow-hidden rounded-[26px] bg-[#241A45] p-4 ring-1 ring-white/10 sm:p-6">
            <div className="flex items-baseline justify-between text-sm">
              <motion.span className="font-display text-2xl text-white">{dayLabel}</motion.span>
              <span className="text-white/60">
                {last === null ? 'noch kein Eintrag' : `${formatTemp(last)} °C`}
              </span>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block h-auto w-full">
              <defs>
                {/* Colour is temperature: cool at the bottom, warm at the top. */}
                <linearGradient id="thermo" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={y(MIN)} y2={y(MAX)}>
                  <stop offset="0%" stopColor="#8FA2FF" />
                  <stop offset="45%" stopColor="#C9D4FF" />
                  <stop offset="62%" stopColor="#FFB7AC" />
                  <stop offset="100%" stopColor="#FF7A6B" />
                </linearGradient>
              </defs>

              <motion.rect
                x={x(0) - dayStep / 2}
                y={PAD.top}
                height={H - PAD.top - PAD.bottom}
                rx={10}
                fill="#C8324A"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: dayStep * Math.min(days, EXAMPLE_PERIOD_DAYS), opacity: days > 0 ? 0.32 : 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              />

              {[36.2, 36.4, 36.6, 36.8, 37.0].map((tick) => (
                <g key={tick}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="#fff" strokeOpacity={0.08} />
                  <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize={11} fill="#fff" fillOpacity={0.5}>{formatTemp(tick, 1)}</text>
                </g>
              ))}
              {[1, 7, 14, 21, 28].map((day) => (
                <text key={day} x={x(day - 1)} y={H - 12} textAnchor="middle" fontSize={11} fill="#fff" fillOpacity={0.5}>{day}</text>
              ))}

              <motion.line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(EXAMPLE_GUIDE_LINE)}
                y2={y(EXAMPLE_GUIDE_LINE)}
                stroke="#FFC24B"
                strokeWidth={2}
                strokeDasharray="2 8"
                strokeLinecap="round"
                style={{ pathLength: guide, opacity: guide }}
              />
              <motion.text x={W - PAD.right} y={y(EXAMPLE_GUIDE_LINE) + 18} textAnchor="end" fontSize={12} fontWeight={700} fill="#FFC24B" style={{ opacity: guide }}>
                Hilfslinie {formatTemp(EXAMPLE_GUIDE_LINE)} °C
              </motion.text>

              {path && <path d={path} fill="none" stroke="url(#thermo)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />}
              {shown.map((temp, index) => (
                <motion.circle
                  key={index}
                  cx={x(index)}
                  cy={y(temp)}
                  r={index === shown.length - 1 ? 7 : 4}
                  fill={index === shown.length - 1 ? '#fff' : '#241A45'}
                  stroke="url(#thermo)"
                  strokeWidth={2.5}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                />
              ))}

              <motion.g style={{ opacity: riseOpacity }}>
                <circle cx={x(EXAMPLE_RISE_INDEX)} cy={y(EXAMPLE_TEMPS[EXAMPLE_RISE_INDEX])} r={13} fill="none" stroke="#fff" strokeWidth={2} />
                <text x={x(EXAMPLE_RISE_INDEX) - 20} y={y(EXAMPLE_TEMPS[EXAMPLE_RISE_INDEX]) + 4} textAnchor="end" fontSize={13} fontWeight={700} fill="#fff">Anstieg</text>
              </motion.g>
            </svg>

            {/* Mini calendar: fills with the same days */}
            <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5">
              {WEEKDAYS.map((day) => (
                <span key={day} className="hidden text-center text-[10px] text-white/45 sm:block">{day}</span>
              ))}
              {Array.from({ length: N }, (_, index) => {
                const filled = index < days
                const period = filled && index < EXAMPLE_PERIOD_DAYS
                return (
                  <span
                    key={index}
                    className={`flex h-5 items-center justify-center rounded-md text-[10px] tabular-nums transition-colors duration-300 sm:h-7 sm:text-xs ${
                      period ? 'bg-[#C8324A] font-semibold text-white' : filled ? 'bg-white/15 text-white' : 'bg-white/[0.04] text-white/30'
                    }`}
                  >
                    {index + 1}
                  </span>
                )
              })}
            </div>

            <motion.dl style={{ opacity: statsOpacity, y: statsY }} className="mt-4 hidden grid-cols-3 gap-2 text-center sm:grid">
              {[
                ['Ø Zykluslänge', '29 Tage'],
                ['Hochlage', '+0,39 °C'],
                ['Nächste Periode', 'um den 1. Dez.'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white/[0.07] px-2 py-2.5">
                  <dt className="text-[11px] text-white/55">{label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{value}</dd>
                </div>
              ))}
            </motion.dl>

            <motion.div
              style={{ opacity: pdfOpacity, y: pdfY }}
              className="absolute right-4 top-14 hidden rotate-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-strong sm:block"
            >
              Kurve_Zyklus-4.pdf
            </motion.div>
          </div>
          <p className="mt-2 text-xs text-white/45">Erfundene Beispielwerte.</p>
        </div>

        {/* Steps: plain content, scrolls past the chart */}
        <ol className="relative z-0">
          {steps.map((step) => (
            <li key={step.title} className="flex min-h-[62vh] flex-col justify-center py-10 lg:min-h-[78vh]">
              <p className="text-sm font-semibold text-[#FF9E8F]">{step.label}</p>
              <h3 className="font-display mt-3 text-4xl text-white sm:text-5xl">{step.title}</h3>
              <div className="mt-5 max-w-md text-lg leading-relaxed text-white/75">{step.body}</div>
            </li>
          ))}
        </ol>
      </div>
    </MotionConfig>
  )
}
