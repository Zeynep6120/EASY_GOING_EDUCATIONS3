const pool = require("./connection");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Sample English teacher data
const teachers = [
  {
    username: "robert.martin",
    password: "Teacher123!",
    name: "Robert",
    surname: "Martin",
    email: "robert.martin@school.com",
    gender: "MALE",
    birth_date: "1980-05-15",
    birth_place: "Boston",
    phone_number: "555-111-2222",
    ssn: "111-22-3333",
    is_advisor_teacher: true,
  },
  {
    username: "sarah.johnson",
    password: "Teacher123!",
    name: "Sarah",
    surname: "Johnson",
    email: "sarah.johnson@school.com",
    gender: "FEMALE",
    birth_date: "1982-08-20",
    birth_place: "Seattle",
    phone_number: "555-222-3333",
    ssn: "222-33-4444",
    is_advisor_teacher: true,
  },
  {
    username: "david.williams",
    password: "Teacher123!",
    name: "David",
    surname: "Williams",
    email: "david.williams@school.com",
    gender: "MALE",
    birth_date: "1978-12-10",
    birth_place: "Chicago",
    phone_number: "555-333-4444",
    ssn: "333-44-5555",
    is_advisor_teacher: false,
  },
  {
    username: "jennifer.brown",
    password: "Teacher123!",
    name: "Jennifer",
    surname: "Brown",
    email: "jennifer.brown@school.com",
    gender: "FEMALE",
    birth_date: "1985-03-25",
    birth_place: "Miami",
    phone_number: "555-444-5555",
    ssn: "444-55-6666",
    is_advisor_teacher: true,
  },
  {
    username: "michael.davis",
    password: "Teacher123!",
    name: "Michael",
    surname: "Davis",
    email: "michael.davis@school.com",
    gender: "MALE",
    birth_date: "1979-07-18",
    birth_place: "Denver",
    phone_number: "555-555-6666",
    ssn: "555-66-7777",
    is_advisor_teacher: false,
  },
  {
    username: "lisa.wilson",
    password: "Teacher123!",
    name: "Lisa",
    surname: "Wilson",
    email: "lisa.wilson@school.com",
    gender: "FEMALE",
    birth_date: "1983-11-05",
    birth_place: "Portland",
    phone_number: "555-666-7777",
    ssn: "666-77-8888",
    is_advisor_teacher: true,
  },
  {
    username: "christopher.moore",
    password: "Teacher123!",
    name: "Christopher",
    surname: "Moore",
    email: "christopher.moore@school.com",
    gender: "MALE",
    birth_date: "1981-02-14",
    birth_place: "Austin",
    phone_number: "555-777-8888",
    ssn: "777-88-9999",
    is_advisor_teacher: false,
  },
  {
    username: "amanda.taylor",
    password: "Teacher123!",
    name: "Amanda",
    surname: "Taylor",
    email: "amanda.taylor@school.com",
    gender: "FEMALE",
    birth_date: "1984-09-30",
    birth_place: "Nashville",
    phone_number: "555-888-9999",
    ssn: "888-99-0000",
    is_advisor_teacher: true,
  },
];

async function createTeachers() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Creating ${teachers.length} teachers...`);

    for (const teacherData of teachers) {
      try {
        // Check if username already exists
        const existingUser = await client.query(
          "SELECT user_id FROM users WHERE username = $1",
          [teacherData.username]
        );

        if (existingUser.rows.length > 0) {
          console.log(`⚠️  Teacher ${teacherData.username} already exists, skipping...`);
          continue;
        }

        // Check if email already exists
        const existingEmail = await client.query(
          "SELECT user_id FROM users WHERE email = $1",
          [teacherData.email]
        );

        if (existingEmail.rows.length > 0) {
          console.log(`⚠️  Email ${teacherData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(teacherData.password, 10);

        // Insert into users table
        const userResult = await client.query(
          `INSERT INTO users (username, password, name, surname, email, gender, birth_date, birth_place, phone_number, ssn, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'TEACHER', true)
           RETURNING user_id`,
          [
            teacherData.username,
            hashedPassword,
            teacherData.name,
            teacherData.surname,
            teacherData.email,
            teacherData.gender,
            teacherData.birth_date,
            teacherData.birth_place,
            teacherData.phone_number,
            teacherData.ssn,
          ]
        );

        const userId = userResult.rows[0].user_id;

        // Insert into teachers table with all information
        await client.query(
          `INSERT INTO teachers (
            teacher_id, username, name, surname, email, gender, 
            birth_date, birth_place, phone_number, ssn, is_active,
            is_advisor_teacher
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            userId,
            teacherData.username,
            teacherData.name,
            teacherData.surname,
            teacherData.email,
            teacherData.gender,
            teacherData.birth_date,
            teacherData.birth_place,
            teacherData.phone_number,
            teacherData.ssn,
            true, // is_active
            teacherData.is_advisor_teacher || false,
          ]
        );

        const advisorStatus = teacherData.is_advisor_teacher ? "Advisor Teacher" : "Regular Teacher";
        console.log(`✅ Created teacher: ${teacherData.name} ${teacherData.surname} (${teacherData.username}) - ${advisorStatus}`);
      } catch (error) {
        console.error(`❌ Error creating teacher ${teacherData.username}:`, error.message);
        // Continue with next teacher
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created teachers!`);
    
    // Show summary
    const advisorCount = teachers.filter(t => t.is_advisor_teacher).length;
    const regularCount = teachers.length - advisorCount;
    console.log(`\n📊 Summary:`);
    console.log(`   - Total teachers: ${teachers.length}`);
    console.log(`   - Advisor teachers: ${advisorCount}`);
    console.log(`   - Regular teachers: ${regularCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating teachers:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createTeachers()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createTeachers;

