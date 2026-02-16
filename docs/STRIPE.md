# Stripe-Integration – Handwerker-CRM

## Übersicht

Das Handwerker-CRM nutzt **Stripe** für alle Zahlungen und Abonnements. Diese Dokumentation beschreibt die vollständige Integration.

---

## Architektur

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend       │     │   Next.js API    │     │     Stripe       │
│   (React)        │────▶│   Routes         │────▶│                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                │                          │
                                │                          │
                                ▼                          │
                         ┌──────────────────┐              │
                         │    Supabase      │◀─────────────┘
                         │   (Webhooks)     │    Webhook Events
                         └──────────────────┘
```

---

## Environment Variables

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxx           # Produktiv
STRIPE_PUBLISHABLE_KEY=pk_live_xxx      # Produktiv (für Client)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Webhook
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs (in Stripe Dashboard erstellt)
STRIPE_PRICE_HANDWERKER_MONTHLY=price_xxx
STRIPE_PRICE_HANDWERKER_YEARLY=price_xxx
STRIPE_PRICE_MEISTER_MONTHLY=price_xxx
STRIPE_PRICE_MEISTER_YEARLY=price_xxx

# Customer Portal
STRIPE_CUSTOMER_PORTAL_CONFIG=bpc_xxx
```

**Für Entwicklung (Test-Modus):**
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Stripe Dashboard Setup

### 1. Produkte & Preise erstellen

**Produkt: Handwerker**
```
Name: Handwerker
Beschreibung: Unbegrenzte Kunden & Rechnungen

Preis 1 (Monatlich):
  - ID: price_handwerker_monthly
  - Betrag: 29,00 €
  - Intervall: Monatlich
  
Preis 2 (Jährlich):
  - ID: price_handwerker_yearly
  - Betrag: 290,00 €
  - Intervall: Jährlich
  - (17% Rabatt gegenüber monatlich)
```

**Produkt: Meister**
```
Name: Meister
Beschreibung: Team-Funktionen & Premium-Support

Preis 1 (Monatlich):
  - ID: price_meister_monthly
  - Betrag: 59,00 €
  - Intervall: Monatlich
  
Preis 2 (Jährlich):
  - ID: price_meister_yearly
  - Betrag: 590,00 €
  - Intervall: Jährlich
```

### 2. Customer Portal konfigurieren

Settings → Billing → Customer Portal:
- ✅ Rechnungen einsehen
- ✅ Zahlungsmethode ändern
- ✅ Plan upgraden/downgraden
- ✅ Abo kündigen
- Kündigungsfrist: Sofort zum Periodenende

### 3. Webhooks einrichten

Endpoint URL: `https://your-domain.de/api/webhooks/stripe`

**Events auswählen:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.created`
- `customer.updated`

---

## API Routes

### POST `/api/stripe/create-checkout-session`

Erstellt eine Stripe Checkout Session für den Upgrade.

```typescript
// app/api/stripe/create-checkout-session/route.ts
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { priceId, billingCycle } = await request.json()
  
  // Prüfe ob User bereits Stripe Customer ist
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()
  
  let customerId = subscription?.stripe_customer_id
  
  // Erstelle Stripe Customer falls nicht vorhanden
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id
      }
    })
    customerId = customer.id
    
    // Speichere Customer ID
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      plan_id: 'starter',
      status: 'active'
    })
  }
  
  // Erstelle Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card', 'sepa_debit'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/einstellungen/abo?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/einstellungen/abo?canceled=true`,
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        supabase_user_id: user.id,
        billing_cycle: billingCycle
      }
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    locale: 'de'
  })
  
  return NextResponse.json({ sessionId: session.id, url: session.url })
}
```

### POST `/api/stripe/create-portal-session`

Erstellt einen Link zum Stripe Customer Portal.

```typescript
// app/api/stripe/create-portal-session/route.ts
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()
  
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/einstellungen/abo`
  })
  
  return NextResponse.json({ url: session.url })
}
```

### POST `/api/webhooks/stripe`

Verarbeitet Stripe Webhook Events.

```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

// Service Role Client für Webhook (keine RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!
  
  let event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  // Event loggen
  await supabaseAdmin.from('subscription_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event.data.object
  })
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
        
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
    }
    
    // Event als verarbeitet markieren
    await supabaseAdmin
      .from('subscription_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id)
      
  } catch (err) {
    console.error('Webhook handler error:', err)
    await supabaseAdmin
      .from('subscription_events')
      .update({ error_message: err.message })
      .eq('stripe_event_id', event.id)
  }
  
  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata.supabase_user_id
  const subscription = await stripe.subscriptions.retrieve(session.subscription)
  
  // Plan aus Price ID ableiten
  const priceId = subscription.items.data[0].price.id
  let planId = 'starter'
  
  if (priceId.includes('handwerker')) planId = 'handwerker'
  if (priceId.includes('meister')) planId = 'meister'
  
  await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_id: planId,
    billing_cycle: session.metadata.billing_cycle || 'monthly',
    status: subscription.status,
    trial_start: subscription.trial_start 
      ? new Date(subscription.trial_start * 1000).toISOString() 
      : null,
    trial_end: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString() 
      : null,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
  })
  
  // Profil aktualisieren
  await supabaseAdmin.from('profiles').update({
    subscription_tier: planId,
    subscription_valid_until: new Date(subscription.current_period_end * 1000).toISOString()
  }).eq('id', userId)
}

async function handleSubscriptionUpdated(subscription: any) {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()
  
  if (!data) return
  
  const priceId = subscription.items.data[0].price.id
  let planId = 'starter'
  if (priceId.includes('handwerker')) planId = 'handwerker'
  if (priceId.includes('meister')) planId = 'meister'
  
  await supabaseAdmin.from('subscriptions').update({
    stripe_price_id: priceId,
    plan_id: planId,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at 
      ? new Date(subscription.canceled_at * 1000).toISOString() 
      : null
  }).eq('stripe_subscription_id', subscription.id)
  
  // Profil sync
  await supabaseAdmin.from('profiles').update({
    subscription_tier: planId,
    subscription_valid_until: new Date(subscription.current_period_end * 1000).toISOString()
  }).eq('id', data.user_id)
}

async function handleSubscriptionDeleted(subscription: any) {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()
  
  if (!data) return
  
  // Downgrade auf Starter
  await supabaseAdmin.from('subscriptions').update({
    plan_id: 'starter',
    status: 'canceled',
    canceled_at: new Date().toISOString()
  }).eq('stripe_subscription_id', subscription.id)
  
  await supabaseAdmin.from('profiles').update({
    subscription_tier: 'starter',
    subscription_valid_until: null
  }).eq('id', data.user_id)
}

async function handleInvoicePaid(invoice: any) {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, id')
    .eq('stripe_customer_id', invoice.customer)
    .single()
  
  if (!data) return
  
  await supabaseAdmin.from('payment_history').insert({
    user_id: data.user_id,
    subscription_id: data.id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency.toUpperCase(),
    status: 'paid',
    description: invoice.lines.data[0]?.description,
    invoice_pdf_url: invoice.invoice_pdf,
    receipt_url: invoice.hosted_invoice_url,
    paid_at: new Date().toISOString()
  })
}

async function handlePaymentFailed(invoice: any) {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, id')
    .eq('stripe_customer_id', invoice.customer)
    .single()
  
  if (!data) return
  
  await supabaseAdmin.from('payment_history').insert({
    user_id: data.user_id,
    subscription_id: data.id,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_due,
    currency: invoice.currency.toUpperCase(),
    status: 'failed',
    description: 'Zahlung fehlgeschlagen'
  })
  
  // Subscription Status aktualisieren
  await supabaseAdmin.from('subscriptions').update({
    status: 'past_due'
  }).eq('stripe_customer_id', invoice.customer)
  
  // TODO: E-Mail an Nutzer senden
}
```

---

## Stripe Client Setup

```typescript
// lib/stripe.ts
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true
})
```

---

## Frontend Components

### Pricing-Karte

```typescript
// components/pricing/PricingCard.tsx
'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PricingCardProps {
  plan: 'handwerker' | 'meister'
  billingCycle: 'monthly' | 'yearly'
}

export function PricingCard({ plan, billingCycle }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  
  const prices = {
    handwerker: { monthly: 29, yearly: 290 },
    meister: { monthly: 59, yearly: 590 }
  }
  
  const priceIds = {
    handwerker: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HANDWERKER_MONTHLY,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HANDWERKER_YEARLY
    },
    meister: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MEISTER_MONTHLY,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MEISTER_YEARLY
    }
  }
  
  const handleCheckout = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: priceIds[plan][billingCycle],
          billingCycle
        })
      })
      
      const { url } = await response.json()
      
      // Redirect zu Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-2xl font-bold capitalize">{plan}</h3>
      <div className="mt-4">
        <span className="text-4xl font-bold">
          €{prices[plan][billingCycle]}
        </span>
        <span className="text-gray-500">
          /{billingCycle === 'monthly' ? 'Monat' : 'Jahr'}
        </span>
      </div>
      
      {billingCycle === 'yearly' && (
        <p className="text-green-600 text-sm mt-2">
          17% Rabatt gegenüber monatlich
        </p>
      )}
      
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full mt-6 bg-primary-500 text-white py-3 px-6 rounded-xl
                   hover:bg-primary-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Wird geladen...' : '14 Tage kostenlos testen'}
      </button>
    </div>
  )
}
```

### Abo-Verwaltung

```typescript
// components/settings/SubscriptionManager.tsx
'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'

export function SubscriptionManager() {
  const { subscription, loading } = useSubscription()
  const [portalLoading, setPortalLoading] = useState(false)
  
  const openCustomerPortal = async () => {
    setPortalLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST'
      })
      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setPortalLoading(false)
    }
  }
  
  if (loading) return <div>Laden...</div>
  
  return (
    <div className="bg-white rounded-xl p-6">
      <h2 className="text-xl font-semibold">Dein Abo</h2>
      
      <div className="mt-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Plan</span>
          <span className="font-medium capitalize">{subscription?.plan_id}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Status</span>
          <StatusBadge status={subscription?.status} />
        </div>
        
        {subscription?.current_period_end && (
          <div className="flex justify-between">
            <span className="text-gray-600">Nächste Zahlung</span>
            <span>{formatDate(subscription.current_period_end)}</span>
          </div>
        )}
        
        {subscription?.cancel_at_period_end && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
            Dein Abo wird am {formatDate(subscription.current_period_end)} beendet.
          </div>
        )}
      </div>
      
      <button
        onClick={openCustomerPortal}
        disabled={portalLoading}
        className="mt-6 w-full border border-gray-300 py-2 px-4 rounded-lg
                   hover:bg-gray-50 transition-colors"
      >
        {portalLoading ? 'Wird geladen...' : 'Abo verwalten'}
      </button>
    </div>
  )
}
```

---

## Subscription Hook

```typescript
// hooks/useSubscription.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Subscription {
  plan_id: string
  status: string
  billing_cycle: string
  current_period_end: string
  cancel_at_period_end: boolean
  trial_end: string | null
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const supabase = createClient()
    
    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setSubscription(data)
      setLoading(false)
    }
    
    fetchSubscription()
    
    // Realtime Updates
    const channel = supabase
      .channel('subscription-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions'
      }, (payload) => {
        setSubscription(payload.new as Subscription)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  // Helper für Feature-Checks
  const isPaid = subscription?.plan_id !== 'starter'
  const canUseLogo = isPaid
  const canSendEmail = isPaid
  const canUseTeam = subscription?.plan_id === 'meister'
  const isTrialing = subscription?.status === 'trialing'
  const isCanceled = subscription?.cancel_at_period_end
  
  return {
    subscription,
    loading,
    isPaid,
    canUseLogo,
    canSendEmail,
    canUseTeam,
    isTrialing,
    isCanceled
  }
}
```

---

## Testing

### Stripe CLI für lokales Testen

```bash
# Installieren
brew install stripe/stripe-cli/stripe

# Einloggen
stripe login

# Webhooks an localhost weiterleiten
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test-Events senden
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted
```

### Test-Karten

| Nummer | Ergebnis |
|--------|----------|
| 4242 4242 4242 4242 | Erfolg |
| 4000 0000 0000 0002 | Karte abgelehnt |
| 4000 0000 0000 3220 | 3D Secure erforderlich |

**SEPA Test-IBAN:** DE89370400440532013000

---

## Checkliste vor Go-Live

- [ ] Live-Keys in Produktions-Environment
- [ ] Webhook-Endpoint verifiziert
- [ ] Customer Portal konfiguriert
- [ ] Testbestellung durchgeführt
- [ ] Kündigungs-Flow getestet
- [ ] Zahlungsfehlschlag getestet
- [ ] E-Mail-Benachrichtigungen konfiguriert
- [ ] Steuereinstellungen (EU VAT) geprüft
