# Datenbankschema – SaaS Blueprint

> **⚠️ Dieses Schema kann an deine Entitäten angepasst werden!**
> 
> Standard-Entitäten: customers, projects, quotes, invoices, appointments, templates
> Passe die Tabellennamen und Felder in CONFIG.md an.

## Übersicht

Die Datenbank nutzt **Supabase (PostgreSQL)** mit Row Level Security (RLS) für Multi-Tenancy. Jeder Nutzer kann nur seine eigenen Daten sehen und bearbeiten.

---

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   customers  │       │   projects   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ user_id (FK) │       │ id (PK)      │
│ email        │       │ id (PK)      │◄──────│ customer_id  │
│ ...          │       │ name         │       │ user_id (FK) │
└──────────────┘       │ ...          │       │ ...          │
                       └──────────────┘       └──────────────┘
                                                     │
                       ┌──────────────┐              │
                       │    quotes    │◄─────────────┤
                       ├──────────────┤              │
                       │ id (PK)      │              │
                       │ project_id   │              │
                       │ ...          │              │
                       └──────────────┘              │
                              │                      │
                              ▼                      │
                       ┌──────────────┐              │
                       │   invoices   │◄─────────────┘
                       ├──────────────┤
                       │ id (PK)      │
                       │ quote_id     │
                       │ project_id   │
                       │ ...          │
                       └──────────────┘
```

---

## Tabellendefinitionen

### 1. profiles (Erweiterte Nutzerdaten)

```sql
-- Erweitert die Supabase auth.users Tabelle
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Geschäftsdaten
    company_name VARCHAR(255),
    owner_name VARCHAR(255) NOT NULL,
    trade VARCHAR(100), -- Gewerk: Elektriker, Maler, etc.
    
    -- Kontakt
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    website VARCHAR(255),
    
    -- Adresse
    street VARCHAR(255),
    house_number VARCHAR(20),
    postal_code VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(2) DEFAULT 'DE',
    
    -- Steuer & Recht
    tax_id VARCHAR(50), -- Steuernummer
    vat_id VARCHAR(50), -- USt-IdNr. (optional)
    is_small_business BOOLEAN DEFAULT false, -- Kleinunternehmer §19 UStG
    trade_register VARCHAR(100), -- Handelsregistereintrag (optional)
    
    -- Branding
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1b4d89',
    
    -- Rechnungseinstellungen
    invoice_prefix VARCHAR(10) DEFAULT 'RE',
    next_invoice_number INTEGER DEFAULT 1,
    quote_prefix VARCHAR(10) DEFAULT 'AN',
    next_quote_number INTEGER DEFAULT 1,
    default_payment_terms INTEGER DEFAULT 14, -- Zahlungsziel in Tagen
    default_vat_rate DECIMAL(5,2) DEFAULT 19.00,
    
    -- Bank
    bank_name VARCHAR(255),
    iban VARCHAR(34),
    bic VARCHAR(11),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, handwerker, meister
    subscription_valid_until TIMESTAMPTZ
);

-- Trigger für updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
```

### 2. customers (Kunden)

```sql
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Typ
    customer_type VARCHAR(20) DEFAULT 'private', -- private, business
    
    -- Personendaten (Privatkunde)
    salutation VARCHAR(20), -- Herr, Frau, Divers
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Firmendaten (Geschäftskunde)
    company_name VARCHAR(255),
    contact_person VARCHAR(200),
    
    -- Kontakt
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Adresse
    street VARCHAR(255),
    house_number VARCHAR(20),
    address_extra VARCHAR(100), -- Zusatz, z.B. "2. OG links"
    postal_code VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(2) DEFAULT 'DE',
    
    -- Zusätzliche Infos
    notes TEXT,
    tags TEXT[], -- z.B. ['Stammkunde', 'Bauträger']
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft Delete
);

-- Indizes
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_search ON public.customers 
    USING GIN (to_tsvector('german', 
        coalesce(first_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(company_name, '') || ' ' ||
        coalesce(email, '') || ' ' ||
        coalesce(city, '')
    ));

-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own customers"
    ON public.customers FOR ALL
    USING (auth.uid() = user_id);
```

### 3. projects (Projekte/Aufträge)

```sql
CREATE TYPE project_status AS ENUM (
    'inquiry',      -- Anfrage
    'quoted',       -- Angebot erstellt
    'accepted',     -- Auftrag angenommen
    'in_progress',  -- In Bearbeitung
    'completed',    -- Abgeschlossen
    'invoiced',     -- Abgerechnet
    'cancelled'     -- Storniert
);

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    
    -- Projekt-Infos
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reference_number VARCHAR(50), -- Eigene Auftragsnummer
    
    -- Status
    status project_status DEFAULT 'inquiry',
    
    -- Adresse (kann von Kundenadresse abweichen)
    location_street VARCHAR(255),
    location_house_number VARCHAR(20),
    location_postal_code VARCHAR(10),
    location_city VARCHAR(100),
    location_notes TEXT, -- z.B. "Hinterhaus, Klingeln bei Müller"
    
    -- Termine
    scheduled_start DATE,
    scheduled_end DATE,
    actual_start DATE,
    actual_end DATE,
    
    -- Finanzen (Zusammenfassung)
    estimated_value DECIMAL(12,2),
    actual_value DECIMAL(12,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indizes
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_customer_id ON public.projects(customer_id);
CREATE INDEX idx_projects_status ON public.projects(status);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own projects"
    ON public.projects FOR ALL
    USING (auth.uid() = user_id);
```

### 4. line_items (Positionen für Angebote/Rechnungen)

```sql
CREATE TABLE public.line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Zuordnung (eines von beiden)
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    
    -- Position
    position_number INTEGER NOT NULL,
    
    -- Inhalt
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Mengen & Preise
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'Stk.', -- Stk., Std., m², m, kg, pausch.
    unit_price DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 19.00,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Berechnet (für schnellen Zugriff)
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (
        quantity * unit_price * (1 - discount_percent / 100)
    ) STORED,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Entweder quote_id ODER invoice_id
    CONSTRAINT line_item_parent CHECK (
        (quote_id IS NOT NULL AND invoice_id IS NULL) OR
        (quote_id IS NULL AND invoice_id IS NOT NULL)
    )
);

-- RLS
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own line_items"
    ON public.line_items FOR ALL
    USING (auth.uid() = user_id);
```

### 5. quotes (Angebote)

```sql
CREATE TYPE quote_status AS ENUM (
    'draft',        -- Entwurf
    'sent',         -- Versendet
    'viewed',       -- Vom Kunden angesehen
    'accepted',     -- Angenommen
    'rejected',     -- Abgelehnt
    'expired'       -- Abgelaufen
);

CREATE TABLE public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    project_id UUID REFERENCES public.projects(id),
    
    -- Nummern
    quote_number VARCHAR(50) NOT NULL,
    
    -- Status
    status quote_status DEFAULT 'draft',
    
    -- Daten
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    -- Beträge (denormalisiert für Performance)
    subtotal DECIMAL(12,2) DEFAULT 0,
    vat_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    
    -- Texte
    intro_text TEXT,
    outro_text TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    
    -- Unique pro User
    UNIQUE(user_id, quote_number)
);

-- RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own quotes"
    ON public.quotes FOR ALL
    USING (auth.uid() = user_id);
```

### 6. invoices (Rechnungen)

```sql
CREATE TYPE invoice_status AS ENUM (
    'draft',        -- Entwurf
    'sent',         -- Versendet
    'viewed',       -- Angesehen
    'partial',      -- Teilgezahlt
    'paid',         -- Bezahlt
    'overdue',      -- Überfällig
    'cancelled',    -- Storniert
    'credited'      -- Gutgeschrieben
);

CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    project_id UUID REFERENCES public.projects(id),
    quote_id UUID REFERENCES public.quotes(id),
    
    -- Nummern
    invoice_number VARCHAR(50) NOT NULL,
    
    -- Status
    status invoice_status DEFAULT 'draft',
    
    -- Daten
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Beträge
    subtotal DECIMAL(12,2) DEFAULT 0,
    vat_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    
    -- Kleinunternehmer
    is_small_business BOOLEAN DEFAULT false,
    
    -- Texte
    intro_text TEXT,
    outro_text TEXT,
    payment_terms TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- GoBD: Nach Versand nicht mehr änderbar
    is_locked BOOLEAN DEFAULT false,
    locked_at TIMESTAMPTZ,
    
    -- Unique pro User
    UNIQUE(user_id, invoice_number)
);

-- Trigger: Sperren nach Versand
CREATE OR REPLACE FUNCTION lock_invoice_on_send()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'sent' AND OLD.status = 'draft' THEN
        NEW.is_locked := true;
        NEW.locked_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_lock_trigger
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION lock_invoice_on_send();

-- RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own invoices"
    ON public.invoices FOR ALL
    USING (auth.uid() = user_id);

-- Verhindere Löschung von gesperrten Rechnungen
CREATE POLICY "Cannot delete locked invoices"
    ON public.invoices FOR DELETE
    USING (is_locked = false);
```

### 7. appointments (Termine)

```sql
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id),
    project_id UUID REFERENCES public.projects(id),
    
    -- Termin
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Zeit
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,
    
    -- Ort (übernimmt von Project oder Customer wenn leer)
    location_street VARCHAR(255),
    location_city VARCHAR(100),
    location_notes TEXT,
    
    -- Erinnerung
    reminder_minutes INTEGER, -- Minuten vor Termin
    reminder_sent BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own appointments"
    ON public.appointments FOR ALL
    USING (auth.uid() = user_id);
```

### 8. templates (Vorlagen für Leistungspositionen)

```sql
CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template-Daten
    title VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(20) DEFAULT 'Stk.',
    unit_price DECIMAL(12,2),
    vat_rate DECIMAL(5,2) DEFAULT 19.00,
    
    -- Kategorisierung
    category VARCHAR(100),
    tags TEXT[],
    
    -- Sortierung
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own templates"
    ON public.templates FOR ALL
    USING (auth.uid() = user_id);
```

### 9. audit_log (Änderungsprotokoll für GoBD)

```sql
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Was wurde geändert
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    
    -- Änderungen
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    
    -- Meta
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);

-- Trigger-Funktion für Audit-Log
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (user_id, table_name, record_id, action, new_data)
        VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (user_id, table_name, record_id, action, old_data, new_data)
        VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (user_id, table_name, record_id, action, old_data)
        VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit-Trigger für Rechnungen (kritisch für GoBD)
CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

## Hilfsfunktionen

### Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Volltextsuche für Kunden

```sql
CREATE OR REPLACE FUNCTION search_customers(search_query TEXT, p_user_id UUID)
RETURNS SETOF customers AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM customers
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND (
          first_name ILIKE '%' || search_query || '%' OR
          last_name ILIKE '%' || search_query || '%' OR
          company_name ILIKE '%' || search_query || '%' OR
          email ILIKE '%' || search_query || '%' OR
          city ILIKE '%' || search_query || '%' OR
          phone ILIKE '%' || search_query || '%'
      )
    ORDER BY 
        CASE WHEN last_name ILIKE search_query || '%' THEN 0 ELSE 1 END,
        last_name, first_name
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Nächste Rechnungsnummer generieren

```sql
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_number INTEGER;
    v_year TEXT;
BEGIN
    -- Hole Prefix und aktuelle Nummer
    SELECT invoice_prefix, next_invoice_number 
    INTO v_prefix, v_number
    FROM profiles 
    WHERE id = p_user_id;
    
    -- Jahr für die Nummer
    v_year := to_char(CURRENT_DATE, 'YYYY');
    
    -- Erhöhe Nummer für nächstes Mal
    UPDATE profiles 
    SET next_invoice_number = next_invoice_number + 1
    WHERE id = p_user_id;
    
    -- Formatiere: RE-2025-0001
    RETURN v_prefix || '-' || v_year || '-' || lpad(v_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Seed Data (Entwicklung)

```sql
-- Demo-Leistungsvorlagen für Elektriker
INSERT INTO public.templates (user_id, title, description, unit, unit_price, category) VALUES
('USER_ID_HERE', 'Steckdose installieren', 'Unterputz-Steckdose inkl. Rahmen', 'Stk.', 45.00, 'Installation'),
('USER_ID_HERE', 'Lichtschalter installieren', 'Unterputz-Schalter inkl. Rahmen', 'Stk.', 35.00, 'Installation'),
('USER_ID_HERE', 'Kabel verlegen', 'NYM-J 3x1,5mm² Unterputz', 'm', 8.50, 'Kabel'),
('USER_ID_HERE', 'Sicherungskasten prüfen', 'E-Check nach DIN VDE 0100-600', 'pausch.', 89.00, 'Prüfung'),
('USER_ID_HERE', 'Arbeitsstunde Elektriker', 'Montagearbeiten', 'Std.', 65.00, 'Arbeit');
```

---

## Stripe & Subscription Tabellen

### 10. subscriptions (Stripe-Abonnements)

```sql
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Stripe IDs
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    
    -- Plan Details
    plan_id VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, handwerker, meister
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- active, trialing, past_due, canceled, unpaid, incomplete
    
    -- Dates
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    
    -- Usage Tracking
    customers_count INTEGER DEFAULT 0,
    invoices_this_month INTEGER DEFAULT 0,
    usage_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- Index für schnelle Lookups
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Nur Backend/Webhooks können Subscriptions ändern
CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');
```

### 11. subscription_events (Stripe Event Log)

```sql
CREATE TABLE public.subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Stripe Event
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    -- checkout.session.completed, invoice.paid, subscription.updated, etc.
    
    -- Event Data
    payload JSONB NOT NULL,
    
    -- Processing
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_user ON subscription_events(user_id);
```

### 12. payment_history (Zahlungshistorie)

```sql
CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Stripe Invoice
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    
    -- Amount
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Status
    status VARCHAR(50) NOT NULL, -- paid, failed, refunded, pending
    
    -- Details
    description TEXT,
    invoice_pdf_url TEXT,
    receipt_url TEXT,
    
    -- Dates
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user ON payment_history(user_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);

-- RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
    ON payment_history FOR SELECT
    USING (auth.uid() = user_id);
```

---

## Admin-Dashboard Tabellen

### 13. admin_users (Admin-Rollen)

```sql
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role
    role VARCHAR(50) NOT NULL DEFAULT 'support',
    -- super_admin: Vollzugriff
    -- support: Nutzer-Ansicht, Impersonation
    -- finance: Umsatz-Analytics, Subscriptions
    
    -- Permissions (feinere Steuerung)
    permissions JSONB DEFAULT '[]',
    -- ["users:read", "users:impersonate", "subscriptions:manage", "analytics:view"]
    
    -- Metadata
    granted_by UUID REFERENCES admin_users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_admin_user UNIQUE (user_id)
);

-- Kein RLS - nur Backend-Zugriff via Service Role
```

### 14. admin_audit_log (Admin-Aktivitäten)

```sql
CREATE TABLE public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users(id),
    
    -- Action
    action VARCHAR(100) NOT NULL,
    -- user:view, user:impersonate, subscription:update, feature_flag:toggle, etc.
    
    -- Target
    target_type VARCHAR(50), -- user, subscription, feature_flag
    target_id UUID,
    
    -- Details
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created ON admin_audit_log(created_at DESC);
```

### 15. feature_flags (Feature-Toggles)

```sql
CREATE TABLE public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Flag
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Status
    is_enabled BOOLEAN DEFAULT false,
    
    -- Targeting
    enabled_for_all BOOLEAN DEFAULT false,
    enabled_for_users UUID[] DEFAULT '{}', -- Spezifische User-IDs
    enabled_for_plans VARCHAR[] DEFAULT '{}', -- ['handwerker', 'meister']
    percentage_rollout INTEGER DEFAULT 0, -- 0-100 für schrittweises Rollout
    
    -- Metadata
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function zum Prüfen eines Feature Flags
CREATE OR REPLACE FUNCTION is_feature_enabled(
    p_flag_name VARCHAR,
    p_user_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_flag RECORD;
    v_user_plan VARCHAR;
BEGIN
    SELECT * INTO v_flag FROM feature_flags WHERE name = p_flag_name;
    
    IF NOT FOUND OR NOT v_flag.is_enabled THEN
        RETURN false;
    END IF;
    
    -- Für alle aktiviert
    IF v_flag.enabled_for_all THEN
        RETURN true;
    END IF;
    
    -- Für spezifischen User
    IF p_user_id = ANY(v_flag.enabled_for_users) THEN
        RETURN true;
    END IF;
    
    -- Für Plan
    IF p_user_id IS NOT NULL THEN
        SELECT plan_id INTO v_user_plan FROM subscriptions WHERE user_id = p_user_id;
        IF v_user_plan = ANY(v_flag.enabled_for_plans) THEN
            RETURN true;
        END IF;
    END IF;
    
    -- Percentage Rollout (basierend auf User-ID Hash)
    IF v_flag.percentage_rollout > 0 AND p_user_id IS NOT NULL THEN
        IF (abs(hashtext(p_user_id::text)) % 100) < v_flag.percentage_rollout THEN
            RETURN true;
        END IF;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 16. support_tickets (Support-Queue)

```sql
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Ticket Details
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    -- general, billing, technical, feature_request, bug_report
    
    -- Status
    status VARCHAR(50) DEFAULT 'open',
    -- open, in_progress, waiting_for_customer, resolved, closed
    priority VARCHAR(20) DEFAULT 'normal',
    -- low, normal, high, urgent
    
    -- Assignment
    assigned_to UUID REFERENCES admin_users(id),
    
    -- Resolution
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Metadata
    user_email VARCHAR(255),
    user_plan VARCHAR(50),
    browser_info JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);
```

---

## Demo-Modus Tabellen

### 17. demo_sessions (Demo-Tracking)

```sql
CREATE TABLE public.demo_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Tracking
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Demo Data
    demo_data_created BOOLEAN DEFAULT false,
    demo_customer_ids UUID[] DEFAULT '{}',
    demo_project_ids UUID[] DEFAULT '{}',
    
    -- Conversion
    converted_to_user_id UUID REFERENCES auth.users(id),
    converted_at TIMESTAMPTZ,
    
    -- Timestamps
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demo_sessions_token ON demo_sessions(session_token);
CREATE INDEX idx_demo_sessions_expires ON demo_sessions(expires_at);

-- Cleanup alte Demo-Sessions
CREATE OR REPLACE FUNCTION cleanup_expired_demo_sessions()
RETURNS void AS $$
BEGIN
    -- Lösche Demo-Daten von abgelaufenen Sessions
    DELETE FROM customers WHERE id = ANY(
        SELECT unnest(demo_customer_ids) FROM demo_sessions 
        WHERE expires_at < NOW() AND converted_to_user_id IS NULL
    );
    
    -- Lösche abgelaufene Sessions
    DELETE FROM demo_sessions 
    WHERE expires_at < NOW() AND converted_to_user_id IS NULL;
END;
$$ LANGUAGE plpgsql;
```

### Demo Seed Data

```sql
-- Funktion zum Erstellen von Demo-Daten für eine Session
CREATE OR REPLACE FUNCTION create_demo_data(p_session_id UUID)
RETURNS void AS $$
DECLARE
    v_demo_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID; -- Spezieller Demo-User
    v_customer_ids UUID[];
    v_project_ids UUID[];
    v_cust_mueller UUID;
    v_cust_schmidt UUID;
    v_cust_weber UUID;
BEGIN
    -- Demo-Kunden erstellen
    INSERT INTO customers (id, user_id, first_name, last_name, company_name, email, phone, street, postal_code, city)
    VALUES 
        (gen_random_uuid(), v_demo_user_id, 'Thomas', 'Müller', NULL, 'mueller@example.com', '0171 1234567', 'Hauptstraße 12', '30159', 'Hannover'),
        (gen_random_uuid(), v_demo_user_id, 'Anna', 'Schmidt', 'Schmidt GmbH', 'a.schmidt@schmidt-gmbh.de', '0511 9876543', 'Industrieweg 45', '30159', 'Hannover'),
        (gen_random_uuid(), v_demo_user_id, 'Michael', 'Weber', 'Weber & Söhne', 'info@weber-soehne.de', '0172 5555555', 'Marktplatz 3', '30159', 'Hannover'),
        (gen_random_uuid(), v_demo_user_id, 'Lisa', 'Becker', NULL, 'lisa.becker@email.de', '0173 2222222', 'Gartenstraße 8', '30159', 'Hannover'),
        (gen_random_uuid(), v_demo_user_id, 'Stefan', 'Hoffmann', 'Hoffmann Immobilien', 'kontakt@hoffmann-immo.de', '0511 3333333', 'Königstraße 99', '30159', 'Hannover')
    RETURNING id INTO v_customer_ids;
    
    -- Speichere Customer IDs in Session
    UPDATE demo_sessions 
    SET demo_customer_ids = v_customer_ids, demo_data_created = true
    WHERE id = p_session_id;
    
    -- Demo-Projekte & Angebote erstellen (vereinfacht)
    -- ... weitere Demo-Daten
END;
$$ LANGUAGE plpgsql;
```

---

## Admin Dashboard Views

### Nutzer-Übersicht

```sql
CREATE OR REPLACE VIEW admin_users_overview AS
SELECT 
    u.id,
    u.email,
    u.created_at as registered_at,
    u.last_sign_in_at,
    p.company_name,
    p.owner_name,
    p.trade,
    p.city,
    s.plan_id,
    s.status as subscription_status,
    s.current_period_end,
    s.trial_end,
    (SELECT COUNT(*) FROM customers WHERE user_id = u.id AND deleted_at IS NULL) as customer_count,
    (SELECT COUNT(*) FROM invoices WHERE user_id = u.id) as invoice_count,
    (SELECT COALESCE(SUM(total_gross), 0) FROM invoices WHERE user_id = u.id AND status = 'paid') as total_revenue
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id
ORDER BY u.created_at DESC;
```

### Umsatz-Analytics

```sql
CREATE OR REPLACE VIEW admin_revenue_analytics AS
SELECT 
    DATE_TRUNC('month', ph.created_at) as month,
    COUNT(DISTINCT ph.user_id) as paying_customers,
    SUM(CASE WHEN ph.status = 'paid' THEN ph.amount_cents ELSE 0 END) / 100.0 as revenue_eur,
    COUNT(CASE WHEN ph.status = 'paid' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN ph.status = 'failed' THEN 1 END) as failed_payments
FROM payment_history ph
GROUP BY DATE_TRUNC('month', ph.created_at)
ORDER BY month DESC;

-- MRR Berechnung
CREATE OR REPLACE FUNCTION get_current_mrr()
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(
            CASE 
                WHEN s.plan_id = 'handwerker' AND s.billing_cycle = 'monthly' THEN 29.00
                WHEN s.plan_id = 'handwerker' AND s.billing_cycle = 'yearly' THEN 290.00 / 12
                WHEN s.plan_id = 'meister' AND s.billing_cycle = 'monthly' THEN 59.00
                WHEN s.plan_id = 'meister' AND s.billing_cycle = 'yearly' THEN 590.00 / 12
                ELSE 0
            END
        ), 0)
        FROM subscriptions s
        WHERE s.status IN ('active', 'trialing')
    );
END;
$$ LANGUAGE plpgsql;
```

---

## Profile-Management SQL Functions

### Automatische Profil-Erstellung bei Registrierung

```sql
-- migrations/020_profile_management.sql

-- Trigger: Automatisch Profil erstellen wenn User sich registriert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        owner_name,
        company_name,
        created_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'owner_name', NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
        NOW()
    );
    
    -- Starter-Subscription erstellen
    INSERT INTO public.subscriptions (
        user_id,
        plan_id,
        status,
        stripe_customer_id
    ) VALUES (
        NEW.id,
        'starter',
        'active',
        '' -- Wird später von Stripe gesetzt
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger auf auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Profil aktualisieren

```sql
-- Function: Profil sicher aktualisieren
CREATE OR REPLACE FUNCTION update_user_profile(
    p_owner_name VARCHAR DEFAULT NULL,
    p_company_name VARCHAR DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL,
    p_mobile VARCHAR DEFAULT NULL,
    p_street VARCHAR DEFAULT NULL,
    p_house_number VARCHAR DEFAULT NULL,
    p_postal_code VARCHAR DEFAULT NULL,
    p_city VARCHAR DEFAULT NULL,
    p_tax_id VARCHAR DEFAULT NULL,
    p_vat_id VARCHAR DEFAULT NULL,
    p_is_small_business BOOLEAN DEFAULT NULL,
    p_bank_name VARCHAR DEFAULT NULL,
    p_iban VARCHAR DEFAULT NULL,
    p_bic VARCHAR DEFAULT NULL,
    p_invoice_prefix VARCHAR DEFAULT NULL,
    p_quote_prefix VARCHAR DEFAULT NULL,
    p_default_payment_terms INTEGER DEFAULT NULL,
    p_default_vat_rate DECIMAL DEFAULT NULL
)
RETURNS profiles AS $$
DECLARE
    v_profile profiles;
BEGIN
    UPDATE profiles SET
        owner_name = COALESCE(p_owner_name, owner_name),
        company_name = COALESCE(p_company_name, company_name),
        phone = COALESCE(p_phone, phone),
        mobile = COALESCE(p_mobile, mobile),
        street = COALESCE(p_street, street),
        house_number = COALESCE(p_house_number, house_number),
        postal_code = COALESCE(p_postal_code, postal_code),
        city = COALESCE(p_city, city),
        tax_id = COALESCE(p_tax_id, tax_id),
        vat_id = COALESCE(p_vat_id, vat_id),
        is_small_business = COALESCE(p_is_small_business, is_small_business),
        bank_name = COALESCE(p_bank_name, bank_name),
        iban = COALESCE(p_iban, iban),
        bic = COALESCE(p_bic, bic),
        invoice_prefix = COALESCE(p_invoice_prefix, invoice_prefix),
        quote_prefix = COALESCE(p_quote_prefix, quote_prefix),
        default_payment_terms = COALESCE(p_default_payment_terms, default_payment_terms),
        default_vat_rate = COALESCE(p_default_vat_rate, default_vat_rate),
        updated_at = NOW()
    WHERE id = auth.uid()
    RETURNING * INTO v_profile;
    
    RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Account löschen (vollständig)

```sql
-- Function: User-Account vollständig löschen
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Prüfe ob User existiert und Caller berechtigt ist
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to delete this account';
    END IF;
    
    -- 1. Lösche alle Termine
    DELETE FROM appointments WHERE user_id = p_user_id;
    
    -- 2. Lösche alle Line Items (über Quotes/Invoices)
    DELETE FROM line_items WHERE quote_id IN (
        SELECT id FROM quotes WHERE user_id = p_user_id
    );
    DELETE FROM line_items WHERE invoice_id IN (
        SELECT id FROM invoices WHERE user_id = p_user_id
    );
    
    -- 3. Lösche alle Rechnungen (Hinweis: Für GoBD müssen diese evtl. archiviert werden)
    DELETE FROM invoices WHERE user_id = p_user_id;
    
    -- 4. Lösche alle Angebote
    DELETE FROM quotes WHERE user_id = p_user_id;
    
    -- 5. Lösche alle Projekte
    DELETE FROM projects WHERE user_id = p_user_id;
    
    -- 6. Lösche alle Kunden
    DELETE FROM customers WHERE user_id = p_user_id;
    
    -- 7. Lösche alle Vorlagen
    DELETE FROM templates WHERE user_id = p_user_id;
    
    -- 8. Lösche Audit-Log
    DELETE FROM audit_log WHERE user_id = p_user_id;
    
    -- 9. Lösche E-Mail-Queue
    DELETE FROM email_queue WHERE user_id = p_user_id;
    
    -- 10. Lösche Subscription
    DELETE FROM subscriptions WHERE user_id = p_user_id;
    
    -- 11. Lösche Payment History
    DELETE FROM payment_history WHERE user_id = p_user_id;
    
    -- 12. Lösche Profil
    DELETE FROM profiles WHERE id = p_user_id;
    
    -- 13. Auth User wird via Edge Function gelöscht (admin.deleteUser)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Account anonymisieren (für GoBD-Compliance)

```sql
-- Function: User-Daten anonymisieren (Rechnungen bleiben für 10 Jahre)
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Anonymisiere Profil (behalte für Rechnungsarchiv)
    UPDATE profiles SET
        email = 'deleted_' || p_user_id || '@deleted.local',
        owner_name = 'Gelöschter Nutzer',
        company_name = NULL,
        phone = NULL,
        mobile = NULL,
        street = NULL,
        house_number = NULL,
        postal_code = NULL,
        city = NULL,
        tax_id = '**GELÖSCHT**',
        vat_id = NULL,
        iban = NULL,
        bic = NULL,
        logo_url = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Anonymisiere Kunden (Rechnungen referenzieren diese)
    UPDATE customers SET
        first_name = 'Gelöscht',
        last_name = 'Gelöscht',
        company_name = 'Gelöschter Kunde',
        email = NULL,
        phone = NULL,
        street = NULL,
        postal_code = NULL,
        city = NULL,
        notes = NULL,
        deleted_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Lösche nicht-archivierungspflichtige Daten
    DELETE FROM appointments WHERE user_id = p_user_id;
    DELETE FROM templates WHERE user_id = p_user_id;
    DELETE FROM projects WHERE user_id = p_user_id 
        AND id NOT IN (SELECT project_id FROM invoices WHERE user_id = p_user_id);
    DELETE FROM quotes WHERE user_id = p_user_id 
        AND id NOT IN (SELECT quote_id FROM invoices WHERE user_id = p_user_id AND quote_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Passwort-Änderung protokollieren

```sql
-- Trigger: Passwort-Änderung im Audit-Log
CREATE OR REPLACE FUNCTION log_password_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.encrypted_password != NEW.encrypted_password THEN
        INSERT INTO audit_log (
            user_id,
            action,
            table_name,
            details
        ) VALUES (
            NEW.id,
            'password_changed',
            'auth.users',
            jsonb_build_object('changed_at', NOW())
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger auf auth.users (benötigt Service Role)
-- Wird via Supabase Dashboard oder Migration mit Service Role ausgeführt
```

---

## E-Mail-Queue Tabelle

```sql
-- migrations/021_email_queue.sql

CREATE TABLE public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- E-Mail Details
    to_email VARCHAR(255) NOT NULL,
    to_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    reply_to VARCHAR(255),
    
    -- Template (optional)
    template_id VARCHAR(100),
    template_data JSONB,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, processing, sent, failed, cancelled
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    priority INTEGER DEFAULT 5, -- 1-10, niedrig = wichtiger
    
    -- Retry Logic
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    
    -- Result
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    smtp_message_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Queue-Verarbeitung
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_queue_priority ON email_queue(priority, created_at) WHERE status = 'pending';
CREATE INDEX idx_email_queue_user ON email_queue(user_id);

-- RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emails"
    ON email_queue FOR SELECT
    USING (auth.uid() = user_id);

-- Nur Service Role kann E-Mails einfügen/updaten
CREATE POLICY "Service role can manage email queue"
    ON email_queue FOR ALL
    USING (auth.role() = 'service_role');
```

### E-Mail Queue Helper Functions

```sql
-- Function: E-Mail in Queue einfügen
CREATE OR REPLACE FUNCTION queue_email(
    p_to_email VARCHAR,
    p_subject VARCHAR,
    p_html_body TEXT,
    p_template_id VARCHAR DEFAULT NULL,
    p_template_data JSONB DEFAULT NULL,
    p_scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    v_email_id UUID;
BEGIN
    INSERT INTO email_queue (
        user_id,
        to_email,
        subject,
        html_body,
        template_id,
        template_data,
        scheduled_for,
        priority
    ) VALUES (
        auth.uid(),
        p_to_email,
        p_subject,
        p_html_body,
        p_template_id,
        p_template_data,
        p_scheduled_for,
        p_priority
    )
    RETURNING id INTO v_email_id;
    
    RETURN v_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Nächste E-Mails zum Versenden holen
CREATE OR REPLACE FUNCTION get_pending_emails(p_limit INTEGER DEFAULT 10)
RETURNS SETOF email_queue AS $$
BEGIN
    RETURN QUERY
    UPDATE email_queue
    SET 
        status = 'processing',
        last_attempt_at = NOW(),
        attempts = attempts + 1
    WHERE id IN (
        SELECT id FROM email_queue
        WHERE status = 'pending'
        AND scheduled_for <= NOW()
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        ORDER BY priority ASC, created_at ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: E-Mail als gesendet markieren
CREATE OR REPLACE FUNCTION mark_email_sent(
    p_email_id UUID,
    p_smtp_message_id VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE email_queue SET
        status = 'sent',
        sent_at = NOW(),
        smtp_message_id = p_smtp_message_id,
        updated_at = NOW()
    WHERE id = p_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: E-Mail als fehlgeschlagen markieren
CREATE OR REPLACE FUNCTION mark_email_failed(
    p_email_id UUID,
    p_error_message TEXT
)
RETURNS void AS $$
DECLARE
    v_attempts INTEGER;
    v_max_attempts INTEGER;
BEGIN
    SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
    FROM email_queue WHERE id = p_email_id;
    
    IF v_attempts >= v_max_attempts THEN
        -- Endgültig fehlgeschlagen
        UPDATE email_queue SET
            status = 'failed',
            error_message = p_error_message,
            updated_at = NOW()
        WHERE id = p_email_id;
    ELSE
        -- Retry planen (exponentieller Backoff: 1min, 5min, 30min)
        UPDATE email_queue SET
            status = 'pending',
            error_message = p_error_message,
            next_retry_at = NOW() + (POWER(5, v_attempts) * INTERVAL '1 minute'),
            updated_at = NOW()
        WHERE id = p_email_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Cron Job für E-Mail Queue

```sql
-- Cron Job: E-Mail Queue verarbeiten (alle 1 Minute)
SELECT cron.schedule(
    'process-email-queue',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/process-email-queue',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    )
    $$
);

-- Cron Job: Alte verarbeitete E-Mails löschen (täglich)
SELECT cron.schedule(
    'cleanup-email-queue',
    '0 3 * * *',
    $$DELETE FROM email_queue WHERE status IN ('sent', 'failed') AND created_at < NOW() - INTERVAL '30 days'$$
);
```

---

## Onboarding-Status Tracking

```sql
-- Erweiterung der profiles Tabelle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';

-- Function: Onboarding-Schritt aktualisieren
CREATE OR REPLACE FUNCTION update_onboarding_step(
    p_step INTEGER,
    p_data JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    UPDATE profiles SET
        onboarding_step = p_step,
        onboarding_data = onboarding_data || p_data,
        onboarding_completed = (p_step >= 5), -- 5 Schritte im Onboarding
        updated_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migrations-Reihenfolge

1. `001_create_profiles.sql`
2. `002_create_customers.sql`
3. `003_create_projects.sql`
4. `004_create_quotes.sql`
5. `005_create_invoices.sql`
6. `006_create_line_items.sql`
7. `007_create_appointments.sql`
8. `008_create_templates.sql`
9. `009_create_audit_log.sql`
10. `010_create_functions.sql`
11. `011_create_triggers.sql`
12. `012_create_subscriptions.sql`
13. `013_create_payment_history.sql`
14. `014_create_admin_tables.sql`
15. `015_create_feature_flags.sql`
16. `016_create_support_tickets.sql`
17. `017_create_demo_sessions.sql`
18. `018_create_admin_views.sql`
19. `019_seed_data.sql` (nur Development)
20. `020_profile_management.sql`
21. `021_email_queue.sql`
22. `022_onboarding_tracking.sql`
23. `023_cron_jobs.sql`
