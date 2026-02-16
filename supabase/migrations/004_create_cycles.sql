-- 004_create_cycles.sql
-- Berechnete Zyklen mit Eisprung-Erkennung

CREATE TABLE IF NOT EXISTS cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  ovulation_date DATE,
  cycle_length INT,
  cover_line_temp DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_cycles_user_date 
  ON cycles(user_id, start_date DESC);

-- RLS aktivieren
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cycles"
  ON cycles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles"
  ON cycles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles"
  ON cycles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycles"
  ON cycles FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: updated_at
CREATE OR REPLACE TRIGGER cycles_updated_at
  BEFORE UPDATE ON cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
