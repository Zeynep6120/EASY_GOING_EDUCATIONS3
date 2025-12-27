const express = require("express");
const router = express.Router();
const pool = require("../db/connection");
const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");

// GET /api/student-programs - Get all student-program relationships
router.get("/student-programs", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    // First get all student-program relationships with basic info
    const query = `
      SELECT 
        sp.student_id,
        sp.course_program_id,
        u.username as student_username,
        u.name as student_name,
        u.surname as student_surname,
        u.email as student_email,
        u.name || ' ' || u.surname as student_full_name,
        lp.day_of_week,
        lp.start_time,
        lp.stop_time,
        et.term_name,
        et.term_id
      FROM student_programs sp
      JOIN students s ON s.student_id = sp.student_id
      JOIN users u ON u.user_id = sp.student_id
      JOIN course_programs lp ON lp.course_program_id = sp.course_program_id
      JOIN education_terms et ON et.term_id = lp.education_term_id
      ORDER BY sp.student_id, sp.course_program_id
    `;
    const result = await pool.query(query);
    
    // For each row, get the courses/lessons associated with the program
    const rowsWithCourses = await Promise.all(
      result.rows.map(async (row) => {
        // Try to get courses from program_lessons table
        let courses = [];
        try {
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
          // If that fails, try lessons table
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
          } catch (err2) {
            console.error("Error loading courses:", err2);
          }
        }
        
        return {
          ...row,
          courses: courses
        };
      })
    );
    
    res.json(rowsWithCourses);
  } catch (error) {
    console.error("GET /student-programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/student-programs - Create student-program relationship
router.post("/student-programs", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { student_id, course_program_id } = req.body;
    
    if (!student_id || !course_program_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "student_id and course_program_id are required" });
    }

    // Get student information
    const studentQuery = `
      SELECT s.name, s.surname, s.email, s.username
      FROM students s
      WHERE s.student_id = $1
    `;
    const studentResult = await client.query(studentQuery, [student_id]);
    if (studentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found" });
    }
    const student = studentResult.rows[0];

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
      INSERT INTO student_programs (
        student_id, course_program_id,
        student_name, student_surname, student_email, student_username,
        program_id, day, time, term,
        course_id, course_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const result = await client.query(query, [
      student_id,
      course_program_id,
      student.name,
      student.surname,
      student.email,
      student.username,
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
    console.error("POST /student-programs error:", error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: "This student is already enrolled in this program" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
});

// PUT /api/student-programs/:student_id/:course_program_id - Update student-program relationship
router.put("/student-programs/:student_id/:course_program_id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const oldStudentId = Number(req.params.student_id);
    const oldLessonProgramId = Number(req.params.course_program_id);
    const { student_id: newStudentId, course_program_id: newLessonProgramId } = req.body;

    if (!newStudentId || !newLessonProgramId) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "student_id and course_program_id are required" });
    }

    // Check if old record exists
    const oldRecord = await client.query(
      "SELECT * FROM student_programs WHERE student_id = $1 AND course_program_id = $2",
      [oldStudentId, oldLessonProgramId]
    );
    if (oldRecord.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student program not found" });
    }

    // Check if new combination already exists
    const existingRecord = await client.query(
      "SELECT * FROM student_programs WHERE student_id = $1 AND course_program_id = $2",
      [newStudentId, newLessonProgramId]
    );
    if (existingRecord.rows.length > 0 && (newStudentId !== oldStudentId || newLessonProgramId !== oldLessonProgramId)) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "This student is already enrolled in this program" });
    }

    // Get new student information
    const studentQuery = `
      SELECT s.name, s.surname, s.email, s.username
      FROM students s
      WHERE s.student_id = $1
    `;
    const studentResult = await client.query(studentQuery, [newStudentId]);
    if (studentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found" });
    }
    const student = studentResult.rows[0];

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
      "DELETE FROM student_programs WHERE student_id = $1 AND course_program_id = $2",
      [oldStudentId, oldLessonProgramId]
    );

    // Insert new record
    const query = `
      INSERT INTO student_programs (
        student_id, course_program_id,
        student_name, student_surname, student_email, student_username,
        program_id, day, time, term,
        course_id, course_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const result = await client.query(query, [
      newStudentId,
      newLessonProgramId,
      student.name,
      student.surname,
      student.email,
      student.username,
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
    console.error("PUT /student-programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
});

// DELETE /api/student-programs/:student_id/:course_program_id - Delete student-program relationship
router.delete("/student-programs/:student_id/:course_program_id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const student_id = Number(req.params.student_id);
    const course_program_id = Number(req.params.course_program_id);

    const query = `
      DELETE FROM student_programs
      WHERE student_id = $1 AND course_program_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [student_id, course_program_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }
    
    res.json({ message: "Deleted", data: result.rows[0] });
  } catch (error) {
    console.error("DELETE /student-programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

