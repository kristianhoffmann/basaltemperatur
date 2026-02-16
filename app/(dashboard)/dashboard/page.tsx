// app/(dashboard)/dashboard/page.tsx
// Dashboard – Hauptseite mit KPIs und Temperaturkurve

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
  const startDateStr = startDate.toISOString().split('T')[0]

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

  // Nur Einträge des aktuellen Zyklus für Eisprung-Erkennung verwenden
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

  // Fruchtbarkeitsfenster
  const fertilityWindow = lastPeriodStart ? getFertilityWindow(lastPeriodStart, cycleLength) : null
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const fertilityStatus = getFertilityStatus(todayStr, fertilityWindow)

  const kpiCards = [
    {
      icon: CalendarHeart,
      label: 'Zyklustag',
      value: cycleDay ? `Tag ${cycleDay}` : '–',
      subtitle: cycleDay ? `von ~${cycleLength}` : 'Keine Periode markiert',
      iconColor: 'text-rose-400',
    },
    {
      icon: Thermometer,
      label: 'Letzte Temperatur',
      value: lastEntry ? `${Number(lastEntry.temperature).toFixed(2)}°` : '–',
      subtitle: lastEntry ? format(parseISO(lastEntry.date), 'd. MMM', { locale: de }) : 'Noch kein Eintrag',
      iconColor: 'text-rose-400',
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
      iconColor: 'text-violet-400',
    },
    {
      icon: TrendingUp,
      label: 'Nächste Periode',
      value: daysUntilPeriod !== null && daysUntilPeriod > 0 ? `~${daysUntilPeriod}d` : '–',
      subtitle: daysUntilPeriod !== null && daysUntilPeriod > 0 && nextPeriod
        ? format(parseISO(nextPeriod), 'd. MMM', { locale: de })
        : 'Nicht genug Daten',
      iconColor: 'text-period-400',
    },
  ]

  return (
    <div className="space-y-5 pb-8 pt-4 animate-fade-in">
      {/* Fertility Status Banner */}
      {fertilityStatus !== 'infertile' && (
        <div
          className="rounded-2xl p-4 text-center animate-fade-in"
          style={{
            background: fertilityStatus === 'peak'
              ? 'linear-gradient(135deg, #f59e0b20, #f59e0b10)'
              : 'linear-gradient(135deg, #10b98120, #10b98110)',
            border: `1px solid ${fertilityStatus === 'peak' ? '#f59e0b40' : '#10b98140'}`,
          }}
        >
          <span className="text-lg">
            {fertilityStatus === 'peak' ? '⚡' : '🔥'}
          </span>
          <p className="font-semibold text-sm mt-1" style={{ color: fertilityStatus === 'peak' ? '#b45309' : '#047857' }}>
            {fertilityStatus === 'peak' ? 'Höchste Fruchtbarkeit' : 'Fruchtbares Fenster'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: fertilityStatus === 'peak' ? '#92400e' : '#065f46' }}>
            {fertilityStatus === 'peak'
              ? 'Eisprung steht unmittelbar bevor'
              : 'Du befindest dich im fruchtbaren Fenster'}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">
            Hallo! 👋
          </h1>
          <p className="text-sm mt-0.5 text-[var(--text-muted)]">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>
        <Link href="/eintrag">
          <button
            className="inline-flex items-center justify-center gap-2 font-medium text-sm text-white rounded-2xl px-4 py-2 transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
              boxShadow: '0 4px 16px rgba(232, 120, 138, 0.3)',
            }}
          >
            <PlusCircle className="h-4 w-4" />
            Eintrag
          </button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <kpi.icon className={`h-3.5 w-3.5 ${kpi.iconColor}`} />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {kpi.label}
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-[var(--text)]">
              {kpi.value}
            </div>
            <p className="text-[11px] mt-1 text-[var(--text-muted)]">
              {kpi.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Temperature Chart */}
      <TemperatureChart entries={entries} periodEntries={periodEntries} />

      {/* Quick Entry Prompt */}
      {!entries.find(e => e.date === format(new Date(), 'yyyy-MM-dd')) && (
        <div className="card p-6 text-center">
          <Thermometer className="h-8 w-8 mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm mb-4 text-[var(--text-secondary)]">
            Du hast heute noch keine Temperatur eingetragen.
          </p>
          <Link href="/eintrag">
            <button
              className="inline-flex items-center justify-center gap-2 font-medium text-sm text-white rounded-2xl px-5 py-2.5 transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
                boxShadow: '0 4px 16px rgba(232, 120, 138, 0.3)',
              }}
            >
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
