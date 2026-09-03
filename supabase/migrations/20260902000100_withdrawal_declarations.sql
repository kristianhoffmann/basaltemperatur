-- Eingegangene Widerrufserklaerungen nach § 356a BGB.
--
-- Die elektronische Widerrufsfunktion ist seit dem 19.06.2026 Pflicht. Der
-- Verbraucher erklaert den Widerruf ueber ein oeffentliches Formular — ohne
-- Login, denn wer widerrufen will, hat oft schon kein Konto mehr oder kommt
-- nicht mehr hinein. Genau deshalb darf hier NICHT per RLS auf auth.uid()
-- gefiltert werden; geschrieben wird ausschliesslich serverseitig mit dem
-- Service-Role-Key aus /api/widerruf.
--
-- Die Zeile ist der Nachweis, dass und WANN die Erklaerung zugegangen ist.
-- Sie wird nicht geloescht, wenn das Konto geloescht wird: Die Aufbewahrung
-- stuetzt sich auf Art. 6 Abs. 1 lit. c DSGVO (Nachweis gesetzlicher
-- Pflichten), nicht auf den Bestand des Nutzerkontos. Deshalb auch kein
-- Fremdschluessel auf auth.users — eine Kontoloeschung darf den Beleg nicht
-- mitreissen.

create table if not exists public.withdrawal_declarations (
    id uuid primary key default gen_random_uuid(),
    received_at timestamptz not null default now(),
    name text not null,
    email text not null,
    contract_reference text not null,
    contract_date date,
    message text,
    -- Wortlaut der Bestaetigung, so wie sie den Verbraucher erreicht hat.
    receipt_summary text not null,
    acknowledgement_sent boolean not null default false,
    acknowledgement_error text,
    source_ip_hash text,
    user_agent text,
    handled_at timestamptz,
    handled_note text
);

create index if not exists withdrawal_declarations_received_at_idx
    on public.withdrawal_declarations (received_at desc);
create index if not exists withdrawal_declarations_email_idx
    on public.withdrawal_declarations (lower(email));

alter table public.withdrawal_declarations enable row level security;

-- Keine Policy fuer anon/authenticated: Weder Lesen noch Schreiben ist aus dem
-- Browser moeglich. Der Service-Role-Key umgeht RLS und ist der einzige Weg
-- hinein. Ein Widerruf ist ein Rechtsakt, kein Nutzerdatensatz.

comment on table public.withdrawal_declarations is
    'Widerrufserklaerungen aus der elektronischen Widerrufsfunktion (§ 356a BGB). Nur serverseitig beschreibbar.';
