-- 003_create_period_entries.sql
-- Perioden-Tracking (Menstruation)

CREATE TABLE IF NOT EXISTS period_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  flow_intensity TEXT DEFAULT 'medium' CHECK (flow_intensity IN ('light', 'medium', 'heavy', 'spotting')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Index
CREATE INDEX idx_period_entries_user_date 
  ON period_entries(user_id, date DESC);

-- RLS aktivieren
ALTER TABLE period_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own period entries"
  ON period_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own period entries"
  ON period_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own period entries"
  ON period_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own period entries"
  ON period_entries FOR DELETE
  USING (auth.uid() = user_id);
