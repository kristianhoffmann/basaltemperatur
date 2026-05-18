import Link from 'next/link'
import { Activity, Bot, Globe2, MousePointerClick, Route, Timer, TrendingUp, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { sourceLabel, type TrafficEvent } from '@/lib/traffic'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  days?: string
  bots?: string
  admins?: string
}>

type GroupRow = {
  label: string
  count: number
  visitors: number
  percent: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const RANGE_OPTIONS = [1, 7, 30, 90, 365]
const FETCH_PAGE_SIZE = 1000

export default async function AdminTrafficPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const days = RANGE_OPTIONS.includes(Number(params.days)) ? Number(params.days) : 30
  const includeBots = params.bots === '1'
  const includeAdmins = params.admins === '1'
  const start = new Date()
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)

  const supabase = createAdminClient()
  const { events: allEvents, errorMessage } = await fetchTrafficEvents(supabase, start.toISOString())
  const visibleEvents = allEvents.filter(event =>
    (includeBots || !event.is_bot) &&
    (includeAdmins || !event.is_admin)
  )
  const pageviews = visibleEvents.filter(event => event.event_type === 'pageview')
  const sessions = new Set(pageviews.map(event => event.session_id))
  const visitors = new Set(pageviews.map(event => event.visitor_id))
  const signedInVisitors = new Set(pageviews.map(event => event.user_id).filter(Boolean))
  const sessionPageviews = countBy(pageviews, event => event.session_id)
  const bouncedSessions = [...sessionPageviews.values()].filter(count => count === 1).length
  const visitorSessions = groupSessionIdsByVisitor(pageviews)
  const returningVisitors = [...visitorSessions.values()].filter(set => set.size > 1).length

  const topPages = groupTraffic(pageviews, event => event.path, pageviews.length, 12)
  const topSources = groupTraffic(pageviews, sourceLabel, pageviews.length, 12)
  const topCountries = groupTraffic(pageviews, event => event.country || 'Unbekannt', pageviews.length, 10)
  const topDevices = groupTraffic(pageviews, event => event.device_type || 'Unbekannt', pageviews.length, 8)
  const topBrowsers = groupTraffic(pageviews, event => event.browser || 'Unbekannt', pageviews.length, 8)
  const topCampaigns = groupTraffic(pageviews.filter(event => event.utm_campaign), event => event.utm_campaign || 'Unbekannt', pageviews.length, 8)
  const landingPages = groupTraffic(firstPageviewPerSession(pageviews), event => event.path, sessions.size, 8)
  const daily = buildDailySeries(pageviews, days)
  const hourly = buildHourlySeries(pageviews)
  const funnel = buildFunnel(pageviews)

  const metrics = [
    {
      label: 'Pageviews',
      value: pageviews.length.toLocaleString('de-DE'),
      sub: `${allEvents.filter(event => event.is_bot).length.toLocaleString('de-DE')} Bot-Events`,
      icon: Activity,
    },
    {
      label: 'Besucher',
      value: visitors.size.toLocaleString('de-DE'),
      sub: `${returningVisitors.toLocaleString('de-DE')} wiederkehrend`,
      icon: Users,
    },
    {
      label: 'Sessions',
      value: sessions.size.toLocaleString('de-DE'),
      sub: `${average(pageviews.length, sessions.size).toFixed(1)} Seiten/Session`,
      icon: Route,
    },
    {
      label: 'Bounce Rate',
      value: `${percentage(bouncedSessions, sessions.size)}%`,
      sub: `${bouncedSessions.toLocaleString('de-DE')} Single-Page Sessions`,
      icon: MousePointerClick,
    },
    {
      label: 'Angemeldet',
      value: signedInVisitors.size.toLocaleString('de-DE'),
      sub: 'Besucher mit User-ID',
      icon: TrendingUp,
    },
    {
      label: 'Zeitraum',
      value: `${days} Tage`,
      sub: `seit ${formatDate(start.toISOString())}`,
      icon: Timer,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-200">Trafficstatistik</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Vollständige Admin Analytics</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Pageviews, Sessions, Besucher, Referrer, UTM-Kampagnen, Länder, Geräte, Browser,
            Funnel und Rohdaten. IPs werden nur gehasht gespeichert.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map(option => (
            <FilterLink key={option} days={option} active={days === option} bots={includeBots} admins={includeAdmins}>
              {option}d
            </FilterLink>
          ))}
          <FilterLink days={days} bots={!includeBots} admins={includeAdmins} active={includeBots}>
            <Bot className="h-3.5 w-3.5" />
            Bots
          </FilterLink>
          <FilterLink days={days} bots={includeBots} admins={!includeAdmins} active={includeAdmins}>
            Admins
          </FilterLink>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          Trafficdaten konnten nicht geladen werden: {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map(metric => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Tagesverlauf" icon={<Activity className="h-5 w-5 text-rose-300" />}>
          <DailyChart rows={daily} />
        </Panel>
        <Panel title="Funnel" icon={<TrendingUp className="h-5 w-5 text-rose-300" />}>
          <Funnel rows={funnel} />
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel title="Top Seiten" icon={<MousePointerClick className="h-5 w-5 text-rose-300" />}>
          <GroupTable rows={topPages} empty="Noch keine Seitenaufrufe" />
        </Panel>
        <Panel title="Quellen" icon={<Globe2 className="h-5 w-5 text-rose-300" />}>
          <GroupTable rows={topSources} empty="Noch keine Referrer" />
        </Panel>
        <Panel title="Landing Pages" icon={<Route className="h-5 w-5 text-rose-300" />}>
          <GroupTable rows={landingPages} empty="Noch keine Sessions" />
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        <Panel title="Länder" icon={<Globe2 className="h-5 w-5 text-rose-300" />}>
          <GroupTable rows={topCountries} empty="Keine Geo-Daten" />
        </Panel>
        <Panel title="Geräte" icon={<Activity className="h-5 w-5 text-rose-300" />}>
          <GroupTable rows={topDevices} empty="Keine Geräte-Daten" />
        </Panel>
        <Panel title="Browser" icon={<Activity className="h-5 w-5 text-rose-300" />}>
          <GroupTable rows={topBrowsers} empty="Keine Browser-Daten" />
        </Panel>
        <Panel title="Kampagnen" icon={<TrendingUp className="h-5 w-5 text-rose-300" />}>
          <GroupTable rows={topCampaigns} empty="Keine UTM-Kampagnen" />
        </Panel>
      </section>

      <Panel title="Stundenverteilung" icon={<Timer className="h-5 w-5 text-rose-300" />}>
        <HourlyChart rows={hourly} />
      </Panel>

      <Panel title="Letzte Events" icon={<Activity className="h-5 w-5 text-rose-300" />}>
        <RecentEvents events={visibleEvents.slice(0, 80)} />
      </Panel>
    </div>
  )
}

async function fetchTrafficEvents(supabase: ReturnType<typeof createAdminClient>, startIso: string) {
  const events: TrafficEvent[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('traffic_events')
      .select('*')
      .gte('created_at', startIso)
      .order('created_at', { ascending: false })
      .range(from, from + FETCH_PAGE_SIZE - 1)

    if (error) {
      return { events, errorMessage: error.message }
    }

    const page = (data || []) as TrafficEvent[]
    events.push(...page)

    if (page.length < FETCH_PAGE_SIZE) {
      return { events, errorMessage: null }
    }

    from += FETCH_PAGE_SIZE
  }
}

function FilterLink({
  days,
  bots,
  admins,
  active,
  children,
}: {
  days: number
  bots: boolean
  admins: boolean
  active: boolean
  children: React.ReactNode
}) {
  const href = `/admin/traffic?days=${days}${bots ? '&bots=1' : ''}${admins ? '&admins=1' : ''}`
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? 'border-rose-300 bg-rose-300 text-slate-950'
          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}

function MetricCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: typeof Activity }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-black/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <Icon className="h-4 w-4 text-rose-300" />
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  )
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function GroupTable({ rows, empty }: { rows: GroupRow[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">{empty}</p>
  }

  return (
    <div className="space-y-3">
      {rows.map(row => (
        <div key={row.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-slate-200">{row.label}</span>
            <span className="shrink-0 font-medium">{row.count.toLocaleString('de-DE')}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-rose-300" style={{ width: `${row.percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{row.visitors.toLocaleString('de-DE')} Besucher</p>
        </div>
      ))}
    </div>
  )
}

function DailyChart({ rows }: { rows: { date: string; pageviews: number; visitors: number }[] }) {
  const max = Math.max(1, ...rows.map(row => row.pageviews))
  return (
    <div className="flex h-64 items-end gap-1.5 overflow-x-auto pb-2">
      {rows.map(row => (
        <div key={row.date} className="flex min-w-8 flex-1 flex-col items-center gap-2">
          <div className="flex h-52 w-full items-end rounded-t-lg bg-white/5">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-rose-400 to-rose-200"
              style={{ height: `${Math.max(3, (row.pageviews / max) * 100)}%` }}
              title={`${row.date}: ${row.pageviews} Pageviews, ${row.visitors} Besucher`}
            />
          </div>
          <span className="text-[10px] text-slate-500">{row.date.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

function HourlyChart({ rows }: { rows: { hour: number; count: number }[] }) {
  const max = Math.max(1, ...rows.map(row => row.count))
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(24, minmax(22px, 1fr))' }}>
      {rows.map(row => (
        <div key={row.hour} className="space-y-1 text-center">
          <div className="flex h-24 items-end rounded bg-white/5">
            <div
              className="w-full rounded bg-violet-300"
              style={{ height: `${Math.max(3, (row.count / max) * 100)}%` }}
              title={`${row.hour}:00 - ${row.count} Pageviews`}
            />
          </div>
          <span className="text-[10px] text-slate-500">{row.hour}</span>
        </div>
      ))}
    </div>
  )
}

function Funnel({ rows }: { rows: { label: string; visitors: number; percent: number }[] }) {
  const max = Math.max(1, rows[0]?.visitors || 1)
  return (
    <div className="space-y-3">
      {rows.map(row => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-200">{row.label}</span>
            <span className="font-medium">{row.visitors.toLocaleString('de-DE')} · {row.percent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-300" style={{ width: `${Math.max(2, (row.visitors / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentEvents({ events }: { events: TrafficEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-400">Noch keine Events im gewählten Zeitraum.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pr-3">Zeit</th>
            <th className="py-2 pr-3">Pfad</th>
            <th className="py-2 pr-3">Quelle</th>
            <th className="py-2 pr-3">Gerät</th>
            <th className="py-2 pr-3">Browser</th>
            <th className="py-2 pr-3">Land</th>
            <th className="py-2 pr-3">User</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {events.map(event => (
            <tr key={event.id} className="text-slate-300">
              <td className="whitespace-nowrap py-2 pr-3">{formatDateTime(event.created_at)}</td>
              <td className="max-w-[260px] truncate py-2 pr-3 text-white">{event.path}</td>
              <td className="max-w-[180px] truncate py-2 pr-3">{sourceLabel(event)}</td>
              <td className="py-2 pr-3">{event.device_type || '–'}{event.is_bot ? ' · Bot' : ''}</td>
              <td className="py-2 pr-3">{event.browser || '–'}</td>
              <td className="py-2 pr-3">{event.country || '–'}</td>
              <td className="py-2 pr-3">{event.user_id ? 'eingeloggt' : 'anonym'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function groupTraffic(events: TrafficEvent[], labelFor: (event: TrafficEvent) => string | null, total: number, limit: number): GroupRow[] {
  const groups = new Map<string, { count: number; visitors: Set<string> }>()
  for (const event of events) {
    const label = labelFor(event) || 'Unbekannt'
    const current = groups.get(label) || { count: 0, visitors: new Set<string>() }
    current.count++
    current.visitors.add(event.visitor_id)
    groups.set(label, current)
  }

  return [...groups.entries()]
    .map(([label, value]) => ({
      label,
      count: value.count,
      visitors: value.visitors.size,
      percent: total > 0 ? Math.round((value.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

function countBy<T>(items: T[], keyFor: (item: T) => string) {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = keyFor(item)
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

function groupSessionIdsByVisitor(events: TrafficEvent[]) {
  const map = new Map<string, Set<string>>()
  for (const event of events) {
    const set = map.get(event.visitor_id) || new Set<string>()
    set.add(event.session_id)
    map.set(event.visitor_id, set)
  }
  return map
}

function firstPageviewPerSession(events: TrafficEvent[]) {
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const seen = new Set<string>()
  const first: TrafficEvent[] = []
  for (const event of sorted) {
    if (seen.has(event.session_id)) continue
    seen.add(event.session_id)
    first.push(event)
  }
  return first
}

function buildDailySeries(events: TrafficEvent[], days: number) {
  const map = new Map<string, { pageviews: number; visitors: Set<string> }>()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10)
    map.set(date, { pageviews: 0, visitors: new Set<string>() })
  }

  for (const event of events) {
    const date = event.created_at.slice(0, 10)
    const row = map.get(date)
    if (!row) continue
    row.pageviews++
    row.visitors.add(event.visitor_id)
  }

  return [...map.entries()].map(([date, row]) => ({
    date,
    pageviews: row.pageviews,
    visitors: row.visitors.size,
  }))
}

function buildHourlySeries(events: TrafficEvent[]) {
  const rows = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
  for (const event of events) {
    const hour = new Date(event.created_at).getHours()
    rows[hour].count++
  }
  return rows
}

function buildFunnel(events: TrafficEvent[]) {
  const steps = [
    { label: 'Landing', match: (event: TrafficEvent) => event.path === '/' },
    { label: 'Registrierung', match: (event: TrafficEvent) => event.path.startsWith('/registrieren') },
    { label: 'Login', match: (event: TrafficEvent) => event.path.startsWith('/login') },
    { label: 'Onboarding', match: (event: TrafficEvent) => event.path.startsWith('/onboarding') },
    { label: 'Dashboard', match: (event: TrafficEvent) => event.path.startsWith('/dashboard') },
    { label: 'Erfolg', match: (event: TrafficEvent) => event.path.startsWith('/erfolg') },
  ]
  const baseVisitors = new Set(events.map(event => event.visitor_id)).size || 1

  return steps.map(step => {
    const visitors = new Set(events.filter(step.match).map(event => event.visitor_id)).size
    return {
      label: step.label,
      visitors,
      percent: percentage(visitors, baseVisitors),
    }
  })
}

function average(value: number, divisor: number) {
  return divisor > 0 ? value / divisor : 0
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
