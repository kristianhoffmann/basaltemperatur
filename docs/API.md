# API Dokumentation – Handwerker-CRM

## Übersicht

Die API basiert auf **Supabase** und nutzt:
- **PostgREST** für CRUD-Operationen
- **Row Level Security (RLS)** für Autorisierung
- **Edge Functions** für komplexe Logik

---

## 1. Basis-Konfiguration

### Client Setup

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### TypeScript Typen generieren

```bash
# Supabase CLI installieren
npm install -g supabase

# Typen aus Datenbank generieren
supabase gen types typescript --project-id your-project-id > types/database.ts
```

---

## 2. Kunden API

### Alle Kunden abrufen

```typescript
const { data: customers, error } = await supabase
  .from('customers')
  .select('*')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
```

### Kunde suchen

```typescript
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .is('deleted_at', null)
  .or(`
    first_name.ilike.%${query}%,
    last_name.ilike.%${query}%,
    company_name.ilike.%${query}%,
    email.ilike.%${query}%,
    city.ilike.%${query}%
  `)
  .limit(50)
```

### Kunde mit Projekten & Rechnungen

```typescript
const { data: customer, error } = await supabase
  .from('customers')
  .select(`
    *,
    projects (
      id,
      title,
      status,
      created_at
    ),
    invoices (
      id,
      invoice_number,
      total,
      status,
      invoice_date
    )
  `)
  .eq('id', customerId)
  .single()
```

### Neuen Kunden erstellen

```typescript
const { data: newCustomer, error } = await supabase
  .from('customers')
  .insert({
    customer_type: 'private',
    first_name: 'Max',
    last_name: 'Mustermann',
    email: 'max@example.de',
    street: 'Musterstraße',
    house_number: '1',
    postal_code: '12345',
    city: 'Berlin'
  })
  .select()
  .single()
```

### Kunden aktualisieren

```typescript
const { data, error } = await supabase
  .from('customers')
  .update({
    phone: '+49 123 456789',
    notes: 'Stammkunde seit 2020'
  })
  .eq('id', customerId)
  .select()
  .single()
```

### Kunden löschen (Soft Delete)

```typescript
const { error } = await supabase
  .from('customers')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', customerId)
```

---

## 3. Projekte API

### Projekte mit Kundendaten

```typescript
const { data: projects, error } = await supabase
  .from('projects')
  .select(`
    *,
    customer:customers (
      id,
      first_name,
      last_name,
      company_name
    )
  `)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
```

### Projekte nach Status filtern

```typescript
const { data: activeProjects, error } = await supabase
  .from('projects')
  .select('*')
  .in('status', ['accepted', 'in_progress'])
  .is('deleted_at', null)
```

### Projekt erstellen

```typescript
const { data: project, error } = await supabase
  .from('projects')
  .insert({
    customer_id: customerId,
    title: 'Elektroinstallation Bad',
    description: 'Komplette Neuinstallation im Badezimmer',
    status: 'inquiry',
    estimated_value: 2500.00
  })
  .select()
  .single()
```

### Projektstatus ändern

```typescript
const { error } = await supabase
  .from('projects')
  .update({ 
    status: 'in_progress',
    actual_start: new Date().toISOString().split('T')[0]
  })
  .eq('id', projectId)
```

---

## 4. Angebote API

### Angebot mit Positionen abrufen

```typescript
const { data: quote, error } = await supabase
  .from('quotes')
  .select(`
    *,
    customer:customers (*),
    project:projects (*),
    line_items (*)
  `)
  .eq('id', quoteId)
  .single()
```

### Neues Angebot erstellen

```typescript
// 1. Nächste Angebotsnummer holen
const { data: profile } = await supabase
  .from('profiles')
  .select('quote_prefix, next_quote_number')
  .single()

const quoteNumber = `${profile.quote_prefix}-${new Date().getFullYear()}-${String(profile.next_quote_number).padStart(4, '0')}`

// 2. Angebot erstellen
const { data: quote, error } = await supabase
  .from('quotes')
  .insert({
    customer_id: customerId,
    project_id: projectId,
    quote_number: quoteNumber,
    quote_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    intro_text: 'Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot:',
    outro_text: 'Dieses Angebot ist 30 Tage gültig.'
  })
  .select()
  .single()

// 3. Nummer hochzählen
await supabase
  .from('profiles')
  .update({ next_quote_number: profile.next_quote_number + 1 })
```

### Positionen zum Angebot hinzufügen

```typescript
const { error } = await supabase
  .from('line_items')
  .insert([
    {
      quote_id: quoteId,
      position_number: 1,
      title: 'Steckdose installieren',
      description: 'Unterputz-Steckdose inkl. Rahmen und Material',
      quantity: 3,
      unit: 'Stk.',
      unit_price: 45.00,
      vat_rate: 19.00
    },
    {
      quote_id: quoteId,
      position_number: 2,
      title: 'Arbeitsstunde Elektriker',
      quantity: 2,
      unit: 'Std.',
      unit_price: 65.00,
      vat_rate: 19.00
    }
  ])
```

### Angebotssummen berechnen

```typescript
// Edge Function oder Client-seitig
async function calculateQuoteTotals(quoteId: string) {
  const { data: lineItems } = await supabase
    .from('line_items')
    .select('line_total, vat_rate')
    .eq('quote_id', quoteId)
  
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
  const vatAmount = lineItems.reduce((sum, item) => 
    sum + (item.line_total * item.vat_rate / 100), 0
  )
  const total = subtotal + vatAmount
  
  await supabase
    .from('quotes')
    .update({ subtotal, vat_amount: vatAmount, total })
    .eq('id', quoteId)
  
  return { subtotal, vatAmount, total }
}
```

---

## 5. Rechnungen API

### Rechnung aus Angebot erstellen

```typescript
async function createInvoiceFromQuote(quoteId: string) {
  // 1. Angebot laden
  const { data: quote } = await supabase
    .from('quotes')
    .select(`*, line_items (*)`)
    .eq('id', quoteId)
    .single()
  
  // 2. Rechnungsnummer holen
  const { data: profile } = await supabase
    .from('profiles')
    .select('invoice_prefix, next_invoice_number, default_payment_terms, is_small_business')
    .single()
  
  const invoiceNumber = `${profile.invoice_prefix}-${new Date().getFullYear()}-${String(profile.next_invoice_number).padStart(4, '0')}`
  
  // 3. Rechnung erstellen
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + profile.default_payment_terms)
  
  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      customer_id: quote.customer_id,
      project_id: quote.project_id,
      quote_id: quoteId,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal: quote.subtotal,
      vat_amount: profile.is_small_business ? 0 : quote.vat_amount,
      total: profile.is_small_business ? quote.subtotal : quote.total,
      is_small_business: profile.is_small_business
    })
    .select()
    .single()
  
  // 4. Positionen kopieren
  const lineItemsForInvoice = quote.line_items.map(item => ({
    invoice_id: invoice.id,
    position_number: item.position_number,
    title: item.title,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    vat_rate: profile.is_small_business ? 0 : item.vat_rate,
    discount_percent: item.discount_percent
  }))
  
  await supabase.from('line_items').insert(lineItemsForInvoice)
  
  // 5. Nummer hochzählen
  await supabase
    .from('profiles')
    .update({ next_invoice_number: profile.next_invoice_number + 1 })
  
  // 6. Projekt auf "invoiced" setzen
  if (quote.project_id) {
    await supabase
      .from('projects')
      .update({ status: 'invoiced' })
      .eq('id', quote.project_id)
  }
  
  return invoice
}
```

### Zahlungseingang verbuchen

```typescript
async function markInvoiceAsPaid(invoiceId: string, amount: number) {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total, amount_paid')
    .eq('id', invoiceId)
    .single()
  
  const newAmountPaid = invoice.amount_paid + amount
  const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial'
  
  await supabase
    .from('invoices')
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date().toISOString() : null
    })
    .eq('id', invoiceId)
}
```

### Überfällige Rechnungen prüfen

```typescript
const { data: overdueInvoices } = await supabase
  .from('invoices')
  .select(`
    *,
    customer:customers (first_name, last_name, company_name, email)
  `)
  .eq('status', 'sent')
  .lt('due_date', new Date().toISOString().split('T')[0])
```

---

## 6. Termine API

### Termine für Zeitraum

```typescript
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    *,
    customer:customers (first_name, last_name, company_name),
    project:projects (title)
  `)
  .gte('start_time', startDate.toISOString())
  .lte('end_time', endDate.toISOString())
  .order('start_time')
```

### Heutige Termine

```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

const { data: todayAppointments } = await supabase
  .from('appointments')
  .select('*, customer:customers (*)')
  .gte('start_time', today.toISOString())
  .lt('start_time', tomorrow.toISOString())
  .order('start_time')
```

---

## 7. Dashboard Statistiken

### Offene Beträge

```typescript
const { data, error } = await supabase
  .from('invoices')
  .select('total, amount_paid')
  .in('status', ['sent', 'partial', 'overdue'])

const openAmount = data.reduce((sum, inv) => 
  sum + (inv.total - inv.amount_paid), 0
)
```

### Monatsumsatz

```typescript
const startOfMonth = new Date()
startOfMonth.setDate(1)
startOfMonth.setHours(0, 0, 0, 0)

const { data: monthlyRevenue } = await supabase
  .from('invoices')
  .select('total')
  .eq('status', 'paid')
  .gte('paid_at', startOfMonth.toISOString())

const total = monthlyRevenue.reduce((sum, inv) => sum + inv.total, 0)
```

---

## 8. Realtime Subscriptions

### Neue Nachrichten/Änderungen

```typescript
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'invoices',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Invoice changed:', payload)
      // UI aktualisieren
    }
  )
  .subscribe()

// Cleanup
return () => {
  supabase.removeChannel(channel)
}
```

---

## 9. Edge Functions

### PDF generieren (Beispiel)

```typescript
// supabase/functions/generate-invoice-pdf/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { invoiceId } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  // Rechnungsdaten laden
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`*, customer:customers (*), line_items (*)`)
    .eq('id', invoiceId)
    .single()
  
  // PDF generieren (z.B. mit jsPDF oder externem Service)
  // ...
  
  return new Response(JSON.stringify({ pdf: base64Pdf }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 10. Error Handling

### Standard Error Handler

```typescript
import { PostgrestError } from '@supabase/supabase-js'

function handleSupabaseError(error: PostgrestError | null): string | null {
  if (!error) return null
  
  // Bekannte Fehler
  const errorMessages: Record<string, string> = {
    '23505': 'Dieser Eintrag existiert bereits.',
    '23503': 'Verknüpfte Daten existieren noch.',
    '42501': 'Keine Berechtigung für diese Aktion.',
    'PGRST116': 'Keine Ergebnisse gefunden.'
  }
  
  return errorMessages[error.code] || `Fehler: ${error.message}`
}
```

### React Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Query
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .is('deleted_at', null)
      
      if (error) throw error
      return data
    }
  })
}

// Mutation
export function useCreateCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })
}
```
