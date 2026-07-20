/**
 * The QA contract — what /api/qa/status returns.
 *
 * This type is the whole point of the fleet-wide standard test. Twelve products
 * differ in how you sign up, where the paywall bites and what it says when it
 * does. Keeping that knowledge in hand-written adapter files means it drifts the
 * day someone renames a route; keeping it here means the product describes
 * itself and the test never guesses.
 *
 * The test therefore contains no per-product branches. It reads `auth.kind` to
 * pick a sign-in strategy, navigates to `gating.surface`, and asserts against
 * `gating.blockedCopy`. Differences survive — but declared, not inferred.
 *
 * Copy this file verbatim into each fleet product. It is the shared vocabulary;
 * only the values differ.
 */

export const QA_CONTRACT_VERSION = 2;

/** How an account is created and signed into. Drives which flow the test runs. */
export type QaAuthKind =
  /** Email + password. The test can register and sign in unattended. */
  | 'password'
  /** Magic link only. The test needs mailbox access mid-flow; there is no password. */
  | 'magic-link'
  /** Third-party consent screen only. The test cannot self-register. */
  | 'oauth-only'
  /** Product-specific flow that none of the above describes. */
  | 'custom';

export type QaBillingRuntime =
  /** Checkout/portal/webhook run in this app, so this app's env decides the mode. */
  | 'vercel'
  /** They run in a Supabase Edge Function with its OWN secret — this app's env says nothing. */
  | 'edge-function';

export type QaKeyMode = 'test' | 'live' | 'unconfigured' | 'unknown';

export type QaBilling = {
  runtime: QaBillingRuntime;
  /** Mode of the key that ACTUALLY processes payments, not merely the one in this app's env. */
  keyMode: QaKeyMode;
  /**
   * The only question a purchase test needs answered. True whenever a checkout
   * could move real money — including when the mode could not be determined,
   * because "unknown" must never be treated as safe.
   */
  chargesRealMoney: boolean;
};

export type QaAuth = {
  kind: QaAuthKind;
  /** Route that starts registration, or null when the product has no self-service signup. */
  signupPath: string | null;
  loginPath: string | null;
  /** Where a user deletes their own account, or null if that does not exist. */
  deletePath: string | null;
  /** Route that resets a password, or null. */
  passwordResetPath: string | null;
  /** True when signup requires clicking a link in an email before the account works. */
  emailConfirmationRequired: boolean;
  /**
   * What the confirmation mail must look like.
   *
   * A confirmation link that works is not enough: GoTrue falls back to its own
   * unbranded default template whenever the configured one fails to load, and
   * the link still works — so the flow passes while every user receives a mail
   * that looks like it came from nobody. The test therefore asserts on the mail
   * itself, and needs to know what to expect.
   */
  mail: QaMailExpectation | null;
};

export type QaMailExpectation = {
  /** Address the confirmation mail is sent from, e.g. "noreply@example.com". */
  fromAddress: string | null;
  /** Subject line the branded template produces, matched exactly. */
  subject: string | null;
  /**
   * A distinctive string that appears ONLY in the branded template — a wordmark,
   * a brand colour, a footer line. Its absence means the default template was
   * used, which is the failure this check exists to catch.
   */
  brandedMarker: string | null;
};

export type QaGating = {
  /** Route where a non-entitled user visibly hits the wall. */
  surface: string | null;
  /** The exact user-facing text shown when blocked, so the test asserts on reality. */
  blockedCopy: string | null;
  /**
   * Which plan the test should buy. Must produce an OBSERVABLE difference — a
   * plan whose limits equal the free tier makes the whole purchase test vacuous.
   */
  testPlan: string | null;
};

export type QaContract = {
  contractVersion: number;
  product: string;
  billing: QaBilling;
  auth: QaAuth;
  gating: QaGating;
  /** Switches that could make a paywall assertion pass for the wrong reason. */
  flags: Record<string, unknown>;
  session: { userId: string; email: string | null } | null;
  entitlement: { plan: string; status: string; entitled: boolean } | null;
};

/**
 * Classify a Stripe secret key by prefix. Only ever returns a verdict — the key
 * itself must never leave the server.
 */
export function classifyStripeKey(key: string | undefined | null): QaKeyMode {
  const trimmed = key?.trim();
  if (!trimmed) return 'unconfigured';
  if (trimmed.startsWith('sk_test_') || trimmed.startsWith('rk_test_')) return 'test';
  if (trimmed.startsWith('sk_live_') || trimmed.startsWith('rk_live_')) return 'live';
  return 'unknown';
}

/**
 * Whether a checkout could move real money.
 *
 * Deliberately fails closed: anything that is not provably test mode counts as
 * real. An unconfigured app env is the exact situation that misled us before —
 * billing ran live inside an edge function while this app reported nothing.
 */
export function chargesRealMoney(keyMode: QaKeyMode): boolean {
  return keyMode !== 'test';
}
