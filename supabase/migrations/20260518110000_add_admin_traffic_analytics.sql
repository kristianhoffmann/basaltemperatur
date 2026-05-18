-- Admin traffic analytics.
-- Events are written server-side with the service-role key. IP addresses are not stored in plain text.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.traffic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL DEFAULT 'pageview' CHECK (event_type IN ('pageview', 'conversion', 'custom')),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  path TEXT NOT NULL,
  full_url TEXT,
  query_string TEXT,
  title TEXT,
  referrer TEXT,
  referrer_host TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  language TEXT,
  timezone TEXT,
  viewport_width INT,
  viewport_height INT,
  screen_width INT,
  screen_height INT,
  color_scheme TEXT CHECK (color_scheme IS NULL OR color_scheme IN ('light', 'dark')),
  connection_type TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT CHECK (device_type IS NULL OR device_type IN ('desktop', 'mobile', 'tablet')),
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  bot_name TEXT,
  ip_hash TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.traffic_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_traffic_events_created_at ON public.traffic_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_events_path_created_at ON public.traffic_events(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_events_visitor_created_at ON public.traffic_events(visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_events_session_created_at ON public.traffic_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_events_user_created_at ON public.traffic_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_events_referrer_host ON public.traffic_events(referrer_host) WHERE referrer_host IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_events_utm_source ON public.traffic_events(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_events_country ON public.traffic_events(country) WHERE country IS NOT NULL;

REVOKE ALL ON public.traffic_events FROM anon, authenticated;
