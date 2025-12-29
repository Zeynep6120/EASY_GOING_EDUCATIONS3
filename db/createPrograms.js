const pool = require("./connection");
const LessonProgram = require("../src/repositories/LessonProgram");
const EducationTerm = require("../src/repositories/EducationTerm");
const Lesson = require("../src/repositories/Lesson");

async function createPrograms() {
  console.log("Attempting to create 5 sample programs...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get available education terms
    const terms = await EducationTerm.getAll();
    if (terms.length === 0) {
      console.error("No education terms found. Please create education terms first.");
      return;
    }
    const currentTerm = terms[0]; // Use first available term
    console.log(`Using education term: ${currentTerm.term_name} (ID: ${currentTerm.term_id})`);

    // Get available lessons
    const lessons = await Lesson.getAll();
    if (lessons.length === 0) {
      console.error("No lessons found. Please create lessons first.");
      return;
    }
    console.log(`Found ${lessons.length} available lessons`);

    // Programs ordered by day (Monday to Friday)
    const programsToCreate = [
      {
        day: "MONDAY",
        start_time: "09:00:00",
        stop_time: "10:30:00",
        education_term_id: currentTerm.term_id,
        lesson_id: lessons[0]?.lesson_id || lessons[0]?.lesson_id, // First lesson
      },
      {
        day: "TUESDAY",
        start_time: "09:00:00",
        stop_time: "10:30:00",
        education_term_id: currentTerm.term_id,
        lesson_id: lessons[1]?.lesson_id || lessons[0]?.lesson_id, // Second lesson or first if only one
      },
      {
        day: "WEDNESDAY",
        start_time: "09:00:00",
        stop_time: "10:30:00",
        education_term_id: currentTerm.term_id,
        lesson_id: lessons[2]?.lesson_id || lessons[0]?.lesson_id, // Third lesson or first
      },
      {
        day: "THURSDAY",
        start_time: "09:00:00",
        stop_time: "10:30:00",
        education_term_id: currentTerm.term_id,
        lesson_id: lessons[3]?.lesson_id || lessons[0]?.lesson_id, // Fourth lesson or first
      },
      {
        day: "FRIDAY",
        start_time: "09:00:00",
        stop_time: "10:30:00",
        education_term_id: currentTerm.term_id,
        lesson_id: lessons[4]?.lesson_id || lessons[0]?.lesson_id, // Fifth lesson or first
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const programData of programsToCreate) {
      // Check if program already exists (same day, time, and term)
      const existingProgram = await client.query(
        `SELECT * FROM lesson_programs 
         WHERE day_of_week = $1 
         AND start_time = $2 
         AND education_term_id = $3`,
        [programData.day, programData.start_time, programData.education_term_id]
      );

      if (existingProgram.rows.length > 0) {
        console.log(
          `Skipping program ${programData.day} ${programData.start_time}: already exists.`
        );
        skippedCount++;
        continue;
      }

      // Create program
      const program = await LessonProgram.create({
        day: programData.day,
        start_time: programData.start_time,
        stop_time: programData.stop_time,
        education_term_id: programData.education_term_id,
      });

      const programId = program.lesson_program_id;

      // Add lesson to program
      if (programData.lesson_id) {
        await LessonProgram.addLesson(programId, programData.lesson_id);
        const lesson = lessons.find((l) => l.lesson_id === programData.lesson_id);
        console.log(
          `Program created: ${programData.day} ${programData.start_time}-${programData.stop_time} with lesson "${lesson?.lesson_name || 'Unknown'}"`
        );
      } else {
        console.log(
          `Program created: ${programData.day} ${programData.start_time}-${programData.stop_time} (no lesson assigned)`
        );
      }

      createdCount++;
    }

    await client.query("COMMIT");
    console.log(
      `\n${createdCount} sample programs created successfully. (${skippedCount} skipped)`
    );

    // Display summary
    const allPrograms = await LessonProgram.getAll();
    console.log(`\nTotal programs in database: ${allPrograms.length}`);
    console.log("\nPrograms:");
    for (const prog of allPrograms) {
      const programLessons = await LessonProgram.getLessons(prog.lesson_program_id);
      const lessonNames = programLessons.map((l) => l.lesson_name).join(", ") || "No lessons";
      console.log(
        `- ${prog.day_of_week} ${prog.start_time}-${prog.stop_time} (Term: ${prog.term_name}) - Lessons: ${lessonNames}`
      );
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to create programs:", error);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  createPrograms()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  module.exports = createPrograms;
}

