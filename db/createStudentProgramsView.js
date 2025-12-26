const pool = require("./connection");
require("dotenv").config();

/**
 * Create a view for student_programs that includes all lesson information
 * This view joins student_programs with lesson_programs, lessons, and education_terms
 * to show complete lesson details for each student enrollment
 */
async function createStudentProgramsView() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    console.log("Creating student_programs_detail view...\n");

    // Drop view if it exists
    await client.query("DROP VIEW IF EXISTS student_programs_detail CASCADE");
    console.log("  ✅ Dropped existing view if it existed");

    // Create view with all lesson information
    await client.query(`
      CREATE VIEW student_programs_detail AS
      SELECT 
        sp.student_id,
        sp.lesson_program_id,
        u.username as student_username,
        u.name as student_name,
        u.surname as student_surname,
        u.email as student_email,
        lp.day_of_week,
        lp.start_time,
        lp.stop_time,
        lp.education_term_id,
        et.term_name,
        et.start_date as term_start_date,
        et.end_date as term_end_date,
        -- Lesson information from program_lessons join
        l.lesson_id,
        l.lesson_name,
        l.credit_score,
        l.compulsory,
        -- Instructor information
        i.user_id as instructor_id,
        i.name as instructor_name,
        i.surname as instructor_surname,
        i.email as instructor_email
      FROM student_programs sp
      JOIN users u ON u.user_id = sp.student_id
      JOIN lesson_programs lp ON lp.lesson_program_id = sp.lesson_program_id
      JOIN education_terms et ON et.term_id = lp.education_term_id
      LEFT JOIN program_lessons pl ON pl.lesson_program_id = lp.lesson_program_id
      LEFT JOIN lessons l ON l.lesson_id = pl.lesson_id
      LEFT JOIN instructor_programs ip ON ip.lesson_program_id = lp.lesson_program_id
      LEFT JOIN users i ON i.user_id = ip.instructor_id AND i.role = 'INSTRUCTOR'
    `);
    console.log("  ✅ Created student_programs_detail view");

    await client.query("COMMIT");
    console.log("\n✅ View creation completed successfully!");
    console.log("\n📊 View Information:");
    console.log("   - View name: student_programs_detail");
    console.log("   - Usage: SELECT * FROM student_programs_detail WHERE student_id = ?");
    console.log("   - Includes: Student info, Lesson info, Program schedule, Term info, Instructor info");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating view:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  createStudentProgramsView()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createStudentProgramsView;

