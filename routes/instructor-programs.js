const express = require("express");
const router = express.Router();
const pool = require("../db/connection");
const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");

// GET /api/instructor-programs - Get all instructor-program relationships
router.get("/instructor-programs", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    // First get all instructor-program relationships with basic info
    // Use LEFT JOIN to include all instructors, even if they don't have programs assigned
    const query = `
      SELECT 
        COALESCE(ip.instructor_id, u.user_id) as instructor_id,
        ip.lesson_program_id,
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
      FROM users u
      LEFT JOIN instructor_programs ip ON ip.instructor_id = u.user_id
      LEFT JOIN lesson_programs lp ON lp.lesson_program_id = ip.lesson_program_id
      LEFT JOIN education_terms et ON et.term_id = lp.education_term_id
      WHERE u.role = 'INSTRUCTOR'
      ORDER BY u.user_id, ip.lesson_program_id NULLS LAST
    `;
    const result = await pool.query(query);
    
    // For each row, get the courses/lessons associated with the program
    // Note: instructor_id might be null for instructors without programs (due to LEFT JOIN)
    // We'll use u.user_id as instructor_id in that case
    const rowsWithCourses = await Promise.all(
      result.rows.map(async (row) => {
        // Use user_id as instructor_id if instructor_id is null (instructor without program)
        const instructorId = row.instructor_id || row.user_id;
        // Only fetch courses if there's a lesson_program_id
        let courses = [];
        if (row.lesson_program_id) {
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
              WHERE pl.lesson_program_id = $1
            `;
            const coursesResult = await pool.query(coursesQuery, [row.lesson_program_id]);
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
                WHERE pc.lesson_program_id = $1
              `;
              const coursesResult = await pool.query(coursesQuery, [row.lesson_program_id]);
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
                  WHERE pl.lesson_program_id = $1
                `;
                const lessonsResult = await pool.query(lessonsQuery, [row.lesson_program_id]);
                courses = lessonsResult.rows.map(l => ({
                  course_id: l.course_id,
                  course_name: l.course_name,
                  credit_score: l.credit_score,
                  compulsory: l.compulsory
                }));
              } catch (err3) {
                console.error("Error loading courses for program:", row.lesson_program_id, err3);
              }
            }
          }
        }
        
        return {
          ...row,
          instructor_id: instructorId, // Ensure instructor_id is always set
          courses: courses
        };
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
  try {
    const { instructor_id, lesson_program_id } = req.body;
    
    if (!instructor_id || !lesson_program_id) {
      return res.status(400).json({ message: "instructor_id and lesson_program_id are required" });
    }

    const query = `
      INSERT INTO instructor_programs (instructor_id, lesson_program_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [instructor_id, lesson_program_id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /instructor-programs error:", error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: "This instructor is already assigned to this program" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/instructor-programs/:instructor_id/:lesson_program_id - Delete instructor-program relationship
router.delete("/instructor-programs/:instructor_id/:lesson_program_id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const instructor_id = Number(req.params.instructor_id);
    const lesson_program_id = Number(req.params.lesson_program_id);

    const query = `
      DELETE FROM instructor_programs
      WHERE instructor_id = $1 AND lesson_program_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [instructor_id, lesson_program_id]);
    
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

