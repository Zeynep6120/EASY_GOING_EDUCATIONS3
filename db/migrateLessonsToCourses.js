const pool = require("./connection");
require("dotenv").config();

/**
 * Migration: Migrate lessons to courses
 * - Add lesson fields (credit_score, compulsory) to courses table
 * - Migrate lesson data to courses table
 * - Update program_lessons to program_courses (lesson_id -> course_id)
 * - Update all lesson references to course references
 * - Drop lessons table
 */
async function migrateLessonsToCourses() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    console.log("Starting migration: lessons -> courses...\n");

    // Step 1: Add lesson fields to courses table if they don't exist
    console.log("Step 1: Adding lesson fields to courses table...");
    const columnsToAdd = [
      { name: "credit_score", type: "INTEGER DEFAULT 0" },
      { name: "compulsory", type: "BOOLEAN DEFAULT FALSE" },
    ];

    for (const col of columnsToAdd) {
      const columnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'courses' AND column_name = '${col.name}'
        )
      `);
      if (!columnExists.rows[0].exists) {
        await client.query(`ALTER TABLE courses ADD COLUMN ${col.name} ${col.type}`);
        console.log(`  ✅ Added column: ${col.name}`);
      } else {
        console.log(`  ℹ️  Column ${col.name} already exists, skipping creation.`);
      }
    }
    console.log("  ✅ Columns check/addition complete.");

    // Step 2: Migrate lesson data to courses table
    console.log("\nStep 2: Migrating lesson data to courses table...");
    const lessonsData = await client.query("SELECT * FROM lessons");
    let migratedCount = 0;

    for (const lesson of lessonsData.rows) {
      // Check if course with same name already exists
      const existingCourse = await client.query(
        "SELECT course_id FROM courses WHERE title = $1",
        [lesson.lesson_name]
      );

      if (existingCourse.rows.length > 0) {
        // Update existing course with lesson data
        await client.query(
          `UPDATE courses 
           SET credit_score = $1, compulsory = $2 
           WHERE course_id = $3`,
          [
            lesson.credit_score,
            lesson.compulsory || false,
            existingCourse.rows[0].course_id,
          ]
        );
        console.log(`  ✅ Updated existing course: ${lesson.lesson_name}`);
      } else {
        // Create new course from lesson data
        const insertResult = await client.query(
          `INSERT INTO courses (title, description, duration, price, level, image, is_featured, credit_score, compulsory)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING course_id`,
          [
            lesson.lesson_name,
            `Course: ${lesson.lesson_name}`,
            "16 weeks",
            0,
            lesson.compulsory ? "Required" : "Optional",
            null,
            false,
            lesson.credit_score,
            lesson.compulsory || false,
          ]
        );
        console.log(`  ✅ Created new course: ${lesson.lesson_name} (course_id: ${insertResult.rows[0].course_id})`);
      }
      migratedCount++;
    }
    console.log(`  ✅ Migrated ${migratedCount} lessons to courses table.`);

    // Step 3: Create mapping table for lesson_id -> course_id
    console.log("\nStep 3: Creating lesson_id to course_id mapping...");
    const mappingResult = await client.query(`
      SELECT l.lesson_id, c.course_id
      FROM lessons l
      JOIN courses c ON c.title = l.lesson_name
    `);
    const lessonToCourseMap = {};
    mappingResult.rows.forEach(row => {
      lessonToCourseMap[row.lesson_id] = row.course_id;
    });
    console.log(`  ✅ Created mapping for ${Object.keys(lessonToCourseMap).length} lessons.`);

    // Step 4: Rename program_lessons to program_courses and update columns
    console.log("\nStep 4: Migrating program_lessons to program_courses...");
    
    // Check if program_courses already exists
    const programCoursesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'program_courses'
      )
    `);

    if (!programCoursesExists.rows[0].exists) {
      // Create program_courses table
      await client.query(`
        CREATE TABLE program_courses (
          lesson_program_id INTEGER REFERENCES lesson_programs(lesson_program_id),
          course_id INTEGER REFERENCES courses(course_id),
          PRIMARY KEY (lesson_program_id, course_id)
        )
      `);
      console.log("  ✅ Created program_courses table.");

      // Migrate data from program_lessons to program_courses
      const programLessonsData = await client.query("SELECT * FROM program_lessons");
      let migratedProgramLessons = 0;

      for (const pl of programLessonsData.rows) {
        const courseId = lessonToCourseMap[pl.lesson_id];
        if (courseId) {
          await client.query(
            `INSERT INTO program_courses (lesson_program_id, course_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [pl.lesson_program_id, courseId]
          );
          migratedProgramLessons++;
        } else {
          console.warn(`  ⚠️  No course mapping found for lesson_id ${pl.lesson_id}, skipping.`);
        }
      }
      console.log(`  ✅ Migrated ${migratedProgramLessons} records from program_lessons to program_courses.`);

      // Drop program_lessons table (CASCADE will drop foreign key constraints)
      await client.query("DROP TABLE IF EXISTS program_lessons CASCADE");
      console.log("  ✅ Dropped program_lessons table.");
    } else {
      console.log("  ℹ️  program_courses table already exists, skipping creation.");
    }

    // Step 5: Update students table if it has lesson_id column
    console.log("\nStep 5: Checking students table for lesson_id column...");
    const studentsLessonIdExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'lesson_id'
      )
    `);
    if (studentsLessonIdExists.rows[0].exists) {
      // Add course_id column if it doesn't exist
      const studentsCourseIdExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'students' AND column_name = 'course_id'
        )
      `);
      if (!studentsCourseIdExists.rows[0].exists) {
        await client.query("ALTER TABLE students ADD COLUMN course_id INTEGER REFERENCES courses(course_id)");
        console.log("  ✅ Added course_id column to students table.");
      }

      // Migrate lesson_id to course_id
      const studentsWithLessonId = await client.query("SELECT student_id, lesson_id FROM students WHERE lesson_id IS NOT NULL");
      let migratedStudents = 0;
      for (const student of studentsWithLessonId.rows) {
        const courseId = lessonToCourseMap[student.lesson_id];
        if (courseId) {
          await client.query(
            "UPDATE students SET course_id = $1 WHERE student_id = $2",
            [courseId, student.student_id]
          );
          migratedStudents++;
        }
      }
      console.log(`  ✅ Migrated ${migratedStudents} student lesson_id references to course_id.`);

      // Drop lesson_id column
      await client.query("ALTER TABLE students DROP COLUMN IF EXISTS lesson_id");
      console.log("  ✅ Dropped lesson_id column from students table.");
    } else {
      console.log("  ℹ️  students table does not have lesson_id column, skipping.");
    }

    // Step 6: Drop lessons table (CASCADE will drop any remaining foreign key constraints)
    console.log("\nStep 6: Dropping lessons table...");
    await client.query("DROP TABLE IF EXISTS lessons CASCADE");
    console.log("  ✅ Dropped lessons table.");

    await client.query("COMMIT");
    console.log("\n✅ Migration completed successfully!");
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateLessonsToCourses()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = migrateLessonsToCourses;

