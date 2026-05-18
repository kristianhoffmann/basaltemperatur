import { createVerify, X509Certificate } from 'crypto'

export type AppStoreTransactionPayload = {
  bundleId?: string
  productId?: string
  originalTransactionId?: string
  transactionId?: string
  type?: string
  revocationDate?: number
  expiresDate?: number
}

export type AppStoreNotificationPayload = {
  notificationType?: string
  subtype?: string
  notificationUUID?: string
  data?: {
    bundleId?: string
    appAppleId?: number
    environment?: string
    signedTransactionInfo?: string
    signedRenewalInfo?: string
  }
}

const TRUSTED_APPLE_ROOT_SHA256_FINGERPRINTS = new Set([
  '63343ABFB89A6A03EBB57E9B3F5FA7BE7C4F5C756F3017B3A8C488C3653E9179', // Apple Root CA - G3
  'C2B9B042DD57830E7D117DAC55AC8AE19407D38E41D88F3215BC3A890444A050', // Apple Root CA - G2
])

function base64UrlToBuffer(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='), 'base64')
}

function parseJsonPart<T>(value: string): T {
  return JSON.parse(base64UrlToBuffer(value).toString('utf8')) as T
}

function normalizeFingerprint(value: string): string {
  return value.replace(/:/g, '').toUpperCase()
}

function verifyCertificateChain(x5c: string[]): X509Certificate {
  if (x5c.length < 3) {
    throw new Error('Incomplete StoreKit certificate chain')
  }

  const certificates = x5c.map((cert) => new X509Certificate(Buffer.from(cert, 'base64')))
  const now = Date.now()

  for (const cert of certificates) {
    const validFrom = new Date(cert.validFrom).getTime()
    const validTo = new Date(cert.validTo).getTime()
    if (Number.isNaN(validFrom) || Number.isNaN(validTo) || now < validFrom || now > validTo) {
      throw new Error('StoreKit certificate is not currently valid')
    }
  }

  const root = certificates[certificates.length - 1]
  if (!TRUSTED_APPLE_ROOT_SHA256_FINGERPRINTS.has(normalizeFingerprint(root.fingerprint256))) {
    throw new Error('StoreKit root certificate is not trusted')
  }

  for (let i = 0; i < certificates.length - 1; i++) {
    if (!certificates[i].verify(certificates[i + 1].publicKey)) {
      throw new Error('Invalid StoreKit certificate chain')
    }
  }

  if (!root.verify(root.publicKey)) {
    throw new Error('Invalid StoreKit root certificate')
  }

  return certificates[0]
}

export function verifyAppStoreJws<T>(jws: string): T {
  const parts = jws.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid StoreKit JWS format')
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = parseJsonPart<{ alg?: string; x5c?: string[] }>(encodedHeader)
  if (header.alg !== 'ES256' || !header.x5c?.[0]) {
    throw new Error('Unsupported StoreKit signature')
  }

  const cert = verifyCertificateChain(header.x5c)
  const verify = createVerify('sha256')
  verify.update(`${encodedHeader}.${encodedPayload}`)
  verify.end()

  if (!verify.verify({ key: cert.publicKey, dsaEncoding: 'ieee-p1363' }, base64UrlToBuffer(encodedSignature))) {
    throw new Error('Invalid StoreKit signature')
  }

  return parseJsonPart<T>(encodedPayload)
}

export function expectedAppStoreIds() {
  return {
    bundleId: process.env.APP_STORE_BUNDLE_ID || 'de.basaltemperatur.app',
    productId: process.env.APP_STORE_LIFETIME_PRODUCT_ID || 'de.basaltemperatur.lifetime',
  }
}

export function isLifetimeTransaction(
  payload: AppStoreTransactionPayload,
  options: { allowRevoked?: boolean } = {}
) {
  const expected = expectedAppStoreIds()
  return payload.bundleId === expected.bundleId
    && payload.productId === expected.productId
    && payload.type === 'Non-Consumable'
    && (options.allowRevoked || !payload.revocationDate)
}

export function originalTransactionId(payload: AppStoreTransactionPayload) {
  return payload.originalTransactionId || payload.transactionId || null
}
