/**
 * Vertragsbestätigung nach § 312f Abs. 2 BGB für Käufe in der Webanwendung.
 *
 * Sie muss den Vertragsinhalt auf einem dauerhaften Datenträger wiedergeben –
 * ein Link auf die AGB genügt dafür nicht. Deshalb enthält die Mail AGB,
 * Widerrufsbelehrung und Muster-Formular im Wortlaut, aus derselben Quelle wie
 * die Webseite (lib/legal).
 */

import { sendBrevoMail, type BrevoMailResult } from '@/lib/brevo'
import { agbBlocks } from '@/lib/legal/agb'
import { escapeHtml, legalBlocksToHtml, legalBlocksToText, type LegalBlock } from '@/lib/legal/blocks'
import { LEGAL_LAST_UPDATED, type LegalCompany, type LegalInfrastructure } from '@/lib/legal/config'
import { musterWiderrufsformularBlocks, widerrufsbelehrungBlocks } from '@/lib/legal/widerruf'

export const PRODUCT_NAME = 'Basaltemperatur – Freischaltung der Analyse (Lifetime-Zugang)'
const TIME_ZONE = 'Europe/Berlin'

export interface PurchaseConfirmationInput {
  customerEmail: string
  customerName?: string | null
  orderNumber: string
  purchasedAt: Date
  amountTotal: number
  currency: string
  earlyStartRequestedAt?: string | null
  company: LegalCompany
  infrastructure: LegalInfrastructure
  siteUrl: string
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date) + ' Uhr'
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

// §§ 187 Abs. 1, 188 Abs. 2 BGB: the period starts the day after the contract and
// ends with the 14th day, counted on the German calendar date of the purchase.
export function withdrawalDeadline(purchasedAt: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(purchasedAt)
    .split('-')
    .map(Number)
  return new Date(Date.UTC(parts[0] ?? 1970, (parts[1] ?? 1) - 1, (parts[2] ?? 1) + 14, 12))
}

export function formatAmount(amountTotal: number, currency: string): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency.toUpperCase() }).format(amountTotal / 100)
}

function summaryBlocks(input: PurchaseConfirmationInput): LegalBlock[] {
  const { company } = input
  const deadline = formatDate(withdrawalDeadline(input.purchasedAt))
  const early = input.earlyStartRequestedAt ? new Date(input.earlyStartRequestedAt) : null
  const earlyText = early && !Number.isNaN(early.getTime())
    ? `Du hast am ${formatDateTime(early)} ausdrücklich verlangt, dass wir die Analyse schon vor Ablauf der Widerrufsfrist freischalten, und bestätigt, dass du bei einem Widerruf einen anteiligen Betrag für die bis dahin bereitgestellte Zeit schuldest.`
    : 'Du hast beim Kauf verlangt, dass wir die Analyse schon vor Ablauf der Widerrufsfrist freischalten.'
  const phone = company.phone ? `, Telefon ${company.phone}` : ''

  return [
    { type: 'h2', text: 'Deine Bestellung' },
    { type: 'ul', items: [
      `**Produkt:** ${PRODUCT_NAME}`,
      `**Preis:** ${formatAmount(input.amountTotal, input.currency)} (einmalig, Endpreis; gemäß § 19 UStG wird keine Umsatzsteuer berechnet)`,
      `**Bestellnummer:** ${input.orderNumber}`,
      `**Vertragsschluss:** ${formatDateTime(input.purchasedAt)}`,
      '**Zahlung:** über Stripe',
      `**Konto:** ${input.customerEmail}`,
    ] },
    { type: 'h2', text: 'Sofortiger Beginn und Widerruf' },
    { type: 'p', text: `${earlyText} Dein Widerrufsrecht besteht trotzdem für vierzehn Tage, also bis einschließlich ${deadline}. Am einfachsten widerrufst du online unter [Vertrag widerrufen](/widerruf-ausueben) – halte dafür diese Bestellnummer bereit.` },
    { type: 'h2', text: 'Dein Vertragspartner' },
    { type: 'p', text: `${company.name}, ${company.street}, ${company.city}, ${company.country}${phone}, E-Mail [${company.email}](mailto:${company.email})` },
    { type: 'p', tone: 'small', text: 'Bitte bewahre diese E-Mail auf. Sie enthält den vollständigen Vertragsinhalt: die Widerrufsbelehrung mit Muster-Widerrufsformular und unsere Allgemeinen Geschäftsbedingungen in der Fassung, die beim Kauf galt.' },
  ]
}

function contractBlocks(input: PurchaseConfirmationInput): { belehrung: LegalBlock[]; agb: LegalBlock[] } {
  return {
    belehrung: [...widerrufsbelehrungBlocks(input.company), ...musterWiderrufsformularBlocks(input.company)],
    agb: [
      ...agbBlocks(input.company, input.infrastructure),
      { type: 'p', tone: 'small', text: `Stand: ${LEGAL_LAST_UPDATED}` },
    ],
  }
}

function section(title: string, body: string): string {
  return `<tr><td class="email-content" style="padding:8px 42px 8px;background:#FFFFFF;">
<div style="margin:24px 0 4px;padding-top:24px;border-top:2px solid #FBCFE8;color:#0F1029;font-size:22px;font-weight:800;letter-spacing:-.5px;">${escapeHtml(title)}</div>
${body}
</td></tr>`
}

export function purchaseConfirmationEmail(input: PurchaseConfirmationInput): { subject: string; html: string; text: string } {
  const subject = `Deine Bestellung bei Basaltemperatur (${input.orderNumber})`
  const greeting = input.customerName?.trim() ? `Hallo ${input.customerName.trim()},` : 'Hallo,'
  const intro = 'vielen Dank für deinen Kauf. Hiermit bestätigen wir deinen Vertrag: Die Analyse ist ab sofort in deinem Basaltemperatur-Konto freigeschaltet.'
  const summary = summaryBlocks(input)
  const { belehrung, agb } = contractBlocks(input)
  const site = input.siteUrl

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
<style>
@media only screen and (max-width:620px) {
  .email-frame { padding:0 !important; }
  .email-card { border-radius:0 !important; border-left:0 !important; border-right:0 !important; }
  .email-content { padding-left:22px !important; padding-right:22px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:#FFF1F4;color:#0F1029;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Vertragsbestätigung und Widerrufsbelehrung zu deinem Kauf</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FFF1F4;">
<tr><td class="email-frame" align="center" style="padding:40px 20px;">
<table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#FFFFFF;border:1px solid #FBCFE8;border-radius:24px;overflow:hidden;">
<tr><td style="background:#080A0F;padding:30px 42px 26px;">
<div style="color:#FFFFFF;font-size:24px;font-weight:850;letter-spacing:-.8px;">Basal<span style="color:#E8788A;">temperatur</span></div>
<div style="margin-top:11px;line-height:3px;"><span style="display:inline-block;width:28px;height:3px;background:#E8788A;"></span><span style="display:inline-block;width:16px;height:3px;background:#7B61FF;"></span><span style="display:inline-block;width:10px;height:3px;background:#FBCFE8;"></span></div>
<div style="margin-top:14px;color:#D3D6DE;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Vertragsbestätigung</div>
</td></tr>
<tr><td class="email-content" style="padding:34px 42px 8px;background:#FFFFFF;">
<h1 style="margin:0 0 16px;color:#0F1029;font-size:30px;line-height:1.15;letter-spacing:-1px;">Danke für deinen Kauf</h1>
<p style="margin:0 0 6px;color:#344054;font-size:15px;line-height:1.65;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 8px;color:#344054;font-size:15px;line-height:1.65;">${escapeHtml(intro)}</p>
${legalBlocksToHtml(summary, site)}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 8px;"><tr><td style="background:#E8788A;border-radius:12px;"><a href="${escapeHtml(site)}/dashboard" style="display:inline-block;padding:14px 24px;color:#FFFFFF;font-size:15px;font-weight:750;text-decoration:none;">Zur Analyse &nbsp;→</a></td></tr></table>
</td></tr>
${section('Widerrufsbelehrung', legalBlocksToHtml(belehrung, site))}
${section('Allgemeine Geschäftsbedingungen', legalBlocksToHtml(agb, site))}
<tr><td style="padding:28px 42px 30px;background:#080A0F;border-top:1px solid #20242D;color:#A8AFBC;font-size:12px;line-height:1.6;">
<strong style="color:#FFFFFF;">Warum du diese E-Mail erhältst</strong><br>Du hast in der Basaltemperatur-Webanwendung die Analyse gekauft. Diese Bestätigung ist gesetzlich vorgeschrieben.
<div style="margin-top:14px;"><a href="${escapeHtml(site)}/support" style="color:#FBCFE8;">Support</a> &nbsp;·&nbsp; <a href="${escapeHtml(site)}/datenschutz" style="color:#FBCFE8;">Datenschutz</a> &nbsp;·&nbsp; <a href="${escapeHtml(site)}/impressum" style="color:#FBCFE8;">Impressum</a></div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const text = [
    greeting,
    '',
    intro,
    legalBlocksToText(summary, site),
    '',
    `Zur Analyse: ${site}/dashboard`,
    '',
    '========================================',
    'WIDERRUFSBELEHRUNG',
    '========================================',
    legalBlocksToText(belehrung, site),
    '',
    '========================================',
    'ALLGEMEINE GESCHÄFTSBEDINGUNGEN',
    '========================================',
    legalBlocksToText(agb, site),
  ].join('\n')

  return { subject, html, text }
}

export function sendPurchaseConfirmation(
  input: PurchaseConfirmationInput,
  fetchImpl?: typeof fetch,
): Promise<BrevoMailResult> {
  const mail = purchaseConfirmationEmail(input)
  return sendBrevoMail({
    to: input.customerEmail,
    name: input.customerName ?? undefined,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    fetchImpl,
  })
}
