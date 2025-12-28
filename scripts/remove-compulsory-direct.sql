-- Remove compulsory column from courses table
-- This SQL script removes the compulsory column from the courses table
-- Run this directly in pgAdmin Query Tool or psql

-- First, check if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'compulsory'
    ) THEN
        ALTER TABLE courses DROP COLUMN compulsory;
        RAISE NOTICE 'Column compulsory has been removed from courses table';
    ELSE
        RAISE NOTICE 'Column compulsory does not exist in courses table';
    END IF;
END $$;

