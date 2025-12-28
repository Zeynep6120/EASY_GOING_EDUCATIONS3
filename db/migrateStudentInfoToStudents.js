const pool = require("./connection");
require("dotenv").config();

/**
 * Migration: Remove student_info table
 * This script:
 * 1. Drops the student_info table and all its dependencies
 * 2. Note: student_info contains lesson/term-specific data (grades, attendance)
 *    which cannot be merged into students table (1:1 relationship)
 *    So we're just removing the table as requested
 */
async function migrateStudentInfoToStudents() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    console.log("Starting migration: Remove student_info table...\n");

    // Step 1: Check if student_info table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_info'
      )
    `);

    if (!tableExists.rows[0].exists) {
      console.log("  ℹ️  student_info table does not exist, skipping migration.");
      await client.query("COMMIT");
      return;
    }

    // Step 2: Get count of records in student_info
    const countResult = await client.query("SELECT COUNT(*) FROM student_info");
    const recordCount = countResult.rows[0].count;
    console.log(`  📊 Found ${recordCount} records in student_info table`);

    if (recordCount > 0) {
      console.log("  ⚠️  WARNING: student_info table contains data that will be lost!");
      console.log("  ⚠️  This includes: absentee, midterm_exam, final_exam, average, note, info_note");
      console.log("  ⚠️  These records cannot be merged into students table (different data structure)");
    }

    // Step 3: Drop foreign key constraints that reference student_info
    console.log("\nStep 1: Dropping foreign key constraints...");
    
    // Check for any foreign keys referencing student_info
    const fkCheck = await client.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'student_info'
        AND tc.table_schema = 'public'
    `);

    if (fkCheck.rows.length > 0) {
      console.log(`  Found ${fkCheck.rows.length} foreign key constraints to drop`);
      for (const fk of fkCheck.rows) {
        await client.query(`ALTER TABLE ${fk.table_name} DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`);
        console.log(`  ✅ Dropped constraint ${fk.constraint_name} from ${fk.table_name}`);
      }
    } else {
      console.log("  ℹ️  No foreign key constraints found");
    }

    // Step 4: Drop the student_info table
    console.log("\nStep 2: Dropping student_info table...");
    await client.query("DROP TABLE IF EXISTS student_info CASCADE");
    console.log("  ✅ Dropped student_info table");

    await client.query("COMMIT");
    console.log("\n✅ Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - student_info table: DROPPED`);
    console.log(`   - Records lost: ${recordCount}`);
    console.log("\n⚠️  Note: All student_info data (grades, attendance, notes) has been permanently deleted.");
    console.log("   If you need this data, restore from a backup before running this migration.");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateStudentInfoToStudents()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = migrateStudentInfoToStudents;

