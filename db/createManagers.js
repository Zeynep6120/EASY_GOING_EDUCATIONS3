const pool = require("./connection");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Sample English manager data
const managers = [
  {
    username: "alexander.martinez",
    password: "Manager123!",
    name: "Alexander",
    surname: "Martinez",
    email: "alexander.martinez@school.com",
    gender: "MALE",
    birth_date: "1975-06-20",
    birth_place: "San Francisco",
    phone_number: "555-100-2000",
    ssn: "100-20-3000",
  },
  {
    username: "patricia.clark",
    password: "Manager123!",
    name: "Patricia",
    surname: "Clark",
    email: "patricia.clark@school.com",
    gender: "FEMALE",
    birth_date: "1978-09-15",
    birth_place: "Boston",
    phone_number: "555-200-3000",
    ssn: "200-30-4000",
  },
  {
    username: "richard.lewis",
    password: "Manager123!",
    name: "Richard",
    surname: "Lewis",
    email: "richard.lewis@school.com",
    gender: "MALE",
    birth_date: "1976-03-10",
    birth_place: "Chicago",
    phone_number: "555-300-4000",
    ssn: "300-40-5000",
  },
  {
    username: "nancy.robinson",
    password: "Manager123!",
    name: "Nancy",
    surname: "Robinson",
    email: "nancy.robinson@school.com",
    gender: "FEMALE",
    birth_date: "1979-11-25",
    birth_place: "Seattle",
    phone_number: "555-400-5000",
    ssn: "400-50-6000",
  },
  {
    username: "thomas.walker",
    password: "Manager123!",
    name: "Thomas",
    surname: "Walker",
    email: "thomas.walker@school.com",
    gender: "MALE",
    birth_date: "1977-07-08",
    birth_place: "Miami",
    phone_number: "555-500-6000",
    ssn: "500-60-7000",
  },
  {
    username: "susan.hall",
    password: "Manager123!",
    name: "Susan",
    surname: "Hall",
    email: "susan.hall@school.com",
    gender: "FEMALE",
    birth_date: "1980-02-14",
    birth_place: "Denver",
    phone_number: "555-600-7000",
    ssn: "600-70-8000",
  },
];

async function createManagers() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Creating ${managers.length} managers...`);

    for (const managerData of managers) {
      try {
        // Check if username already exists
        const existingUser = await client.query(
          "SELECT user_id FROM users WHERE username = $1",
          [managerData.username]
        );

        if (existingUser.rows.length > 0) {
          console.log(`⚠️  Manager ${managerData.username} already exists, skipping...`);
          continue;
        }

        // Check if email already exists
        const existingEmail = await client.query(
          "SELECT user_id FROM users WHERE email = $1",
          [managerData.email]
        );

        if (existingEmail.rows.length > 0) {
          console.log(`⚠️  Email ${managerData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(managerData.password, 10);

        // Insert into users table
        const userResult = await client.query(
          `INSERT INTO users (username, password, name, surname, email, gender, birth_date, birth_place, phone_number, ssn, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'MANAGER', true)
           RETURNING user_id`,
          [
            managerData.username,
            hashedPassword,
            managerData.name,
            managerData.surname,
            managerData.email,
            managerData.gender,
            managerData.birth_date,
            managerData.birth_place,
            managerData.phone_number,
            managerData.ssn,
          ]
        );

        const userId = userResult.rows[0].user_id;

        console.log(`✅ Created manager: ${managerData.name} ${managerData.surname} (${managerData.username})`);
      } catch (error) {
        console.error(`❌ Error creating manager ${managerData.username}:`, error.message);
        // Continue with next manager
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created managers!`);
    
    // Show summary
    console.log(`\n📊 Summary:`);
    console.log(`   - Total managers: ${managers.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating managers:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createManagers()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createManagers;

