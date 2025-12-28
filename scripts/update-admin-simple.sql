-- Simple SQL to update admin information
-- Copy and paste this into pgAdmin Query Tool and execute

-- Update users table
UPDATE users
SET 
    gender = 'MALE',
    birth_date = CURRENT_DATE - INTERVAL '40 years',
    birth_place = 'Istanbul',
    phone_number = '5551234567',
    ssn = '12345678901'
WHERE username = 'admin' AND role = 'ADMIN';

-- Update admins table if exists
UPDATE admins
SET 
    gender = 'MALE',
    birth_date = CURRENT_DATE - INTERVAL '40 years',
    birth_place = 'Istanbul',
    phone_number = '5551234567',
    ssn = '12345678901'
WHERE admin_id = (SELECT user_id FROM users WHERE username = 'admin' AND role = 'ADMIN' LIMIT 1);

-- Verify update
SELECT 
    user_id,
    username,
    name,
    surname,
    email,
    gender,
    birth_date,
    birth_place,
    phone_number,
    ssn,
    is_active
FROM users
WHERE username = 'admin' AND role = 'ADMIN';

