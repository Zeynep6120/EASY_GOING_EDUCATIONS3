const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createTables() {
  try {
    console.log("Reading schema.sql file...");
    const schemaPath = path.join(__dirname, "..", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("Parsing SQL statements...");
    
    // Split by semicolon but handle multi-line statements
    const statements = [];
    let currentStatement = "";
    const lines = schema.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith("--")) {
        continue;
      }

      // Remove inline comments
      const commentIndex = line.indexOf("--");
      const cleanLine = commentIndex !== -1 
        ? line.substring(0, commentIndex).trim()
        : line;

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

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (!statement || statement.length < 10) {
        continue;
      }

      try {
        // Extract table name for logging
        const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
        const tableName = tableMatch ? tableMatch[1] : "unknown";

        await pool.query(statement);
        console.log(`✓ Created table: ${tableName}`);
        successCount++;
      } catch (error) {
        // Check if it's an "already exists" error
        if (
          error.code === "42P07" || // duplicate_table
          error.code === "42710" || // duplicate_object
          error.message.includes("already exists") ||
          error.message.includes("duplicate key")
        ) {
          const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
          const tableName = tableMatch ? tableMatch[1] : "unknown";
          console.log(`⊘ Table already exists: ${tableName}`);
          skippedCount++;
        } else {
          console.error(`✗ Error executing statement ${i + 1}:`, error.message);
          console.error(`  Statement: ${statement.substring(0, 100)}...`);
          errorCount++;
        }
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Database initialization summary:");
    console.log(`  ✓ Successfully created: ${successCount} tables`);
    console.log(`  ⊘ Already exists: ${skippedCount} tables`);
    if (errorCount > 0) {
      console.log(`  ✗ Errors: ${errorCount}`);
    }
    console.log("=".repeat(50));

    if (errorCount === 0) {
      console.log("\n✅ Database tables initialized successfully!");
    } else {
      console.log(`\n⚠️  Database initialization completed with ${errorCount} error(s).`);
    }
  } catch (error) {
    console.error("\n❌ Fatal error initializing database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log("\nScript completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = createTables;

