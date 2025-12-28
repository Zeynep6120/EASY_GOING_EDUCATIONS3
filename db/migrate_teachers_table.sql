-- Migration: Add all teacher information fields to teachers table
-- This migration adds all user information fields to the teachers table
-- so that all teacher data is stored in one place

-- Add columns to teachers table
ALTER TABLE teachers
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

-- Update existing records with data from users table
UPDATE teachers t
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
WHERE t.teacher_id = u.user_id;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_ssn ON teachers(ssn);

