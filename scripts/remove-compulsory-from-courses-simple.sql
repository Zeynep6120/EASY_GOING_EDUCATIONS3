-- Remove compulsory column from courses table
-- Run this in pgAdmin Query Tool

ALTER TABLE courses DROP COLUMN IF EXISTS compulsory;

