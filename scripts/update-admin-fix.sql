-- Fix Admin Information - Run this in pgAdmin Query Tool
-- This will update both users and admins tables

BEGIN;

-- First, update the admins table directly by admin_id
UPDATE admins
SET 
    gender = 'MALE',
    birth_date = '1984-01-15',
    birth_place = 'Istanbul',
    phone_number = '5551234567',
    ssn = '12345678901'
WHERE admin_id = 1;

-- Then update the users table
UPDATE users
SET 
    gender = 'MALE',
    birth_date = '1984-01-15',
    birth_place = 'Istanbul',
    phone_number = '5551234567',
    ssn = '12345678901'
WHERE username = 'admin' AND role = 'ADMIN';

COMMIT;

-- Verify the update
SELECT 
    admin_id,
    username,
    name,
    surname,
    email,
    gender,
    birth_date,
    birth_place,
    phone_number,
    ssn
FROM admins
WHERE admin_id = 1;

