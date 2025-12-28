const pool = require("./connection");

async function fillInstructorsNulls() {
  const client = await pool.connect();
  
  try {
    console.log("Filling null values in instructors table...\n");
    await client.query("BEGIN");

    // Update ID 12 (Robert Martin) - bio, image, social_links
    console.log("1️⃣  Updating instructor ID 12 (Robert Martin)...");
    await client.query(`
      UPDATE instructors
      SET 
        bio = COALESCE(bio, 'Experienced educator with a passion for teaching and student success.'),
        image = COALESCE(image, 'instructor-robert-martin.jpg'),
        social_links = COALESCE(social_links, '{"github": "https://github.com/robert-martin", "email": "robert.martin@school.com"}'::jsonb)
      WHERE instructor_id = 12
    `);
    console.log("   ✅ Updated bio, image, and social_links");

    // Update ID 18 (Christopher Moore) - social_links
    console.log("2️⃣  Updating instructor ID 18 (Christopher Moore)...");
    await client.query(`
      UPDATE instructors
      SET 
        social_links = COALESCE(social_links, '{"github": "https://github.com/christopher-moore", "email": "christopher.moore@school.com"}'::jsonb)
      WHERE instructor_id = 18
    `);
    console.log("   ✅ Updated social_links");

    // Update ID 57 (Alexandra Kim) - social_links
    console.log("3️⃣  Updating instructor ID 57 (Alexandra Kim)...");
    await client.query(`
      UPDATE instructors
      SET 
        social_links = COALESCE(social_links, '{"github": "https://github.com/alexandra-kim", "email": "alexandra.kim@easygoing.edu"}'::jsonb)
      WHERE instructor_id = 57
    `);
    console.log("   ✅ Updated social_links");

    await client.query("COMMIT");
    console.log("\n✅ All null values filled successfully!\n");

    // Show final state
    console.log("📊 Final state after update:");
    const afterResult = await client.query(`
      SELECT 
        instructor_id,
        name,
        surname,
        title,
        CASE WHEN bio IS NULL THEN 'NULL' ELSE 'FILLED' END as bio_status,
        CASE WHEN image IS NULL THEN 'NULL' ELSE 'FILLED' END as image_status,
        CASE WHEN social_links IS NULL THEN 'NULL' ELSE 'FILLED' END as social_links_status
      FROM instructors
      WHERE instructor_id IN (12, 18, 57)
      ORDER BY instructor_id
    `);
    console.table(afterResult.rows);

    // Show summary
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(bio) as has_bio,
        COUNT(image) as has_image,
        COUNT(social_links) as has_social_links
      FROM instructors
    `);
    console.log("\n📊 Overall summary:");
    console.table(summary.rows[0]);

    // Check remaining nulls
    const remainingNulls = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE bio IS NULL) as null_bio,
        COUNT(*) FILTER (WHERE image IS NULL) as null_image,
        COUNT(*) FILTER (WHERE social_links IS NULL) as null_social_links
      FROM instructors
    `);
    
    const nullCounts = remainingNulls.rows[0];
    const hasNulls = Object.values(nullCounts).some(count => parseInt(count) > 0);
    
    if (hasNulls) {
      console.log("\n⚠️  Remaining null values:");
      console.table(nullCounts);
    } else {
      console.log("\n✅ No null values remaining in bio, image, or social_links!");
    }

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error filling null values:", error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fillInstructorsNulls()
    .then(() => {
      console.log("\nScript completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = fillInstructorsNulls;

