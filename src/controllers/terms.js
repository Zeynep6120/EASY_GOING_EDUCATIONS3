const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");
const EducationTerm = require("../repositories/EducationTerm");
const pool = require("../../db/connection");

// Terms are "master data".
// Per your hierarchy: only ADMIN + MANAGER can manage (and even view) terms.
// (ASSISTANT_MANAGER, TEACHER, STUDENT are blocked.)

// GET /api/terms (All authenticated users - needed for filtering)
router.get("/terms", authenticateToken, async (req, res) => {
  try {
    const terms = await EducationTerm.getAll();
    res.json(terms);
  } catch (e) {
    console.error("GET /terms error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/terms/current (ADMIN, MANAGER)
router.get(
  "/terms/current",
  authenticateToken,
  requireMinRole("MANAGER"),
  async (req, res) => {
    try {
      const term = await EducationTerm.getCurrent();
      if (!term) return res.status(404).json({ message: "Not found" });
      res.json(term);
    } catch (e) {
      console.error("GET /terms/current error:", e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/terms/:id (ADMIN, MANAGER)
router.get(
  "/terms/:id",
  authenticateToken,
  requireMinRole("MANAGER"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const term = await EducationTerm.findById(id);
      if (!term) return res.status(404).json({ message: "Not found" });
      res.json(term);
    } catch (e) {
      console.error("GET /terms/:id error:", e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST /api/terms (ADMIN, MANAGER)
router.post("/terms", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const { term_name, start_date, end_date } = req.body || {};
    if (!term_name || !start_date || !end_date) {
      return res.status(400).json({ message: "term_name, start_date, end_date are required" });
    }
    const created = await EducationTerm.create({ term_name, start_date, end_date });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /terms error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/terms/:id (ADMIN, MANAGER)
router.put("/terms/:id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { term_name, start_date, end_date } = req.body || {};
    if (!term_name || !start_date || !end_date) {
      return res.status(400).json({ message: "term_name, start_date, end_date are required" });
    }
    const updated = await EducationTerm.update(id, { term_name, start_date, end_date });
    if (!updated) return res.status(404).json({ message: "Education term not found" });
    res.json(updated);
  } catch (e) {
    console.error("PUT /terms/:id error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// DELETE /api/terms/:id (ADMIN, MANAGER)
router.delete("/terms/:id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Check if term is referenced by course_programs
    const checkPrograms = await pool.query(
      "SELECT COUNT(*) as count FROM course_programs WHERE education_term_id = $1",
      [id]
    );
    
    if (parseInt(checkPrograms.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: "Cannot delete education term. This term is used by one or more lesson programs. Please remove the programs first." 
      });
    }
    
    const deleted = await EducationTerm.delete(id);
    if (!deleted) return res.status(404).json({ message: "Education term not found" });
    res.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error("DELETE /terms/:id error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

module.exports = router;
