const express = require("express");
const authRoutes = require("./auth.routes");

// Import other controllers as routes (they already export routers)
const adminRoutes = require("../controllers/admin");
const managerRoutes = require("../controllers/manager");
const assistantManagerRoutes = require("../controllers/assistant-manager");
const instructorRoutes = require("../controllers/instructor");
const studentRoutes = require("../controllers/student");
const advisorInstructorRoutes = require("../controllers/advisor-instructor");
const usersRoutes = require("../controllers/users");
const termsRoutes = require("../controllers/terms");
const lessonsRoutes = require("../controllers/lessons");
const lessonProgramsRoutes = require("../controllers/lesson-programs");
const meetsRoutes = require("../controllers/meets");
const instructorProgramsRoutes = require("../controllers/instructor-programs");
const studentProgramsRoutes = require("../controllers/student-programs");
const contentRoutes = require("../controllers/content");
const contactRoutes = require("../controllers/contact");

const router = express.Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/dean", managerRoutes);
router.use("/vicedean", assistantManagerRoutes);
router.use("/instructors", instructorRoutes);
router.use("/students", studentRoutes);
router.use("/advisor-instructor", advisorInstructorRoutes);
router.use("/", usersRoutes);
router.use("/", termsRoutes);
router.use("/", lessonsRoutes);
router.use("/", lessonProgramsRoutes);
router.use("/", meetsRoutes);
router.use("/", instructorProgramsRoutes);
router.use("/", studentProgramsRoutes);
router.use("/content", contentRoutes);
router.use("/", contactRoutes);

module.exports = router;

