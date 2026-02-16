# Edge Functions – SaaS Blueprint

> **⚠️ ANPASSEN ERFORDERLICH!**
> 
> Ersetze in den E-Mail-Templates:
> - `Handwerker-CRM` → `{{APP_NAME}}`
> - `handwerker-crm.de` → `{{APP_DOMAIN}}`
> - Farben → deine Farben aus CONFIG.md

## Übersicht

Alle Supabase Edge Functions für die App. Diese werden über den eigenen SMTP-Server für E-Mail-Versand und für Backend-Logik genutzt.

> **📁 Jede Edge Function hat eine eigene Datei!**
> 
> Die Dateien findest du im Ordner `supabase/functions/[name]/index.ts`.
> Den Inhalt kannst du direkt über den Browser in Supabase einfügen:
> 
> **Supabase Dashboard → Edge Functions → New Function → Code einfügen → Deploy**

> **✅ Alle Functions sind eigenständig!**
> 
> CORS-Header und alle Hilfsfunktionen sind **inline** enthalten.
> Es gibt keine externen Imports aus anderen Dateien – einfach kopieren und fertig!

---

## Verzeichnisstruktur & Dateien

```
supabase/
└── functions/
    ├── send-email/index.ts              # Generischer E-Mail-Versand
    ├── send-welcome-email/index.ts      # Willkommens-E-Mail nach Registrierung
    ├── send-invoice-reminder/index.ts   # Zahlungserinnerungen
    ├── delete-account/index.ts          # Account-Löschung (DSGVO)
    ├── cleanup-demo/index.ts            # Cron: Demo-Sessions aufräumen
    ├── generate-pdf/index.ts            # PDF-Generierung für Angebote/Rechnungen
    ├── process-email-queue/index.ts     # Cron: E-Mail-Queue verarbeiten
    ├── stripe-webhook/index.ts          # 🔥 Stripe Webhook Handler
    ├── create-checkout-session/index.ts # 🔥 Stripe Checkout erstellen
    └── create-portal-session/index.ts   # 🔥 Stripe Kundenportal öffnen
```

---

## Schnell-Anleitung: Function in Supabase erstellen

1. **Supabase Dashboard** öffnen → **Edge Functions**
2. Klicke **New Function**
3. **Name** eingeben (z.B. `send-email`)
4. **Code** aus der Datei `supabase/functions/send-email/index.ts` kopieren
5. Code in den Editor einfügen
6. **Deploy** klicken
7. **Secrets** konfigurieren (siehe unten)

---

## Secrets konfigurieren

**Supabase Dashboard → Edge Functions → Manage Secrets**

| Secret | Wert | Beschreibung |
|--------|------|--------------|
| `SMTP_HOST` | `mail.dein-server.de` | SMTP Server |
| `SMTP_PORT` | `587` | SMTP Port (587 für TLS) |
| `SMTP_USER` | `noreply@handwerker-crm.de` | SMTP Benutzername |
| `SMTP_PASSWORD` | `xxx` | SMTP Passwort |
| `SMTP_FROM_EMAIL` | `noreply@handwerker-crm.de` | Absender E-Mail |
| `SMTP_FROM_NAME` | `Handwerker-CRM` | Absender Name |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` | Stripe Secret Key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` | Stripe Webhook Signing Secret |
| `STRIPE_PRICE_HANDWERKER_MONTHLY` | `price_xxx` | Price ID Handwerker Monatlich |
| `STRIPE_PRICE_HANDWERKER_YEARLY` | `price_xxx` | Price ID Handwerker Jährlich |
| `STRIPE_PRICE_MEISTER_MONTHLY` | `price_xxx` | Price ID Meister Monatlich |
| `STRIPE_PRICE_MEISTER_YEARLY` | `price_xxx` | Price ID Meister Jährlich |
| `APP_URL` | `https://handwerker-crm.de` | App URL für Redirects |

---

## ⚠️ WICHTIG: Stripe Functions Setup

Die Stripe Functions sind **essentiell** für die Abo-Verwaltung!

### Reihenfolge beim Setup:

1. **Zuerst:** Stripe Products & Prices erstellen
2. **Dann:** Price IDs als Secrets speichern
3. **Dann:** Edge Functions deployen
4. **Zuletzt:** Webhook URL in Stripe konfigurieren

### Stripe Webhook einrichten:

1. Stripe Dashboard → Developers → Webhooks → **Add Endpoint**
2. URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Events auswählen:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. **Signing Secret** kopieren → als `STRIPE_WEBHOOK_SECRET` speichern

---

## Functions im Detail

### 1. send-email

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, replyTo }: EmailRequest = await req.json()

    // Validierung
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SMTP Request
    const smtpResponse = await sendViaSMTP({
      to,
      subject,
      html,
      text: text || stripHtml(html),
      replyTo
    })

    if (!smtpResponse.success) {
      throw new Error(smtpResponse.error)
    }

    return new Response(
      JSON.stringify({ success: true, messageId: smtpResponse.messageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email send error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendViaSMTP(params: {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}) {
  const SMTP_HOST = Deno.env.get('SMTP_HOST')!
  const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587'
  const SMTP_USER = Deno.env.get('SMTP_USER')!
  const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')!
  const SMTP_FROM_EMAIL = Deno.env.get('SMTP_FROM_EMAIL')!
  const SMTP_FROM_NAME = Deno.env.get('SMTP_FROM_NAME') || 'Handwerker-CRM'

  // Verwende nodemailer-kompatible SMTP API oder direkten SMTP
  // Beispiel mit externem SMTP-Relay wie Resend, Postmark, oder eigenem Server
  
  const response = await fetch(`https://${SMTP_HOST}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SMTP_PASSWORD}`,
    },
    body: JSON.stringify({
      from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    return { success: false, error }
  }

  const data = await response.json()
  return { success: true, messageId: data.id }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
```

---

## 2. Willkommens-E-Mail nach Registrierung

### send-welcome-email/index.ts

```typescript
// supabase/functions/send-welcome-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Profil laden
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email, owner_name, company_name')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      throw new Error('Profile not found')
    }

    // Willkommens-E-Mail senden
    const emailHtml = generateWelcomeEmail(profile.owner_name, profile.company_name)

    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: profile.email,
        subject: 'Willkommen bei Handwerker-CRM! 🎉',
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      throw new Error('Failed to send welcome email')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Welcome email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateWelcomeEmail(ownerName: string, companyName?: string): string {
  const name = ownerName || 'Handwerker'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1b4d89 0%, #2a6ab8 100%); color: white; padding: 30px; text-align: center; }
    .content { background: #ffffff; padding: 30px; }
    .step { display: flex; align-items: flex-start; margin: 20px 0; }
    .step-number { background: #f9e45b; color: #1b4d89; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
    .button { display: inline-block; background: #1b4d89; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #666; font-size: 12px; }
    .tip { background: #e8f5f2; border-left: 4px solid #6db784; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Willkommen bei Handwerker-CRM!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Vom Anruf zur Rechnung in 3 Klicks</p>
    </div>
    
    <div class="content">
      <p>Hallo ${name},</p>
      
      <p>schön, dass du dabei bist! ${companyName ? `Wir freuen uns, <strong>${companyName}</strong> bei uns begrüßen zu dürfen.` : ''}</p>
      
      <p>Mit Handwerker-CRM wird deine Büroarbeit zum Kinderspiel. Hier sind deine ersten Schritte:</p>
      
      <div class="step">
        <div class="step-number">1</div>
        <div>
          <strong>Profil vervollständigen</strong><br>
          Füge dein Logo und deine Firmendaten hinzu, damit deine Angebote und Rechnungen professionell aussehen.
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">2</div>
        <div>
          <strong>Ersten Kunden anlegen</strong><br>
          Erstelle deinen ersten Kundeneintrag – Name, Adresse, Telefon – mehr braucht es nicht.
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">3</div>
        <div>
          <strong>Erstes Angebot schreiben</strong><br>
          Erstelle ein Angebot, exportiere es als PDF und versende es direkt per E-Mail.
        </div>
      </div>
      
      <div class="tip">
        <strong>💡 Tipp:</strong> Lege Leistungsvorlagen an (z.B. "Steckdose installieren – 45€"), um Angebote noch schneller zu erstellen!
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://handwerker-crm.de/dashboard" class="button">Zum Dashboard →</a>
      </p>
      
      <p>Bei Fragen erreichst du uns jederzeit unter <a href="mailto:support@handwerker-crm.de">support@handwerker-crm.de</a>.</p>
      
      <p>
        Viel Erfolg!<br>
        Dein Handwerker-CRM Team
      </p>
    </div>
    
    <div class="footer">
      <p>© 2025 Handwerker-CRM | <a href="https://handwerker-crm.de/datenschutz">Datenschutz</a> | <a href="https://handwerker-crm.de/impressum">Impressum</a></p>
    </div>
  </div>
</body>
</html>
  `
}
```

---

## 3. Zahlungserinnerung

### send-invoice-reminder/index.ts

```typescript
// supabase/functions/send-invoice-reminder/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Optional: Spezifische Rechnung oder alle überfälligen
    const { invoiceId, sendToAll } = await req.json()

    let invoices = []

    if (invoiceId) {
      // Einzelne Rechnung
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(email, first_name, last_name, company_name),
          profile:profiles(company_name, email)
        `)
        .eq('id', invoiceId)
        .single()

      if (error) throw error
      invoices = [data]

    } else if (sendToAll) {
      // Alle überfälligen Rechnungen
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(email, first_name, last_name, company_name),
          profile:profiles(company_name, email)
        `)
        .eq('status', 'sent')
        .lt('due_date', new Date().toISOString())

      if (error) throw error
      invoices = data || []
    }

    const results = []

    for (const invoice of invoices) {
      if (!invoice.customer?.email) continue

      const daysOverdue = Math.floor(
        (Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      const emailHtml = generateReminderEmail(invoice, daysOverdue)

      const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          to: invoice.customer.email,
          subject: `Zahlungserinnerung: Rechnung ${invoice.invoice_number}`,
          html: emailHtml,
          replyTo: invoice.profile?.email,
        }),
      })

      // Rechnung als "Erinnerung gesendet" markieren
      await supabase
        .from('invoices')
        .update({
          reminder_sent_at: new Date().toISOString(),
          reminder_count: (invoice.reminder_count || 0) + 1,
        })
        .eq('id', invoice.id)

      results.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        sent: emailResponse.ok,
      })
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Invoice reminder error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateReminderEmail(invoice: any, daysOverdue: number): string {
  const customerName = invoice.customer.company_name || 
    `${invoice.customer.first_name} ${invoice.customer.last_name}`
  const companyName = invoice.profile?.company_name || 'Ihr Dienstleister'

  const urgency = daysOverdue > 14 ? 'zweite' : 'freundliche'
  const urgencyColor = daysOverdue > 14 ? '#dc2626' : '#f59e0b'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: ${urgencyColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .invoice-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: ${urgencyColor}; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Zahlungserinnerung</h2>
    </div>
    
    <div class="content">
      <p>Sehr geehrte/r ${customerName},</p>
      
      <p>dies ist eine ${urgency} Erinnerung an die offene Rechnung:</p>
      
      <div class="invoice-box">
        <table style="width: 100%;">
          <tr>
            <td><strong>Rechnungsnummer:</strong></td>
            <td style="text-align: right;">${invoice.invoice_number}</td>
          </tr>
          <tr>
            <td><strong>Rechnungsdatum:</strong></td>
            <td style="text-align: right;">${formatDate(invoice.issue_date)}</td>
          </tr>
          <tr>
            <td><strong>Fällig seit:</strong></td>
            <td style="text-align: right;">${formatDate(invoice.due_date)} (${daysOverdue} Tage)</td>
          </tr>
          <tr>
            <td><strong>Offener Betrag:</strong></td>
            <td style="text-align: right;" class="amount">${formatCurrency(invoice.total_gross)}</td>
          </tr>
        </table>
      </div>
      
      <p>Bitte überweisen Sie den offenen Betrag zeitnah auf das in der Rechnung angegebene Konto.</p>
      
      <p>Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie diese E-Mail bitte als gegenstandslos.</p>
      
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      
      <p>
        Mit freundlichen Grüßen<br>
        ${companyName}
      </p>
    </div>
    
    <div class="footer">
      <p>Diese E-Mail wurde automatisch versendet.</p>
    </div>
  </div>
</body>
</html>
  `
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}
```

---

## 4. Cron: Automatische Zahlungserinnerungen

### SQL für Cron Job (pg_cron)

```sql
-- migrations/025_payment_reminder_cron.sql

-- Funktion die täglich ausgeführt wird
CREATE OR REPLACE FUNCTION send_overdue_reminders()
RETURNS void AS $$
DECLARE
    v_invoice RECORD;
    v_url TEXT;
BEGIN
    -- Alle überfälligen Rechnungen die noch keine Erinnerung bekommen haben
    -- oder deren letzte Erinnerung > 7 Tage her ist
    FOR v_invoice IN
        SELECT i.id, i.invoice_number, i.due_date, i.reminder_count
        FROM invoices i
        WHERE i.status = 'sent'
        AND i.due_date < CURRENT_DATE
        AND (
            i.reminder_sent_at IS NULL
            OR i.reminder_sent_at < CURRENT_DATE - INTERVAL '7 days'
        )
        AND (i.reminder_count IS NULL OR i.reminder_count < 3)
    LOOP
        -- Edge Function aufrufen
        v_url := current_setting('app.supabase_url') || '/functions/v1/send-invoice-reminder';
        
        PERFORM net.http_post(
            url := v_url,
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object('invoiceId', v_invoice.id)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron Job: Täglich um 9:00 Uhr
SELECT cron.schedule(
    'send-overdue-reminders',
    '0 9 * * *',
    $$SELECT send_overdue_reminders()$$
);
```

---

## 5. Account Löschung

Siehe `docs/AUTH.md` Sektion 11 für die vollständige Implementation.

---

## 6. Demo Cleanup

### cleanup-demo/index.ts

```typescript
// supabase/functions/cleanup-demo/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Abgelaufene Demo-Sessions finden (älter als 30 Tage, nicht konvertiert)
    const { data: expiredSessions, error } = await supabase
      .from('demo_sessions')
      .select('id, demo_customer_ids, demo_project_ids')
      .lt('expires_at', new Date().toISOString())
      .is('converted_to_user_id', null)

    if (error) throw error

    let cleanedCount = 0

    for (const session of expiredSessions || []) {
      // Demo-Kunden löschen (CASCADE löscht auch Projekte, Angebote, etc.)
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

      cleanedCount++
    }

    console.log(`Cleaned up ${cleanedCount} expired demo sessions`)

    return new Response(
      JSON.stringify({ success: true, cleaned: cleanedCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Demo cleanup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 7. PDF-Generierung

### generate-pdf/index.ts

```typescript
// supabase/functions/generate-pdf/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// PDF-Bibliothek für Deno
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, id } = await req.json() // type: 'invoice' | 'quote'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Auth prüfen
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Daten laden
    let document, lineItems, profile, customer

    if (type === 'invoice') {
      const { data } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*),
          line_items(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      document = data
      lineItems = data?.line_items
      customer = data?.customer
    } else if (type === 'quote') {
      const { data } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customers(*),
          line_items(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      document = data
      lineItems = data?.line_items
      customer = data?.customer
    }

    if (!document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Profil laden
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    profile = profileData

    // PDF generieren
    const pdfBytes = await generatePDF(type, document, lineItems, profile, customer)

    // Als Base64 zurückgeben
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)))

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: base64,
        filename: `${type === 'invoice' ? 'Rechnung' : 'Angebot'}_${document.invoice_number || document.quote_number}.pdf`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('PDF generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generatePDF(
  type: string,
  document: any,
  lineItems: any[],
  profile: any,
  customer: any
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  let y = height - 50

  // Header
  page.drawText(profile.company_name || 'Firma', {
    x: 50,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.106, 0.302, 0.537), // #1b4d89
  })

  y -= 30

  // Firmenadresse
  const companyAddress = [
    profile.street,
    `${profile.postal_code} ${profile.city}`,
    profile.phone ? `Tel: ${profile.phone}` : null,
    profile.email,
  ].filter(Boolean)

  for (const line of companyAddress) {
    page.drawText(line, { x: 50, y, size: 10, font })
    y -= 14
  }

  y -= 20

  // Kundenadresse
  const customerAddress = [
    customer.company_name,
    `${customer.first_name} ${customer.last_name}`,
    customer.street,
    `${customer.postal_code} ${customer.city}`,
  ].filter(Boolean)

  for (const line of customerAddress) {
    page.drawText(line, { x: 50, y, size: 11, font })
    y -= 14
  }

  y -= 30

  // Dokumenttitel
  const title = type === 'invoice' 
    ? `Rechnung ${document.invoice_number}`
    : `Angebot ${document.quote_number}`

  page.drawText(title, {
    x: 50,
    y,
    size: 16,
    font: fontBold,
  })

  y -= 20

  // Datum
  page.drawText(`Datum: ${formatDate(document.issue_date || document.created_at)}`, {
    x: 50,
    y,
    size: 10,
    font,
  })

  y -= 30

  // Positionen Header
  page.drawText('Pos.', { x: 50, y, size: 10, font: fontBold })
  page.drawText('Beschreibung', { x: 80, y, size: 10, font: fontBold })
  page.drawText('Menge', { x: 320, y, size: 10, font: fontBold })
  page.drawText('Einzelpreis', { x: 380, y, size: 10, font: fontBold })
  page.drawText('Gesamt', { x: 480, y, size: 10, font: fontBold })

  y -= 5
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1 })
  y -= 15

  // Positionen
  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i]
    
    page.drawText(`${i + 1}`, { x: 50, y, size: 10, font })
    page.drawText(item.description.substring(0, 40), { x: 80, y, size: 10, font })
    page.drawText(`${item.quantity} ${item.unit}`, { x: 320, y, size: 10, font })
    page.drawText(formatCurrency(item.unit_price), { x: 380, y, size: 10, font })
    page.drawText(formatCurrency(item.total), { x: 480, y, size: 10, font })

    y -= 18
  }

  y -= 10
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1 })
  y -= 20

  // Summen
  page.drawText('Netto:', { x: 380, y, size: 10, font })
  page.drawText(formatCurrency(document.subtotal), { x: 480, y, size: 10, font })
  y -= 14

  if (!profile.is_small_business) {
    page.drawText(`MwSt. (${document.vat_rate || 19}%):`, { x: 380, y, size: 10, font })
    page.drawText(formatCurrency(document.tax_amount), { x: 480, y, size: 10, font })
    y -= 14
  }

  page.drawText('Gesamt:', { x: 380, y, size: 12, font: fontBold })
  page.drawText(formatCurrency(document.total_gross), { x: 480, y, size: 12, font: fontBold })

  // Kleinunternehmer-Hinweis
  if (profile.is_small_business) {
    y -= 40
    page.drawText('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.', {
      x: 50,
      y,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
  }

  // Bankverbindung
  y = 100
  page.drawText('Bankverbindung:', { x: 50, y, size: 9, font: fontBold })
  y -= 12
  page.drawText(`${profile.bank_name || 'Bank'} | IBAN: ${profile.iban || 'DEXX XXXX XXXX XXXX XXXX XX'}`, {
    x: 50,
    y,
    size: 9,
    font,
  })

  return pdfDoc.save()
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}
```

---

## Deployment

### Edge Functions deployen

```bash
# Einzelne Function deployen
supabase functions deploy send-email

# Alle Functions deployen
supabase functions deploy

# Mit Secrets
supabase secrets set SMTP_HOST=mail.example.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=noreply@example.com
supabase secrets set SMTP_PASSWORD=secret
supabase secrets set SMTP_FROM_EMAIL=noreply@example.com
supabase secrets set SMTP_FROM_NAME="Handwerker-CRM"
```

### Cron Jobs einrichten

```bash
# pg_cron Extension aktivieren (Supabase Dashboard → Database → Extensions)
# Dann SQL ausführen für die Cron Jobs
```

---

## Checkliste

- [ ] `send-email` Function deployed
- [ ] `send-welcome-email` Function deployed
- [ ] `send-invoice-reminder` Function deployed
- [ ] `delete-account` Function deployed
- [ ] `cleanup-demo` Function deployed
- [ ] `generate-pdf` Function deployed
- [ ] SMTP Secrets konfiguriert
- [ ] Cron Jobs aktiviert
- [ ] E-Mail-Templates getestet
- [ ] PDF-Ausgabe getestet
