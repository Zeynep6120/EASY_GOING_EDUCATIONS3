const pool = require("./connection");
const fs = require("fs");
const path = require("path");
const createAdminUser = require("./createAdmin");

async function initializeDatabase() {
  try {
    console.log("Initializing database tables...");

    // Read schema file
    const schemaPath = path.join(__dirname, "..", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Parse SQL statements more reliably
    const statements = [];
    let currentStatement = "";
    const lines = schema.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and full-line comments
      if (!line || line.startsWith("--")) {
        continue;
      }

      // Remove inline comments
      const commentIndex = line.indexOf("--");
      const cleanLine =
        commentIndex !== -1 ? line.substring(0, commentIndex).trim() : line;

      if (!cleanLine) continue;

      currentStatement += cleanLine + " ";

      // If line ends with semicolon, it's a complete statement
      if (cleanLine.endsWith(";")) {
        const statement = currentStatement.trim();
        if (statement && statement.length > 1) {
          statements.push(statement);
        }
        currentStatement = "";
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (!statement || statement.length < 10) {
        continue;
      }

      try {
        await pool.query(statement);
        successCount++;
      } catch (error) {
        // Ignore "already exists" errors
        if (
          error.code === "42P07" || // duplicate_table
          error.code === "42710" || // duplicate_object
          error.message.includes("already exists") ||
          error.message.includes("duplicate key")
        ) {
          skippedCount++;
        } else {
          errorCount++;
          console.error("Error executing statement:", error.message);
        }
      }
    }

    if (errorCount === 0) {
      console.log(
        `✓ Database initialized: ${successCount} tables created, ${skippedCount} already exist`
      );
    } else {
      console.log(
        `⚠ Database initialization: ${successCount} succeeded, ${skippedCount} skipped, ${errorCount} errors`
      );
    }

    // Create admin user if it doesn't exist (non-blocking)
    try {
      await createAdminUser();
    } catch (error) {
      console.log("Note: Admin user creation skipped (may already exist)");
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    // Don't throw - allow server to start even if initialization fails
  }
}

module.exports = initializeDatabase;
