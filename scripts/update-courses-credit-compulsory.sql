-- Update courses table: Add credit_score and compulsory columns
-- Version: v8

BEGIN;

-- Add credit_score column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'credit_score'
  ) THEN
    ALTER TABLE courses ADD COLUMN credit_score INTEGER DEFAULT 3;
  END IF;
END $$;

-- Add compulsory column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'compulsory'
  ) THEN
    ALTER TABLE courses ADD COLUMN compulsory BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update credit scores and compulsory status based on level
UPDATE courses 
SET credit_score = 3, compulsory = true
WHERE level = 'Beginner';

UPDATE courses 
SET credit_score = 4, compulsory = false
WHERE level = 'Intermediate';

UPDATE courses 
SET credit_score = 5, compulsory = false
WHERE level = 'Advanced';

-- Specific adjustments for important courses
UPDATE courses 
SET credit_score = 4, compulsory = true
WHERE title IN ('Web Development Fundamentals', 'Python Programming', 'Database Design & SQL');

UPDATE courses 
SET credit_score = 6, compulsory = false
WHERE title IN ('Full Stack Development', 'AI & Deep Learning', 'Blockchain Development', 'Game Development');

COMMIT;

