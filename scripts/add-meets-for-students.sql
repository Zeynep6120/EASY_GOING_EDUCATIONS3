-- Add 2 meets for each student
-- Each student will have 2 meets with their advisor instructor
-- Note: This script assumes meets table has instructor_id column

DO $$
DECLARE
    student_record RECORD;
    instructor_id_val INTEGER;
    meet_id_1 INTEGER;
    meet_id_2 INTEGER;
    meet_date_1 DATE;
    meet_date_2 DATE;
BEGIN
    -- Loop through all students
    FOR student_record IN 
        SELECT s.student_id, s.advisor_instructor_id, s.advisor_teacher_id
        FROM students s
        WHERE s.student_id IS NOT NULL
    LOOP
        -- Get advisor instructor ID (prefer advisor_instructor_id, then advisor_teacher_id, then first available instructor)
        IF student_record.advisor_instructor_id IS NOT NULL THEN
            instructor_id_val := student_record.advisor_instructor_id;
        ELSIF student_record.advisor_teacher_id IS NOT NULL THEN
            instructor_id_val := student_record.advisor_teacher_id;
        ELSE
            -- Get first available instructor from users table with INSTRUCTOR role
            SELECT u.user_id INTO instructor_id_val
            FROM users u
            WHERE u.role = 'INSTRUCTOR'
            LIMIT 1;
            
            -- If still no instructor found, skip this student
            IF instructor_id_val IS NULL THEN
                CONTINUE;
            END IF;
        END IF;
        
        -- Generate two different dates (one in the past, one in the future)
        meet_date_1 := CURRENT_DATE - INTERVAL '7 days'; -- 7 days ago
        meet_date_2 := CURRENT_DATE + INTERVAL '7 days';  -- 7 days from now
        
        -- Create first meet
        INSERT INTO meets (instructor_id, date, start_time, stop_time, description)
        VALUES (
            instructor_id_val,
            meet_date_1,
            '10:00:00',
            '11:00:00',
            'Regular consultation meeting with student'
        )
        RETURNING meet_id INTO meet_id_1;
        
        -- Add student to first meet
        INSERT INTO meet_students (meet_id, student_id)
        VALUES (meet_id_1, student_record.student_id)
        ON CONFLICT DO NOTHING;
        
        -- Create second meet
        INSERT INTO meets (instructor_id, date, start_time, stop_time, description)
        VALUES (
            instructor_id_val,
            meet_date_2,
            '14:00:00',
            '15:00:00',
            'Follow-up meeting with student'
        )
        RETURNING meet_id INTO meet_id_2;
        
        -- Add student to second meet
        INSERT INTO meet_students (meet_id, student_id)
        VALUES (meet_id_2, student_record.student_id)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Added 2 meets for student % with instructor %', student_record.student_id, instructor_id_val;
    END LOOP;
END $$;

-- Verify the meets were created
SELECT 
    s.student_id,
    s.name || ' ' || s.surname as student_name,
    COUNT(ms.meet_id) as meet_count
FROM students s
LEFT JOIN meet_students ms ON s.student_id = ms.student_id
GROUP BY s.student_id, s.name, s.surname
ORDER BY s.student_id;

