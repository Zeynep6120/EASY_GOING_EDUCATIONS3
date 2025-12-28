const pool = require("./connection");
const fs = require("fs");
const path = require("path");

async function fixInstructorProgramsNulls() {
  const client = await pool.connect();
  
  try {
    console.log("Fixing null values in instructor_programs table...\n");
    await client.query("BEGIN");

    // Show current state
    console.log("📊 Current state before update:");
    const beforeResult = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(instructor_name) as has_instructor_name,
        COUNT(instructor_surname) as has_instructor_surname,
        COUNT(instructor_email) as has_instructor_email,
        COUNT(instructor_username) as has_instructor_username,
        COUNT(program_id) as has_program_id,
        COUNT(day) as has_day,
        COUNT(time) as has_time,
        COUNT(term) as has_term,
        COUNT(course_id) as has_course_id,
        COUNT(course_name) as has_course_name
      FROM instructor_programs
    `);
    console.table(beforeResult.rows[0]);
    console.log();

    // Update instructor information from users table
    console.log("1️⃣  Updating instructor information from users table...");
    const instructorUpdate = await client.query(`
      UPDATE instructor_programs ip
      SET 
        instructor_name = COALESCE(ip.instructor_name, u.name),
        instructor_surname = COALESCE(ip.instructor_surname, u.surname),
        instructor_email = COALESCE(ip.instructor_email, u.email),
        instructor_username = COALESCE(ip.instructor_username, u.username)
      FROM users u
      WHERE ip.instructor_id = u.user_id
        AND u.role = 'INSTRUCTOR'
        AND (
          ip.instructor_name IS NULL OR
          ip.instructor_surname IS NULL OR
          ip.instructor_email IS NULL OR
          ip.instructor_username IS NULL
        )
    `);
    console.log(`   ✅ Updated ${instructorUpdate.rowCount} rows`);

    // Update program information from course_programs table
    console.log("2️⃣  Updating program information from course_programs table...");
    const programUpdate = await client.query(`
      UPDATE instructor_programs ip
      SET 
        program_id = COALESCE(ip.program_id, cp.course_program_id),
        day = COALESCE(ip.day, cp.day_of_week),
        time = COALESCE(
          ip.time,
          CASE 
            WHEN cp.start_time IS NOT NULL AND cp.stop_time IS NOT NULL 
            THEN cp.start_time::text || ' - ' || cp.stop_time::text
            ELSE NULL
          END
        )
      FROM course_programs cp
      WHERE ip.course_program_id = cp.course_program_id
        AND (
          ip.program_id IS NULL OR
          ip.day IS NULL OR
          ip.time IS NULL
        )
    `);
    console.log(`   ✅ Updated ${programUpdate.rowCount} rows`);

    // Update term information from education_terms via course_programs
    console.log("3️⃣  Updating term information from education_terms...");
    const termUpdate = await client.query(`
      UPDATE instructor_programs ip
      SET 
        term = COALESCE(ip.term, et.term_name)
      FROM course_programs cp
      JOIN education_terms et ON cp.education_term_id = et.term_id
      WHERE ip.course_program_id = cp.course_program_id
        AND ip.term IS NULL
    `);
    console.log(`   ✅ Updated ${termUpdate.rowCount} rows`);

    // Update course information from program_lessons and courses tables
    console.log("4️⃣  Updating course information from program_lessons -> courses...");
    
    // Check if program_lessons table exists
    const programLessonsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'program_lessons'
      )
    `);
    
    if (programLessonsCheck.rows[0].exists) {
      const courseUpdate1 = await client.query(`
        UPDATE instructor_programs ip
        SET 
          course_id = COALESCE(ip.course_id, c.course_id),
          course_name = COALESCE(ip.course_name, c.title)
        FROM course_programs cp
        LEFT JOIN program_lessons pl ON pl.course_program_id = cp.course_program_id
        LEFT JOIN courses c ON c.course_id = pl.lesson_id
        WHERE ip.course_program_id = cp.course_program_id
          AND c.course_id IS NOT NULL
          AND (
            ip.course_id IS NULL OR
            ip.course_name IS NULL
          )
      `);
      console.log(`   ✅ Updated ${courseUpdate1.rowCount} rows from program_lessons`);
    } else {
      console.log("   ⚠️  program_lessons table does not exist, skipping...");
    }

    // Try program_courses if it exists
    console.log("5️⃣  Checking program_courses table...");
    const programCoursesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'program_courses'
      )
    `);
    
    if (programCoursesCheck.rows[0].exists) {
      const courseUpdate2 = await client.query(`
        UPDATE instructor_programs ip
        SET 
          course_id = COALESCE(ip.course_id, c.course_id),
          course_name = COALESCE(ip.course_name, c.title)
        FROM course_programs cp
        LEFT JOIN program_courses pc ON pc.course_program_id = cp.course_program_id
        LEFT JOIN courses c ON c.course_id = pc.course_id
        WHERE ip.course_program_id = cp.course_program_id
          AND c.course_id IS NOT NULL
          AND (
            ip.course_id IS NULL OR
            ip.course_name IS NULL
          )
      `);
      console.log(`   ✅ Updated ${courseUpdate2.rowCount} rows from program_courses`);
    } else {
      console.log("   ⚠️  program_courses table does not exist, skipping...");
    }

    // Try course_programs table directly
    console.log("6️⃣  Updating from course_programs table directly...");
    const courseUpdate3 = await client.query(`
      UPDATE instructor_programs ip
      SET 
        course_id = COALESCE(ip.course_id, cp.course_id),
        course_name = COALESCE(ip.course_name, cp.course_name)
      FROM course_programs cp
      WHERE ip.course_program_id = cp.course_program_id
        AND (
          cp.course_id IS NOT NULL OR
          cp.course_name IS NOT NULL
        )
        AND (
          ip.course_id IS NULL OR
          ip.course_name IS NULL
        )
    `);
    console.log(`   ✅ Updated ${courseUpdate3.rowCount} rows from course_programs`);

    // Try lessons table if it exists
    console.log("7️⃣  Checking lessons table...");
    const lessonsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons'
      )
    `);
    
    if (lessonsCheck.rows[0].exists && programLessonsCheck.rows[0].exists) {
      const courseUpdate4 = await client.query(`
        UPDATE instructor_programs ip
        SET 
          course_id = COALESCE(ip.course_id, l.lesson_id),
          course_name = COALESCE(ip.course_name, l.lesson_name)
        FROM course_programs cp
        LEFT JOIN program_lessons pl ON pl.course_program_id = cp.course_program_id
        LEFT JOIN lessons l ON l.lesson_id = pl.lesson_id
        WHERE ip.course_program_id = cp.course_program_id
          AND l.lesson_id IS NOT NULL
          AND (
            ip.course_id IS NULL OR
            ip.course_name IS NULL
          )
      `);
      console.log(`   ✅ Updated ${courseUpdate4.rowCount} rows from lessons`);
    } else {
      console.log("   ⚠️  lessons table or program_lessons does not exist, skipping...");
    }

    await client.query("COMMIT");
    console.log("\n✅ All updates completed successfully!\n");

    // Show final state
    console.log("📊 Final state after update:");
    const afterResult = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(instructor_name) as has_instructor_name,
        COUNT(instructor_surname) as has_instructor_surname,
        COUNT(instructor_email) as has_instructor_email,
        COUNT(instructor_username) as has_instructor_username,
        COUNT(program_id) as has_program_id,
        COUNT(day) as has_day,
        COUNT(time) as has_time,
        COUNT(term) as has_term,
        COUNT(course_id) as has_course_id,
        COUNT(course_name) as has_course_name
      FROM instructor_programs
    `);
    console.table(afterResult.rows[0]);

    // Show remaining nulls if any
    const remainingNulls = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE instructor_name IS NULL) as null_instructor_name,
        COUNT(*) FILTER (WHERE instructor_surname IS NULL) as null_instructor_surname,
        COUNT(*) FILTER (WHERE instructor_email IS NULL) as null_instructor_email,
        COUNT(*) FILTER (WHERE instructor_username IS NULL) as null_instructor_username,
        COUNT(*) FILTER (WHERE program_id IS NULL) as null_program_id,
        COUNT(*) FILTER (WHERE day IS NULL) as null_day,
        COUNT(*) FILTER (WHERE time IS NULL) as null_time,
        COUNT(*) FILTER (WHERE term IS NULL) as null_term,
        COUNT(*) FILTER (WHERE course_id IS NULL) as null_course_id,
        COUNT(*) FILTER (WHERE course_name IS NULL) as null_course_name
      FROM instructor_programs
    `);
    
    const nullCounts = remainingNulls.rows[0];
    const hasNulls = Object.values(nullCounts).some(count => parseInt(count) > 0);
    
    if (hasNulls) {
      console.log("\n⚠️  Remaining null values:");
      console.table(nullCounts);
    } else {
      console.log("\n✅ No null values remaining!");
    }

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error fixing null values:", error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixInstructorProgramsNulls()
    .then(() => {
      console.log("\nScript completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = fixInstructorProgramsNulls;

