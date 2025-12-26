const pool = require("./connection");
require("dotenv").config();

/**
 * Migration: Teachers -> Instructors
 * 
 * This script:
 * 1. Moves all teachers data to instructors (public web content table)
 * 2. Updates all foreign key references from teachers to instructors
 * 3. Changes USER role from TEACHER to INSTRUCTOR
 * 4. Drops the teachers table
 */

async function migrateTeachersToInstructors() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    console.log("Starting migration: Teachers -> Instructors...\n");

    // Step 1: Get all teachers
    const teachersResult = await client.query(`
      SELECT 
        t.teacher_id,
        t.is_advisor_teacher,
        u.name,
        u.surname,
        u.email
      FROM teachers t
      JOIN users u ON u.user_id = t.teacher_id
      WHERE u.role = 'TEACHER'
    `);
    
    const teachers = teachersResult.rows;
    console.log(`Found ${teachers.length} teachers to migrate.\n`);

    // Step 2: Update students.advisor_teacher_id to advisor_instructor_id (reference users table)
    console.log("Step 1: Updating students.advisor_teacher_id references...");
    
    // Rename column: advisor_teacher_id -> advisor_instructor_id
    // First check if advisor_instructor_id exists
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'advisor_instructor_id'
      )
    `);
    
    if (!columnExists.rows[0].exists) {
      // Add new column
      await client.query(`
        ALTER TABLE students 
        ADD COLUMN advisor_instructor_id INTEGER REFERENCES users(user_id)
      `);
      console.log("  ✅ Added advisor_instructor_id column");
      
      // Copy data from advisor_teacher_id to advisor_instructor_id
      await client.query(`
        UPDATE students 
        SET advisor_instructor_id = advisor_teacher_id 
        WHERE advisor_teacher_id IS NOT NULL
      `);
      console.log("  ✅ Copied advisor data");
    }
    
    // Step 3: Update teacher_programs to instructor_programs (reference users table)
    console.log("\nStep 2: Creating instructor_programs table...");
    
    // Check if instructor_programs exists, if not create it
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
    console.log(`  ✅ Migrated ${teacherProgramsResult.rows.length} program assignments`);

    // Step 4: Update meets.teacher_id to instructor_id (reference users table)
    console.log("\nStep 3: Updating meets table...");
    
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
      
      // Copy data from teacher_id to instructor_id
      await client.query(`
        UPDATE meets 
        SET instructor_id = teacher_id 
        WHERE teacher_id IS NOT NULL
      `);
      console.log("  ✅ Copied meets data");
    }

    // Step 5: Update roles table FIRST (before updating users)
    console.log("\nStep 4: Updating roles table...");
    await client.query(`
      INSERT INTO roles (role_name) 
      VALUES ('INSTRUCTOR')
      ON CONFLICT (role_name) DO NOTHING
    `);
    console.log("  ✅ Added INSTRUCTOR role");

    // Step 6: Update users.role from TEACHER to INSTRUCTOR
    console.log("\nStep 5: Updating users.role from TEACHER to INSTRUCTOR...");
    const updateRoleResult = await client.query(`
      UPDATE users 
      SET role = 'INSTRUCTOR' 
      WHERE role = 'TEACHER'
    `);
    console.log(`  ✅ Updated ${updateRoleResult.rowCount} user roles`);

    // Step 7: Drop foreign key constraints that reference teachers
    console.log("\nStep 6: Dropping foreign key constraints...");
    
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

    // Step 8: Drop teachers table
    console.log("\nStep 7: Dropping teachers table...");
    await client.query("DROP TABLE IF EXISTS teachers CASCADE");
    console.log("  ✅ Dropped teachers table");

    await client.query("COMMIT");
    console.log("\n✅ Migration completed successfully!");
    
    // Summary
    const instructorRoleCount = await client.query("SELECT COUNT(*) FROM users WHERE role = 'INSTRUCTOR'");
    const publicInstructorsCount = await client.query("SELECT COUNT(*) FROM instructors");
    
    console.log("\n📊 Summary:");
    console.log(`   - Users with INSTRUCTOR role: ${instructorRoleCount.rows[0].count}`);
    console.log(`   - Public instructors (web content): ${publicInstructorsCount.rows[0].count}`);
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateTeachersToInstructors()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = migrateTeachersToInstructors;

