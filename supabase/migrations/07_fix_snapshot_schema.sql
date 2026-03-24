-- Migration: Fix marks_snapshot schema mismatch
-- The application code expects a section_rank column which was missing in 01_schema.sql

ALTER TABLE marks_snapshot ADD COLUMN IF NOT EXISTS section_rank INTEGER;

-- Create index for section_rank if needed, but it's probably not critical yet compared to the insert failure.
CREATE INDEX IF NOT EXISTS idx_marks_snapshot_section_rank ON marks_snapshot(section_rank);
