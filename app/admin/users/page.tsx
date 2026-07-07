import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, BadgeCheck, Crown, Users } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Nutzer · Admin',
  robots: { index: false, follow: false },
}

const MAX_USERS = 1000

type AuthUser = {
  id: string
  email?: string
  created_at?: string
  last_sign_in_at?: string | null
  email_confirmed_at?: string | null
  confirmed_at?: string | null
}

type UserRow = {
  id: string
  email: string | null
  plan: 'premium' | 'free'
  createdAt: string | null
  lastSignInAt: string | null
  confirmed: boolean
}

export default async function AdminUsersPage() {
  await requireAdmin()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  let errorMessage: string | null = null

  // Auth users (service-role admin API)
  const authUsers: AuthUser[] = []
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: MAX_USERS })
    if (error) errorMessage = error.message
    else if (data?.users) authUsers.push(...(data.users as AuthUser[]))
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Nutzer konnten nicht geladen werden.'
  }

  // Plan map from profiles.has_lifetime_access
  const planByUserId = new Map<string, 'premium' | 'free'>()
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, has_lifetime_access')
    for (const p of (profiles ?? []) as Array<{ id: string; has_lifetime_access: boolean | null }>) {
      planByUserId.set(p.id, p.has_lifetime_access ? 'premium' : 'free')
    }
  } catch {
    // profiles optional; default to free
  }

  const isConfirmed = (u: AuthUser) => Boolean(u.email_confirmed_at || u.confirmed_at)

  const rows: UserRow[] = authUsers
    .map((u) => ({
      id: u.id,
      email: u.email ?? null,
      plan: planByUserId.get(u.id) ?? 'free',
      createdAt: u.created_at ?? null,
      lastSignInAt: u.last_sign_in_at ?? null,
      confirmed: isConfirmed(u),
    }))
    .sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0
      return tb - ta
    })
    .slice(0, MAX_USERS)

  const premiumCount = rows.filter((r) => r.plan === 'premium').length
  const confirmedCount = rows.filter((r) => r.confirmed).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-200">Nutzerverwaltung</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Alle Nutzer</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Registrierte Konten aus Supabase Auth, neueste zuerst. Premium wird aus
            <span className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">profiles.has_lifetime_access</span>
            abgeleitet.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Übersicht
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          Nutzerdaten konnten nicht geladen werden: {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Nutzer gesamt" value={rows.length} icon={Users} />
        <StatCard label="Bestätigt" value={confirmedCount} icon={BadgeCheck} />
        <StatCard label="Premium (Lifetime)" value={premiumCount} icon={Crown} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-rose-300" />
          <h2 className="font-semibold">Nutzerliste</h2>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">Noch keine Nutzer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">E-Mail</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Registriert</th>
                  <th className="py-2 pr-3">Letzter Login</th>
                  <th className="py-2 pr-3">Bestätigt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rows.map((row) => (
                  <tr key={row.id} className="text-slate-300">
                    <td className="max-w-[280px] truncate py-2 pr-3 text-white">{row.email ?? '–'}</td>
                    <td className="py-2 pr-3">
                      {row.plan === 'premium' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-xs font-medium text-amber-200">
                          <Crown className="h-3 w-3" />
                          Premium
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3">{formatDateTime(row.createdAt)}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{formatDateTime(row.lastSignInAt)}</td>
                    <td className="py-2 pr-3">
                      {row.confirmed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <BadgeCheck className="h-4 w-4" />
                          Ja
                        </span>
                      ) : (
                        <span className="text-slate-500">Nein</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-black/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <Icon className="h-4 w-4 text-rose-300" />
      </div>
      <p className="mt-3 text-2xl font-bold">{value.toLocaleString('de-DE')}</p>
    </div>
  )
}

function formatDateTime(value: string | null) {
  if (!value) return '–'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
