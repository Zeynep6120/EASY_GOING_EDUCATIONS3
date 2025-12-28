-- Direct SQL to update admin - Copy and paste into pgAdmin Query Tool

UPDATE users
SET 
    gender = 'MALE',
    birth_date = '1984-01-15',
    birth_place = 'Istanbul',
    phone_number = '5551234567',
    ssn = '12345678901'
WHERE username = 'admin' AND role = 'ADMIN';

UPDATE admins
SET 
    gender = 'MALE',
    birth_date = '1984-01-15',
    birth_place = 'Istanbul',
    phone_number = '5551234567',
    ssn = '12345678901'
WHERE admin_id = (SELECT user_id FROM users WHERE username = 'admin' AND role = 'ADMIN' LIMIT 1);

