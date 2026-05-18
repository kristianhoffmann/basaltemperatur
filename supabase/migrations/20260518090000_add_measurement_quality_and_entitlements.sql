-- Add structured measurement-quality fields and harden premium entitlements.
-- The quality fields are nullable/backward-compatible for existing entries.

ALTER TABLE temperature_entries
ADD COLUMN IF NOT EXISTS measurement_time TIME,
ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(3,1) CHECK (sleep_hours IS NULL OR (sleep_hours >= 0 AND sleep_hours <= 24)),
ADD COLUMN IF NOT EXISTS disturbed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disturbance_reason TEXT,
ADD COLUMN IF NOT EXISTS exclude_from_analysis BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS entitlement_source TEXT NOT NULL DEFAULT 'none'
  CHECK (entitlement_source IN ('none', 'stripe', 'app_store', 'manual')),
ADD COLUMN IF NOT EXISTS lifetime_access_granted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS app_store_original_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS app_store_product_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_app_store_original_transaction_id
  ON profiles(app_store_original_transaction_id)
  WHERE app_store_original_transaction_id IS NOT NULL;

-- RLS can restrict rows but not individual columns. This trigger prevents users
-- from self-granting premium access through a normal authenticated profile update.
CREATE OR REPLACE FUNCTION public.prevent_client_entitlement_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.has_lifetime_access IS DISTINCT FROM FALSE
        OR NEW.entitlement_source IS DISTINCT FROM 'none'
        OR NEW.lifetime_access_granted_at IS NOT NULL
        OR NEW.app_store_original_transaction_id IS NOT NULL
        OR NEW.app_store_product_id IS NOT NULL THEN
        RAISE EXCEPTION 'Premium entitlement fields cannot be inserted by clients.';
      END IF;
    ELSIF NEW.has_lifetime_access IS DISTINCT FROM OLD.has_lifetime_access
      OR NEW.entitlement_source IS DISTINCT FROM OLD.entitlement_source
      OR NEW.lifetime_access_granted_at IS DISTINCT FROM OLD.lifetime_access_granted_at
      OR NEW.app_store_original_transaction_id IS DISTINCT FROM OLD.app_store_original_transaction_id
      OR NEW.app_store_product_id IS DISTINCT FROM OLD.app_store_product_id THEN
      RAISE EXCEPTION 'Premium entitlement fields cannot be updated by clients.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_client_entitlement_updates ON profiles;
CREATE TRIGGER prevent_client_entitlement_updates
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_entitlement_updates();
