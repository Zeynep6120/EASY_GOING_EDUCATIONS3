-- Remove compulsory column from courses table

-- Drop the compulsory column from courses table
ALTER TABLE courses DROP COLUMN IF EXISTS compulsory;

-- Verify the column has been removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

