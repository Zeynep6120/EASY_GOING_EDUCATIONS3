// Migration script: Copy all student information from users table to students table
// This ensures all existing student records have complete information in the students table

const pool = require("./connection");

async function migrateStudentsData() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("🔄 Starting student data migration...");

    // Step 1: Add columns if they don't exist
    console.log("📝 Adding columns to students table...");
    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS username VARCHAR(50),
      ADD COLUMN IF NOT EXISTS name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS surname VARCHAR(100),
      ADD COLUMN IF NOT EXISTS email VARCHAR(100),
      ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
      ADD COLUMN IF NOT EXISTS birth_date DATE,
      ADD COLUMN IF NOT EXISTS birth_place VARCHAR(100),
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS ssn VARCHAR(20),
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
    `);

    // Step 2: Update existing student records
    console.log("🔄 Updating existing student records...");
    const updateResult = await client.query(`
      UPDATE students s
      SET 
        username = u.username,
        name = u.name,
        surname = u.surname,
        email = u.email,
        gender = u.gender,
        birth_date = u.birth_date,
        birth_place = u.birth_place,
        phone_number = u.phone_number,
        ssn = u.ssn,
        is_active = u.is_active
      FROM users u
      WHERE s.student_id = u.user_id
    `);
    console.log(`✅ Updated ${updateResult.rowCount} existing student records`);

    // Step 3: Insert students that exist in users but not in students table
    console.log("➕ Inserting missing student records...");
    const insertResult = await client.query(`
      INSERT INTO students (
        student_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active,
        father_name, mother_name, advisor_teacher_id
      )
      SELECT 
        u.user_id,
        u.username,
        u.name,
        u.surname,
        u.email,
        u.gender,
        u.birth_date,
        u.birth_place,
        u.phone_number,
        u.ssn,
        u.is_active,
        NULL as father_name,
        NULL as mother_name,
        NULL as advisor_teacher_id
      FROM users u
      LEFT JOIN students s ON u.user_id = s.student_id
      WHERE u.role = 'STUDENT'
        AND s.student_id IS NULL
      ON CONFLICT (student_id) DO NOTHING
    `);
    console.log(`✅ Inserted ${insertResult.rowCount} new student records`);

    // Step 4: Create indexes
    console.log("📊 Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
      CREATE INDEX IF NOT EXISTS idx_students_ssn ON students(ssn);
    `);

    // Step 5: Verify migration
    console.log("🔍 Verifying migration...");
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total_students_in_users,
        (SELECT COUNT(*) FROM students) as total_students_in_students_table,
        COUNT(CASE WHEN s.username IS NOT NULL THEN 1 END) as students_with_username,
        COUNT(CASE WHEN s.name IS NOT NULL THEN 1 END) as students_with_name,
        COUNT(CASE WHEN s.email IS NOT NULL THEN 1 END) as students_with_email
      FROM users u
      LEFT JOIN students s ON u.user_id = s.student_id
      WHERE u.role = 'STUDENT'
    `);

    const stats = verifyResult.rows[0];
    console.log("\n📊 Migration Statistics:");
    console.log(`   Total students in users table: ${stats.total_students_in_users}`);
    console.log(`   Total students in students table: ${stats.total_students_in_students_table}`);
    console.log(`   Students with username: ${stats.students_with_username}`);
    console.log(`   Students with name: ${stats.students_with_name}`);
    console.log(`   Students with email: ${stats.students_with_email}`);

    await client.query("COMMIT");
    console.log("\n✅ Student data migration completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  migrateStudentsData()
    .then(() => {
      console.log("\n✅ Migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = migrateStudentsData;

