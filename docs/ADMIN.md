# Admin-Dashboard – Handwerker-CRM

## Übersicht

Das Admin-Dashboard ermöglicht die Verwaltung aller Nutzer, Abonnements und System-Einstellungen. Es ist nur für autorisierte Administratoren zugänglich.

---

## Architektur

```
/admin                    (Layout mit Admin-Nav)
├── /dashboard           Dashboard mit KPIs
├── /users               Nutzer-Übersicht
│   └── /[id]           Nutzer-Details
├── /subscriptions       Abo-Verwaltung
├── /analytics           Umsatz & Metriken
├── /support             Support-Tickets
├── /feature-flags       Feature-Toggles
├── /audit-log           Aktivitäts-Log
└── /settings            System-Einstellungen
```

---

## Rollen & Berechtigungen

### Rollen-Hierarchie

| Rolle | Beschreibung |
|-------|--------------|
| `super_admin` | Vollzugriff auf alle Funktionen |
| `support` | Nutzer-Ansicht, Impersonation, Support-Queue |
| `finance` | Umsatz-Analytics, Subscription-Management |

### Berechtigungen (Permissions)

```typescript
type Permission =
  | 'users:read'           // Nutzer ansehen
  | 'users:write'          // Nutzer bearbeiten
  | 'users:delete'         // Nutzer löschen
  | 'users:impersonate'    // Als Nutzer einloggen
  | 'subscriptions:read'   // Abos ansehen
  | 'subscriptions:write'  // Abos bearbeiten
  | 'analytics:view'       // Analytics Dashboard
  | 'support:read'         // Support-Tickets lesen
  | 'support:write'        // Support-Tickets bearbeiten
  | 'feature_flags:read'   // Feature Flags ansehen
  | 'feature_flags:write'  // Feature Flags ändern
  | 'audit:read'           // Audit-Log lesen
  | 'settings:write'       // System-Einstellungen
```

### Rollen-zu-Berechtigungen Mapping

```typescript
const rolePermissions = {
  super_admin: ['*'], // Alle Berechtigungen
  
  support: [
    'users:read',
    'users:impersonate',
    'support:read',
    'support:write',
    'subscriptions:read'
  ],
  
  finance: [
    'users:read',
    'subscriptions:read',
    'subscriptions:write',
    'analytics:view',
    'audit:read'
  ]
}
```

---

## Admin Middleware

```typescript
// middleware.ts (erweitert)
import { createClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  
  // Admin-Routen schützen
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Prüfe Admin-Status
    const { data: admin } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single()
    
    if (!admin || !admin.is_active) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Rolle in Header für Server Components
    response.headers.set('x-admin-role', admin.role)
  }
  
  return response
}
```

---

## Dashboard-Seiten

### 1. Admin Dashboard (Übersicht)

```typescript
// app/admin/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { KPICard } from '@/components/admin/KPICard'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  // KPIs laden
  const [
    { count: totalUsers },
    { count: activeSubscriptions },
    { data: mrr },
    { count: openTickets }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']),
    supabase.rpc('get_current_mrr'),
    supabase.from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
  ])
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Registrierte Nutzer"
          value={totalUsers || 0}
          change="+12% vs. Vormonat"
          trend="up"
        />
        <KPICard
          title="Aktive Abos"
          value={activeSubscriptions || 0}
          subtitle="inkl. Trials"
        />
        <KPICard
          title="MRR"
          value={`€${mrr?.toFixed(2) || '0.00'}`}
          change="+8% vs. Vormonat"
          trend="up"
        />
        <KPICard
          title="Offene Tickets"
          value={openTickets || 0}
          alert={openTickets > 10}
        />
      </div>
      
      {/* Weitere Sections: Neueste Nutzer, Letzte Payments, etc. */}
    </div>
  )
}
```

### 2. Nutzer-Übersicht

```typescript
// app/admin/users/page.tsx
import { createClient } from '@/lib/supabase/server'
import { UsersTable } from '@/components/admin/UsersTable'
import { SearchInput } from '@/components/ui/SearchInput'

export default async function UsersPage({
  searchParams
}: {
  searchParams: { q?: string; plan?: string; page?: string }
}) {
  const supabase = await createClient()
  const page = parseInt(searchParams.page || '1')
  const perPage = 20
  
  let query = supabase
    .from('admin_users_overview')
    .select('*')
    .order('registered_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)
  
  if (searchParams.q) {
    query = query.or(`email.ilike.%${searchParams.q}%,company_name.ilike.%${searchParams.q}%`)
  }
  
  if (searchParams.plan) {
    query = query.eq('plan_id', searchParams.plan)
  }
  
  const { data: users, count } = await query
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nutzer</h1>
        <div className="flex gap-4">
          <SearchInput placeholder="E-Mail oder Firma suchen..." />
          <PlanFilter />
        </div>
      </div>
      
      <UsersTable users={users || []} />
      
      <Pagination total={count || 0} perPage={perPage} currentPage={page} />
    </div>
  )
}
```

### 3. Nutzer-Details & Impersonation

```typescript
// app/admin/users/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ImpersonateButton } from '@/components/admin/ImpersonateButton'

export default async function UserDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  
  const { data: user } = await supabase
    .from('admin_users_overview')
    .select('*')
    .eq('id', params.id)
    .single()
  
  const { data: recentActivity } = await supabase
    .from('audit_log')
    .select('*')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20)
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{user?.company_name || user?.email}</h1>
          <p className="text-gray-500">{user?.email}</p>
        </div>
        <ImpersonateButton userId={params.id} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil-Infos */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="font-semibold mb-4">Profil</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Inhaber</dt>
              <dd>{user?.owner_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Gewerk</dt>
              <dd>{user?.trade}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Stadt</dt>
              <dd>{user?.city}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Registriert</dt>
              <dd>{formatDate(user?.registered_at)}</dd>
            </div>
          </dl>
        </div>
        
        {/* Subscription */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="font-semibold mb-4">Abonnement</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Plan</dt>
              <dd className="capitalize">{user?.plan_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd><StatusBadge status={user?.subscription_status} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Gültig bis</dt>
              <dd>{formatDate(user?.current_period_end)}</dd>
            </div>
          </dl>
        </div>
        
        {/* Nutzung */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="font-semibold mb-4">Nutzung</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Kunden</dt>
              <dd>{user?.customer_count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Rechnungen</dt>
              <dd>{user?.invoice_count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Umsatz (gesamt)</dt>
              <dd>€{user?.total_revenue?.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Aktivitäts-Log */}
      <div className="mt-6 bg-white rounded-xl p-6">
        <h2 className="font-semibold mb-4">Letzte Aktivitäten</h2>
        <ActivityLog entries={recentActivity || []} />
      </div>
    </div>
  )
}
```

### 4. Impersonation API

```typescript
// app/api/admin/impersonate/route.ts
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Prüfe Admin-Berechtigung
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('user_id', adminUser.id)
    .single()
  
  if (!admin || !['super_admin', 'support'].includes(admin.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const { targetUserId } = await request.json()
  
  // Audit-Log schreiben
  await supabaseAdmin.from('admin_audit_log').insert({
    admin_id: admin.id,
    action: 'user:impersonate',
    target_type: 'user',
    target_id: targetUserId,
    details: { reason: 'Support investigation' },
    ip_address: request.headers.get('x-forwarded-for')
  })
  
  // Magic Link für Target User generieren
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: (await supabaseAdmin.from('profiles').select('email').eq('id', targetUserId).single()).data?.email!
  })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Speichere Original-Admin-Session für "Zurück"-Funktion
  const cookieStore = cookies()
  cookieStore.set('admin_original_session', adminUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 // 1 Stunde
  })
  
  return NextResponse.json({ 
    url: data.properties?.action_link,
    message: 'Impersonation gestartet'
  })
}
```

### 5. Analytics Dashboard

```typescript
// app/admin/analytics/page.tsx
import { createClient } from '@/lib/supabase/server'
import { RevenueChart } from '@/components/admin/charts/RevenueChart'
import { ChurnChart } from '@/components/admin/charts/ChurnChart'
import { UserGrowthChart } from '@/components/admin/charts/UserGrowthChart'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  
  // Umsatz-Daten der letzten 12 Monate
  const { data: revenueData } = await supabase
    .from('admin_revenue_analytics')
    .select('*')
    .order('month', { ascending: true })
    .limit(12)
  
  // Nutzer-Wachstum
  const { data: userGrowth } = await supabase.rpc('get_user_growth_by_month')
  
  // Plan-Verteilung
  const { data: planDistribution } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .in('status', ['active', 'trialing'])
  
  const planCounts = planDistribution?.reduce((acc, s) => {
    acc[s.plan_id] = (acc[s.plan_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="MRR"
          value="€2,847"
          change="+12.3%"
          trend="up"
        />
        <MetricCard
          title="ARR"
          value="€34,164"
          subtitle="Projected"
        />
        <MetricCard
          title="Churn Rate"
          value="3.2%"
          change="-0.5%"
          trend="down" // down is good for churn
        />
        <MetricCard
          title="LTV"
          value="€412"
          change="+8%"
          trend="up"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6">
          <h2 className="font-semibold mb-4">Monatlicher Umsatz</h2>
          <RevenueChart data={revenueData || []} />
        </div>
        
        <div className="bg-white rounded-xl p-6">
          <h2 className="font-semibold mb-4">Nutzer-Wachstum</h2>
          <UserGrowthChart data={userGrowth || []} />
        </div>
      </div>
      
      {/* Plan Distribution */}
      <div className="bg-white rounded-xl p-6">
        <h2 className="font-semibold mb-4">Plan-Verteilung</h2>
        <div className="flex gap-8">
          <PlanBar label="Starter" count={planCounts?.starter || 0} color="gray" />
          <PlanBar label="Handwerker" count={planCounts?.handwerker || 0} color="primary" />
          <PlanBar label="Meister" count={planCounts?.meister || 0} color="accent" />
        </div>
      </div>
    </div>
  )
}
```

### 6. Feature Flags

```typescript
// app/admin/feature-flags/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeatureFlag {
  id: string
  name: string
  description: string
  is_enabled: boolean
  enabled_for_all: boolean
  enabled_for_plans: string[]
  percentage_rollout: number
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const supabase = createClient()
  
  useEffect(() => {
    loadFlags()
  }, [])
  
  async function loadFlags() {
    const { data } = await supabase
      .from('feature_flags')
      .select('*')
      .order('name')
    setFlags(data || [])
  }
  
  async function toggleFlag(flagId: string, field: string, value: any) {
    await supabase
      .from('feature_flags')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', flagId)
    loadFlags()
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <button className="bg-primary-500 text-white px-4 py-2 rounded-lg">
          + Neues Flag
        </button>
      </div>
      
      <div className="bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Beschreibung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Targeting</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Rollout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {flags.map((flag) => (
              <tr key={flag.id}>
                <td className="px-6 py-4 font-mono text-sm">{flag.name}</td>
                <td className="px-6 py-4 text-gray-500">{flag.description}</td>
                <td className="px-6 py-4">
                  <Toggle
                    checked={flag.is_enabled}
                    onChange={(v) => toggleFlag(flag.id, 'is_enabled', v)}
                  />
                </td>
                <td className="px-6 py-4">
                  {flag.enabled_for_all ? (
                    <span className="text-green-600">Alle</span>
                  ) : (
                    <span>{flag.enabled_for_plans.join(', ') || 'Niemand'}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={flag.percentage_rollout}
                    onChange={(e) => toggleFlag(flag.id, 'percentage_rollout', parseInt(e.target.value))}
                    className="w-24"
                  />
                  <span className="ml-2">{flag.percentage_rollout}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### 7. Support-Tickets

```typescript
// app/admin/support/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function SupportPage() {
  const supabase = await createClient()
  
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select(`
      *,
      assigned_admin:admin_users(user_id)
    `)
    .order('created_at', { ascending: false })
  
  const openCount = tickets?.filter(t => t.status === 'open').length || 0
  const inProgressCount = tickets?.filter(t => t.status === 'in_progress').length || 0
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Support-Tickets</h1>
      
      {/* Status-Tabs */}
      <div className="flex gap-4 mb-6">
        <StatusTab label="Offen" count={openCount} active />
        <StatusTab label="In Bearbeitung" count={inProgressCount} />
        <StatusTab label="Gelöst" count={0} />
      </div>
      
      {/* Ticket-Liste */}
      <div className="space-y-4">
        {tickets?.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  )
}
```

---

## Admin Navigation

```typescript
// components/admin/AdminNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  MessageSquare,
  Flag,
  FileText,
  Settings
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Nutzer', icon: Users },
  { href: '/admin/subscriptions', label: 'Abos', icon: CreditCard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/support', label: 'Support', icon: MessageSquare },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: Flag },
  { href: '/admin/audit-log', label: 'Audit-Log', icon: FileText },
  { href: '/admin/settings', label: 'Einstellungen', icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()
  
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <span className="text-xl font-bold">Admin</span>
        <span className="ml-2 text-xs bg-red-500 px-2 py-0.5 rounded">ADMIN</span>
      </div>
      
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      
      {/* Zurück zur App */}
      <div className="absolute bottom-4 left-4 right-4">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 px-4 py-2 
                     bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          ← Zurück zur App
        </Link>
      </div>
    </aside>
  )
}
```

---

## Sicherheits-Checkliste

- [ ] Alle Admin-Routen durch Middleware geschützt
- [ ] Rollen-basierte Zugriffskontrolle implementiert
- [ ] Alle Admin-Aktionen werden im Audit-Log protokolliert
- [ ] Impersonation erfordert Bestätigung + Logging
- [ ] Keine sensiblen Daten in Client-Komponenten
- [ ] Service Role Key nur server-seitig verwendet
- [ ] Rate Limiting auf Admin-APIs
- [ ] 2FA für Admin-Accounts empfohlen
