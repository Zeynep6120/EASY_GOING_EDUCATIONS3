-- Migration script: Rename lesson_programs to course_programs
-- Version: v8

BEGIN;

-- Rename table
ALTER TABLE lesson_programs RENAME TO course_programs;

-- Rename primary key constraint
ALTER TABLE course_programs RENAME CONSTRAINT lesson_programs_pkey TO course_programs_pkey;

-- Rename column
ALTER TABLE course_programs RENAME COLUMN lesson_program_id TO course_program_id;

-- Update foreign keys in related tables
-- student_programs
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_programs' AND column_name = 'lesson_program_id') THEN
    ALTER TABLE student_programs RENAME COLUMN lesson_program_id TO course_program_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_programs_lesson_program_id_fkey') THEN
    ALTER TABLE student_programs RENAME CONSTRAINT student_programs_lesson_program_id_fkey TO student_programs_course_program_id_fkey;
  END IF;
END $$;

-- instructor_programs
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instructor_programs' AND column_name = 'lesson_program_id') THEN
    ALTER TABLE instructor_programs RENAME COLUMN lesson_program_id TO course_program_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'instructor_programs_lesson_program_id_fkey') THEN
    ALTER TABLE instructor_programs RENAME CONSTRAINT instructor_programs_lesson_program_id_fkey TO instructor_programs_course_program_id_fkey;
  END IF;
END $$;

-- teacher_programs (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_programs' AND column_name = 'lesson_program_id') THEN
    ALTER TABLE teacher_programs RENAME COLUMN lesson_program_id TO course_program_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'teacher_programs_lesson_program_id_fkey') THEN
    ALTER TABLE teacher_programs RENAME CONSTRAINT teacher_programs_lesson_program_id_fkey TO teacher_programs_course_program_id_fkey;
  END IF;
END $$;

COMMIT;

