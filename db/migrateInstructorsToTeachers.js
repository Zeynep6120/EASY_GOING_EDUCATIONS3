const pool = require("./connection");
const bcrypt = require("bcryptjs");
require("dotenv").config();

/**
 * Migration: Move all instructors to teachers table
 * - Creates users for each instructor
 * - Creates teachers entries
 * - Drops instructors table
 */
async function migrateInstructorsToTeachers() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log("🔄 Starting migration: Instructors → Teachers");

    // Get all instructors
    const instructorsResult = await client.query(
      "SELECT * FROM instructors ORDER BY instructor_id"
    );
    const instructors = instructorsResult.rows;

    if (instructors.length === 0) {
      console.log("ℹ️  No instructors found. Nothing to migrate.");
      await client.query("COMMIT");
      return;
    }

    console.log(`📋 Found ${instructors.length} instructors to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const instructor of instructors) {
      try {
        // Parse name into name and surname
        const nameParts = instructor.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "Instructor";
        const lastName = nameParts.slice(1).join(" ") || "Unknown";

        // Generate username from name
        const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, ".")}`;
        let username = baseUsername;
        let counter = 1;

        // Check if username already exists
        while (true) {
          const existingUser = await client.query(
            "SELECT user_id FROM users WHERE username = $1",
            [username]
          );
          if (existingUser.rows.length === 0) break;
          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Generate email if not provided
        const email = `${username}@easygoing.edu`;

        // Generate a default password (instructors should change it)
        const defaultPassword = "Instructor123!";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Insert into users table
        const userResult = await client.query(
          `INSERT INTO users (username, password, name, surname, email, role, is_active)
           VALUES ($1, $2, $3, $4, $5, 'TEACHER', true)
           RETURNING user_id`,
          [username, hashedPassword, firstName, lastName, email]
        );

        const userId = userResult.rows[0].user_id;

        // Insert into teachers table
        await client.query(
          `INSERT INTO teachers (
            teacher_id, username, name, surname, email, is_active, is_advisor_teacher
          ) VALUES ($1, $2, $3, $4, $5, true, false)`,
          [userId, username, firstName, lastName, email]
        );

        // Store instructor metadata (title, bio, image, social_links) in a note or separate field
        // For now, we'll add title to the name or store in a comment
        // You might want to add these fields to teachers table later
        if (instructor.title || instructor.bio || instructor.image || instructor.social_links) {
          console.log(`  ℹ️  Instructor "${instructor.name}" metadata (title, bio, image, social_links) not migrated to teachers table.`);
          console.log(`     Consider adding these fields to teachers table if needed.`);
        }

        migratedCount++;
        console.log(`  ✅ Migrated: ${instructor.name} → ${firstName} ${lastName} (${username})`);
      } catch (error) {
        console.error(`  ❌ Error migrating instructor "${instructor.name}":`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   - Migrated: ${migratedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Total: ${instructors.length}`);

    // Drop instructors table
    console.log("\n🗑️  Dropping instructors table...");
    await client.query("DROP TABLE IF EXISTS instructors CASCADE");
    console.log("  ✅ Instructors table dropped");

    await client.query("COMMIT");
    console.log("\n✅ Migration completed successfully!");
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  migrateInstructorsToTeachers()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = migrateInstructorsToTeachers;

