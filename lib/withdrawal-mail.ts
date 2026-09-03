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

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WithdrawalMailResult =
  | { ok: true }
  | { ok: false; code: 'configuration' | 'provider' | 'timeout' };

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim().toLowerCase() ?? '';
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'Basaltemperatur';
  if (!apiKey || !EMAIL_PATTERN.test(senderEmail) || !EMAIL_PATTERN.test(options.to)) {
    return { ok: false, code: 'configuration' };
  }

  const body = withdrawalAcknowledgementBody(options.name, options.summary);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await (options.fetchImpl ?? fetch)(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: options.to, name: options.name }],
        subject: 'Eingangsbestätigung deines Widerrufs',
        htmlContent: body.html,
        textContent: body.text,
      }),
      signal: controller.signal,
    });
    return response.ok ? { ok: true } : { ok: false, code: 'provider' };
  } catch {
    return { ok: false, code: 'timeout' };
  } finally {
    clearTimeout(timeout);
  }
}
