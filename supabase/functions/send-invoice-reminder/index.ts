// Edge Function: send-invoice-reminder
// Sendet Zahlungserinnerungen für überfällige Rechnungen
// 
// ============================================================
// ANLEITUNG: Kopiere ALLES in Supabase Dashboard → Edge Functions → New Function → "send-invoice-reminder"
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
// CORS HEADERS (inline - keine externen Imports)
// ============================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================================
// HELPER: Datum formatieren
// ============================================================
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE')
}

// ============================================================
// HELPER: Währung formatieren
// ============================================================
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

// ============================================================
// HELPER: Zahlungserinnerung HTML generieren
// ============================================================
function generateReminderEmail(invoice: any, daysOverdue: number): string {
  const customerName = invoice.customer.company_name || 
    `${invoice.customer.first_name} ${invoice.customer.last_name}`
  const companyName = invoice.profile?.company_name || 'Ihr Dienstleister'
  const urgencyColor = daysOverdue > 14 ? '#dc2626' : '#f59e0b'

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #e8f5f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background-color: ${urgencyColor}; padding: 24px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Zahlungserinnerung</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Sehr geehrte/r ${customerName},
              </p>
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                dies ist eine ${daysOverdue > 14 ? 'zweite' : 'freundliche'} Erinnerung an die offene Rechnung:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px;"><strong>Rechnungsnummer:</strong></td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${invoice.invoice_number}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px;"><strong>Rechnungsdatum:</strong></td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${formatDate(invoice.issue_date)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px;"><strong>Fällig seit:</strong></td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${formatDate(invoice.due_date)} (${daysOverdue} Tage)</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px;"><strong>Offener Betrag:</strong></td>
                        <td style="padding: 8px 0; color: ${urgencyColor}; font-size: 18px; font-weight: bold; text-align: right;">${formatCurrency(invoice.total_gross)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Bitte überweisen Sie den offenen Betrag zeitnah auf das in der Rechnung angegebene Konto.
              </p>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie diese E-Mail bitte als gegenstandslos.
              </p>
              <p style="margin: 24px 0 0 0; color: #374151; font-size: 16px;">
                Mit freundlichen Grüßen<br><strong>${companyName}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 16px 40px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Diese E-Mail wurde automatisch versendet.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async (req) => {
  // CORS Preflight
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
      if (data) invoices = [data]

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
      // Skip wenn Kunde keine E-Mail hat
      if (!invoice.customer?.email) {
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          sent: false,
          reason: 'No customer email'
        })
        continue
      }

      // Tage überfällig berechnen
      const daysOverdue = Math.floor(
        (Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      // E-Mail generieren
      const emailHtml = generateReminderEmail(invoice, daysOverdue)

      // E-Mail senden
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

      const sent = emailResponse.ok

      if (sent) {
        // Rechnung als "Erinnerung gesendet" markieren
        await supabase
          .from('invoices')
          .update({
            reminder_sent_at: new Date().toISOString(),
            reminder_count: (invoice.reminder_count || 0) + 1,
          })
          .eq('id', invoice.id)
      }

      results.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        sent: sent,
        daysOverdue: daysOverdue
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
