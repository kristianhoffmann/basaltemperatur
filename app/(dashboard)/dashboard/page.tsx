// app/(dashboard)/dashboard/page.tsx
// Dashboard – Hauptseite mit KPIs und Temperaturkurve – 2026 Modern Design

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemperatureChart } from '@/components/features/TemperatureChart'
import { UpgradeBanner } from './UpgradeBanner'
import {
  detectOvulation,
  predictNextPeriod,
  getPredictionReadiness,
} from '@/lib/ovulation'
import { format, differenceInDays, parseISO, startOfDay } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Thermometer,
  CalendarHeart,
  Sparkles,
  TrendingUp,
  PlusCircle,
  BookOpenCheck,
} from 'lucide-react'
import Link from 'next/link'
import type { CervicalMucusType, Profile } from '@/types/database'

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
      .select('date, temperature, notes, cervical_mucus, disturbed, exclude_from_analysis')
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

  const entries = (tempResult.data || []) as { date: string; temperature: number; notes: string | null; cervical_mucus?: CervicalMucusType | null; disturbed?: boolean; exclude_from_analysis?: boolean }[]
  const periodEntries = (periodResult.data || []) as { date: string; flow_intensity: 'light' | 'medium' | 'heavy' | 'spotting' }[]
  const profile = profileResult.data as Profile | null
  const hasLifetimeAccess = Boolean(profile?.has_lifetime_access)
  const cycleLength = profile?.cycle_length_default || 28

  const cyclePeriodEntries = periodEntries.filter(p => p.flow_intensity !== 'spotting')
  const periodDates = cyclePeriodEntries.map(p => p.date).sort()
  const predictionReadiness = getPredictionReadiness(entries, periodEntries)
  const completedCycleCount = predictionReadiness.completedCycleCount
  const predictionBaselineReady = predictionReadiness.ready
  const primaryPredictionReason = predictionReadiness.reasons[0] || 'bereit'
  let lastPeriodStart: string | null = null
  if (periodDates.length > 0) {
    // Find cycle starts (first day after a gap of >3 days, consistent with ovulation.ts)
    const cycleStarts: string[] = [periodDates[0]]
    for (let i = 1; i < periodDates.length; i++) {
      const diff = differenceInDays(parseISO(periodDates[i]), parseISO(periodDates[i - 1]))
      if (diff > 3) {
        cycleStarts.push(periodDates[i])
      }
    }
    lastPeriodStart = cycleStarts[cycleStarts.length - 1]
  }

  const periodStart = lastPeriodStart // local const for type narrowing
  const currentCycleEntries = periodStart
    ? entries.filter(e => e.date >= periodStart)
    : entries
  const ovulation = detectOvulation(currentCycleEntries)

  const cycleDay = lastPeriodStart
    ? differenceInDays(new Date(), parseISO(lastPeriodStart)) + 1
    : null

  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null

  const nextPeriod = lastPeriodStart ? predictNextPeriod(lastPeriodStart, cycleLength) : null
  const today = startOfDay(new Date())
  const daysUntilPeriod = nextPeriod ? differenceInDays(parseISO(nextPeriod), today) : null

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
      label: 'Temperaturanstieg',
      // Retrospective only: shown once the entered values confirm a rise.
      value: ovulation.ovulationDate ? 'Bestätigt' : '–',
      subtitle: ovulation.ovulationDate
        ? `erste höhere Messung am ${format(parseISO(ovulation.ovulationDate), 'd. MMM', { locale: de })}`
        : 'in den letzten Werten nicht erkennbar',
      iconClass: 'kpi-icon-violet',
    },
    {
      icon: TrendingUp,
      label: 'Nächste Periode',
      value: daysUntilPeriod !== null && daysUntilPeriod > 0 ? `~${daysUntilPeriod}d` : '–',
      subtitle: daysUntilPeriod !== null && daysUntilPeriod > 0 && nextPeriod
        ? format(parseISO(nextPeriod), 'd. MMM', { locale: de })
        : primaryPredictionReason,
      iconClass: 'kpi-icon-period',
    },
  ]

  return (
    <div className="space-y-5 pb-8 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in animate-stagger-1">
        <div>
          <h1 className="font-display text-3xl text-[var(--text)]">
            Dein Tagebuch
          </h1>
          <p className="text-sm mt-0.5 text-[var(--text-muted)]">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>
        <Link href="/eintrag">
          <button className="btn btn-primary btn-sm">
            <PlusCircle className="h-4 w-4" />
            Neuer Eintrag
          </button>
        </Link>
      </div>

      <div className="card animate-fade-in animate-stagger-2">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-orange-100 text-orange-500">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text)]">Neu hier? Anleitung öffnen</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Kurze Schritt-für-Schritt Einführung für Einträge, Kalender, Prognosen und Premium-Funktionen.
            </p>
          </div>
          <Link href="/anleitung" className="shrink-0">
            <button className="btn btn-sm btn-secondary">Anleitung</button>
          </Link>
        </div>
      </div>

      {!hasLifetimeAccess ? (
        <>
          <div className="card animate-fade-in animate-stagger-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Einträge und Kalender bleiben kostenlos. Analyse-Funktionen wie Prognosen, Statistiken,
              Zyklusvergleich und Export sind im Vollzugang enthalten.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/eintrag">
                <button className="btn btn-sm">
                  <PlusCircle className="h-4 w-4" />
                  Eintrag öffnen
                </button>
              </Link>
              <Link href="/kalender">
                <button className="btn btn-sm btn-secondary">
                  <CalendarHeart className="h-4 w-4" />
                  Kalender öffnen
                </button>
              </Link>
              <Link href="/anleitung">
                <button className="btn btn-sm btn-secondary">
                  <BookOpenCheck className="h-4 w-4" />
                  Anleitung lesen
                </button>
              </Link>
            </div>
          </div>
          <UpgradeBanner />
        </>
      ) : (
        <>
          {/* Forecast readiness */}
          {!predictionBaselineReady && (
            <div className="card animate-fade-in">
              <p className="text-sm font-semibold text-[var(--text)]">
                Periodenschätzung noch ausgeblendet
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Die Schätzung des nächsten Periodenbeginns erscheint erst, wenn die Datenbasis belastbar genug ist.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {predictionReadiness.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800"
                  >
                    {reason}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-3">
                Auswertbar: {completedCycleCount}/3 Zyklen, {predictionReadiness.usableTemperatureCount} Temperaturwerte.
              </p>
            </div>
          )}

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

          {/* Disclaimer */}
          <div className="text-center pb-2 pt-2 px-4">
            <p className="text-xs text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              <strong>Hinweis:</strong> Die Auswertung beschreibt nur deine eingetragenen Werte und kann einen
              Temperaturanstieg erst rückblickend zeigen. Die Schätzung des nächsten Periodenbeginns ist eine
              Statistik und kann abweichen. Die App bestimmt keine fruchtbaren Tage, dient <u>nicht</u> zur
              Verhütung und ersetzt keinen ärztlichen Rat.
            </p>
          </div>
        </>
      )}

      {/* Quick Entry Prompt */}
      {!entries.find(e => e.date === format(new Date(), 'yyyy-MM-dd')) && (
        <div className="card text-center animate-fade-in animate-stagger-6 py-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--rose-light)] flex items-center justify-center">
            <Thermometer className="h-7 w-7 text-[var(--rose)]" />
          </div>
          <p className="text-sm mb-5 text-[var(--text-secondary)]">
            Du hast heute noch keine Temperatur eingetragen.
          </p>
          <Link href="/eintrag">
            <button className="btn btn-primary">
              <PlusCircle className="h-4 w-4" />
              Jetzt eintragen
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
