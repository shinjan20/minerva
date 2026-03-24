-- Migration: Term Lock & Cleanup
-- 1. Drop redundant tables
DROP TABLE IF EXISTS cr_otp_registration;
DROP TABLE IF EXISTS announcements;

-- 2. Update academic_terms with locking mechanisms
-- (Adding IF NOT EXISTS for safety as these might have been added in a previous manual run or 04 update)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='academic_terms' AND column_name='is_locked') THEN
        ALTER TABLE academic_terms ADD COLUMN is_locked BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='academic_terms' AND column_name='is_published') THEN
        ALTER TABLE academic_terms ADD COLUMN is_published BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='academic_terms' AND column_name='locked_at') THEN
        ALTER TABLE academic_terms ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Ensure defaults for terms 1-3 exist
INSERT INTO academic_terms (term, weight) 
VALUES (1, 1.0), (2, 1.0), (3, 1.0)
ON CONFLICT (term) DO NOTHING;
