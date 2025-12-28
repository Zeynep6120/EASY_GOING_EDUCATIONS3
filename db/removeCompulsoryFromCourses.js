const pool = require("./connection");

async function removeCompulsoryColumn() {
  const shouldClosePool = require.main === module;

  try {
    console.log("Removing compulsory column from courses table...");

    // Check if column exists
    const columnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'compulsory'
      )
    `);

    if (!columnCheck.rows[0].exists) {
      console.log("✓ Compulsory column does not exist in courses table. Nothing to remove.");
      if (shouldClosePool) {
        await pool.end();
      }
      return;
    }

    // Drop the column
    await pool.query(`
      ALTER TABLE courses DROP COLUMN IF EXISTS compulsory
    `);

    console.log("✅ Successfully removed compulsory column from courses table!");

    // Verify the column has been removed
    const verifyCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      ORDER BY ordinal_position
    `);

    console.log("\n📋 Current courses table columns:");
    verifyCheck.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

  } catch (error) {
    console.error("❌ Error removing compulsory column:", error.message);
    console.error(error);
    throw error;
  } finally {
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  removeCompulsoryColumn()
    .then(() => {
      console.log("\n✅ Script completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error.message);
      process.exit(1);
    });
}

module.exports = removeCompulsoryColumn;

