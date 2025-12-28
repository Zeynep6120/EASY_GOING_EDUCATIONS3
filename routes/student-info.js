const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const { normalizeRole, requireRoles } = require("../middleware/rbac");

const StudentInfo = require("../models/StudentInfo");

/**
 * STUDENT_INFO RBAC:
 * - ADMIN: full CRUD (view/edit/delete all)
 * - MANAGER: view + create/update all (operational, cannot delete)
 * - ASSISTANT_MANAGER: view only (all records)
 * - TEACHER: create/update + view (all students)
 * - STUDENT: view only (only own records)
 */

// Helper: build filters
function buildFilters(query) {
  const filters = {};
  if (query.student_id) filters.student_id = Number(query.student_id);
  if (query.lesson_id) filters.lesson_id = Number(query.lesson_id);
  if (query.term_id) filters.term_id = Number(query.term_id);
  return filters;
}

// GET /student-info
router.get("/student-info", authenticateToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const userId = Number(req.user.id);
    const filters = buildFilters(req.query || {});

    // STUDENT: only own (with optional term filter)
    if (role === "STUDENT") {
      if (filters.term_id) {
        const rows = await StudentInfo.getByStudentAndTerm(userId, filters.term_id);
        return res.json(rows);
      }
      const rows = await StudentInfo.getByStudent(userId);
      return res.json(rows);
    }

    // ADMIN, MANAGER, ASSISTANT_MANAGER, TEACHER: can view all (with optional filters)
    // If filters provided, use the most specific method available
    if (filters.student_id && filters.lesson_id) {
      const rows = await StudentInfo.getByStudentAndLesson(filters.student_id, filters.lesson_id);
      return res.json(rows);
    }
    if (filters.student_id) {
      const rows = await StudentInfo.getByStudent(filters.student_id);
      return res.json(rows);
    }
    if (filters.lesson_id) {
      const rows = await StudentInfo.getByLesson(filters.lesson_id);
      return res.json(rows);
    }
    if (filters.term_id) {
      const rows = await StudentInfo.getByTerm(filters.term_id);
      return res.json(rows);
    }

    // No filters: return all
    const rows = await StudentInfo.getAll();
    res.json(rows);
  } catch (error) {
    console.error("GET /student-info error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /student-info/:id
router.get("/student-info/:id", authenticateToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const infoId = Number(req.params.id);

    const row = await StudentInfo.findById(infoId);
    if (!row) return res.status(404).json({ message: "Not found" });

    if (role === "STUDENT" && Number(row.student_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(row);
  } catch (error) {
    console.error("GET /student-info/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /student-info
// Only: ADMIN, MANAGER, TEACHER (ASSISTANT_MANAGER cannot create)
router.post("/student-info", authenticateToken, requireRoles("ADMIN", "MANAGER", "TEACHER"), async (req, res) => {
  try {
    const {
      student_id,
      lesson_id,
      term_id,
      absentee,
      midterm_exam,
      final_exam,
      average,
      note,
      info_note,
    } = req.body || {};

    if (!student_id || !lesson_id || !term_id) {
      return res.status(400).json({ message: "student_id, lesson_id, term_id are required" });
    }

    const created = await StudentInfo.create({
      student_id: Number(student_id),
      lesson_id: Number(lesson_id),
      term_id: Number(term_id),
      absentee: absentee ?? 0,
      midterm_exam: midterm_exam ?? null,
      final_exam: final_exam ?? null,
      average: average ?? null,
      note: note ?? null,
      info_note: info_note ?? null,
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("POST /student-info error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /student-info/:id
// Only: ADMIN, MANAGER, TEACHER (ASSISTANT_MANAGER cannot update)
router.put("/student-info/:id", authenticateToken, requireRoles("ADMIN", "MANAGER", "TEACHER"), async (req, res) => {
  try {
    const infoId = Number(req.params.id);

    const updated = await StudentInfo.update(infoId, {
      absentee: req.body.absentee,
      midterm_exam: req.body.midterm_exam,
      final_exam: req.body.final_exam,
      average: req.body.average,
      note: req.body.note,
      info_note: req.body.info_note,
    });

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (error) {
    console.error("PUT /student-info/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /student-info/:id
// Only: ADMIN
router.delete("/student-info/:id", authenticateToken, requireRoles("ADMIN"), async (req, res) => {
  try {
    const infoId = Number(req.params.id);
    const deleted = await StudentInfo.delete(infoId);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /student-info/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
