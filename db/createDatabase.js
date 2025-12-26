const { Pool } = require("pg");
require("dotenv").config();

// Connect to PostgreSQL without specifying a database (to create the database)
const adminPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "postgres", // Connect to default postgres database
});

async function createDatabase() {
  const client = await adminPool.connect();
  try {
    const dbName = process.env.DB_NAME;
    
    console.log(`Creating database: ${dbName}...`);
    
    // Check if database exists
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`✓ Database "${dbName}" already exists`);
    } else {
      // Create database
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✓ Database "${dbName}" created successfully`);
    }
  } catch (error) {
    console.error(`❌ Error creating database:`, error.message);
    throw error;
  } finally {
    client.release();
    await adminPool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log("\n✅ Database creation completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Database creation failed:", error);
      process.exit(1);
    });
}

module.exports = createDatabase;

