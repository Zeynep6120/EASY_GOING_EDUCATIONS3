-- Update Admin User Information
-- This script fills in missing information for the admin user

-- Calculate birth date for admin (40 years old, within 25-70 constraint)
-- Set to 40 years old (middle of the allowed range)
DO $$
DECLARE
    admin_user_id INTEGER;
    birth_date DATE;
BEGIN
    -- Find admin user ID
    SELECT user_id INTO admin_user_id
    FROM users
    WHERE username = 'admin' AND role = 'ADMIN'
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user not found!';
        RETURN;
    END IF;

    -- Calculate birth date (40 years old)
    birth_date := CURRENT_DATE - INTERVAL '40 years';

    -- Update users table
    UPDATE users
    SET 
        gender = 'MALE',
        birth_date = birth_date,
        birth_place = 'Istanbul',
        phone_number = '5551234567',
        ssn = '12345678901'
    WHERE user_id = admin_user_id;

    RAISE NOTICE 'Updated users table for admin (ID: %)', admin_user_id;

    -- Update admins table if it exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
    ) THEN
        UPDATE admins
        SET 
            gender = 'MALE',
            birth_date = birth_date,
            birth_place = 'Istanbul',
            phone_number = '5551234567',
            ssn = '12345678901'
        WHERE admin_id = admin_user_id;

        RAISE NOTICE 'Updated admins table for admin (ID: %)', admin_user_id;
    END IF;

    RAISE NOTICE 'Admin information updated successfully!';
    RAISE NOTICE 'Gender: MALE';
    RAISE NOTICE 'Birth Date: % (40 years old)', birth_date;
    RAISE NOTICE 'Birth Place: Istanbul';
    RAISE NOTICE 'Phone Number: 5551234567';
    RAISE NOTICE 'SSN: 12345678901';
END $$;

-- Verify the update
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

