-- Migration: Add max_score to marks_visibility
-- Allows pre-configuration of component maximum scores with visibility controls.

ALTER TABLE marks_visibility ADD COLUMN max_score DECIMAL;

-- Optional: Populate existing ones with a default if needed, 
-- but we'll let the app handle it dynamically.
