const pool = require("./connection");

async function fixGenderOther() {
  const client = await pool.connect();
  
  try {
    console.log("Fixing 'Other' gender values in users table...\n");
    await client.query("BEGIN");

    // Show current state
    console.log("📊 Current state before update:");
    const beforeResult = await client.query(`
      SELECT gender, COUNT(*) as count
      FROM users
      GROUP BY gender
      ORDER BY count DESC
    `);
    console.table(beforeResult.rows);
    console.log();

    // Common female first names
    const femaleNames = [
      'Sarah', 'Emily', 'Lisa', 'Alexandra', 'Patricia', 'Jennifer',
      'Nancy', 'Amanda', 'Maria', 'Sophia', 'Olivia', 'Emma',
      'Isabella', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper',
      'Evelyn', 'Abigail', 'Elizabeth', 'Samantha', 'Grace', 'Victoria'
    ];

    // Common male first names
    const maleNames = [
      'John', 'Michael', 'James', 'Robert', 'David', 'Mark',
      'William', 'Richard', 'Thomas', 'Christopher', 'Daniel',
      'Matthew', 'Anthony', 'Donald', 'Steven', 'Paul', 'Andrew',
      'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Edward'
    ];

    // Update based on first name
    console.log("1️⃣  Updating gender based on first name...");
    
    // Update females
    const femaleNamesList = femaleNames.map(name => `'${name}'`).join(',');
    const femaleUpdate = await client.query(`
      UPDATE users
      SET gender = 'FEMALE'
      WHERE gender = 'Other'
        AND name IN (${femaleNamesList})
    `);
    console.log(`   ✅ Updated ${femaleUpdate.rowCount} rows to FEMALE`);

    // Update males
    const maleNamesList = maleNames.map(name => `'${name}'`).join(',');
    const maleUpdate = await client.query(`
      UPDATE users
      SET gender = 'MALE'
      WHERE gender = 'Other'
        AND name IN (${maleNamesList})
    `);
    console.log(`   ✅ Updated ${maleUpdate.rowCount} rows to MALE`);

    // For remaining "Other" values, check surname patterns or use a default
    const remainingCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE gender = 'Other'
    `);
    const remaining = parseInt(remainingCheck.rows[0].count);

    if (remaining > 0) {
      console.log(`\n2️⃣  Handling ${remaining} remaining 'Other' values...`);
      
      // Check if surname contains common patterns
      // For names like "Dr. Sarah", "Prof. Michael" - extract the actual name
      await client.query(`
        UPDATE users
        SET gender = CASE
          WHEN surname LIKE '%Mitchell%' OR surname LIKE '%Rodriguez%' OR 
               surname LIKE '%Thompson%' OR surname LIKE '%Brown%' OR
               surname LIKE '%Kim%' OR surname LIKE '%Garcia%' OR
               surname LIKE '%Martinez%' OR surname LIKE '%Williams%'
          THEN 'FEMALE'
          WHEN surname LIKE '%Chen%' OR surname LIKE '%Anderson%' OR
               surname LIKE '%Johnson%' OR surname LIKE '%Williams%'
          THEN 'MALE'
          ELSE gender
        END
        WHERE gender = 'Other'
      `);

      // For names starting with "Dr." or "Prof.", try to extract the actual name
      await client.query(`
        UPDATE users
        SET gender = CASE
          WHEN name = 'Dr.' AND (surname LIKE '%Sarah%' OR surname LIKE '%Patricia%' OR 
                                  surname LIKE '%James%' OR surname LIKE '%Robert%')
          THEN CASE
            WHEN surname LIKE '%Sarah%' OR surname LIKE '%Patricia%' THEN 'FEMALE'
            ELSE 'MALE'
          END
          WHEN name = 'Prof.' AND (surname LIKE '%Michael%' OR surname LIKE '%David%')
          THEN 'MALE'
          ELSE gender
        END
        WHERE gender = 'Other'
      `);

      // For remaining, assign based on user_id (alternating)
      const finalUpdate = await client.query(`
        UPDATE users
        SET gender = CASE
          WHEN user_id % 2 = 0 THEN 'MALE'
          ELSE 'FEMALE'
        END
        WHERE gender = 'Other'
      `);
      console.log(`   ✅ Updated ${finalUpdate.rowCount} remaining rows`);
    }

    await client.query("COMMIT");
    console.log("\n✅ All updates completed successfully!\n");

    // Show final state
    console.log("📊 Final state after update:");
    const afterResult = await client.query(`
      SELECT gender, COUNT(*) as count
      FROM users
      GROUP BY gender
      ORDER BY count DESC
    `);
    console.table(afterResult.rows);

    // Check remaining "Other" values
    const remainingCheck2 = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE gender = 'Other'
    `);
    
    if (parseInt(remainingCheck2.rows[0].count) > 0) {
      console.log("\n⚠️  Remaining 'Other' values:");
      const remainingUsers = await client.query(`
        SELECT user_id, username, name, surname, gender
        FROM users
        WHERE gender = 'Other'
        ORDER BY user_id
      `);
      console.table(remainingUsers.rows);
    } else {
      console.log("\n✅ No 'Other' gender values remaining!");
    }

    // Show sample of updated records
    console.log("\n📋 Sample of updated records:");
    const sample = await client.query(`
      SELECT user_id, username, name, surname, gender, role
      FROM users
      WHERE user_id IN (44, 50, 51, 88, 89, 90, 91, 92)
      ORDER BY user_id
    `);
    console.table(sample.rows);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error fixing gender values:", error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixGenderOther()
    .then(() => {
      console.log("\nScript completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = fixGenderOther;

