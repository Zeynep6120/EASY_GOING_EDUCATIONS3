const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();

const initializeDatabase = require("./db/init");

// Controllers
const authRoutes = require("./src/controllers/auth");
const adminRoutes = require("./src/controllers/admin");
const managerRoutes = require("./src/controllers/manager");
const assistantManagerRoutes = require("./src/controllers/assistant-manager");
const instructorRoutes = require("./src/controllers/instructor");
const studentRoutes = require("./src/controllers/student");
const advisorInstructorRoutes = require("./src/controllers/advisor-instructor");
const usersRoutes = require("./src/controllers/users");
const termsRoutes = require("./src/controllers/terms");
const lessonsRoutes = require("./src/controllers/lessons");
const lessonProgramsRoutes = require("./src/controllers/lesson-programs");
// const studentInfoRoutes = require("./src/controllers/student-info"); // Removed: student_info table merged into students
const meetsRoutes = require("./src/controllers/meets");
const instructorProgramsRoutes = require("./src/controllers/instructor-programs");
const studentProgramsRoutes = require("./src/controllers/student-programs");
const contentRoutes = require("./src/controllers/content");
const contactRoutes = require("./src/controllers/contact");

const app = express();
const net = require("net");

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Initialize database on startup
initializeDatabase()
  .then(() => {
    console.log("Database tables checked/created");
  })
  .catch((error) => {
    console.error("Database initialization error:", error);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dean", managerRoutes);
app.use("/api/vicedean", assistantManagerRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/advisor-instructor", advisorInstructorRoutes);
app.use("/api", usersRoutes);
app.use("/api", termsRoutes);
app.use("/api", lessonsRoutes);
app.use("/api", lessonProgramsRoutes);
// app.use("/api", studentInfoRoutes); // Removed: student_info table merged into students
app.use("/api", meetsRoutes);
// Instructor programs and student programs management
app.use("/api", instructorProgramsRoutes);
app.use("/api", studentProgramsRoutes);
// Public website content management (courses/instructors/events/slides)
// Public read endpoints are available under /api/content/*
// Admin-only write endpoints are also under /api/content/*
app.use("/api/content", contentRoutes);
// Contact messages
app.use("/api", contactRoutes);

// Simple API health endpoint
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Function to check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once("close", () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on("error", () => {
      resolve(false);
    });
  });
}

// Function to find available port starting from a given port
async function findAvailablePort(startPort, maxAttempts = 100) {
  let currentPort = startPort;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const available = await isPortAvailable(currentPort);
    if (available) {
      return currentPort;
    }
    currentPort++;
    attempts++;
  }

  throw new Error(`Could not find available port after ${maxAttempts} attempts`);
}

// Start server with automatic port selection
async function startServer() {
  const startPort = parseInt(process.env.PORT) || 3000;
  
  try {
    const availablePort = await findAvailablePort(startPort);
    
    app.listen(availablePort, () => {
      console.log(`Server running on port ${availablePort}`);
      if (availablePort !== startPort) {
        console.log(`Note: Port ${startPort} was in use, using port ${availablePort} instead`);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
