// Edge Function: generate-pdf
// Generiert PDFs für Angebote und Rechnungen
// 
// ============================================================
// ANLEITUNG: Kopiere ALLES in Supabase Dashboard → Edge Functions → New Function → "generate-pdf"
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

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
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// ============================================================
// HELPER: Währung formatieren
// ============================================================
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount || 0)
}

// ============================================================
// HELPER: PDF generieren
// ============================================================
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
  const primaryColor = rgb(0.106, 0.302, 0.537) // #1b4d89
  let y = height - 50

  // === HEADER ===
  page.drawText(profile?.company_name || 'Firma', {
    x: 50, y, size: 20, font: fontBold, color: primaryColor,
  })
  y -= 25

  // Firmenadresse (klein, rechts oben)
  const companyLines = [
    profile?.street ? `${profile.street} ${profile.house_number || ''}`.trim() : '',
    profile?.postal_code && profile?.city ? `${profile.postal_code} ${profile.city}` : '',
    profile?.phone ? `Tel: ${profile.phone}` : '',
    profile?.email || ''
  ].filter(Boolean)

  let headerY = height - 50
  for (const line of companyLines) {
    page.drawText(line, { x: 400, y: headerY, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
    headerY -= 12
  }

  y -= 20

  // === EMPFÄNGER ===
  const customerLines = [
    customer?.company_name,
    [customer?.first_name, customer?.last_name].filter(Boolean).join(' '),
    customer?.street,
    [customer?.postal_code, customer?.city].filter(Boolean).join(' ')
  ].filter(Boolean)

  for (const line of customerLines) {
    page.drawText(String(line), { x: 50, y, size: 11, font })
    y -= 14
  }

  y -= 30

  // === TITEL ===
  const docNumber = type === 'invoice' ? document.invoice_number : document.quote_number
  const title = type === 'invoice' ? `Rechnung ${docNumber}` : `Angebot ${docNumber}`

  page.drawText(title, { x: 50, y, size: 18, font: fontBold, color: primaryColor })
  y -= 25

  // Datum
  const dateLabel = type === 'invoice' ? 'Rechnungsdatum' : 'Angebotsdatum'
  const issueDate = document.issue_date || document.created_at
  page.drawText(`${dateLabel}: ${formatDate(issueDate)}`, {
    x: 50, y, size: 10, font, color: rgb(0.3, 0.3, 0.3)
  })

  if (type === 'invoice' && document.due_date) {
    page.drawText(`Fällig bis: ${formatDate(document.due_date)}`, {
      x: 250, y, size: 10, font, color: rgb(0.3, 0.3, 0.3)
    })
  }

  y -= 35

  // === POSITIONEN HEADER ===
  page.drawText('Pos.', { x: 50, y, size: 9, font: fontBold })
  page.drawText('Beschreibung', { x: 80, y, size: 9, font: fontBold })
  page.drawText('Menge', { x: 340, y, size: 9, font: fontBold })
  page.drawText('Preis', { x: 400, y, size: 9, font: fontBold })
  page.drawText('Gesamt', { x: 480, y, size: 9, font: fontBold })

  y -= 5
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 15

  // === POSITIONEN ===
  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i]
    
    page.drawText(`${i + 1}`, { x: 50, y, size: 10, font })
    
    const desc = (item.description || '').substring(0, 45)
    page.drawText(desc, { x: 80, y, size: 10, font })
    
    page.drawText(`${item.quantity} ${item.unit || 'Stk'}`, { x: 340, y, size: 10, font })
    page.drawText(formatCurrency(item.unit_price), { x: 400, y, size: 10, font })
    page.drawText(formatCurrency(item.total || item.quantity * item.unit_price), { x: 480, y, size: 10, font })

    y -= 18

    if (y < 150) break // Seitenumbruch verhindern (vereinfacht)
  }

  y -= 10
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 20

  // === SUMMEN ===
  const subtotal = document.subtotal || lineItems.reduce((sum, item) => sum + (item.total || item.quantity * item.unit_price), 0)
  
  page.drawText('Netto:', { x: 400, y, size: 10, font })
  page.drawText(formatCurrency(subtotal), { x: 480, y, size: 10, font })
  y -= 14

  // MwSt. nur wenn kein Kleinunternehmer
  if (!profile?.is_small_business && document.tax_amount) {
    const vatRate = document.vat_rate || 19
    page.drawText(`MwSt. (${vatRate}%):`, { x: 400, y, size: 10, font })
    page.drawText(formatCurrency(document.tax_amount), { x: 480, y, size: 10, font })
    y -= 14
  }

  // Gesamtsumme
  page.drawText('Gesamt:', { x: 400, y, size: 12, font: fontBold })
  page.drawText(formatCurrency(document.total_gross || subtotal), { 
    x: 480, y, size: 12, font: fontBold, color: primaryColor 
  })

  // === KLEINUNTERNEHMER HINWEIS ===
  if (profile?.is_small_business) {
    y -= 40
    page.drawText('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.', {
      x: 50, y, size: 9, font, color: rgb(0.4, 0.4, 0.4)
    })
  }

  // === BANKVERBINDUNG (Footer) ===
  y = 100
  page.drawLine({ start: { x: 50, y: y + 15 }, end: { x: 545, y: y + 15 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) })

  page.drawText('Bankverbindung:', { x: 50, y, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 12
  
  const bankInfo = [
    profile?.bank_name,
    profile?.iban ? `IBAN: ${profile.iban}` : null,
    profile?.bic ? `BIC: ${profile.bic}` : null
  ].filter(Boolean).join(' | ')
  
  page.drawText(bankInfo || 'Bankverbindung siehe Impressum', {
    x: 50, y, size: 9, font, color: rgb(0.4, 0.4, 0.4)
  })

  return pdfDoc.save()
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
    const { type, id } = await req.json() // type: 'invoice' | 'quote'

    if (!type || !id) {
      return new Response(
        JSON.stringify({ error: 'type and id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Auth prüfen
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Daten laden
    let document, lineItems, customer

    if (type === 'invoice') {
      const { data, error } = await supabase
        .from('invoices')
        .select(`*, customer:customers(*), line_items(*)`)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Invoice not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      document = data
      lineItems = data.line_items || []
      customer = data.customer

    } else if (type === 'quote') {
      const { data, error } = await supabase
        .from('quotes')
        .select(`*, customer:customers(*), line_items(*)`)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Quote not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      document = data
      lineItems = data.line_items || []
      customer = data.customer
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Use "invoice" or "quote"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Profil laden
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // PDF generieren
    const pdfBytes = await generatePDF(type, document, lineItems, profile, customer)

    // Als Base64 zurückgeben
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)))
    const docNumber = type === 'invoice' ? document.invoice_number : document.quote_number
    const prefix = type === 'invoice' ? 'Rechnung' : 'Angebot'

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: base64,
        filename: `${prefix}_${docNumber}.pdf`,
        mimeType: 'application/pdf'
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
