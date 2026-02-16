-- 002_create_temperature_entries.sql
-- Tägliche Basaltemperatur-Einträge

CREATE TABLE IF NOT EXISTS temperature_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  temperature DECIMAL(4,2) NOT NULL CHECK (temperature BETWEEN 34.00 AND 42.00),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Index für schnelle Abfragen nach Benutzer und Datumsbereich
CREATE INDEX idx_temperature_entries_user_date 
  ON temperature_entries(user_id, date DESC);

-- RLS aktivieren
ALTER TABLE temperature_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own temperature entries"
  ON temperature_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own temperature entries"
  ON temperature_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own temperature entries"
  ON temperature_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own temperature entries"
  ON temperature_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: updated_at
CREATE OR REPLACE TRIGGER temperature_entries_updated_at
  BEFORE UPDATE ON temperature_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
