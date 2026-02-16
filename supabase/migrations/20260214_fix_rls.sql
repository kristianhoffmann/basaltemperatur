-- Ensure RLS is enabled
ALTER TABLE temperature_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_entries ENABLE ROW LEVEL SECURITY;

-- Temperature Entries Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'temperature_entries' AND policyname = 'Users can view their own temperature entries') THEN
        CREATE POLICY "Users can view their own temperature entries" 
        ON temperature_entries FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'temperature_entries' AND policyname = 'Users can insert their own temperature entries') THEN
        CREATE POLICY "Users can insert their own temperature entries" 
        ON temperature_entries FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'temperature_entries' AND policyname = 'Users can update their own temperature entries') THEN
        CREATE POLICY "Users can update their own temperature entries" 
        ON temperature_entries FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'temperature_entries' AND policyname = 'Users can delete their own temperature entries') THEN
        CREATE POLICY "Users can delete their own temperature entries" 
        ON temperature_entries FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Period Entries Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'period_entries' AND policyname = 'Users can view their own period entries') THEN
        CREATE POLICY "Users can view their own period entries" 
        ON period_entries FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'period_entries' AND policyname = 'Users can insert their own period entries') THEN
        CREATE POLICY "Users can insert their own period entries" 
        ON period_entries FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'period_entries' AND policyname = 'Users can update their own period entries') THEN
        CREATE POLICY "Users can update their own period entries" 
        ON period_entries FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'period_entries' AND policyname = 'Users can delete their own period entries') THEN
        CREATE POLICY "Users can delete their own period entries" 
        ON period_entries FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;
