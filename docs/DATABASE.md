# Datenbank

Basaltemperatur nutzt Supabase Postgres mit Row Level Security. Die Datenbank speichert Profile, Temperaturwerte, Periodentage, Zyklen und Admin-Traffic-Events.

## Migrations

Die Migrationen liegen unter `supabase/migrations` und muessen in Reihenfolge angewendet werden:

1. `001_create_profiles.sql`
2. `002_create_temperature_entries.sql`
3. `003_create_period_entries.sql`
4. `004_create_cycles.sql`
5. `20260214_fix_rls.sql`
6. `20260214170534_add_cervical_mucus.sql`
7. `20260506083622_fix_display_name_handling.sql`
8. `20260518090000_add_measurement_quality_and_entitlements.sql`
9. `20260518100000_add_sensitive_data_consent.sql`
10. `20260518110000_add_admin_traffic_analytics.sql`

## Tabellen

### `profiles`

Ergaenzende Profildaten zu `auth.users`.

Wichtige Felder:

- `id`
- `display_name`
- `cycle_length_default`
- `luteal_phase_default`
- `temperature_unit`
- `has_lifetime_access`
- `entitlement_source`
- `lifetime_access_granted_at`
- `app_store_original_transaction_id`
- `app_store_product_id`
- `onboarding_completed`
- `sensitive_data_consent_at`
- `sensitive_data_consent_version`
- `intended_use_acknowledged_at`

RLS erlaubt Nutzern Zugriff auf das eigene Profil. Ein Trigger verhindert, dass normale Clients Premium-Entitlement-Felder selbst setzen oder aendern.

### `temperature_entries`

Tageswerte fuer Basaltemperatur.

Wichtige Felder:

- `user_id`
- `date`
- `temperature`
- `notes`
- `cervical_mucus`
- `measurement_time`
- `sleep_hours`
- `disturbed`
- `disturbance_reason`
- `exclude_from_analysis`

`UNIQUE(user_id, date)` stellt sicher, dass pro Nutzer und Tag nur ein Temperatureintrag existiert.

### `period_entries`

Periodenmarkierungen pro Tag.

Wichtige Felder:

- `user_id`
- `date`
- `flow_intensity` (`light`, `medium`, `heavy`, `spotting`)

Spotting wird in der Zyklusstart-Erkennung nicht als Periodenbeginn gewertet.

### `cycles`

Persistierte Zyklusbereiche und abgeleitete Werte.

Wichtige Felder:

- `user_id`
- `start_date`
- `end_date`
- `cycle_length`
- `ovulation_date`

### `traffic_events`

Serverseitig geschriebene Admin-Analytics.

Wichtige Felder:

- `visitor_id`
- `session_id`
- `user_id`
- `path`
- `full_url`
- `query_string`
- `referrer`
- `user_agent`
- `browser`
- `os`
- `device_type`
- `ip_hash`
- `country`
- `metadata`

Die Tabelle ist fuer `anon` und `authenticated` gesperrt. Writes erfolgen ueber die API-Route mit Service Role.

## Sensitive-Data-Consent

Die Migration `20260518100000_add_sensitive_data_consent.sql` blockiert Inserts und Updates in `temperature_entries` und `period_entries`, solange das Profil keinen `sensitive_data_consent_at` hat.

Service-Role-Zugriffe sind davon ausgenommen, damit administrative Routen und Account-Migrationen funktionieren.

## Premium-Entitlements

Premium-Felder liegen in `profiles`. Entitlements werden ausschliesslich serverseitig gesetzt:

- Stripe Webhook: `app/api/stripe-webhook/route.ts`
- App Store Entitlement Sync: `app/api/app-store/entitlement/route.ts`
- App Store Notifications: `app/api/app-store/notifications/route.ts`

Clients duerfen diese Felder nicht direkt aendern.

## Typen

Die TypeScript-Typen liegen in `types/database.ts`.

Der Generator-Befehl ist:

```bash
npm run db:types
```
