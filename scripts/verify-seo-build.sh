#!/usr/bin/env bash
# Offline verification only. All credentials and records are local test fixtures.
set -euo pipefail
cd "$(dirname "$0")/.."
env -i \
  PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" \
  NEXT_TELEMETRY_DISABLED=1 \
  SEO_FIXTURE_OUTAGE="${SEO_FIXTURE_OUTAGE:-0}" \
  NEXT_FONT_GOOGLE_MOCKED_RESPONSES="$PWD/tests/fixtures/seo-fonts.cjs" \
  NODE_OPTIONS="--require $PWD/tests/fixtures/seo-fetch.cjs" \
  NEXT_PUBLIC_SUPABASE_URL=http://seo-fixture.invalid \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=offline-test-only \
  SUPABASE_SERVICE_ROLE_KEY=offline-test-only \
  SEO_AUTOPILOT_SITE_ID=11111111-1111-4111-8111-111111111111 \
  STRIPE_SECRET_KEY=sk_test_offline_only \
  npm run build -- --webpack
