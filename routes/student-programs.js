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
        sp.lesson_program_id,
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
      JOIN lesson_programs lp ON lp.lesson_program_id = sp.lesson_program_id
      JOIN education_terms et ON et.term_id = lp.education_term_id
      ORDER BY sp.student_id, sp.lesson_program_id
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
            WHERE pl.lesson_program_id = $1
          `;
          const coursesResult = await pool.query(coursesQuery, [row.lesson_program_id]);
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
              WHERE pl.lesson_program_id = $1
            `;
            const lessonsResult = await pool.query(lessonsQuery, [row.lesson_program_id]);
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
  try {
    const { student_id, lesson_program_id } = req.body;
    
    if (!student_id || !lesson_program_id) {
      return res.status(400).json({ message: "student_id and lesson_program_id are required" });
    }

    const query = `
      INSERT INTO student_programs (student_id, lesson_program_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [student_id, lesson_program_id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /student-programs error:", error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: "This student is already enrolled in this program" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/student-programs/:student_id/:lesson_program_id - Delete student-program relationship
router.delete("/student-programs/:student_id/:lesson_program_id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const student_id = Number(req.params.student_id);
    const lesson_program_id = Number(req.params.lesson_program_id);

    const query = `
      DELETE FROM student_programs
      WHERE student_id = $1 AND lesson_program_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [student_id, lesson_program_id]);
    
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

