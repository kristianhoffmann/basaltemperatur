const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type BrevoMailResult =
  | { ok: true }
  | { ok: false; code: 'configuration' | 'provider' | 'timeout' }

export async function sendBrevoMail(options: {
  to: string
  name?: string
  subject: string
  html: string
  text: string
  fetchImpl?: typeof fetch
}): Promise<BrevoMailResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim().toLowerCase() ?? ''
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'Basaltemperatur'
  if (!apiKey || !EMAIL_PATTERN.test(senderEmail) || !EMAIL_PATTERN.test(options.to)) {
    return { ok: false, code: 'configuration' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await (options.fetchImpl ?? fetch)(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [options.name ? { email: options.to, name: options.name } : { email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
      }),
      signal: controller.signal,
    })
    return response.ok ? { ok: true } : { ok: false, code: 'provider' }
  } catch {
    return { ok: false, code: 'timeout' }
  } finally {
    clearTimeout(timeout)
  }
}
