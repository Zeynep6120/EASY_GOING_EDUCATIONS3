const pool = require("./connection");
const bcrypt = require("bcryptjs");

async function createAdminUser() {
  const shouldClosePool = require.main === module;

  try {
    console.log("Checking admin user...");

    // Check if admin already exists
    const existingAdmin = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR (email = $2 AND role = $3)",
      ["admin", "admin@school.com", "ADMIN"]
    );

    if (existingAdmin.rows.length > 0) {
      console.log("✓ Admin user already exists:");
      existingAdmin.rows.forEach((admin) => {
        console.log(`   Username: ${admin.username}, Email: ${admin.email}`);
      });
      return existingAdmin.rows[0];
    }

    // Hash password
    const password = "12345";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (
        username, 
        password, 
        name, 
        surname, 
        email, 
        role
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING user_id, username, name, surname, email, role`,
      [
        "admin",
        hashedPassword,
        "System",
        "Administrator",
        "admin@school.com",
        "ADMIN",
      ]
    );

    const admin = result.rows[0];
    console.log("\n✅ Admin user created successfully!");
    console.log("   Username: admin");
    console.log("   Password: 12345");
    console.log("   Email:", admin.email);
    console.log("   Role:", admin.role);

    return admin;
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    if (shouldClosePool) {
      throw error;
    }
    return null;
  } finally {
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log("\nScript completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = createAdminUser;
