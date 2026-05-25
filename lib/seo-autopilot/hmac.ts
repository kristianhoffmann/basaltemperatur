import { createHmac, timingSafeEqual } from 'crypto'

const REPLAY_WINDOW_MS = 5 * 60 * 1000

function sign(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')
}

export function signPayload(timestamp: string, rawBody: string): string {
  return sign(process.env.SEO_AUTOPILOT_SECRET!, timestamp, rawBody)
}

export function verifySignature(
  signature: string,
  timestamp: string,
  rawBody: string
): { ok: boolean; error?: 'stale' | 'bad_signature' } {
  const tsMs = parseInt(timestamp, 10) * 1000
  if (isNaN(tsMs) || Date.now() - tsMs > REPLAY_WINDOW_MS) {
    return { ok: false, error: 'stale' }
  }

  const expected = sign(process.env.SEO_AUTOPILOT_SECRET!, timestamp, rawBody)
  const sigBuf = Buffer.from(signature.padEnd(64, '0'), 'hex')
  const expBuf = Buffer.from(expected, 'hex')

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, error: 'bad_signature' }
  }

  return { ok: true }
}
