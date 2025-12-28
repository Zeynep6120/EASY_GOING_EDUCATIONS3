const express = require("express");
const Teacher = require("../models/Teacher");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Get all advisor teachers
router.get("/getAll", authenticateToken, async (req, res) => {
  try {
    const advisorTeachers = await Teacher.getAdvisorTeachers();
    res.json(advisorTeachers);
  } catch (error) {
    console.error("Error fetching advisor teachers:", error);
    res.status(500).json({ message: "Error fetching advisor teachers", error: error.message });
  }
});

module.exports = router;

