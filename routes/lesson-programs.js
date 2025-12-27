const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const { normalizeRole, requireMinRole, requireRoles } = require("../middleware/rbac");

const LessonProgram = require("../models/LessonProgram");

/**
 * RBAC summary (based on your hierarchy):
 * - ADMIN: full access
 * - MANAGER: full access except ADMIN accounts (handled elsewhere), can manage programs
 * - ASSISTANT_MANAGER: can view programs + manage student enrollments
 * - INSTRUCTOR: can view own programs + students in own programs
 * - STUDENT: can view own enrolled programs
 */

// Helper: check if a user can access a given program (details/lessons/teachers list)
async function canAccessProgram(programId, reqUser) {
  const role = normalizeRole(reqUser.role);
  const userId = Number(reqUser.id);

  if (role === "ADMIN" || role === "MANAGER" || role === "ASSISTANT_MANAGER") return true;

  if (role === "INSTRUCTOR") {
    return await LessonProgram.isInstructorAssigned(programId, userId);
  }

  if (role === "STUDENT") {
    return await LessonProgram.isStudentEnrolled(programId, userId);
  }

  return false;
}

/**
 * GET /lesson-programs
 * - ADMIN/MANAGER/ASSISTANT_MANAGER: all programs
 * - INSTRUCTOR: programs assigned to instructor
 * - STUDENT: programs enrolled by student (or all programs if ?available=true)
 */
router.get("/lesson-programs", authenticateToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const userId = Number(req.user.id);
    const showAvailable = req.query.available === "true" || req.query.all === "true";
    const termId = req.query.term_id ? Number(req.query.term_id) : null;

    let rows = [];

    if (role === "ADMIN" || role === "MANAGER" || role === "ASSISTANT_MANAGER") {
      rows = await LessonProgram.getAll();
    } else if (role === "INSTRUCTOR") {
      rows = await LessonProgram.getByInstructor(userId);
    } else if (role === "STUDENT") {
      // If student wants to see all available programs (for enrollment)
      if (showAvailable) {
        rows = await LessonProgram.getAll();
      } else {
        // Otherwise, return only enrolled programs
        rows = await LessonProgram.getByStudent(userId);
      }
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Filter by term_id if provided
    if (termId) {
      rows = rows.filter(row => 
        row.education_term_id === termId || row.term_id === termId
      );
    }

    return res.json(rows);
  } catch (error) {
    console.error("GET /lesson-programs error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /lesson-programs
 * Create a new program slot
 * Body: { day, start_time, stop_time, term_id }
 * Only: ADMIN, MANAGER
 */
router.post("/lesson-programs", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const { day, day_of_week, start_time, stop_time, term_id, education_term_id } = req.body;

    if (!(day || day_of_week) || !start_time || !stop_time || !(term_id || education_term_id)) {
      return res.status(400).json({ message: "day/day_of_week, start_time, stop_time, term_id/education_term_id are required" });
    }

    const created = await LessonProgram.create({
      day_of_week: day_of_week || day,
      start_time,
      stop_time,
      education_term_id: education_term_id || term_id,
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("POST /lesson-programs error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /lesson-programs/:id
 * Only: ADMIN, MANAGER
 */
router.put("/lesson-programs/:id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const { day, day_of_week, start_time, stop_time, term_id, education_term_id } = req.body;

    const updated = await LessonProgram.update(programId, {
      day_of_week: day_of_week || day,
      start_time,
      stop_time,
      education_term_id: education_term_id || term_id,
    });

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (error) {
    console.error("PUT /lesson-programs/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /lesson-programs/:id
 * Only: ADMIN, MANAGER
 */
router.delete("/lesson-programs/:id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const deleted = await LessonProgram.delete(programId);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /lesson-programs/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /lesson-programs/:id
 * Allowed if user can access that program (see helper)
 */
router.get("/lesson-programs/:id", authenticateToken, async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const ok = await canAccessProgram(programId, req.user);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const program = await LessonProgram.getById(programId);
    if (!program) return res.status(404).json({ message: "Not found" });
    res.json(program);
  } catch (error) {
    console.error("GET /lesson-programs/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * COURSES IN PROGRAM
 * GET  /lesson-programs/:id/courses (also supports /lessons for backward compatibility)
 * POST /lesson-programs/:id/courses   body: { course_id } (also supports lesson_id)
 * DEL  /lesson-programs/:id/courses/:courseId (also supports /lessons/:lessonId)
 */
router.get("/lesson-programs/:id/courses", authenticateToken, async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const role = normalizeRole(req.user.role);
    
    // STUDENT can view courses for any program (for enrollment purposes)
    // Other roles need proper access
    if (role !== "STUDENT") {
      const ok = await canAccessProgram(programId, req.user);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
    }

    const rows = await LessonProgram.getCourses(programId);
    res.json(rows);
  } catch (error) {
    console.error("GET /lesson-programs/:id/courses error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Backward compatibility: /lessons endpoint redirects to /courses
router.get("/lesson-programs/:id/lessons", authenticateToken, async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const role = normalizeRole(req.user.role);
    
    // STUDENT can view courses for any program (for enrollment purposes)
    // Other roles need proper access
    if (role !== "STUDENT") {
      const ok = await canAccessProgram(programId, req.user);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
    }

    const rows = await LessonProgram.getCourses(programId);
    res.json(rows);
  } catch (error) {
    console.error("GET /lesson-programs/:id/lessons error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/lesson-programs/:id/courses", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const { course_id, lesson_id } = req.body;
    const courseId = course_id || lesson_id; // Support both for backward compatibility
    if (!courseId) return res.status(400).json({ message: "course_id is required" });

    const created = await LessonProgram.addCourse(programId, Number(courseId));
    res.status(201).json(created);
  } catch (error) {
    console.error("POST /lesson-programs/:id/courses error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Backward compatibility: /lessons endpoint redirects to /courses
router.post("/lesson-programs/:id/lessons", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const { lesson_id, course_id } = req.body;
    const courseId = course_id || lesson_id; // Support both for backward compatibility
    if (!courseId) return res.status(400).json({ message: "course_id or lesson_id is required" });

    const created = await LessonProgram.addCourse(programId, Number(courseId));
    res.status(201).json(created);
  } catch (error) {
    console.error("POST /lesson-programs/:id/lessons error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/lesson-programs/:id/courses/:courseId", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const courseId = Number(req.params.courseId);

    const removed = await LessonProgram.removeCourse(programId, courseId);
    if (!removed) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Removed" });
  } catch (error) {
    console.error("DELETE /lesson-programs/:id/courses/:courseId error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Backward compatibility: /lessons/:lessonId endpoint redirects to /courses/:courseId
router.delete("/lesson-programs/:id/lessons/:lessonId", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const courseId = Number(req.params.lessonId);

    const removed = await LessonProgram.removeCourse(programId, courseId);
    if (!removed) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Removed" });
  } catch (error) {
    console.error("DELETE /lesson-programs/:id/lessons/:lessonId error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * INSTRUCTORS IN PROGRAM
 * GET  /lesson-programs/:id/instructors
 * POST /lesson-programs/:id/instructors  body: { instructor_id }
 * DEL  /lesson-programs/:id/instructors/:instructorId
 */
router.get("/lesson-programs/:id/instructors", authenticateToken, async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const role = normalizeRole(req.user.role);
    
    // STUDENT can view instructors for any program (for enrollment purposes)
    // Other roles need proper access
    if (role !== "STUDENT") {
      const ok = await canAccessProgram(programId, req.user);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
    }

    const rows = await LessonProgram.getInstructors(programId);
    res.json(rows);
  } catch (error) {
    console.error("GET /lesson-programs/:id/instructors error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Backward compatibility: support /teachers endpoint
router.get("/lesson-programs/:id/teachers", authenticateToken, async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const ok = await canAccessProgram(programId, req.user);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const rows = await LessonProgram.getInstructors(programId);
    res.json(rows);
  } catch (error) {
    console.error("GET /lesson-programs/:id/teachers error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/lesson-programs/:id/instructors", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const { instructor_id, teacher_id } = req.body;
    const instructorId = instructor_id || teacher_id; // Support both for backward compatibility
    if (!instructorId) return res.status(400).json({ message: "instructor_id is required" });

    const created = await LessonProgram.assignInstructor(programId, Number(instructorId));
    res.status(201).json(created);
  } catch (error) {
    console.error("POST /lesson-programs/:id/instructors error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Backward compatibility: support /teachers endpoint
router.post("/lesson-programs/:id/teachers", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const { teacher_id } = req.body;
    if (!teacher_id) return res.status(400).json({ message: "teacher_id is required" });

    const created = await LessonProgram.assignInstructor(programId, Number(teacher_id));
    res.status(201).json(created);
  } catch (error) {
    console.error("POST /lesson-programs/:id/teachers error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/lesson-programs/:id/instructors/:instructorId", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const instructorId = Number(req.params.instructorId);

    const removed = await LessonProgram.removeInstructor(programId, instructorId);
    if (!removed) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Removed" });
  } catch (error) {
    console.error("DELETE /lesson-programs/:id/instructors/:instructorId error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Backward compatibility: support /teachers endpoint
router.delete("/lesson-programs/:id/teachers/:teacherId", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const teacherId = Number(req.params.teacherId);

    const removed = await LessonProgram.removeInstructor(programId, teacherId);
    if (!removed) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Removed" });
  } catch (error) {
    console.error("DELETE /lesson-programs/:id/teachers/:teacherId error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * STUDENTS IN PROGRAM
 * GET  /lesson-programs/:id/students
 * POST /lesson-programs/:id/students  body: { student_id } OR { student_ids: [] }
 * DEL  /lesson-programs/:id/students/:studentId
 *
 * - ADMIN/MANAGER/ASSISTANT_MANAGER can enroll/unenroll students
 * - INSTRUCTOR can view students ONLY if assigned to that program
 */
router.get("/lesson-programs/:id/students", authenticateToken, async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const role = normalizeRole(req.user.role);

    if (role === "STUDENT") return res.status(403).json({ message: "Forbidden" });

    // For INSTRUCTOR: must be assigned to the program
    const ok = await canAccessProgram(programId, req.user);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const rows = await LessonProgram.getStudents(programId);
    res.json(rows);
  } catch (error) {
    console.error("GET /lesson-programs/:id/students error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/lesson-programs/:id/students", authenticateToken, requireRoles("ADMIN", "MANAGER", "ASSISTANT_MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const { student_id, student_ids } = req.body || {};

    const ids = Array.isArray(student_ids)
      ? student_ids.map(Number).filter(Boolean)
      : [Number(student_id)].filter(Boolean);

    if (ids.length === 0) return res.status(400).json({ message: "student_id or student_ids required" });

    const created = [];
    for (const sid of ids) {
      const row = await LessonProgram.enrollStudent(programId, sid);
      if (row) created.push(row);
    }

    res.status(201).json({ message: "Enrolled", created_count: created.length, created });
  } catch (error) {
    console.error("POST /lesson-programs/:id/students error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/lesson-programs/:id/students/:studentId", authenticateToken, requireRoles("ADMIN", "MANAGER", "ASSISTANT_MANAGER"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const studentId = Number(req.params.studentId);

    const removed = await LessonProgram.removeStudent(programId, studentId);
    if (!removed) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Removed" });
  } catch (error) {
    console.error("DELETE /lesson-programs/:id/students/:studentId error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * STUDENT SELF-ENROLL (optional helper)
 * POST /lesson-programs/:id/enroll
 * Only: STUDENT (enrolls self)
 */
router.post("/lesson-programs/:id/enroll", authenticateToken, requireRoles("STUDENT"), async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const studentId = Number(req.user.id);

    const created = await LessonProgram.enrollStudent(programId, studentId);
    res.status(201).json(created);
  } catch (error) {
    console.error("POST /lesson-programs/:id/enroll error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
