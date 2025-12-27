-- Check and fix meets table structure and data

-- 1. Check if meets table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'meets'
ORDER BY ordinal_position;

-- 2. Check if instructor_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'meets' 
        AND column_name = 'instructor_id'
    ) THEN
        -- Add instructor_id column
        ALTER TABLE meets ADD COLUMN instructor_id INTEGER;
        
        -- If teacher_id exists, copy data from teacher_id to instructor_id
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'meets' 
            AND column_name = 'teacher_id'
        ) THEN
            UPDATE meets SET instructor_id = teacher_id WHERE instructor_id IS NULL;
        END IF;
        
        -- Add foreign key constraint if users table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE meets 
            ADD CONSTRAINT fk_meets_instructor 
            FOREIGN KEY (instructor_id) REFERENCES users(user_id);
        END IF;
        
        RAISE NOTICE 'Added instructor_id column to meets table';
    ELSE
        RAISE NOTICE 'instructor_id column already exists in meets table';
    END IF;
END $$;

-- 3. Check current meets count
SELECT COUNT(*) as total_meets FROM meets;

-- 4. Check meets with students
SELECT 
    m.meet_id,
    m.instructor_id,
    m.date,
    m.start_time,
    COUNT(ms.student_id) as student_count
FROM meets m
LEFT JOIN meet_students ms ON m.meet_id = ms.meet_id
GROUP BY m.meet_id, m.instructor_id, m.date, m.start_time
ORDER BY m.date DESC
LIMIT 10;

-- 5. Check if there are any meets without instructor_id
SELECT COUNT(*) as meets_without_instructor 
FROM meets 
WHERE instructor_id IS NULL;

-- 6. If meets table is empty or has issues, add meets for students
DO $$
DECLARE
    student_record RECORD;
    instructor_id_val INTEGER;
    meet_id_1 INTEGER;
    meet_id_2 INTEGER;
    meet_date_1 DATE;
    meet_date_2 DATE;
    meets_count INTEGER;
BEGIN
    -- Count existing meets
    SELECT COUNT(*) INTO meets_count FROM meets;
    
    -- Only add meets if there are no meets or very few meets
    IF meets_count < 5 THEN
        RAISE NOTICE 'Adding meets for students...';
        
        -- Loop through all students
        FOR student_record IN 
            SELECT s.student_id, s.advisor_instructor_id, s.advisor_teacher_id
            FROM students s
            WHERE s.student_id IS NOT NULL
        LOOP
            -- Get advisor instructor ID
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
                
                IF instructor_id_val IS NULL THEN
                    CONTINUE;
                END IF;
            END IF;
            
            -- Generate two different dates
            meet_date_1 := CURRENT_DATE - INTERVAL '7 days';
            meet_date_2 := CURRENT_DATE + INTERVAL '7 days';
            
            -- Create first meet (only if it doesn't already exist for this student)
            IF NOT EXISTS (
                SELECT 1 FROM meets m
                JOIN meet_students ms ON m.meet_id = ms.meet_id
                WHERE ms.student_id = student_record.student_id
                AND m.date = meet_date_1
                LIMIT 1
            ) THEN
                INSERT INTO meets (instructor_id, date, start_time, stop_time, description)
                VALUES (
                    instructor_id_val,
                    meet_date_1,
                    '10:00:00',
                    '11:00:00',
                    'Regular consultation meeting with student'
                )
                RETURNING meet_id INTO meet_id_1;
                
                INSERT INTO meet_students (meet_id, student_id)
                VALUES (meet_id_1, student_record.student_id)
                ON CONFLICT DO NOTHING;
            END IF;
            
            -- Create second meet
            IF NOT EXISTS (
                SELECT 1 FROM meets m
                JOIN meet_students ms ON m.meet_id = ms.meet_id
                WHERE ms.student_id = student_record.student_id
                AND m.date = meet_date_2
                LIMIT 1
            ) THEN
                INSERT INTO meets (instructor_id, date, start_time, stop_time, description)
                VALUES (
                    instructor_id_val,
                    meet_date_2,
                    '14:00:00',
                    '15:00:00',
                    'Follow-up meeting with student'
                )
                RETURNING meet_id INTO meet_id_2;
                
                INSERT INTO meet_students (meet_id, student_id)
                VALUES (meet_id_2, student_record.student_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Finished adding meets for students';
    ELSE
        RAISE NOTICE 'Meets already exist, skipping addition';
    END IF;
END $$;

-- 7. Final verification
SELECT 
    'Total Meets' as metric,
    COUNT(*)::text as value
FROM meets
UNION ALL
SELECT 
    'Meets with Students' as metric,
    COUNT(DISTINCT ms.meet_id)::text as value
FROM meet_students ms
UNION ALL
SELECT 
    'Total Student-Meet Relationships' as metric,
    COUNT(*)::text as value
FROM meet_students;

