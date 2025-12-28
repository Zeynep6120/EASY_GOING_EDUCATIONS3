-- Assign unique course combinations to each student
-- Version: v8

BEGIN;

-- Delete existing student_programs
DELETE FROM student_programs;

-- Assign unique course combinations to each student
WITH students_list AS (
  SELECT 
    s.student_id,
    u.name as student_name,
    u.surname as student_surname,
    u.email as student_email,
    u.username as student_username,
    ROW_NUMBER() OVER (ORDER BY s.student_id) as student_num
  FROM students s
  INNER JOIN users u ON u.user_id = s.student_id
),
course_assignments AS (
  SELECT 
    sl.student_id,
    sl.student_name,
    sl.student_surname,
    sl.student_email,
    sl.student_username,
    -- Each student gets a unique combination of 3 courses
    CASE 
      WHEN sl.student_num = 1 THEN ARRAY[1, 2, 3]
      WHEN sl.student_num = 2 THEN ARRAY[4, 5, 6]
      WHEN sl.student_num = 3 THEN ARRAY[7, 8, 9]
      WHEN sl.student_num = 4 THEN ARRAY[10, 11, 12]
      WHEN sl.student_num = 5 THEN ARRAY[13, 14, 15]
      WHEN sl.student_num = 6 THEN ARRAY[1, 4, 7]
      WHEN sl.student_num = 7 THEN ARRAY[2, 5, 8]
      WHEN sl.student_num = 8 THEN ARRAY[3, 6, 9]
      WHEN sl.student_num = 9 THEN ARRAY[10, 13, 1]
      WHEN sl.student_num = 10 THEN ARRAY[11, 14, 2]
      WHEN sl.student_num = 11 THEN ARRAY[12, 15, 3]
      ELSE ARRAY[1, 2, 3]
    END as course_ids
  FROM students_list sl
),
expanded_assignments AS (
  SELECT 
    ca.student_id,
    ca.student_name,
    ca.student_surname,
    ca.student_email,
    ca.student_username,
    UNNEST(ca.course_ids) as course_id
  FROM course_assignments ca
),
course_programs_with_rank AS (
  SELECT 
    cp.course_program_id,
    cp.course_id,
    cp.course_name,
    cp.day,
    cp.time,
    cp.term,
    cp.program_id,
    ROW_NUMBER() OVER (PARTITION BY cp.course_id ORDER BY cp.course_program_id) as rn
  FROM course_programs cp
)
INSERT INTO student_programs (
  student_id, student_name, student_surname, student_email, student_username,
  course_program_id, program_id, day, time, term, course_id, course_name
)
SELECT 
  ea.student_id,
  ea.student_name,
  ea.student_surname,
  ea.student_email,
  ea.student_username,
  cpr.course_program_id,
  cpr.program_id,
  cpr.day,
  cpr.time,
  cpr.term,
  cpr.course_id,
  cpr.course_name
FROM expanded_assignments ea
INNER JOIN course_programs_with_rank cpr 
  ON cpr.course_id = ea.course_id 
  AND cpr.rn = 1;

COMMIT;

