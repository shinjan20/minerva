-- 1. Add unique constraint to marks for UPSERT capabilities
ALTER TABLE marks ADD CONSTRAINT marks_student_course_component_key UNIQUE (course_id, student_id, component);

-- 2. Add course credits for Top-Level TGPA equations
ALTER TABLE courses ADD COLUMN credits DECIMAL DEFAULT 1.0;

-- 3. Add new component percentages to score_breakup
ALTER TABLE score_breakup ADD COLUMN assignments_pct DECIMAL DEFAULT 0;
ALTER TABLE score_breakup ADD COLUMN class_participation_pct DECIMAL DEFAULT 0;

-- 4. Recreate the CHECK constraint for score_breakup to include the new components
ALTER TABLE score_breakup DROP CONSTRAINT pct_sum_check;
ALTER TABLE score_breakup ADD CONSTRAINT pct_sum_check 
  CHECK (quiz_pct + midterm_pct + project_pct + endterm_pct + assignments_pct + class_participation_pct = 100);
