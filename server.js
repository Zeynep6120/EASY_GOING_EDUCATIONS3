const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();

const initializeDatabase = require("./db/init");

// Routes - Using layered architecture: Routes -> Controllers -> Services -> Repositories
const apiRoutes = require("./src/routes");

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

// Routes - Layered Architecture: Routes -> Controllers -> Services -> Repositories
app.use("/api", apiRoutes);

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
