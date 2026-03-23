-- Migration Script: Refactoring `marks` table to JSONB Structure
-- Instruction: Run this script precisely once in your Supabase SQL Editor to enforce the new schema.

DROP TABLE IF EXISTS marks;

CREATE TABLE marks (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id             UUID REFERENCES courses(id) ON DELETE CASCADE,
  pgpid                 VARCHAR NOT NULL REFERENCES student_roster(student_id) ON DELETE CASCADE,
  marks_data            JSONB NOT NULL DEFAULT '{}',
  uploaded_by           UUID REFERENCES users(id),
  uploaded_at           TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, pgpid)
);

CREATE INDEX idx_marks_student_course ON marks(pgpid, course_id);
