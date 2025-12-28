const pool = require("./connection");

async function updateAdminInfo() {
  try {
    console.log("Updating admin user information...");

    // Find admin user
    const adminResult = await pool.query(
      "SELECT user_id, username FROM users WHERE username = $1 AND role = $2",
      ["admin", "ADMIN"]
    );

    if (adminResult.rows.length === 0) {
      console.log("❌ Admin user not found!");
      return;
    }

    const admin = adminResult.rows[0];
    console.log(`Found admin user: ${admin.username} (ID: ${admin.user_id})`);

    // Calculate birth date for admin (25-70 years old constraint)
    // Let's set it to 40 years old (middle of the range)
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 40, today.getMonth(), today.getDate());
    const birthDateStr = birthDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Update users table
    await pool.query(
      `UPDATE users 
       SET 
         gender = $1,
         birth_date = $2,
         birth_place = $3,
         phone_number = $4,
         ssn = $5
       WHERE user_id = $6`,
      [
        "MALE", // Gender
        birthDateStr, // Birth date (40 years old)
        "Istanbul", // Birth place
        "5551234567", // Phone number
        "12345678901", // SSN (11 digits)
        admin.user_id
      ]
    );

    // Check if admins table exists and update it
    const adminsTableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      )`
    );

    if (adminsTableCheck.rows[0].exists) {
      await pool.query(
        `UPDATE admins 
         SET 
           gender = $1,
           birth_date = $2,
           birth_place = $3,
           phone_number = $4,
           ssn = $5
         WHERE admin_id = $6`,
        [
          "MALE",
          birthDateStr,
          "Istanbul",
          "5551234567",
          "12345678901",
          admin.user_id
        ]
      );
      console.log("✓ Updated admins table");
    }

    console.log("\n✅ Admin information updated successfully!");
    console.log("   Gender: MALE");
    console.log("   Birth Date:", birthDateStr, "(40 years old)");
    console.log("   Birth Place: Istanbul");
    console.log("   Phone Number: 5551234567");
    console.log("   SSN: 12345678901");

    // Verify the update
    const verifyResult = await pool.query(
      "SELECT username, name, surname, email, gender, birth_date, birth_place, phone_number, ssn FROM users WHERE user_id = $1",
      [admin.user_id]
    );

    if (verifyResult.rows.length > 0) {
      console.log("\n📋 Updated admin information:");
      console.log(verifyResult.rows[0]);
    }

  } catch (error) {
    console.error("❌ Error updating admin information:", error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  updateAdminInfo()
    .then(() => {
      console.log("\nScript completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = updateAdminInfo;

