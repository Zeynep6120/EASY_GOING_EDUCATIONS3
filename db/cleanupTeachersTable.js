const pool = require("./connection");
require("dotenv").config();

/**
 * Cleanup script: Remove teachers table completely
 * This script ensures teachers table is dropped and all data is migrated
 */

async function cleanupTeachersTable() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    console.log("Starting cleanup: Removing teachers table...\n");

    // Step 1: Check if teachers table exists
    const teachersTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'teachers'
      )
    `);
    
    if (!teachersTableExists.rows[0].exists) {
      console.log("✅ Teachers table does not exist. Nothing to clean up.");
      await client.query("COMMIT");
      return;
    }

    console.log("⚠️  Teachers table still exists. Proceeding with cleanup...\n");

    // Step 2: Ensure all users with TEACHER role are updated to INSTRUCTOR
    console.log("Step 1: Updating user roles from TEACHER to INSTRUCTOR...");
    const updateRoleResult = await client.query(`
      UPDATE users 
      SET role = 'INSTRUCTOR' 
      WHERE role = 'TEACHER'
    `);
    console.log(`  ✅ Updated ${updateRoleResult.rowCount} user roles`);

    // Step 3: Ensure INSTRUCTOR role exists
    console.log("\nStep 2: Ensuring INSTRUCTOR role exists...");
    await client.query(`
      INSERT INTO roles (role_name) 
      VALUES ('INSTRUCTOR')
      ON CONFLICT (role_name) DO NOTHING
    `);
    console.log("  ✅ INSTRUCTOR role exists");

    // Step 4: Ensure students.advisor_instructor_id exists and is populated
    console.log("\nStep 3: Ensuring students.advisor_instructor_id is set...");
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
      
      // Copy data from advisor_teacher_id if it exists
      const teacherColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'students' AND column_name = 'advisor_teacher_id'
        )
      `);
      
      if (teacherColumnExists.rows[0].exists) {
        await client.query(`
          UPDATE students 
          SET advisor_instructor_id = advisor_teacher_id 
          WHERE advisor_teacher_id IS NOT NULL
        `);
        console.log("  ✅ Copied advisor data from advisor_teacher_id");
      }
    } else {
      console.log("  ✅ advisor_instructor_id column already exists");
    }

    // Step 5: Ensure instructor_programs table exists and is populated
    console.log("\nStep 4: Ensuring instructor_programs table exists...");
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
      
      // Migrate data from teacher_programs if it exists
      const teacherProgramsExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'teacher_programs'
        )
      `);
      
      if (teacherProgramsExists.rows[0].exists) {
        const teacherProgramsResult = await client.query(`
          SELECT tp.teacher_id, tp.lesson_program_id
          FROM teacher_programs tp
          JOIN users u ON u.user_id = tp.teacher_id
          WHERE u.role = 'INSTRUCTOR' OR u.role = 'TEACHER'
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
      }
    } else {
      console.log("  ✅ instructor_programs table already exists");
    }

    // Step 6: Ensure meets.instructor_id exists and is populated
    console.log("\nStep 5: Ensuring meets.instructor_id is set...");
    const meetsInstructorColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'meets' AND column_name = 'instructor_id'
      )
    `);
    
    if (!meetsInstructorColumnExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE meets 
        ADD COLUMN instructor_id INTEGER REFERENCES users(user_id)
      `);
      console.log("  ✅ Added instructor_id column to meets");
      
      // Copy data from teacher_id if it exists
      const meetsTeacherColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'meets' AND column_name = 'teacher_id'
        )
      `);
      
      if (meetsTeacherColumnExists.rows[0].exists) {
        await client.query(`
          UPDATE meets 
          SET instructor_id = teacher_id 
          WHERE teacher_id IS NOT NULL
        `);
        console.log("  ✅ Copied meets data from teacher_id");
      }
    } else {
      console.log("  ✅ meets.instructor_id column already exists");
    }

    // Step 7: Drop foreign key constraints and columns that reference teachers
    console.log("\nStep 6: Dropping old teacher references...");
    
    // Drop students.advisor_teacher_id
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
    
    // Drop meets.teacher_id
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
    console.log("\n✅ Cleanup completed successfully!");
    
    // Summary
    const instructorRoleCount = await client.query("SELECT COUNT(*) FROM users WHERE role = 'INSTRUCTOR'");
    const publicInstructorsCount = await client.query("SELECT COUNT(*) FROM instructors");
    
    console.log("\n📊 Summary:");
    console.log(`   - Users with INSTRUCTOR role: ${instructorRoleCount.rows[0].count}`);
    console.log(`   - Public instructors (web content): ${publicInstructorsCount.rows[0].count}`);
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  cleanupTeachersTable()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = cleanupTeachersTable;

