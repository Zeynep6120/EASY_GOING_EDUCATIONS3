const express = require("express");
const router = express.Router();
const pool = require("../db/connection");
const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");

// GET /api/instructor-programs - Get all instructor-program relationships
router.get("/instructor-programs", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    // Get all instructor-program relationships with instructor and program details
    // Only get instructors that have programs assigned (INNER JOIN)
    const query = `
      SELECT 
        ip.instructor_id,
        ip.course_program_id,
        u.user_id,
        u.username as instructor_username,
        u.name as instructor_name,
        u.surname as instructor_surname,
        u.email as instructor_email,
        u.name || ' ' || u.surname as instructor_full_name,
        lp.day_of_week,
        lp.start_time,
        lp.stop_time,
        et.term_name,
        et.term_id
      FROM instructor_programs ip
      INNER JOIN users u ON u.user_id = ip.instructor_id
      INNER JOIN course_programs lp ON lp.course_program_id = ip.course_program_id
      INNER JOIN education_terms et ON et.term_id = lp.education_term_id
      WHERE u.role = 'INSTRUCTOR'
      ORDER BY ip.instructor_id, ip.course_program_id
    `;
    const result = await pool.query(query);
    
    // For each row, get the courses/lessons associated with the program
    const rowsWithCourses = await Promise.all(
      result.rows.map(async (row) => {
        // instructor_id is always set since we use INNER JOIN
        const instructorId = row.instructor_id;
        // Only fetch courses if there's a course_program_id
        let courses = [];
        if (row.course_program_id) {
          try {
            // Try to get courses from program_lessons table first (most common)
            const coursesQuery = `
              SELECT 
                c.course_id,
                c.title as course_name,
                c.description,
                c.duration,
                c.level
              FROM program_lessons pl
              JOIN courses c ON c.course_id = pl.lesson_id
              WHERE pl.course_program_id = $1
            `;
            const coursesResult = await pool.query(coursesQuery, [row.course_program_id]);
            courses = coursesResult.rows;
          } catch (err) {
            // If that fails, try program_courses table
            try {
              const coursesQuery = `
                SELECT 
                  c.course_id,
                  c.title as course_name,
                  c.description,
                  c.duration,
                  c.level
                FROM program_courses pc
                JOIN courses c ON c.course_id = pc.course_id
                WHERE pc.course_program_id = $1
              `;
              const coursesResult = await pool.query(coursesQuery, [row.course_program_id]);
              courses = coursesResult.rows;
            } catch (err2) {
              // If that also fails, try lessons table
              try {
                const lessonsQuery = `
                  SELECT 
                    l.lesson_id as course_id,
                    l.lesson_name as course_name,
                    l.credit_score,
                    l.compulsory
                  FROM program_lessons pl
                  JOIN lessons l ON l.lesson_id = pl.lesson_id
                  WHERE pl.course_program_id = $1
                `;
                const lessonsResult = await pool.query(lessonsQuery, [row.course_program_id]);
                courses = lessonsResult.rows.map(l => ({
                  course_id: l.course_id,
                  course_name: l.course_name,
                  credit_score: l.credit_score,
                  compulsory: l.compulsory
                }));
              } catch (err3) {
                console.error("Error loading courses for program:", row.course_program_id, err3);
              }
            }
          }
        }
        
        // Return all instructor and program data with courses
        const result = {
          instructor_id: instructorId,
          course_program_id: row.course_program_id,
          instructor_name: row.instructor_name,
          instructor_surname: row.instructor_surname,
          instructor_email: row.instructor_email,
          instructor_username: row.instructor_username,
          instructor_full_name: row.instructor_full_name,
          day_of_week: row.day_of_week,
          start_time: row.start_time,
          stop_time: row.stop_time,
          term_name: row.term_name,
          term_id: row.term_id,
          courses: courses
        };
        
        console.log("Returning instructor program data:", {
          instructor_id: result.instructor_id,
          instructor_name: result.instructor_name,
          instructor_surname: result.instructor_surname,
          instructor_email: result.instructor_email,
          courses_count: result.courses.length
        });
        
        return result;
      })
    );
    
    res.json(rowsWithCourses);
  } catch (error) {
    console.error("GET /instructor-programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/instructor-programs - Create instructor-program relationship
router.post("/instructor-programs", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { instructor_id, course_program_id } = req.body;
    
    if (!instructor_id || !course_program_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "instructor_id and course_program_id are required" });
    }

    // Get instructor information
    const instructorQuery = `
      SELECT u.name, u.surname, u.email, u.username
      FROM users u
      WHERE u.user_id = $1 AND u.role = 'INSTRUCTOR'
    `;
    const instructorResult = await client.query(instructorQuery, [instructor_id]);
    if (instructorResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Instructor not found" });
    }
    const instructor = instructorResult.rows[0];

    // Get program information
    const programQuery = `
      SELECT lp.day_of_week, lp.start_time, lp.stop_time, et.term_name
      FROM course_programs lp
      LEFT JOIN education_terms et ON lp.education_term_id = et.term_id
      WHERE lp.course_program_id = $1
    `;
    const programResult = await client.query(programQuery, [course_program_id]);
    if (programResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Program not found" });
    }
    const program = programResult.rows[0];

    // Get course information
    let courseId = null;
    let courseName = null;
    try {
      const courseQuery = `
        SELECT c.course_id, c.title
        FROM program_lessons pl
        JOIN courses c ON pl.lesson_id = c.course_id
        WHERE pl.course_program_id = $1
        LIMIT 1
      `;
      const courseResult = await client.query(courseQuery, [course_program_id]);
      if (courseResult.rows.length > 0) {
        courseId = courseResult.rows[0].course_id;
        courseName = courseResult.rows[0].title;
      }
    } catch (err) {
      console.warn("Could not fetch course information:", err.message);
    }

    const timeStr = `${program.start_time} - ${program.stop_time}`;

    const query = `
      INSERT INTO instructor_programs (
        instructor_id, course_program_id,
        instructor_name, instructor_surname, instructor_email, instructor_username,
        program_id, day, time, term,
        course_id, course_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const result = await client.query(query, [
      instructor_id,
      course_program_id,
      instructor.name,
      instructor.surname,
      instructor.email,
      instructor.username,
      course_program_id, // program_id
      program.day_of_week, // day
      timeStr, // time
      program.term_name || null, // term
      courseId,
      courseName
    ]);

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /instructor-programs error:", error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: "This instructor is already assigned to this program" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
});

// PUT /api/instructor-programs/:instructor_id/:course_program_id - Update instructor-program relationship
router.put("/instructor-programs/:instructor_id/:course_program_id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const oldInstructorId = Number(req.params.instructor_id);
    const oldLessonProgramId = Number(req.params.course_program_id);
    const { instructor_id: newInstructorId, course_program_id: newLessonProgramId } = req.body;

    if (!newInstructorId || !newLessonProgramId) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "instructor_id and course_program_id are required" });
    }

    // Check if old record exists
    const oldRecord = await client.query(
      "SELECT * FROM instructor_programs WHERE instructor_id = $1 AND course_program_id = $2",
      [oldInstructorId, oldLessonProgramId]
    );
    if (oldRecord.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Instructor program not found" });
    }

    // Check if new combination already exists
    const existingRecord = await client.query(
      "SELECT * FROM instructor_programs WHERE instructor_id = $1 AND course_program_id = $2",
      [newInstructorId, newLessonProgramId]
    );
    if (existingRecord.rows.length > 0 && (newInstructorId !== oldInstructorId || newLessonProgramId !== oldLessonProgramId)) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "This instructor is already assigned to this program" });
    }

    // Get new instructor information
    const instructorQuery = `
      SELECT u.name, u.surname, u.email, u.username
      FROM users u
      WHERE u.user_id = $1 AND u.role = 'INSTRUCTOR'
    `;
    const instructorResult = await client.query(instructorQuery, [newInstructorId]);
    if (instructorResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Instructor not found" });
    }
    const instructor = instructorResult.rows[0];

    // Get new program information
    const programQuery = `
      SELECT lp.day_of_week, lp.start_time, lp.stop_time, et.term_name
      FROM course_programs lp
      LEFT JOIN education_terms et ON lp.education_term_id = et.term_id
      WHERE lp.course_program_id = $1
    `;
    const programResult = await client.query(programQuery, [newLessonProgramId]);
    if (programResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Program not found" });
    }
    const program = programResult.rows[0];

    // Get course information
    let courseId = null;
    let courseName = null;
    try {
      const courseQuery = `
        SELECT c.course_id, c.title
        FROM program_lessons pl
        JOIN courses c ON pl.lesson_id = c.course_id
        WHERE pl.course_program_id = $1
        LIMIT 1
      `;
      const courseResult = await client.query(courseQuery, [newLessonProgramId]);
      if (courseResult.rows.length > 0) {
        courseId = courseResult.rows[0].course_id;
        courseName = courseResult.rows[0].title;
      }
    } catch (err) {
      console.warn("Could not fetch course information:", err.message);
    }

    const timeStr = `${program.start_time} - ${program.stop_time}`;

    // Delete old record
    await client.query(
      "DELETE FROM instructor_programs WHERE instructor_id = $1 AND course_program_id = $2",
      [oldInstructorId, oldLessonProgramId]
    );

    // Insert new record
    const query = `
      INSERT INTO instructor_programs (
        instructor_id, course_program_id,
        instructor_name, instructor_surname, instructor_email, instructor_username,
        program_id, day, time, term,
        course_id, course_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const result = await client.query(query, [
      newInstructorId,
      newLessonProgramId,
      instructor.name,
      instructor.surname,
      instructor.email,
      instructor.username,
      newLessonProgramId, // program_id
      program.day_of_week, // day
      timeStr, // time
      program.term_name || null, // term
      courseId,
      courseName
    ]);

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PUT /instructor-programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
});

// DELETE /api/instructor-programs/:instructor_id/:course_program_id - Delete instructor-program relationship
router.delete("/instructor-programs/:instructor_id/:course_program_id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const instructor_id = Number(req.params.instructor_id);
    const course_program_id = Number(req.params.course_program_id);

    const query = `
      DELETE FROM instructor_programs
      WHERE instructor_id = $1 AND course_program_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [instructor_id, course_program_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }
    
    res.json({ message: "Deleted", data: result.rows[0] });
  } catch (error) {
    console.error("DELETE /instructor-programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

