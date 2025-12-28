const pool = require("./connection");

async function fixInstructorsNulls() {
  const client = await pool.connect();
  
  try {
    console.log("Fixing null values in instructors table...\n");
    await client.query("BEGIN");

    // Show current state
    console.log("📊 Current state before update:");
    const beforeResult = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(surname) as has_surname,
        COUNT(username) as has_username,
        COUNT(email) as has_email,
        COUNT(title) as has_title
      FROM instructors
    `);
    console.table(beforeResult.rows[0]);
    console.log();

    // Update surname, username, email from users table
    console.log("1️⃣  Updating surname, username, email from users table...");
    const update1 = await client.query(`
      UPDATE instructors i
      SET 
        surname = COALESCE(i.surname, u.surname),
        username = COALESCE(i.username, u.username),
        email = COALESCE(i.email, u.email)
      FROM users u
      WHERE i.instructor_id = u.user_id
        AND u.role = 'INSTRUCTOR'
        AND (
          i.surname IS NULL OR
          i.username IS NULL OR
          i.email IS NULL
        )
    `);
    console.log(`   ✅ Updated ${update1.rowCount} rows`);

    await client.query("COMMIT");
    console.log("\n✅ All updates completed successfully!\n");

    // Show final state
    console.log("📊 Final state after update:");
    const afterResult = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(surname) as has_surname,
        COUNT(username) as has_username,
        COUNT(email) as has_email,
        COUNT(title) as has_title
      FROM instructors
    `);
    console.table(afterResult.rows[0]);

    // Show remaining nulls if any
    const remainingNulls = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE surname IS NULL) as null_surname,
        COUNT(*) FILTER (WHERE username IS NULL) as null_username,
        COUNT(*) FILTER (WHERE email IS NULL) as null_email,
        COUNT(*) FILTER (WHERE title IS NULL) as null_title
      FROM instructors
    `);
    
    const nullCounts = remainingNulls.rows[0];
    const hasNulls = Object.values(nullCounts).some(count => parseInt(count) > 0);
    
    if (hasNulls) {
      console.log("\n⚠️  Remaining null values:");
      console.table(nullCounts);
    } else {
      console.log("\n✅ No null values remaining!");
    }

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error fixing null values:", error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixInstructorsNulls()
    .then(() => {
      console.log("\nScript completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = fixInstructorsNulls;

