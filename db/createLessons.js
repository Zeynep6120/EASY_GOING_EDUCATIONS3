const pool = require("./connection");
require("dotenv").config();

// Sample English lesson data
const lessons = [
  {
    lesson_name: "Mathematics",
    credit_score: 4,
    compulsory: true,
  },
  {
    lesson_name: "English Language",
    credit_score: 3,
    compulsory: true,
  },
  {
    lesson_name: "Computer Science",
    credit_score: 4,
    compulsory: false,
  },
  {
    lesson_name: "Physics",
    credit_score: 3,
    compulsory: false,
  },
  {
    lesson_name: "Chemistry",
    credit_score: 3,
    compulsory: false,
  },
  {
    lesson_name: "History",
    credit_score: 2,
    compulsory: true,
  },
  {
    lesson_name: "Geography",
    credit_score: 2,
    compulsory: true,
  },
  {
    lesson_name: "Biology",
    credit_score: 3,
    compulsory: false,
  },
];

async function createLessons() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Creating ${lessons.length} lessons...`);

    for (const lessonData of lessons) {
      try {
        // Check if lesson already exists
        const existingLesson = await client.query(
          "SELECT lesson_id FROM lessons WHERE lesson_name = $1",
          [lessonData.lesson_name]
        );

        if (existingLesson.rows.length > 0) {
          console.log(`⚠️  Lesson "${lessonData.lesson_name}" already exists, skipping...`);
          continue;
        }

        // Insert lesson
        const result = await client.query(
          `INSERT INTO lessons (lesson_name, credit_score, compulsory)
           VALUES ($1, $2, $3)
           RETURNING lesson_id, lesson_name, credit_score, compulsory`,
          [
            lessonData.lesson_name,
            lessonData.credit_score,
            lessonData.compulsory,
          ]
        );

        const lesson = result.rows[0];
        console.log(`✅ Created lesson: ${lesson.lesson_name} (${lesson.credit_score} credits, ${lesson.compulsory ? 'Compulsory' : 'Optional'})`);
      } catch (error) {
        console.error(`❌ Error creating lesson "${lessonData.lesson_name}":`, error.message);
        // Continue with next lesson
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created lessons!`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating lessons:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createLessons()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createLessons;

