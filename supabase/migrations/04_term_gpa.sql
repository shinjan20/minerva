-- Migration: Add term to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 1 CHECK (term BETWEEN 1 AND 3);

-- Add term weights for CGPA calculation
CREATE TABLE IF NOT EXISTS academic_terms (
  term INTEGER PRIMARY KEY CHECK (term BETWEEN 1 AND 3),
  weight DECIMAL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  locked_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default weights
INSERT INTO academic_terms (term, weight) VALUES (1, 1.0), (2, 1.0), (3, 1.0)
ON CONFLICT (term) DO NOTHING;
