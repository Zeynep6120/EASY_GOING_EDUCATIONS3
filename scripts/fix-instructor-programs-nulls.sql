-- Script to fix null values in instructor_programs table
-- This script updates all null columns by joining with related tables

BEGIN;

-- Update instructor information from users table
UPDATE instructor_programs ip
SET 
  instructor_name = COALESCE(ip.instructor_name, u.name),
  instructor_surname = COALESCE(ip.instructor_surname, u.surname),
  instructor_email = COALESCE(ip.instructor_email, u.email),
  instructor_username = COALESCE(ip.instructor_username, u.username)
FROM users u
WHERE ip.instructor_id = u.user_id
  AND u.role = 'INSTRUCTOR'
  AND (
    ip.instructor_name IS NULL OR
    ip.instructor_surname IS NULL OR
    ip.instructor_email IS NULL OR
    ip.instructor_username IS NULL
  );

-- Update program information from course_programs table
UPDATE instructor_programs ip
SET 
  program_id = COALESCE(ip.program_id, cp.course_program_id),
  day = COALESCE(ip.day, cp.day_of_week),
  time = COALESCE(
    ip.time,
    CASE 
      WHEN cp.start_time IS NOT NULL AND cp.stop_time IS NOT NULL 
      THEN cp.start_time::text || ' - ' || cp.stop_time::text
      ELSE NULL
    END
  )
FROM course_programs cp
WHERE ip.course_program_id = cp.course_program_id
  AND (
    ip.program_id IS NULL OR
    ip.day IS NULL OR
    ip.time IS NULL
  );

-- Update term information from education_terms via course_programs
UPDATE instructor_programs ip
SET 
  term = COALESCE(ip.term, et.term_name)
FROM course_programs cp
JOIN education_terms et ON cp.education_term_id = et.term_id
WHERE ip.course_program_id = cp.course_program_id
  AND ip.term IS NULL;

-- Update course information from program_lessons and courses tables
-- First try program_lessons -> courses (if program_lessons table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_lessons') THEN
    UPDATE instructor_programs ip
    SET 
      course_id = COALESCE(ip.course_id, c.course_id),
      course_name = COALESCE(ip.course_name, c.title)
    FROM course_programs cp
    LEFT JOIN program_lessons pl ON pl.course_program_id = cp.course_program_id
    LEFT JOIN courses c ON c.course_id = pl.lesson_id
    WHERE ip.course_program_id = cp.course_program_id
      AND c.course_id IS NOT NULL
      AND (
        ip.course_id IS NULL OR
        ip.course_name IS NULL
      );
  END IF;
END $$;

-- If still null, try program_courses -> courses (if program_courses table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_courses') THEN
    UPDATE instructor_programs ip
    SET 
      course_id = COALESCE(ip.course_id, c.course_id),
      course_name = COALESCE(ip.course_name, c.title)
    FROM course_programs cp
    LEFT JOIN program_courses pc ON pc.course_program_id = cp.course_program_id
    LEFT JOIN courses c ON c.course_id = pc.course_id
    WHERE ip.course_program_id = cp.course_program_id
      AND c.course_id IS NOT NULL
      AND (
        ip.course_id IS NULL OR
        ip.course_name IS NULL
      );
  END IF;
END $$;

-- If still null, try course_programs table directly (it may have course_id and course_name)
UPDATE instructor_programs ip
SET 
  course_id = COALESCE(ip.course_id, cp.course_id),
  course_name = COALESCE(ip.course_name, cp.course_name)
FROM course_programs cp
WHERE ip.course_program_id = cp.course_program_id
  AND (
    cp.course_id IS NOT NULL OR
    cp.course_name IS NOT NULL
  )
  AND (
    ip.course_id IS NULL OR
    ip.course_name IS NULL
  );

-- If still null, try program_lessons -> lessons table (if lessons table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons') THEN
    UPDATE instructor_programs ip
    SET 
      course_id = COALESCE(ip.course_id, l.lesson_id),
      course_name = COALESCE(ip.course_name, l.lesson_name)
    FROM course_programs cp
    LEFT JOIN program_lessons pl ON pl.course_program_id = cp.course_program_id
    LEFT JOIN lessons l ON l.lesson_id = pl.lesson_id
    WHERE ip.course_program_id = cp.course_program_id
      AND l.lesson_id IS NOT NULL
      AND (
        ip.course_id IS NULL OR
        ip.course_name IS NULL
      );
  END IF;
END $$;

COMMIT;

-- Show summary of updates
SELECT 
  COUNT(*) as total_records,
  COUNT(instructor_name) as has_instructor_name,
  COUNT(instructor_surname) as has_instructor_surname,
  COUNT(instructor_email) as has_instructor_email,
  COUNT(instructor_username) as has_instructor_username,
  COUNT(program_id) as has_program_id,
  COUNT(day) as has_day,
  COUNT(time) as has_time,
  COUNT(term) as has_term,
  COUNT(course_id) as has_course_id,
  COUNT(course_name) as has_course_name
FROM instructor_programs;

