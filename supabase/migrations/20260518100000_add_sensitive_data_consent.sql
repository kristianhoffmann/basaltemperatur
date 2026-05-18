-- Versioned consent for processing sensitive cycle data.
-- Temperature and period writes are blocked until the profile has explicit consent.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sensitive_data_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sensitive_data_consent_version TEXT,
  ADD COLUMN IF NOT EXISTS intended_use_acknowledged_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.has_sensitive_data_consent(metadata JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN lower(coalesce(metadata->>'sensitive_data_consent', 'false')) IN ('true', '1', 'yes', 'on');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  has_consent BOOLEAN;
BEGIN
  has_consent := public.has_sensitive_data_consent(NEW.raw_user_meta_data);

  INSERT INTO public.profiles AS p (
    id,
    display_name,
    sensitive_data_consent_at,
    sensitive_data_consent_version,
    intended_use_acknowledged_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'owner_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email
    ),
    CASE WHEN has_consent THEN now() ELSE NULL END,
    CASE
      WHEN has_consent THEN COALESCE(NULLIF(NEW.raw_user_meta_data->>'sensitive_data_consent_version', ''), '2026-05-18')
      ELSE NULL
    END,
    CASE WHEN has_consent THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE
    SET sensitive_data_consent_at = COALESCE(p.sensitive_data_consent_at, EXCLUDED.sensitive_data_consent_at),
        sensitive_data_consent_version = COALESCE(p.sensitive_data_consent_version, EXCLUDED.sensitive_data_consent_version),
        intended_use_acknowledged_at = COALESCE(p.intended_use_acknowledged_at, EXCLUDED.intended_use_acknowledged_at);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

UPDATE public.profiles p
SET sensitive_data_consent_at = COALESCE(p.sensitive_data_consent_at, u.created_at, now()),
    sensitive_data_consent_version = COALESCE(
      p.sensitive_data_consent_version,
      NULLIF(u.raw_user_meta_data->>'sensitive_data_consent_version', ''),
      '2026-05-18'
    ),
    intended_use_acknowledged_at = COALESCE(p.intended_use_acknowledged_at, u.created_at, now())
FROM auth.users u
WHERE p.id = u.id
  AND public.has_sensitive_data_consent(u.raw_user_meta_data);

CREATE OR REPLACE FUNCTION public.require_sensitive_data_consent()
RETURNS TRIGGER AS $$
DECLARE
  profile_consent_at TIMESTAMPTZ;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT sensitive_data_consent_at
    INTO profile_consent_at
    FROM public.profiles
   WHERE id = NEW.user_id;

  IF profile_consent_at IS NULL THEN
    RAISE EXCEPTION 'SENSITIVE_DATA_CONSENT_REQUIRED'
      USING ERRCODE = 'P0001',
            MESSAGE = 'SENSITIVE_DATA_CONSENT_REQUIRED';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS require_sensitive_data_consent_temperature_entries ON public.temperature_entries;
CREATE TRIGGER require_sensitive_data_consent_temperature_entries
  BEFORE INSERT OR UPDATE ON public.temperature_entries
  FOR EACH ROW EXECUTE FUNCTION public.require_sensitive_data_consent();

DROP TRIGGER IF EXISTS require_sensitive_data_consent_period_entries ON public.period_entries;
CREATE TRIGGER require_sensitive_data_consent_period_entries
  BEFORE INSERT OR UPDATE ON public.period_entries
  FOR EACH ROW EXECUTE FUNCTION public.require_sensitive_data_consent();
