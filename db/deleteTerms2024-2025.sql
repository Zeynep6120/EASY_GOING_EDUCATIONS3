-- Delete education terms for 2024 and 2025 (excluding 2023-2024 academic year)
-- This script will delete:
-- - 2024 Summer Term
-- - 2025 Summer Term
-- - 2024-2025 Fall Semester
-- - 2024-2025 Spring Semester

-- First, check if there are any references
-- If there are references, you may need to delete them first or use CASCADE

-- Delete with CASCADE to handle foreign key references
-- Note: This will also delete related records in lesson_programs, student_programs, etc.

-- Option 1: Delete only terms that are not referenced (safer)
DELETE FROM education_terms 
WHERE term_name IN ('2024 Summer Term', '2025 Summer Term', '2024-2025 Fall Semester', '2024-2025 Spring Semester')
  AND term_id NOT IN (
    SELECT DISTINCT education_term_id 
    FROM lesson_programs 
    WHERE education_term_id IS NOT NULL
    UNION
    SELECT DISTINCT term_id 
    FROM student_programs 
    WHERE term_id IS NOT NULL
  );
