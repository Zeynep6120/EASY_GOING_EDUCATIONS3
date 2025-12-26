const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const pool = require("../db/connection");

// Get all advisor instructors
// This endpoint returns ALL instructors (not just those who are already advisors)
// because any instructor can be assigned as an advisor to a student
router.get("/getAll", authenticateToken, async (req, res) => {
  try {
    // Get all instructors - any instructor can be assigned as an advisor
    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.username,
        u.name,
        u.surname,
        u.email,
        CASE WHEN EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = u.user_id) THEN true ELSE false END as is_advisor_instructor
       FROM users u
       WHERE u.role = 'INSTRUCTOR'
       ORDER BY u.name, u.surname`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching advisor instructors:", error);
    res.status(500).json({ message: "Error fetching advisor instructors", error: error.message });
  }
});

module.exports = router;

