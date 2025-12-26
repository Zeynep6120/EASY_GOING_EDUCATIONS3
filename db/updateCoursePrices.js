const pool = require("./connection");
require("dotenv").config();

async function updateCoursePrices() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log("Updating all course prices to 0 (free)...");

    // Update all courses to have price = 0
    const result = await client.query(
      `UPDATE courses SET price = 0 WHERE price > 0 RETURNING course_id, title, price`
    );

    await client.query("COMMIT");

    console.log(`\n✅ Successfully updated ${result.rows.length} courses to free!`);
    
    if (result.rows.length > 0) {
      console.log("\n📊 Updated courses:");
      result.rows.forEach(course => {
        console.log(`   - ${course.title}: $${course.price} → $0`);
      });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating course prices:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  updateCoursePrices()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = updateCoursePrices;

