-- Create a view for student_programs that includes all lesson information
-- This view joins student_programs with lesson_programs, lessons, and education_terms
-- to show complete lesson details for each student enrollment

-- Drop view if it exists
DROP VIEW IF EXISTS student_programs_detail CASCADE;

-- Create view with all lesson information
CREATE VIEW student_programs_detail AS
SELECT 
  sp.student_id,
  sp.lesson_program_id,
  u.username as student_username,
  u.name as student_name,
  u.surname as student_surname,
  u.email as student_email,
  lp.day_of_week,
  lp.start_time,
  lp.stop_time,
  lp.education_term_id,
  et.term_name,
  et.start_date as term_start_date,
  et.end_date as term_end_date,
  -- Lesson information from program_lessons join
  l.lesson_id,
  l.lesson_name,
  l.credit_score,
  l.compulsory,
  -- Instructor information
  i.user_id as instructor_id,
  i.name as instructor_name,
  i.surname as instructor_surname,
  i.email as instructor_email
FROM student_programs sp
JOIN users u ON u.user_id = sp.student_id
JOIN lesson_programs lp ON lp.lesson_program_id = sp.lesson_program_id
JOIN education_terms et ON et.term_id = lp.education_term_id
LEFT JOIN program_lessons pl ON pl.lesson_program_id = lp.lesson_program_id
LEFT JOIN lessons l ON l.lesson_id = pl.lesson_id
LEFT JOIN instructor_programs ip ON ip.lesson_program_id = lp.lesson_program_id
LEFT JOIN users i ON i.user_id = ip.instructor_id AND i.role = 'INSTRUCTOR';

-- Usage examples:
-- SELECT * FROM student_programs_detail WHERE student_id = 37;
-- SELECT * FROM student_programs_detail ORDER BY student_name, lesson_name;

