-- Fix region_rules table to have proper integer primary key
-- The maker_preference table expects region_rules_id as integer, but region_rules table only has UUID id

-- First, add the missing integer primary key column to region_rules if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'region_rules' AND column_name = 'region_rules_id') THEN
        -- Add the integer primary key column
        ALTER TABLE region_rules ADD COLUMN region_rules_id SERIAL PRIMARY KEY;
    END IF;
END $$;

-- Update the maker_preference table to ensure it uses the correct integer foreign key
-- The region_rules_id in maker_preference should reference region_rules.region_rules_id (integer)
ALTER TABLE maker_preference DROP CONSTRAINT IF EXISTS maker_preference_region_rules_id_fkey;
ALTER TABLE maker_preference ADD CONSTRAINT maker_preference_region_rules_id_fkey 
    FOREIGN KEY (region_rules_id) REFERENCES region_rules(region_rules_id);