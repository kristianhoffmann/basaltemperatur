-- Fix display_name handling:
-- 1. handle_new_user() trigger now also reads `owner_name` (used by web sign-up form & iOS)
-- 2. Backfill profiles for any auth user that has no row in `profiles`
-- 3. Backfill display_name from user_metadata.owner_name where the profile currently
--    holds the email as a fallback (i.e. trigger never picked up the real name)
--
-- All operations are idempotent and never overwrite a user-set display_name.

-- 1. Trigger update --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'owner_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill missing profiles --------------------------------------------
INSERT INTO public.profiles (id, display_name)
SELECT
  u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'owner_name', ''),
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    u.email
  )
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 3. Promote owner_name into display_name where the profile still has the email
--    (only when an actual owner_name is stored in user_metadata).
UPDATE public.profiles p
SET display_name = u.raw_user_meta_data->>'owner_name'
FROM auth.users u
WHERE p.id = u.id
  AND p.display_name = u.email
  AND NULLIF(u.raw_user_meta_data->>'owner_name', '') IS NOT NULL;

-- 4. Keep profiles.display_name in sync when auth metadata changes (e.g. via iOS).
--    iOS' SupabaseService.updateUserName writes to auth.users.raw_user_meta_data.owner_name.
--    Without this trigger, the web UI (which reads profiles.display_name) would lag behind.
CREATE OR REPLACE FUNCTION public.sync_display_name_from_auth()
RETURNS TRIGGER AS $$
DECLARE
  new_name TEXT;
BEGIN
  new_name := NULLIF(NEW.raw_user_meta_data->>'owner_name', '');
  IF new_name IS NOT NULL
     AND new_name IS DISTINCT FROM (OLD.raw_user_meta_data->>'owner_name') THEN
    UPDATE public.profiles
       SET display_name = new_name
     WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_metadata_updated ON auth.users;
CREATE TRIGGER on_auth_user_metadata_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_display_name_from_auth();
