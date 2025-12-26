const pool = require("./connection");
require("dotenv").config();

/**
 * Complete Migration: Teachers -> Instructors
 * 
 * This script:
 * 1. Migrates all teachers data to instructors (public web content table)
 * 2. Updates users.role from TEACHER to INSTRUCTOR
 * 3. Updates all foreign key references:
 *    - students.advisor_teacher_id -> advisor_instructor_id
 *    - teacher_programs -> instructor_programs
 *    - meets.teacher_id -> instructor_id
 * 4. Creates instructor records in instructors table (public web content)
 * 5. Drops teacher-related tables and columns
 */

async function migrateAllTeachersToInstructors() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    console.log("Starting complete migration: Teachers -> Instructors...\n");

    // Step 1: Get all teachers with full data
    const teachersResult = await client.query(`
      SELECT 
        t.teacher_id,
        t.is_advisor_teacher,
        u.name,
        u.surname,
        u.email,
        u.username,
        u.gender,
        u.birth_date,
        u.birth_place,
        u.phone_number,
        u.ssn,
        u.is_active
      FROM teachers t
      JOIN users u ON u.user_id = t.teacher_id
      WHERE u.role = 'TEACHER'
    `);
    
    const teachers = teachersResult.rows;
    console.log(`Found ${teachers.length} teachers to migrate.\n`);

    if (teachers.length === 0) {
      console.log("No teachers found to migrate.");
      await client.query("COMMIT");
      return;
    }

    // Step 2: Ensure INSTRUCTOR role exists
    console.log("Step 1: Ensuring INSTRUCTOR role exists...");
    await client.query(`
      INSERT INTO roles (role_name) 
      VALUES ('INSTRUCTOR')
      ON CONFLICT (role_name) DO NOTHING
    `);
    console.log("  ✅ INSTRUCTOR role ready");

    // Step 3: Update students.advisor_teacher_id to advisor_instructor_id
    console.log("\nStep 2: Updating students.advisor_teacher_id references...");
    
    const advisorColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'advisor_instructor_id'
      )
    `);
    
    if (!advisorColumnExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE students 
        ADD COLUMN advisor_instructor_id INTEGER REFERENCES users(user_id)
      `);
      console.log("  ✅ Added advisor_instructor_id column");
      
      await client.query(`
        UPDATE students 
        SET advisor_instructor_id = advisor_teacher_id 
        WHERE advisor_teacher_id IS NOT NULL
      `);
      console.log("  ✅ Copied advisor data from advisor_teacher_id to advisor_instructor_id");
    } else {
      // Update existing advisor_instructor_id if it's null but advisor_teacher_id exists
      await client.query(`
        UPDATE students 
        SET advisor_instructor_id = advisor_teacher_id 
        WHERE advisor_teacher_id IS NOT NULL 
          AND advisor_instructor_id IS NULL
      `);
      console.log("  ✅ Updated advisor_instructor_id from advisor_teacher_id");
    }

    // Step 4: Create instructor_programs table if it doesn't exist
    console.log("\nStep 3: Setting up instructor_programs table...");
    
    const instructorProgramsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'instructor_programs'
      )
    `);
    
    if (!instructorProgramsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE instructor_programs (
          instructor_id INTEGER REFERENCES users(user_id),
          lesson_program_id INTEGER REFERENCES lesson_programs(lesson_program_id),
          PRIMARY KEY (instructor_id, lesson_program_id)
        )
      `);
      console.log("  ✅ Created instructor_programs table");
    }
    
    // Migrate data from teacher_programs to instructor_programs
    const teacherProgramsResult = await client.query(`
      SELECT tp.teacher_id, tp.lesson_program_id
      FROM teacher_programs tp
      JOIN users u ON u.user_id = tp.teacher_id
      WHERE u.role = 'TEACHER'
    `);
    
    for (const tp of teacherProgramsResult.rows) {
      await client.query(
        `INSERT INTO instructor_programs (instructor_id, lesson_program_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [tp.teacher_id, tp.lesson_program_id]
      );
    }
    console.log(`  ✅ Migrated ${teacherProgramsResult.rows.length} program assignments from teacher_programs to instructor_programs`);

    // Step 5: Update meets.teacher_id to instructor_id
    console.log("\nStep 4: Updating meets table...");
    
    const meetsColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'meets' AND column_name = 'instructor_id'
      )
    `);
    
    if (!meetsColumnExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE meets 
        ADD COLUMN instructor_id INTEGER REFERENCES users(user_id)
      `);
      console.log("  ✅ Added instructor_id column to meets");
    }
    
    // Copy data from teacher_id to instructor_id
    await client.query(`
      UPDATE meets 
      SET instructor_id = teacher_id 
      WHERE teacher_id IS NOT NULL 
        AND (instructor_id IS NULL OR instructor_id != teacher_id)
    `);
    console.log("  ✅ Copied meets data from teacher_id to instructor_id");

    // Step 6: Update users.role from TEACHER to INSTRUCTOR
    console.log("\nStep 5: Updating users.role from TEACHER to INSTRUCTOR...");
    const updateRoleResult = await client.query(`
      UPDATE users 
      SET role = 'INSTRUCTOR' 
      WHERE role = 'TEACHER'
    `);
    console.log(`  ✅ Updated ${updateRoleResult.rowCount} user roles from TEACHER to INSTRUCTOR`);

    // Step 7: Create instructor records in instructors table (public web content)
    console.log("\nStep 6: Creating instructor records in instructors table...");
    
    let instructorsCreated = 0;
    let instructorsSkipped = 0;
    
    for (const teacher of teachers) {
      const fullName = `${teacher.name} ${teacher.surname}`.trim();
      const isAdvisor = teacher.is_advisor_teacher;
      const title = isAdvisor ? "Advisor Instructor" : "Instructor";
      
      // Generate bio based on advisor status
      const bio = isAdvisor
        ? `Experienced advisor instructor at EasyGoing Education, dedicated to student success and academic excellence.`
        : `Experienced instructor at EasyGoing Education, passionate about sharing knowledge and helping students achieve their goals.`;
      
      // Check if instructor already exists
      const existingInstructor = await client.query(
        "SELECT instructor_id FROM instructors WHERE name = $1",
        [fullName]
      );
      
      if (existingInstructor.rows.length === 0) {
        // Assign image based on instructor count
        const imageOptions = ['instructor-01.jpg', 'instructor-02.jpg', 'instructor-03.jpg', 'instructor-04.jpg', 'instructor-05.jpg', 'instructor-06.jpg'];
        const imageIndex = instructorsCreated % imageOptions.length;
        const image = imageOptions[imageIndex];
        
        await client.query(
          `INSERT INTO instructors (name, title, bio, image, social_links)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            fullName,
            title,
            bio,
            image,
            JSON.stringify({
              email: teacher.email || null
            })
          ]
        );
        instructorsCreated++;
        console.log(`  ✅ Created instructor: ${fullName} (${title})`);
      } else {
        instructorsSkipped++;
        console.log(`  ⊘ Instructor already exists: ${fullName}`);
      }
    }
    
    console.log(`\n  📊 Instructors summary: ${instructorsCreated} created, ${instructorsSkipped} skipped`);

    // Step 8: Drop foreign key constraints and columns
    console.log("\nStep 7: Cleaning up teacher-related constraints and columns...");
    
    // Drop students.advisor_teacher_id constraint and column
    await client.query(`
      ALTER TABLE students 
      DROP CONSTRAINT IF EXISTS students_advisor_teacher_id_fkey
    `);
    await client.query(`
      ALTER TABLE students 
      DROP COLUMN IF EXISTS advisor_teacher_id
    `);
    console.log("  ✅ Dropped students.advisor_teacher_id");
    
    // Drop teacher_programs table
    await client.query("DROP TABLE IF EXISTS teacher_programs CASCADE");
    console.log("  ✅ Dropped teacher_programs table");
    
    // Drop meets.teacher_id constraint and column
    await client.query(`
      ALTER TABLE meets 
      DROP CONSTRAINT IF EXISTS meets_teacher_id_fkey
    `);
    await client.query(`
      ALTER TABLE meets 
      DROP COLUMN IF EXISTS teacher_id
    `);
    console.log("  ✅ Dropped meets.teacher_id");

    // Step 9: Drop teachers table
    console.log("\nStep 8: Dropping teachers table...");
    await client.query("DROP TABLE IF EXISTS teachers CASCADE");
    console.log("  ✅ Dropped teachers table");

    await client.query("COMMIT");
    console.log("\n✅ Migration completed successfully!");
    
    // Summary
    const instructorRoleCount = await client.query("SELECT COUNT(*) FROM users WHERE role = 'INSTRUCTOR'");
    const publicInstructorsCount = await client.query("SELECT COUNT(*) FROM instructors");
    const advisorInstructorsCount = await client.query(`
      SELECT COUNT(*) FROM users 
      WHERE role = 'INSTRUCTOR' 
        AND user_id IN (
          SELECT DISTINCT advisor_instructor_id 
          FROM students 
          WHERE advisor_instructor_id IS NOT NULL
        )
    `);
    
    console.log("\n📊 Final Summary:");
    console.log(`   - Users with INSTRUCTOR role: ${instructorRoleCount.rows[0].count}`);
    console.log(`   - Public instructors (web content): ${publicInstructorsCount.rows[0].count}`);
    console.log(`   - Advisor instructors: ${advisorInstructorsCount.rows[0].count}`);
    console.log(`   - Program assignments migrated: ${teacherProgramsResult.rows.length}`);
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateAllTeachersToInstructors()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = migrateAllTeachersToInstructors;

