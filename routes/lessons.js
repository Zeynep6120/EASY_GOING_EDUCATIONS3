const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");
const Course = require("../models/Course");

function parseBool(value) {
  if (value === undefined || value === null) return undefined;
  const v = String(value).toLowerCase().trim();
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return undefined;
}

// GET /api/lessons (all authenticated users can view) - Now uses courses
router.get("/lessons", authenticateToken, async (req, res) => {
  try {
    // Optional filter: /api/lessons?compulsory=true|false
    const compulsoryFilter = parseBool(req.query?.compulsory);
    const courses = await Course.getAll();
    
    // Filter by compulsory if specified
    const filteredCourses = compulsoryFilter === undefined
      ? courses
      : courses.filter(c => (c.compulsory || false) === compulsoryFilter);
    
    // Map courses to lesson-like format for backward compatibility
    const lessons = filteredCourses.map(c => ({
      lesson_id: c.course_id,
      lesson_name: c.title,
      credit_score: c.credit_score || 0,
      compulsory: c.compulsory || false,
    }));
    
    res.json(lessons);
  } catch (e) {
    console.error("GET /lessons error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/lessons/:id (all authenticated users can view) - Now uses courses
router.get("/lessons/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Not found" });
    
    // Map course to lesson-like format for backward compatibility
    res.json({
      lesson_id: course.course_id,
      lesson_name: course.title,
      credit_score: course.credit_score || 0,
      compulsory: course.compulsory || false,
    });
  } catch (e) {
    console.error("GET /lessons/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/lessons (ADMIN, MANAGER) - Now uses courses
router.post("/lessons", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const { lesson_name, credit_score, compulsory } = req.body || {};
    if (!lesson_name || credit_score === undefined) {
      return res.status(400).json({ message: "lesson_name and credit_score are required" });
    }
    const created = await Course.create({
      title: lesson_name,
      description: `Course: ${lesson_name}`,
      duration: "16 weeks",
      price: 0,
      level: compulsory ? "Required" : "Optional",
      image: null,
      is_featured: false,
      credit_score: credit_score,
      compulsory: Boolean(compulsory),
    });
    
    // Map course to lesson-like format for backward compatibility
    res.status(201).json({
      lesson_id: created.course_id,
      lesson_name: created.title,
      credit_score: created.credit_score || 0,
      compulsory: created.compulsory || false,
    });
  } catch (e) {
    console.error("POST /lessons error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/lessons/:id (ADMIN, MANAGER) - Now uses courses
router.put("/lessons/:id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { lesson_name, credit_score, compulsory } = req.body || {};
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    if (!lesson_name || credit_score === undefined) {
      return res.status(400).json({ message: "lesson_name and credit_score are required" });
    }
    
    // First check if course exists
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const updated = await Course.update(id, {
      title: lesson_name,
      description: existingCourse.description, // Keep existing description
      duration: existingCourse.duration, // Keep existing duration
      price: existingCourse.price, // Keep existing price
      level: compulsory ? "Required" : "Optional",
      image: existingCourse.image, // Keep existing image
      is_featured: existingCourse.is_featured, // Keep existing featured status
      credit_score: credit_score,
      compulsory: Boolean(compulsory),
    });
    if (!updated) return res.status(404).json({ message: "Not found" });
    
    // Map course to lesson-like format for backward compatibility
    res.json({
      lesson_id: updated.course_id,
      lesson_name: updated.title,
      credit_score: updated.credit_score || 0,
      compulsory: updated.compulsory || false,
    });
  } catch (e) {
    console.error("PUT /lessons/:id error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// DELETE /api/lessons/:id (ADMIN, MANAGER) - Now uses courses
router.delete("/lessons/:id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    
    const deleted = await Course.delete(id);
    if (!deleted) return res.status(404).json({ message: "Course not found" });
    
    res.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error("DELETE /lessons/:id error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
});

module.exports = router;
