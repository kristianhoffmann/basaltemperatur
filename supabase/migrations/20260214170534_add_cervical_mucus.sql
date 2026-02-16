-- Add cervical mucus tracking to temperature entries
ALTER TABLE temperature_entries 
ADD COLUMN IF NOT EXISTS cervical_mucus TEXT 
CHECK (cervical_mucus IN ('dry', 'sticky', 'creamy', 'watery', 'eggwhite'));
