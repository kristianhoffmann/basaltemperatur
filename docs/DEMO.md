# Demo-Modus – Handwerker-CRM

## Übersicht

Der Demo-Modus ermöglicht Interessenten, alle Features des CRM ohne Registrierung vollständig zu testen. Es werden realistische Beispieldaten bereitgestellt.

---

## Konzept

### Ziele
1. **Conversion steigern** – Nutzer erleben den Wert sofort
2. **Vertrauen aufbauen** – Keine Kreditkarte, kein Risiko
3. **Onboarding verbessern** – Features werden erklärt

### Kernprinzipien
- ✅ Alle Features verfügbar (keine künstlichen Einschränkungen)
- ✅ Realistische Beispieldaten
- ✅ Unbegrenzte Nutzungsdauer
- ✅ Einfacher Übergang zur Registrierung
- ✅ Demo-Daten bleiben isoliert

---

## User Flow

```
Landing Page → "Demo starten" → Demo-Dashboard
                                    │
                                    ├── Alle Features nutzen
                                    ├── Eigene Daten eingeben (optional)
                                    │
                                    ▼
                              "Jetzt registrieren"
                                    │
                                    ▼
                              Registrierung
                                    │
                                    ▼
                              Demo-Daten übernehmen? (optional)
                                    │
                                    ▼
                              Eigenes Dashboard
```

---

## Technische Implementierung

### Demo-Session erstellen

```typescript
// app/demo/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createDemoSession } from '@/lib/demo'

export default async function DemoPage() {
  const cookieStore = cookies()
  let sessionToken = cookieStore.get('demo_session')?.value
  
  if (!sessionToken) {
    // Neue Demo-Session erstellen
    sessionToken = await createDemoSession()
    cookieStore.set('demo_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 Tage
      path: '/'
    })
  }
  
  redirect('/demo/dashboard')
}
```

### Demo-Session Verwaltung

```typescript
// lib/demo.ts
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createDemoSession(): Promise<string> {
  const sessionToken = uuidv4()
  
  // Session in DB speichern
  const { data: session } = await supabaseAdmin
    .from('demo_sessions')
    .insert({
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single()
  
  // Demo-Daten erstellen
  await createDemoData(session.id)
  
  return sessionToken
}

export async function getDemoSession(token: string) {
  const { data } = await supabaseAdmin
    .from('demo_sessions')
    .select('*')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  return data
}

export async function resetDemoData(sessionId: string) {
  // Alte Demo-Daten löschen
  const { data: session } = await supabaseAdmin
    .from('demo_sessions')
    .select('demo_customer_ids, demo_project_ids')
    .eq('id', sessionId)
    .single()
  
  if (session?.demo_customer_ids) {
    await supabaseAdmin
      .from('customers')
      .delete()
      .in('id', session.demo_customer_ids)
  }
  
  // Neue Demo-Daten erstellen
  await createDemoData(sessionId)
}
```

### Demo-Daten erstellen

```typescript
// lib/demo-data.ts
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

export async function createDemoData(sessionId: string) {
  const customerIds: string[] = []
  const projectIds: string[] = []
  
  // 1. Demo-Kunden erstellen
  const customers = [
    {
      first_name: 'Thomas',
      last_name: 'Müller',
      email: 'mueller@example.com',
      phone: '0171 1234567',
      street: 'Hauptstraße 12',
      postal_code: '30159',
      city: 'Hannover',
      notes: 'Stammkunde seit 2020. Bevorzugt Termine vormittags.'
    },
    {
      first_name: 'Anna',
      last_name: 'Schmidt',
      company_name: 'Schmidt GmbH',
      email: 'a.schmidt@schmidt-gmbh.de',
      phone: '0511 9876543',
      street: 'Industrieweg 45',
      postal_code: '30159',
      city: 'Hannover',
      notes: 'Gewerblicher Kunde. Ansprechpartnerin für alle Elektroarbeiten.'
    },
    {
      first_name: 'Michael',
      last_name: 'Weber',
      company_name: 'Weber & Söhne',
      email: 'info@weber-soehne.de',
      phone: '0172 5555555',
      street: 'Marktplatz 3',
      postal_code: '30159',
      city: 'Hannover'
    },
    {
      first_name: 'Lisa',
      last_name: 'Becker',
      email: 'lisa.becker@email.de',
      phone: '0173 2222222',
      street: 'Gartenstraße 8',
      postal_code: '30159',
      city: 'Hannover'
    },
    {
      first_name: 'Stefan',
      last_name: 'Hoffmann',
      company_name: 'Hoffmann Immobilien',
      email: 'kontakt@hoffmann-immo.de',
      phone: '0511 3333333',
      street: 'Königstraße 99',
      postal_code: '30159',
      city: 'Hannover'
    }
  ]
  
  for (const customer of customers) {
    const { data } = await supabaseAdmin
      .from('customers')
      .insert({ ...customer, user_id: DEMO_USER_ID })
      .select('id')
      .single()
    
    if (data) customerIds.push(data.id)
  }
  
  // 2. Demo-Projekte erstellen
  const projects = [
    {
      customer_id: customerIds[0],
      title: 'Komplettsanierung Elektrik EG',
      description: 'Erneuerung der gesamten Elektroinstallation im Erdgeschoss',
      status: 'in_progress',
      address: 'Hauptstraße 12, 30159 Hannover'
    },
    {
      customer_id: customerIds[1],
      title: 'Bürobeleuchtung LED-Umrüstung',
      description: '42 LED-Panels installieren, alte Leuchtstoffröhren entsorgen',
      status: 'quoted',
      address: 'Industrieweg 45, 30159 Hannover'
    },
    {
      customer_id: customerIds[2],
      title: 'Außenbeleuchtung Parkplatz',
      description: 'Installation von 8 LED-Strahlern mit Bewegungsmelder',
      status: 'completed',
      address: 'Marktplatz 3, 30159 Hannover'
    }
  ]
  
  for (const project of projects) {
    const { data } = await supabaseAdmin
      .from('projects')
      .insert({ ...project, user_id: DEMO_USER_ID })
      .select('id')
      .single()
    
    if (data) projectIds.push(data.id)
  }
  
  // 3. Demo-Angebote erstellen
  const quotes = [
    {
      project_id: projectIds[0],
      customer_id: customerIds[0],
      quote_number: 'AN-2025-0001',
      status: 'accepted',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 2450.00,
      tax_amount: 465.50,
      total_gross: 2915.50,
      notes: 'Angebot gültig bei Auftragserteilung bis zum angegebenen Datum.'
    },
    {
      project_id: projectIds[1],
      customer_id: customerIds[1],
      quote_number: 'AN-2025-0002',
      status: 'sent',
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 4200.00,
      tax_amount: 798.00,
      total_gross: 4998.00
    }
  ]
  
  for (const quote of quotes) {
    await supabaseAdmin
      .from('quotes')
      .insert({ ...quote, user_id: DEMO_USER_ID })
  }
  
  // 4. Demo-Rechnungen erstellen
  const invoices = [
    {
      project_id: projectIds[2],
      customer_id: customerIds[2],
      invoice_number: 'RE-2025-0001',
      status: 'paid',
      issue_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      paid_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 1850.00,
      tax_amount: 351.50,
      total_gross: 2201.50
    },
    {
      project_id: projectIds[0],
      customer_id: customerIds[0],
      invoice_number: 'RE-2025-0002',
      status: 'sent',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 1200.00,
      tax_amount: 228.00,
      total_gross: 1428.00
    }
  ]
  
  for (const invoice of invoices) {
    await supabaseAdmin
      .from('invoices')
      .insert({ ...invoice, user_id: DEMO_USER_ID, is_locked: true })
  }
  
  // 5. Demo-Termine erstellen
  const today = new Date()
  const appointments = [
    {
      customer_id: customerIds[0],
      project_id: projectIds[0],
      title: 'Elektrik EG - Fortsetzung',
      start_time: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
      end_time: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
      location: 'Hauptstraße 12, 30159 Hannover',
      notes: 'Sicherungskasten fertigstellen'
    },
    {
      customer_id: customerIds[3],
      title: 'Beratungsgespräch Frau Becker',
      start_time: new Date(today.setDate(today.getDate() + 1)).toISOString(),
      end_time: new Date(today.setHours(15, 0, 0, 0)).toISOString(),
      location: 'Gartenstraße 8, 30159 Hannover',
      notes: 'Angebot für Küchensteckdosen erstellen'
    },
    {
      customer_id: customerIds[1],
      project_id: projectIds[1],
      title: 'Aufmaß LED-Beleuchtung',
      start_time: new Date(today.setDate(today.getDate() + 2)).toISOString(),
      end_time: new Date(today.setHours(11, 0, 0, 0)).toISOString(),
      location: 'Industrieweg 45, 30159 Hannover'
    }
  ]
  
  for (const appointment of appointments) {
    await supabaseAdmin
      .from('appointments')
      .insert({ ...appointment, user_id: DEMO_USER_ID })
  }
  
  // 6. Demo-Vorlagen erstellen
  const templates = [
    { title: 'Steckdose installieren', description: 'Unterputz-Steckdose inkl. Rahmen', unit: 'Stk.', unit_price: 45.00, category: 'Installation' },
    { title: 'Lichtschalter installieren', description: 'Unterputz-Schalter inkl. Rahmen', unit: 'Stk.', unit_price: 35.00, category: 'Installation' },
    { title: 'Kabel verlegen', description: 'NYM-J 3x1,5mm² Unterputz', unit: 'm', unit_price: 8.50, category: 'Kabel' },
    { title: 'Sicherungskasten prüfen', description: 'E-Check nach DIN VDE 0100-600', unit: 'pausch.', unit_price: 89.00, category: 'Prüfung' },
    { title: 'Arbeitsstunde Elektriker', description: 'Montagearbeiten', unit: 'Std.', unit_price: 65.00, category: 'Arbeit' }
  ]
  
  for (const template of templates) {
    await supabaseAdmin
      .from('templates')
      .insert({ ...template, user_id: DEMO_USER_ID })
  }
  
  // Session aktualisieren
  await supabaseAdmin
    .from('demo_sessions')
    .update({
      demo_data_created: true,
      demo_customer_ids: customerIds,
      demo_project_ids: projectIds
    })
    .eq('id', sessionId)
}
```

---

## Demo Layout

```typescript
// app/demo/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDemoSession } from '@/lib/demo'
import { DemoBanner } from '@/components/demo/DemoBanner'
import { DemoProvider } from '@/contexts/DemoContext'

export default async function DemoLayout({
  children
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get('demo_session')?.value
  
  if (!sessionToken) {
    redirect('/demo')
  }
  
  const session = await getDemoSession(sessionToken)
  
  if (!session) {
    redirect('/demo')
  }
  
  return (
    <DemoProvider session={session}>
      <DemoBanner />
      <div className="pt-12"> {/* Platz für Banner */}
        {children}
      </div>
    </DemoProvider>
  )
}
```

### Demo-Banner

```typescript
// components/demo/DemoBanner.tsx
'use client'

import Link from 'next/link'
import { useDemo } from '@/contexts/DemoContext'

export function DemoBanner() {
  const { resetDemo } = useDemo()
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-medium">
            DEMO
          </span>
          <span className="text-sm">
            Du nutzt die Demo-Version mit Beispieldaten
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={resetDemo}
            className="text-sm text-white/80 hover:text-white underline"
          >
            Demo zurücksetzen
          </button>
          
          <Link
            href="/register?from=demo"
            className="bg-accent-400 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-semibold
                       hover:bg-accent-300 transition-colors"
          >
            Jetzt registrieren →
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## Feature-Highlights (Tooltips)

```typescript
// components/demo/FeatureHighlight.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'

interface FeatureHighlightProps {
  id: string
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}

export function FeatureHighlight({
  id,
  title,
  description,
  position = 'bottom',
  children
}: FeatureHighlightProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasSeen, setHasSeen] = useState(false)
  
  useEffect(() => {
    // Prüfe ob User diesen Tooltip schon gesehen hat
    const seen = localStorage.getItem(`demo_highlight_${id}`)
    if (!seen) {
      setIsOpen(true)
    } else {
      setHasSeen(true)
    }
  }, [id])
  
  const dismiss = () => {
    setIsOpen(false)
    setHasSeen(true)
    localStorage.setItem(`demo_highlight_${id}`, 'true')
  }
  
  return (
    <div className="relative">
      {children}
      
      {/* Pulsierender Punkt */}
      {!hasSeen && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-400" />
        </span>
      )}
      
      {/* Tooltip */}
      {isOpen && (
        <div className={`absolute z-50 w-72 bg-gray-900 text-white rounded-xl p-4 shadow-xl
          ${position === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : ''}
          ${position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}
          ${position === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' : ''}
          ${position === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : ''}
        `}>
          <button
            onClick={dismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-start gap-3">
            <Sparkles className="text-accent-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold mb-1">{title}</h4>
              <p className="text-sm text-gray-300">{description}</p>
            </div>
          </div>
          
          {/* Pfeil */}
          <div className={`absolute w-3 h-3 bg-gray-900 rotate-45
            ${position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2' : ''}
            ${position === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : ''}
          `} />
        </div>
      )}
    </div>
  )
}
```

**Verwendung:**

```tsx
<FeatureHighlight
  id="quick-invoice"
  title="Ein-Klick-Rechnung"
  description="Erstelle aus jedem abgeschlossenen Auftrag sofort eine Rechnung – alle Daten werden automatisch übernommen."
>
  <Button onClick={createInvoice}>
    Rechnung erstellen
  </Button>
</FeatureHighlight>
```

---

## Demo → Registrierung Conversion

### Datenübernahme

```typescript
// app/register/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const fromDemo = searchParams.get('from') === 'demo'
  const [importDemo, setImportDemo] = useState(fromDemo)
  
  return (
    <div>
      <h1>Registrierung</h1>
      
      {fromDemo && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={importDemo}
              onChange={(e) => setImportDemo(e.target.checked)}
              className="mt-1"
            />
            <div>
              <span className="font-medium">Demo-Daten übernehmen</span>
              <p className="text-sm text-gray-600 mt-1">
                Deine in der Demo erstellten Kunden, Angebote und Rechnungen werden
                in deinen neuen Account übertragen.
              </p>
            </div>
          </label>
        </div>
      )}
      
      {/* Registrierungsformular */}
    </div>
  )
}
```

### Demo-Daten migrieren

```typescript
// lib/demo.ts
export async function migrateDemoDataToUser(
  sessionToken: string,
  newUserId: string
) {
  const session = await getDemoSession(sessionToken)
  if (!session || !session.demo_data_created) return
  
  // Kunden übertragen
  await supabaseAdmin
    .from('customers')
    .update({ user_id: newUserId })
    .in('id', session.demo_customer_ids)
  
  // Projekte übertragen
  await supabaseAdmin
    .from('projects')
    .update({ user_id: newUserId })
    .in('id', session.demo_project_ids)
  
  // Weitere Tabellen...
  
  // Session als konvertiert markieren
  await supabaseAdmin
    .from('demo_sessions')
    .update({
      converted_to_user_id: newUserId,
      converted_at: new Date().toISOString()
    })
    .eq('session_token', sessionToken)
}
```

---

## Analytics & Tracking

### Demo-Events

```typescript
// lib/analytics.ts
export function trackDemoEvent(event: string, properties?: Record<string, any>) {
  // Beispiel mit Plausible
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, { props: properties })
  }
}

// Events:
// - demo_started
// - demo_feature_used (feature: string)
// - demo_reset
// - demo_register_clicked
// - demo_converted
```

### Demo-Metrics (Admin Dashboard)

```sql
-- Neue Demo-Sessions pro Tag
SELECT DATE(created_at) as date, COUNT(*) as new_sessions
FROM demo_sessions
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Conversion Rate
SELECT 
  COUNT(*) as total_sessions,
  COUNT(converted_to_user_id) as converted,
  ROUND(COUNT(converted_to_user_id)::decimal / COUNT(*) * 100, 2) as conversion_rate
FROM demo_sessions
WHERE created_at > NOW() - INTERVAL '30 days';

-- Meistgenutzte Features in Demo
-- (via Event-Tracking)
```

---

## Cleanup (Cron Job)

```typescript
// supabase/functions/cleanup-demo/index.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  // Lösche abgelaufene Demo-Sessions (älter als 30 Tage, nicht konvertiert)
  const { data: expiredSessions } = await supabase
    .from('demo_sessions')
    .select('id, demo_customer_ids')
    .lt('expires_at', new Date().toISOString())
    .is('converted_to_user_id', null)
  
  for (const session of expiredSessions || []) {
    // Demo-Daten löschen
    if (session.demo_customer_ids?.length) {
      await supabase
        .from('customers')
        .delete()
        .in('id', session.demo_customer_ids)
    }
    
    // Session löschen
    await supabase
      .from('demo_sessions')
      .delete()
      .eq('id', session.id)
  }
  
  return new Response(JSON.stringify({ 
    cleaned: expiredSessions?.length || 0 
  }))
})
```

**Cron einrichten (Supabase Dashboard):**
- Schedule: `0 3 * * *` (täglich um 3 Uhr)
- Function: `cleanup-demo`

---

## Checkliste

- [ ] Demo-Route `/demo` erstellt
- [ ] Demo-Session-Verwaltung implementiert
- [ ] Realistische Beispieldaten definiert
- [ ] Demo-Banner mit CTA
- [ ] Feature-Highlights an wichtigen Stellen
- [ ] Reset-Funktion getestet
- [ ] Demo → Registrierung Flow
- [ ] Daten-Migration bei Conversion
- [ ] Cleanup-Cron eingerichtet
- [ ] Analytics-Events eingebunden
