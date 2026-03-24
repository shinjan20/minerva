-- Migration: Add Class Participation and Update Constraints
-- Allows tracking of CP weightage and ensures total weight still sums to 100%.

ALTER TABLE score_breakup ADD COLUMN cp_pct DECIMAL DEFAULT 0;

-- Drop old check constraint
ALTER TABLE score_breakup DROP CONSTRAINT IF EXISTS pct_sum_check;

-- Add new check constraint including CP
ALTER TABLE score_breakup ADD CONSTRAINT pct_sum_check 
CHECK (quiz_pct + midterm_pct + project_pct + endterm_pct + cp_pct = 100);
