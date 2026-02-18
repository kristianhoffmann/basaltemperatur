// app/(dashboard)/dashboard/page.tsx
// Dashboard – Hauptseite mit KPIs und Temperaturkurve – 2026 Modern Design

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemperatureChart } from '@/components/features/TemperatureChart'
import { detectOvulation, predictNextPeriod, predictNextOvulation, getFertilityWindow, getFertilityStatus } from '@/lib/ovulation'
import { format, differenceInDays, parseISO, startOfDay } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Thermometer,
  CalendarHeart,
  Sparkles,
  TrendingUp,
  PlusCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 365)
  const startDateStr = format(startDate, 'yyyy-MM-dd')

  const [tempResult, periodResult, profileResult] = await Promise.all([
    supabase
      .from('temperature_entries')
      .select('date, temperature, notes')
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

  const entries = (tempResult.data || []) as { date: string; temperature: number; notes: string | null }[]
  const periodEntries = (periodResult.data || []) as { date: string; flow_intensity: 'light' | 'medium' | 'heavy' | 'spotting' }[]
  const profile = profileResult.data as Profile | null
  const cycleLength = profile?.cycle_length_default || 28

  const periodDates = periodEntries.map(p => p.date).sort()
  let lastPeriodStart: string | null = null
  if (periodDates.length > 0) {
    lastPeriodStart = periodDates[periodDates.length - 1]
    for (let i = periodDates.length - 2; i >= 0; i--) {
      const diff = differenceInDays(parseISO(periodDates[i + 1]), parseISO(periodDates[i]))
      if (diff <= 1) {
        lastPeriodStart = periodDates[i]
      } else {
        break
      }
    }
  }

  const currentCycleEntries = lastPeriodStart
    ? entries.filter(e => e.date >= lastPeriodStart)
    : entries
  const ovulation = detectOvulation(currentCycleEntries)

  const cycleDay = lastPeriodStart
    ? differenceInDays(new Date(), parseISO(lastPeriodStart)) + 1
    : null

  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null

  const nextPeriod = lastPeriodStart ? predictNextPeriod(lastPeriodStart, cycleLength) : null
  const nextOvulation = lastPeriodStart ? predictNextOvulation(lastPeriodStart, cycleLength) : null
  const today = startOfDay(new Date())
  const daysUntilPeriod = nextPeriod ? differenceInDays(parseISO(nextPeriod), today) : null
  const daysUntilOvulation = nextOvulation ? differenceInDays(parseISO(nextOvulation), today) : null

  const fertilityWindow = lastPeriodStart ? getFertilityWindow(lastPeriodStart, cycleLength) : null
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const fertilityStatus = getFertilityStatus(todayStr, fertilityWindow)

  const kpiCards = [
    {
      icon: CalendarHeart,
      label: 'Zyklustag',
      value: cycleDay ? `Tag ${cycleDay}` : '–',
      subtitle: cycleDay ? `von ~${cycleLength}` : 'Keine Periode markiert',
      iconClass: 'kpi-icon-rose',
    },
    {
      icon: Thermometer,
      label: 'Letzte Temperatur',
      value: lastEntry ? `${Number(lastEntry.temperature).toFixed(2)}°` : '–',
      subtitle: lastEntry ? format(parseISO(lastEntry.date), 'd. MMM', { locale: de }) : 'Noch kein Eintrag',
      iconClass: 'kpi-icon-rose',
    },
    {
      icon: Sparkles,
      label: 'Eisprung',
      value: ovulation.ovulationDate
        ? 'Erkannt ✓'
        : daysUntilOvulation !== null && daysUntilOvulation > 0
          ? `~${daysUntilOvulation}d`
          : '–',
      subtitle: ovulation.ovulationDate
        ? format(parseISO(ovulation.ovulationDate), 'd. MMM', { locale: de })
        : daysUntilOvulation !== null && daysUntilOvulation > 0 && nextOvulation
          ? format(parseISO(nextOvulation), 'd. MMM', { locale: de })
          : 'Nicht genug Daten',
      iconClass: 'kpi-icon-violet',
    },
    {
      icon: TrendingUp,
      label: 'Nächste Periode',
      value: daysUntilPeriod !== null && daysUntilPeriod > 0 ? `~${daysUntilPeriod}d` : '–',
      subtitle: daysUntilPeriod !== null && daysUntilPeriod > 0 && nextPeriod
        ? format(parseISO(nextPeriod), 'd. MMM', { locale: de })
        : 'Nicht genug Daten',
      iconClass: 'kpi-icon-period',
    },
  ]

  return (
    <div className="space-y-5 pb-8 pt-4">
      {/* Fertility Status Banner */}
      {fertilityStatus !== 'infertile' && (
        <div
          className="card animate-fade-in"
          style={{
            background: fertilityStatus === 'peak'
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.03))'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.03))',
            border: `1px solid ${fertilityStatus === 'peak' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
          }}
        >
          <div className="text-center">
            <span className="text-2xl">
              {fertilityStatus === 'peak' ? '⚡' : '🔥'}
            </span>
            <p className="font-bold text-sm mt-1.5" style={{ color: fertilityStatus === 'peak' ? '#b45309' : '#047857' }}>
              {fertilityStatus === 'peak' ? 'Höchste Fruchtbarkeit' : 'Fruchtbares Fenster'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: fertilityStatus === 'peak' ? '#92400e' : '#065f46' }}>
              {fertilityStatus === 'peak'
                ? 'Eisprung steht unmittelbar bevor'
                : 'Du befindest dich im fruchtbaren Fenster'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in animate-stagger-1">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-[-0.03em]">
            Hallo! 👋
          </h1>
          <p className="text-sm mt-0.5 text-[var(--text-muted)]">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>
        <Link href="/eintrag">
          <button className="btn btn-glow btn-sm">
            <PlusCircle className="h-4 w-4" />
            Neuer Eintrag
          </button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={kpi.label} className={`kpi-card animate-fade-in animate-stagger-${i + 2}`}>
            <div className={`kpi-icon ${kpi.iconClass}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div className="kpi-value">
              {kpi.value}
            </div>
            <p className="kpi-label mt-3">
              {kpi.label}
            </p>
            <p className="kpi-subtitle">
              {kpi.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Temperature Chart */}
      <div className="animate-fade-in animate-stagger-5">
        <TemperatureChart entries={entries} periodEntries={periodEntries} />
      </div>

      {/* Quick Entry Prompt */}
      {!entries.find(e => e.date === format(new Date(), 'yyyy-MM-dd')) && (
        <div className="card text-center animate-fade-in animate-stagger-6 py-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-400/10 to-violet-400/10 flex items-center justify-center">
            <Thermometer className="h-7 w-7 text-[var(--rose)]" />
          </div>
          <p className="text-sm mb-5 text-[var(--text-secondary)]">
            Du hast heute noch keine Temperatur eingetragen.
          </p>
          <Link href="/eintrag">
            <button className="btn btn-glow">
              <PlusCircle className="h-4 w-4" />
              Jetzt eintragen
            </button>
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center pb-8 pt-4 px-4">
        <p className="text-xs text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
          <strong>Hinweis:</strong> Die Eisprung-Erkennung und Zyklusberechnungen basieren auf statistischen Methoden (NFP / 3-über-6-Regel) und deinen Eingaben.
          Es handelt sich um Schätzungen, die von deinem tatsächlichen Zyklus abweichen können.
          Diese App dient <u>nicht</u> zur Verhütung und ersetzt keinen ärztlichen Rat.
        </p>
      </div>
    </div>
  )
}
