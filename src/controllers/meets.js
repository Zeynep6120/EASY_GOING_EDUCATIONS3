const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const { normalizeRole, requireRoles } = require("../middleware/rbac");

const Meet = require("../repositories/Meet");

// Helper: check meet access
async function canAccessMeet(meetId, reqUser) {
  const role = normalizeRole(reqUser.role);
  const userId = Number(reqUser.id);

  if (role === "ADMIN" || role === "MANAGER" || role === "ASSISTANT_MANAGER") return true;

  const meet = await Meet.findById(meetId);
  if (!meet) return false;

  if (role === "INSTRUCTOR") return Number(meet.instructor_id) === userId;

  if (role === "STUDENT") {
    // Student must be a participant
    const meets = await Meet.getByStudent(userId);
    return meets.some((m) => Number(m.meet_id) === meetId);
  }

  return false;
}

// GET /meets
// ADMIN, MANAGER, ASSISTANT_MANAGER: view all
// INSTRUCTOR: view own meets
// STUDENT: view meets they participate in
router.get("/meets", authenticateToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const userId = Number(req.user.id);

    if (role === "ADMIN" || role === "MANAGER" || role === "ASSISTANT_MANAGER") {
      const rows = await Meet.getAll();
      return res.json(rows);
    }

    if (role === "INSTRUCTOR") {
      const rows = await Meet.getByInstructor(userId);
      return res.json(rows);
    }

    if (role === "STUDENT") {
      const rows = await Meet.getByStudent(userId);
      return res.json(rows);
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (error) {
    console.error("GET /meets error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /meets/:id
router.get("/meets/:id", authenticateToken, async (req, res) => {
  try {
    const meetId = Number(req.params.id);
    const ok = await canAccessMeet(meetId, req.user);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const meet = await Meet.findById(meetId);
    if (!meet) return res.status(404).json({ message: "Not found" });

    res.json(meet);
  } catch (error) {
    console.error("GET /meets/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /meets
// Only: ADMIN, MANAGER, INSTRUCTOR
// Body: { date, start_time, stop_time, description, instructor_id? }
// - Instructor creates under own id
// - Admin/Manager can set instructor_id
router.post("/meets", authenticateToken, requireRoles("ADMIN", "MANAGER", "INSTRUCTOR"), async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const { date, start_time, stop_time, description, instructor_id } = req.body || {};

    if (!date || !start_time || !stop_time) {
      return res.status(400).json({ message: "date, start_time, stop_time are required" });
    }

    const iid = (role === "ADMIN" || role === "MANAGER") ? Number(instructor_id || req.user.id) : Number(req.user.id);

    const created = await Meet.create({
      instructor_id: iid,
      date,
      start_time,
      stop_time,
      description: description || null,
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("POST /meets error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /meets/:id
// Only: ADMIN, MANAGER, INSTRUCTOR (instructor must own)
router.put("/meets/:id", authenticateToken, requireRoles("ADMIN", "MANAGER", "INSTRUCTOR"), async (req, res) => {
  try {
    const meetId = Number(req.params.id);
    const role = normalizeRole(req.user.role);

    const meet = await Meet.findById(meetId);
    if (!meet) return res.status(404).json({ message: "Not found" });

    if (role === "INSTRUCTOR" && Number(meet.instructor_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await Meet.update(meetId, {
      date: req.body.date,
      start_time: req.body.start_time,
      stop_time: req.body.stop_time,
      description: req.body.description,
    });

    res.json(updated);
  } catch (error) {
    console.error("PUT /meets/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /meets/:id
// Only: ADMIN, MANAGER (for audit/control purposes)
router.delete("/meets/:id", authenticateToken, requireRoles("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const meetId = Number(req.params.id);
    const deleted = await Meet.delete(meetId);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /meets/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /meets/:id/students
// Allowed: ADMIN/MANAGER/ASSISTANT_MANAGER and INSTRUCTOR(owner)
router.get("/meets/:id/students", authenticateToken, async (req, res) => {
  try {
    const meetId = Number(req.params.id);
    const role = normalizeRole(req.user.role);

    const meet = await Meet.findById(meetId);
    if (!meet) return res.status(404).json({ message: "Not found" });

    if (role === "ADMIN" || role === "MANAGER" || role === "ASSISTANT_MANAGER") {
      const rows = await Meet.getMeetStudents(meetId);
      return res.json(rows);
    }

    if (role === "INSTRUCTOR" && Number(meet.instructor_id) === Number(req.user.id)) {
      const rows = await Meet.getMeetStudents(meetId);
      return res.json(rows);
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (error) {
    console.error("GET /meets/:id/students error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /meets/:id/students
// Allowed: ADMIN, INSTRUCTOR(owner)
router.post("/meets/:id/students", authenticateToken, requireRoles("ADMIN", "INSTRUCTOR"), async (req, res) => {
  try {
    const meetId = Number(req.params.id);
    const role = normalizeRole(req.user.role);

    const meet = await Meet.findById(meetId);
    if (!meet) return res.status(404).json({ message: "Not found" });

    if (role === "INSTRUCTOR" && Number(meet.instructor_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { student_id, student_ids } = req.body || {};
    const ids = Array.isArray(student_ids)
      ? student_ids.map(Number).filter(Boolean)
      : [Number(student_id)].filter(Boolean);

    if (ids.length === 0) return res.status(400).json({ message: "student_id or student_ids required" });

    const created = [];
    for (const sid of ids) {
      const row = await Meet.addStudent(meetId, sid);
      if (row) created.push(row);
    }

    res.status(201).json({ message: "Added", created_count: created.length, created });
  } catch (error) {
    console.error("POST /meets/:id/students error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /meets/:id/students/:studentId
// Allowed: ADMIN, INSTRUCTOR(owner)
router.delete("/meets/:id/students/:studentId", authenticateToken, requireRoles("ADMIN", "INSTRUCTOR"), async (req, res) => {
  try {
    const meetId = Number(req.params.id);
    const studentId = Number(req.params.studentId);
    const role = normalizeRole(req.user.role);

    const meet = await Meet.findById(meetId);
    if (!meet) return res.status(404).json({ message: "Not found" });

    if (role === "INSTRUCTOR" && Number(meet.instructor_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const removed = await Meet.removeStudent(meetId, studentId);
    if (!removed) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Removed" });
  } catch (error) {
    console.error("DELETE /meets/:id/students/:studentId error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
