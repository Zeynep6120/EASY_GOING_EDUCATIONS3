const pool = require("./connection");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Sample English student data
const students = [
  {
    username: "john.smith",
    password: "Student123!",
    name: "John",
    surname: "Smith",
    email: "john.smith@school.com",
    gender: "MALE",
    birth_date: "2005-03-15",
    birth_place: "New York",
    phone_number: "555-123-4567",
    ssn: "123-45-6789",
    father_name: "Robert Smith",
    mother_name: "Mary Smith",
  },
  {
    username: "emily.johnson",
    password: "Student123!",
    name: "Emily",
    surname: "Johnson",
    email: "emily.johnson@school.com",
    gender: "FEMALE",
    birth_date: "2005-07-22",
    birth_place: "Los Angeles",
    phone_number: "555-234-5678",
    ssn: "234-56-7890",
    father_name: "David Johnson",
    mother_name: "Sarah Johnson",
  },
  {
    username: "michael.brown",
    password: "Student123!",
    name: "Michael",
    surname: "Brown",
    email: "michael.brown@school.com",
    gender: "MALE",
    birth_date: "2005-11-08",
    birth_place: "Chicago",
    phone_number: "555-345-6789",
    ssn: "345-67-8901",
    father_name: "James Brown",
    mother_name: "Lisa Brown",
  },
  {
    username: "sophia.davis",
    password: "Student123!",
    name: "Sophia",
    surname: "Davis",
    email: "sophia.davis@school.com",
    gender: "FEMALE",
    birth_date: "2005-01-30",
    birth_place: "Houston",
    phone_number: "555-456-7890",
    ssn: "456-78-9012",
    father_name: "William Davis",
    mother_name: "Jennifer Davis",
  },
  {
    username: "william.wilson",
    password: "Student123!",
    name: "William",
    surname: "Wilson",
    email: "william.wilson@school.com",
    gender: "MALE",
    birth_date: "2005-09-14",
    birth_place: "Phoenix",
    phone_number: "555-567-8901",
    ssn: "567-89-0123",
    father_name: "Thomas Wilson",
    mother_name: "Patricia Wilson",
  },
  {
    username: "olivia.miller",
    password: "Student123!",
    name: "Olivia",
    surname: "Miller",
    email: "olivia.miller@school.com",
    gender: "FEMALE",
    birth_date: "2005-05-25",
    birth_place: "Philadelphia",
    phone_number: "555-678-9012",
    ssn: "678-90-1234",
    father_name: "Christopher Miller",
    mother_name: "Nancy Miller",
  },
  {
    username: "james.moore",
    password: "Student123!",
    name: "James",
    surname: "Moore",
    email: "james.moore@school.com",
    gender: "MALE",
    birth_date: "2005-12-03",
    birth_place: "San Antonio",
    phone_number: "555-789-0123",
    ssn: "789-01-2345",
    father_name: "Daniel Moore",
    mother_name: "Karen Moore",
  },
  {
    username: "isabella.taylor",
    password: "Student123!",
    name: "Isabella",
    surname: "Taylor",
    email: "isabella.taylor@school.com",
    gender: "FEMALE",
    birth_date: "2005-04-18",
    birth_place: "San Diego",
    phone_number: "555-890-1234",
    ssn: "890-12-3456",
    father_name: "Matthew Taylor",
    mother_name: "Betty Taylor",
  },
  {
    username: "benjamin.anderson",
    password: "Student123!",
    name: "Benjamin",
    surname: "Anderson",
    email: "benjamin.anderson@school.com",
    gender: "MALE",
    birth_date: "2005-08-11",
    birth_place: "Dallas",
    phone_number: "555-901-2345",
    ssn: "901-23-4567",
    father_name: "Anthony Anderson",
    mother_name: "Helen Anderson",
  },
  {
    username: "charlotte.thomas",
    password: "Student123!",
    name: "Charlotte",
    surname: "Thomas",
    email: "charlotte.thomas@school.com",
    gender: "FEMALE",
    birth_date: "2005-06-27",
    birth_place: "San Jose",
    phone_number: "555-012-3456",
    ssn: "012-34-5678",
    father_name: "Mark Thomas",
    mother_name: "Sandra Thomas",
  },
];

async function createStudents() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    // Get first advisor teacher (if exists)
    const advisorResult = await client.query(
      `SELECT teacher_id FROM teachers WHERE is_advisor_teacher = true LIMIT 1`
    );
    const advisorTeacherId = advisorResult.rows.length > 0 
      ? advisorResult.rows[0].teacher_id 
      : null;

    console.log(`Creating ${students.length} students...`);
    console.log(`Using advisor teacher ID: ${advisorTeacherId || "None (will be null)"}`);

    for (const studentData of students) {
      try {
        // Check if username already exists
        const existingUser = await client.query(
          "SELECT user_id FROM users WHERE username = $1",
          [studentData.username]
        );

        if (existingUser.rows.length > 0) {
          console.log(`⚠️  Student ${studentData.username} already exists, skipping...`);
          continue;
        }

        // Check if email already exists
        const existingEmail = await client.query(
          "SELECT user_id FROM users WHERE email = $1",
          [studentData.email]
        );

        if (existingEmail.rows.length > 0) {
          console.log(`⚠️  Email ${studentData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(studentData.password, 10);

        // Insert into users table
        const userResult = await client.query(
          `INSERT INTO users (username, password, name, surname, email, gender, birth_date, birth_place, phone_number, ssn, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'STUDENT', true)
           RETURNING user_id`,
          [
            studentData.username,
            hashedPassword,
            studentData.name,
            studentData.surname,
            studentData.email,
            studentData.gender,
            studentData.birth_date,
            studentData.birth_place,
            studentData.phone_number,
            studentData.ssn,
          ]
        );

        const userId = userResult.rows[0].user_id;

        // Insert into students table with all information
        await client.query(
          `INSERT INTO students (
            student_id, username, name, surname, email, gender, 
            birth_date, birth_place, phone_number, ssn, is_active,
            father_name, mother_name, advisor_teacher_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            userId,
            studentData.username,
            studentData.name,
            studentData.surname,
            studentData.email,
            studentData.gender,
            studentData.birth_date,
            studentData.birth_place,
            studentData.phone_number,
            studentData.ssn,
            true, // is_active
            studentData.father_name,
            studentData.mother_name,
            advisorTeacherId,
          ]
        );

        console.log(`✅ Created student: ${studentData.name} ${studentData.surname} (${studentData.username})`);
      } catch (error) {
        console.error(`❌ Error creating student ${studentData.username}:`, error.message);
        // Continue with next student
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created students!`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating students:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createStudents()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createStudents;

