-- FINAL: Update Admin - Copy this entire block and run in pgAdmin

UPDATE admins 
SET 
    gender = 'MALE',
    birth_date = '1984-01-15'::date,
    birth_place = 'Istanbul',
    phone_number = '5551234567',
    ssn = '12345678901'
WHERE admin_id = 1;

-- Refresh the view to see changes
SELECT * FROM admins WHERE admin_id = 1;

