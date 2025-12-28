const pool = require("./connection");

async function fixUsersNulls() {
  const client = await pool.connect();
  
  try {
    console.log("Fixing null values in users table...\n");
    await client.query("BEGIN");

    // Show current state
    console.log("📊 Current state before update:");
    const beforeResult = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(birth_date) as has_birth_date,
        COUNT(CASE WHEN birth_place IS NOT NULL AND birth_place != 'Unknown' THEN 1 END) as has_birth_place,
        COUNT(CASE WHEN phone_number IS NOT NULL AND phone_number != '0000000000' AND phone_number != '0 NULL' THEN 1 END) as has_phone_number,
        COUNT(CASE WHEN ssn IS NOT NULL AND ssn != 'NULL' THEN 1 END) as has_ssn
      FROM users
    `);
    console.table(beforeResult.rows[0]);
    console.log();

    // Generate birth dates (25-70 years old, random dates)
    console.log("1️⃣  Updating birth_date for users with NULL...");
    const birthDateUpdate = await client.query(`
      UPDATE users
      SET birth_date = (
        CASE 
          WHEN user_id % 5 = 0 THEN CURRENT_DATE - INTERVAL '35 years' - (user_id % 365 || ' days')::INTERVAL
          WHEN user_id % 5 = 1 THEN CURRENT_DATE - INTERVAL '40 years' - (user_id % 365 || ' days')::INTERVAL
          WHEN user_id % 5 = 2 THEN CURRENT_DATE - INTERVAL '45 years' - (user_id % 365 || ' days')::INTERVAL
          WHEN user_id % 5 = 3 THEN CURRENT_DATE - INTERVAL '30 years' - (user_id % 365 || ' days')::INTERVAL
          ELSE CURRENT_DATE - INTERVAL '50 years' - (user_id % 365 || ' days')::INTERVAL
        END
      )::DATE
      WHERE birth_date IS NULL
    `);
    console.log(`   ✅ Updated ${birthDateUpdate.rowCount} rows`);

    // Update birth_place - use common cities
    console.log("2️⃣  Updating birth_place for users with NULL or 'Unknown'...");
    const cities = [
      'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya',
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
      'London', 'Paris', 'Berlin', 'Madrid', 'Rome'
    ];
    
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      await client.query(`
        UPDATE users
        SET birth_place = $1
        WHERE (birth_place IS NULL OR birth_place = 'Unknown')
          AND user_id % ${cities.length} = $2
      `, [city, i]);
    }
    const birthPlaceUpdate = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE birth_place IS NULL OR birth_place = 'Unknown'
    `);
    if (parseInt(birthPlaceUpdate.rows[0].count) > 0) {
      // Fill remaining with Istanbul
      await client.query(`
        UPDATE users
        SET birth_place = 'Istanbul'
        WHERE birth_place IS NULL OR birth_place = 'Unknown'
      `);
    }
    console.log(`   ✅ Updated birth_place for all users`);

    // Update phone_number - generate valid phone numbers
    console.log("3️⃣  Updating phone_number for users with NULL or invalid values...");
    const phoneUpdate = await client.query(`
      UPDATE users
      SET phone_number = '555' || LPAD((user_id::text || (user_id * 7 % 10000)::text), 7, '0')
      WHERE phone_number IS NULL 
         OR phone_number = '0000000000'
         OR phone_number = '0 NULL'
         OR LENGTH(phone_number) < 10
    `);
    console.log(`   ✅ Updated ${phoneUpdate.rowCount} rows`);

    // Update ssn - generate valid SSN format (XXX-XX-XXXX)
    console.log("4️⃣  Updating ssn for users with NULL or 'NULL'...");
    const ssnUpdate = await client.query(`
      UPDATE users
      SET ssn = LPAD((user_id * 3)::text, 3, '0') || '-' || 
                 LPAD((user_id * 7 % 100)::text, 2, '0') || '-' || 
                 LPAD((user_id * 11 % 10000)::text, 4, '0')
      WHERE ssn IS NULL OR ssn = 'NULL'
    `);
    console.log(`   ✅ Updated ${ssnUpdate.rowCount} rows`);

    await client.query("COMMIT");
    console.log("\n✅ All updates completed successfully!\n");

    // Show final state
    console.log("📊 Final state after update:");
    const afterResult = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(birth_date) as has_birth_date,
        COUNT(CASE WHEN birth_place IS NOT NULL AND birth_place != 'Unknown' THEN 1 END) as has_birth_place,
        COUNT(CASE WHEN phone_number IS NOT NULL AND phone_number != '0000000000' AND phone_number != '0 NULL' THEN 1 END) as has_phone_number,
        COUNT(CASE WHEN ssn IS NOT NULL AND ssn != 'NULL' THEN 1 END) as has_ssn
      FROM users
    `);
    console.table(afterResult.rows[0]);

    // Check remaining nulls
    const remainingNulls = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE birth_date IS NULL) as null_birth_date,
        COUNT(*) FILTER (WHERE birth_place IS NULL OR birth_place = 'Unknown') as null_birth_place,
        COUNT(*) FILTER (WHERE phone_number IS NULL OR phone_number = '0000000000' OR phone_number = '0 NULL') as null_phone_number,
        COUNT(*) FILTER (WHERE ssn IS NULL OR ssn = 'NULL') as null_ssn
      FROM users
    `);
    
    const nullCounts = remainingNulls.rows[0];
    const hasNulls = Object.values(nullCounts).some(count => parseInt(count) > 0);
    
    if (hasNulls) {
      console.log("\n⚠️  Remaining null values:");
      console.table(nullCounts);
    } else {
      console.log("\n✅ No null values remaining!");
    }

    // Show sample of updated records
    console.log("\n📋 Sample of updated records:");
    const sample = await client.query(`
      SELECT user_id, username, name, surname, birth_date, birth_place, phone_number, ssn
      FROM users
      WHERE user_id IN (20, 44, 50, 88, 89)
      ORDER BY user_id
    `);
    console.table(sample.rows);

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
  fixUsersNulls()
    .then(() => {
      console.log("\nScript completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = fixUsersNulls;

