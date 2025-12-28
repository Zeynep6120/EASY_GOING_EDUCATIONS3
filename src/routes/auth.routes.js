const express = require("express");
const AuthController = require("../controllers/auth.controller");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/instructors", AuthController.getInstructors);
router.get("/students", AuthController.getStudents);
router.get("/health", AuthController.health);
router.get("/admin-status", AuthController.getAdminStatus);

// Protected routes
router.get("/profile", authenticateToken, AuthController.getProfile);
router.put("/update-student-details", authenticateToken, AuthController.updateStudentDetails);

// Seed route (for development)
router.post("/seed-users", AuthController.seedUsers);

module.exports = router;

