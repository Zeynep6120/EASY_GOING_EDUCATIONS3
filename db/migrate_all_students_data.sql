-- Migration: Copy all student information from users table to students table
-- This migration ensures all existing student records have complete information in the students table

-- First, ensure all columns exist in students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS username VARCHAR(50),
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS surname VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_place VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS ssn VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing student records with data from users table
UPDATE students s
SET 
  username = u.username,
  name = u.name,
  surname = u.surname,
  email = u.email,
  gender = u.gender,
  birth_date = u.birth_date,
  birth_place = u.birth_place,
  phone_number = u.phone_number,
  ssn = u.ssn,
  is_active = u.is_active
FROM users u
WHERE s.student_id = u.user_id;

-- Insert students that exist in users but not in students table
INSERT INTO students (
  student_id, username, name, surname, email, gender, 
  birth_date, birth_place, phone_number, ssn, is_active,
  father_name, mother_name, advisor_teacher_id
)
SELECT 
  u.user_id,
  u.username,
  u.name,
  u.surname,
  u.email,
  u.gender,
  u.birth_date,
  u.birth_place,
  u.phone_number,
  u.ssn,
  u.is_active,
  s.father_name,
  s.mother_name,
  s.advisor_teacher_id
FROM users u
LEFT JOIN students s ON u.user_id = s.student_id
WHERE u.role = 'STUDENT'
  AND s.student_id IS NULL;

-- If students table doesn't have father_name/mother_name but users has related data,
-- we need to check if there's a way to get this data. For now, we'll leave it as is
-- since those fields are student-specific and should already be in students table.

-- Add indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_ssn ON students(ssn);

-- Verify the migration
SELECT 
  COUNT(*) as total_students_in_users,
  (SELECT COUNT(*) FROM students) as total_students_in_students_table,
  COUNT(CASE WHEN s.username IS NOT NULL THEN 1 END) as students_with_username,
  COUNT(CASE WHEN s.name IS NOT NULL THEN 1 END) as students_with_name,
  COUNT(CASE WHEN s.email IS NOT NULL THEN 1 END) as students_with_email
FROM users u
LEFT JOIN students s ON u.user_id = s.student_id
WHERE u.role = 'STUDENT';

