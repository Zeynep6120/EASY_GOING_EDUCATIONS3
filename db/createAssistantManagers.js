const pool = require("./connection");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Sample English assistant manager data
const assistantManagers = [
  {
    username: "daniel.harris",
    password: "AsstMgr123!",
    name: "Daniel",
    surname: "Harris",
    email: "daniel.harris@school.com",
    gender: "MALE",
    birth_date: "1982-04-12",
    birth_place: "Portland",
    phone_number: "555-700-8000",
    ssn: "700-80-9000",
  },
  {
    username: "karen.young",
    password: "AsstMgr123!",
    name: "Karen",
    surname: "Young",
    email: "karen.young@school.com",
    gender: "FEMALE",
    birth_date: "1983-08-28",
    birth_place: "Austin",
    phone_number: "555-800-9000",
    ssn: "800-90-0000",
  },
  {
    username: "kevin.king",
    password: "AsstMgr123!",
    name: "Kevin",
    surname: "King",
    email: "kevin.king@school.com",
    gender: "MALE",
    birth_date: "1981-12-05",
    birth_place: "San Diego",
    phone_number: "555-900-0000",
    ssn: "900-00-1000",
  },
  {
    username: "michelle.wright",
    password: "AsstMgr123!",
    name: "Michelle",
    surname: "Wright",
    email: "michelle.wright@school.com",
    gender: "FEMALE",
    birth_date: "1984-05-18",
    birth_place: "Nashville",
    phone_number: "555-000-1000",
    ssn: "000-10-2000",
  },
  {
    username: "steven.lopez",
    password: "AsstMgr123!",
    name: "Steven",
    surname: "Lopez",
    email: "steven.lopez@school.com",
    gender: "MALE",
    birth_date: "1980-10-22",
    birth_place: "Dallas",
    phone_number: "555-100-2000",
    ssn: "100-20-3000",
  },
];

async function createAssistantManagers() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Creating ${assistantManagers.length} assistant managers...`);

    for (const assistantManagerData of assistantManagers) {
      try {
        // Check if username already exists
        const existingUser = await client.query(
          "SELECT user_id FROM users WHERE username = $1",
          [assistantManagerData.username]
        );

        if (existingUser.rows.length > 0) {
          console.log(`⚠️  Assistant Manager ${assistantManagerData.username} already exists, skipping...`);
          continue;
        }

        // Check if email already exists
        const existingEmail = await client.query(
          "SELECT user_id FROM users WHERE email = $1",
          [assistantManagerData.email]
        );

        if (existingEmail.rows.length > 0) {
          console.log(`⚠️  Email ${assistantManagerData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(assistantManagerData.password, 10);

        // Insert into users table
        const userResult = await client.query(
          `INSERT INTO users (username, password, name, surname, email, gender, birth_date, birth_place, phone_number, ssn, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ASSISTANT_MANAGER', true)
           RETURNING user_id`,
          [
            assistantManagerData.username,
            hashedPassword,
            assistantManagerData.name,
            assistantManagerData.surname,
            assistantManagerData.email,
            assistantManagerData.gender,
            assistantManagerData.birth_date,
            assistantManagerData.birth_place,
            assistantManagerData.phone_number,
            assistantManagerData.ssn,
          ]
        );

        const userId = userResult.rows[0].user_id;

        console.log(`✅ Created assistant manager: ${assistantManagerData.name} ${assistantManagerData.surname} (${assistantManagerData.username})`);
      } catch (error) {
        console.error(`❌ Error creating assistant manager ${assistantManagerData.username}:`, error.message);
        // Continue with next assistant manager
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created assistant managers!`);
    
    // Show summary
    console.log(`\n📊 Summary:`);
    console.log(`   - Total assistant managers: ${assistantManagers.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating assistant managers:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createAssistantManagers()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createAssistantManagers;

