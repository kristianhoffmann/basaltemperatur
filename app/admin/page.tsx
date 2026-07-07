import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import {
  Activity,
  BarChart3,
  CalendarClock,
  Crown,
  Droplets,
  RefreshCw,
  Thermometer,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Übersicht · Admin',
  robots: { index: false, follow: false },
}

const MAX_USERS = 1000
const DAY = 24 * 60 * 60 * 1000

type AuthUser = {
  id: string
  created_at?: string
  last_sign_in_at?: string | null
  email_confirmed_at?: string | null
  confirmed_at?: string | null
}

export default async function AdminOverviewPage() {
  await requireAdmin()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const countRows = async (table: string): Promise<number | null> => {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (error) return null
      return count ?? 0
    } catch {
      return null
    }
  }

  const now = Date.now()
  const cutoff7d = now - 7 * DAY
  const cutoff30d = now - 30 * DAY

  // ---- Users (service-role admin API) ----
  const authUsers: AuthUser[] = []
  let usersError: string | null = null
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: MAX_USERS })
    if (error) usersError = error.message
    else if (data?.users) authUsers.push(...(data.users as AuthUser[]))
  } catch (err) {
    usersError = err instanceof Error ? err.message : 'Nutzer konnten nicht geladen werden.'
  }

  const isConfirmed = (u: AuthUser) => Boolean(u.email_confirmed_at || u.confirmed_at)

  let confirmed = 0
  let newLast7d = 0
  let newLast30d = 0
  let activeLast30d = 0
  for (const u of authUsers) {
    if (isConfirmed(u)) confirmed++
    const created = u.created_at ? Date.parse(u.created_at) : NaN
    if (!Number.isNaN(created)) {
      if (created >= cutoff7d) newLast7d++
      if (created >= cutoff30d) newLast30d++
    }
    const lastSignIn = u.last_sign_in_at ? Date.parse(u.last_sign_in_at) : NaN
    if (!Number.isNaN(lastSignIn) && lastSignIn >= cutoff30d) activeLast30d++
  }

  // ---- Premium (lifetime access) + Domain KPIs ----
  let premiumUsers: number | null = null
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('has_lifetime_access', true)
    premiumUsers = error ? null : count ?? 0
  } catch {
    premiumUsers = null
  }
  const cycles = await countRows('cycles')
  const temperatureEntries = await countRows('temperature_entries')
  const periodEntries = await countRows('period_entries')

  const userKpis = [
    { label: 'Nutzer gesamt', value: authUsers.length, icon: Users },
    { label: 'Bestätigt', value: confirmed, icon: UserCheck },
    { label: 'Neu (7 Tage)', value: newLast7d, icon: UserPlus },
    { label: 'Neu (30 Tage)', value: newLast30d, icon: CalendarClock },
    { label: 'Aktiv (30 Tage)', value: activeLast30d, icon: Activity },
    { label: 'Premium (Lifetime)', value: premiumUsers, icon: Crown },
  ]

  const domainKpis = [
    { label: 'Zyklen', value: cycles, icon: RefreshCw },
    { label: 'Temperatur-Einträge', value: temperatureEntries, icon: Thermometer },
    { label: 'Perioden-Einträge', value: periodEntries, icon: Droplets },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-200">Admin-Übersicht</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Statistik-Überblick</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Nutzerkennzahlen und Domain-Metriken auf einen Blick. Details zu Nutzern und
            Traffic über die Links.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <Users className="h-3.5 w-3.5" />
            Nutzer
          </Link>
          <Link
            href="/admin/traffic"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Traffic
          </Link>
        </div>
      </div>

      {usersError && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          Nutzerdaten konnten nicht geladen werden: {usersError}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <Users className="h-4 w-4 text-rose-300" />
          Nutzer
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {userKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <Thermometer className="h-4 w-4 text-rose-300" />
          Zyklusdaten
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {domainKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: number | null; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-black/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <Icon className="h-4 w-4 text-rose-300" />
      </div>
      <p className="mt-3 text-2xl font-bold">{value === null ? '–' : value.toLocaleString('de-DE')}</p>
    </div>
  )
}
