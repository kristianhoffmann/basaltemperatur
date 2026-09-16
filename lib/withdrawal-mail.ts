/**
 * Eingangsbestätigung für Widerrufserklärungen — § 356a Abs. 4 BGB.
 *
 * Dieses Projekt hatte bisher keinen Transaktionsmailversand. Die Bestätigung
 * ist aber Pflicht und muss auf einem DAUERHAFTEN DATENTRÄGER erfolgen; eine
 * Bildschirmanzeige allein genügt nicht, weil sie nicht speicherbar und
 * unveränderbar beim Verbraucher ankommt.
 *
 * Bewusst schlank gehalten: kein Mail-Framework, nur der Brevo-Endpunkt, den
 * die Schwesterprojekte ebenfalls nutzen. Fehlt die Konfiguration, liefert die
 * Funktion `configuration` zurück — der Widerruf bleibt trotzdem gespeichert
 * und wirksam, und die Oberfläche fordert die Person auf, den angezeigten Text
 * selbst zu sichern. Ein fehlender Mailversand darf einen Rechtsakt nicht
 * verschlucken.
 */

import { escapeHtml } from '@/lib/legal/blocks';
import { sendBrevoMail, type BrevoMailResult } from '@/lib/brevo';

export type WithdrawalMailResult = BrevoMailResult;

export function withdrawalAcknowledgementBody(name: string, summary: string): { html: string; text: string } {
  const intro = `Hallo ${name},\n\nwir bestätigen den Eingang deines Widerrufs. Nachfolgend der Inhalt deiner Erklärung mit Datum und Uhrzeit des Eingangs — bitte bewahre diese E-Mail als Nachweis auf.`;
  const outro = 'Wir erstatten dir alle empfangenen Zahlungen unverzüglich, spätestens binnen vierzehn Tagen ab heute, über dasselbe Zahlungsmittel, das du beim Kauf verwendet hast. Es entstehen dir dafür keine Kosten.';
  const html = `<!doctype html><html lang="de"><body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif"><div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px"><h1 style="margin:0 0 16px;font-size:22px">Widerruf bestätigt</h1><p style="margin:0 0 16px;line-height:1.6">${escapeHtml(intro).replace(/\n/g, '<br>')}</p><pre style="margin:0;padding:16px;background:#f1f5f9;border-left:4px solid #0ea5e9;border-radius:10px;font-family:inherit;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(summary)}</pre><p style="margin:18px 0 0;line-height:1.6">${escapeHtml(outro)}</p></div></body></html>`;
  const text = `${intro}\n\n${summary}\n\n${outro}`;
  return { html, text };
}

export async function sendWithdrawalAcknowledgement(options: {
  to: string;
  name: string;
  summary: string;
  fetchImpl?: typeof fetch;
}): Promise<WithdrawalMailResult> {
  const body = withdrawalAcknowledgementBody(options.name, options.summary);
  return sendBrevoMail({
    to: options.to,
    name: options.name,
    subject: 'Eingangsbestätigung deines Widerrufs',
    html: body.html,
    text: body.text,
    fetchImpl: options.fetchImpl,
  });
}
