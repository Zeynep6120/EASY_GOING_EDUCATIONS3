// Migration script: Create role-specific tables and migrate all user data
// This ensures all users are properly distributed to their role-specific tables

const pool = require("./connection");

async function migrateAllRolesData() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("🔄 Starting migration of all roles data...\n");

    // ============================================
    // 1. CREATE TABLES FOR ALL ROLES
    // ============================================
    console.log("📝 Creating role-specific tables...");

    // Admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        admin_id INTEGER PRIMARY KEY REFERENCES users(user_id),
        username VARCHAR(50),
        name VARCHAR(100),
        surname VARCHAR(100),
        email VARCHAR(100),
        gender VARCHAR(10),
        birth_date DATE,
        birth_place VARCHAR(100),
        phone_number VARCHAR(20),
        ssn VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Managers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS managers (
        manager_id INTEGER PRIMARY KEY REFERENCES users(user_id),
        username VARCHAR(50),
        name VARCHAR(100),
        surname VARCHAR(100),
        email VARCHAR(100),
        gender VARCHAR(10),
        birth_date DATE,
        birth_place VARCHAR(100),
        phone_number VARCHAR(20),
        ssn VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Assistant Managers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assistant_managers (
        assistant_manager_id INTEGER PRIMARY KEY REFERENCES users(user_id),
        username VARCHAR(50),
        name VARCHAR(100),
        surname VARCHAR(100),
        email VARCHAR(100),
        gender VARCHAR(10),
        birth_date DATE,
        birth_place VARCHAR(100),
        phone_number VARCHAR(20),
        ssn VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Ensure students and teachers tables have all columns
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

    await client.query(`
      ALTER TABLE teachers
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

    console.log("✅ Tables created/updated\n");

    // ============================================
    // 2. MIGRATE ADMIN DATA
    // ============================================
    console.log("👤 Migrating ADMIN data...");
    const adminResult = await client.query(`
      INSERT INTO admins (
        admin_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active
      )
      SELECT 
        user_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active
      FROM users
      WHERE role = 'ADMIN'
      ON CONFLICT (admin_id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        surname = EXCLUDED.surname,
        email = EXCLUDED.email,
        gender = EXCLUDED.gender,
        birth_date = EXCLUDED.birth_date,
        birth_place = EXCLUDED.birth_place,
        phone_number = EXCLUDED.phone_number,
        ssn = EXCLUDED.ssn,
        is_active = EXCLUDED.is_active
    `);
    console.log(`✅ Migrated ${adminResult.rowCount} admin(s)\n`);

    // ============================================
    // 3. MIGRATE MANAGER DATA
    // ============================================
    console.log("👔 Migrating MANAGER data...");
    const managerResult = await client.query(`
      INSERT INTO managers (
        manager_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active
      )
      SELECT 
        user_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active
      FROM users
      WHERE role = 'MANAGER'
      ON CONFLICT (manager_id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        surname = EXCLUDED.surname,
        email = EXCLUDED.email,
        gender = EXCLUDED.gender,
        birth_date = EXCLUDED.birth_date,
        birth_place = EXCLUDED.birth_place,
        phone_number = EXCLUDED.phone_number,
        ssn = EXCLUDED.ssn,
        is_active = EXCLUDED.is_active
    `);
    console.log(`✅ Migrated ${managerResult.rowCount} manager(s)\n`);

    // ============================================
    // 4. MIGRATE ASSISTANT MANAGER DATA
    // ============================================
    console.log("👨‍💼 Migrating ASSISTANT_MANAGER data...");
    const assistantManagerResult = await client.query(`
      INSERT INTO assistant_managers (
        assistant_manager_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active
      )
      SELECT 
        user_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active
      FROM users
      WHERE role = 'ASSISTANT_MANAGER'
      ON CONFLICT (assistant_manager_id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        surname = EXCLUDED.surname,
        email = EXCLUDED.email,
        gender = EXCLUDED.gender,
        birth_date = EXCLUDED.birth_date,
        birth_place = EXCLUDED.birth_place,
        phone_number = EXCLUDED.phone_number,
        ssn = EXCLUDED.ssn,
        is_active = EXCLUDED.is_active
    `);
    console.log(`✅ Migrated ${assistantManagerResult.rowCount} assistant manager(s)\n`);

    // ============================================
    // 5. MIGRATE TEACHER DATA
    // ============================================
    console.log("👨‍🏫 Migrating TEACHER data...");
    
    // Update existing teachers
    const updateTeacherResult = await client.query(`
      UPDATE teachers t
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
      WHERE t.teacher_id = u.user_id AND u.role = 'TEACHER'
    `);
    console.log(`   Updated ${updateTeacherResult.rowCount} existing teacher(s)`);

    // Insert missing teachers
    const insertTeacherResult = await client.query(`
      INSERT INTO teachers (
        teacher_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active,
        is_advisor_teacher
      )
      SELECT 
        user_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active,
        false as is_advisor_teacher
      FROM users
      WHERE role = 'TEACHER'
        AND user_id NOT IN (SELECT teacher_id FROM teachers)
      ON CONFLICT (teacher_id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        surname = EXCLUDED.surname,
        email = EXCLUDED.email,
        gender = EXCLUDED.gender,
        birth_date = EXCLUDED.birth_date,
        birth_place = EXCLUDED.birth_place,
        phone_number = EXCLUDED.phone_number,
        ssn = EXCLUDED.ssn,
        is_active = EXCLUDED.is_active
    `);
    console.log(`   Inserted ${insertTeacherResult.rowCount} new teacher(s)`);
    console.log(`✅ Total teachers migrated: ${updateTeacherResult.rowCount + insertTeacherResult.rowCount}\n`);

    // ============================================
    // 6. MIGRATE STUDENT DATA
    // ============================================
    console.log("🎓 Migrating STUDENT data...");
    
    // Update existing students
    const updateStudentResult = await client.query(`
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
      WHERE s.student_id = u.user_id AND u.role = 'STUDENT'
    `);
    console.log(`   Updated ${updateStudentResult.rowCount} existing student(s)`);

    // Insert missing students
    const insertStudentResult = await client.query(`
      INSERT INTO students (
        student_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active,
        father_name, mother_name, advisor_teacher_id
      )
      SELECT 
        user_id, username, name, surname, email, gender, 
        birth_date, birth_place, phone_number, ssn, is_active,
        NULL as father_name,
        NULL as mother_name,
        NULL as advisor_teacher_id
      FROM users
      WHERE role = 'STUDENT'
        AND user_id NOT IN (SELECT student_id FROM students)
      ON CONFLICT (student_id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        surname = EXCLUDED.surname,
        email = EXCLUDED.email,
        gender = EXCLUDED.gender,
        birth_date = EXCLUDED.birth_date,
        birth_place = EXCLUDED.birth_place,
        phone_number = EXCLUDED.phone_number,
        ssn = EXCLUDED.ssn,
        is_active = EXCLUDED.is_active
    `);
    console.log(`   Inserted ${insertStudentResult.rowCount} new student(s)`);
    console.log(`✅ Total students migrated: ${updateStudentResult.rowCount + insertStudentResult.rowCount}\n`);

    // ============================================
    // 7. CREATE INDEXES
    // ============================================
    console.log("📊 Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
      CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
      CREATE INDEX IF NOT EXISTS idx_admins_ssn ON admins(ssn);
      
      CREATE INDEX IF NOT EXISTS idx_managers_username ON managers(username);
      CREATE INDEX IF NOT EXISTS idx_managers_email ON managers(email);
      CREATE INDEX IF NOT EXISTS idx_managers_ssn ON managers(ssn);
      
      CREATE INDEX IF NOT EXISTS idx_assistant_managers_username ON assistant_managers(username);
      CREATE INDEX IF NOT EXISTS idx_assistant_managers_email ON assistant_managers(email);
      CREATE INDEX IF NOT EXISTS idx_assistant_managers_ssn ON assistant_managers(ssn);
      
      CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
      CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
      CREATE INDEX IF NOT EXISTS idx_teachers_ssn ON teachers(ssn);
      
      CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
      CREATE INDEX IF NOT EXISTS idx_students_ssn ON students(ssn);
    `);
    console.log("✅ Indexes created\n");

    // ============================================
    // 8. VERIFICATION
    // ============================================
    console.log("🔍 Verifying migration...\n");
    const verifyResult = await client.query(`
      SELECT 
        'ADMIN' as role,
        COUNT(*) as total_in_users,
        (SELECT COUNT(*) FROM admins) as total_in_role_table
      FROM users WHERE role = 'ADMIN'
      UNION ALL
      SELECT 
        'MANAGER' as role,
        COUNT(*) as total_in_users,
        (SELECT COUNT(*) FROM managers) as total_in_role_table
      FROM users WHERE role = 'MANAGER'
      UNION ALL
      SELECT 
        'ASSISTANT_MANAGER' as role,
        COUNT(*) as total_in_users,
        (SELECT COUNT(*) FROM assistant_managers) as total_in_role_table
      FROM users WHERE role = 'ASSISTANT_MANAGER'
      UNION ALL
      SELECT 
        'TEACHER' as role,
        COUNT(*) as total_in_users,
        (SELECT COUNT(*) FROM teachers) as total_in_role_table
      FROM users WHERE role = 'TEACHER'
      UNION ALL
      SELECT 
        'STUDENT' as role,
        COUNT(*) as total_in_users,
        (SELECT COUNT(*) FROM students) as total_in_role_table
      FROM users WHERE role = 'STUDENT'
    `);

    console.log("📊 Migration Statistics:");
    console.log("=" .repeat(60));
    verifyResult.rows.forEach((row) => {
      const match = row.total_in_users === row.total_in_role_table ? "✅" : "⚠️";
      console.log(`${match} ${row.role.padEnd(20)} Users: ${row.total_in_users.toString().padStart(3)} | Table: ${row.total_in_role_table.toString().padStart(3)}`);
    });
    console.log("=" .repeat(60));

    await client.query("COMMIT");
    console.log("\n✅ Migration completed successfully!");
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
  migrateAllRolesData()
    .then(() => {
      console.log("\n✅ All roles data migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = migrateAllRolesData;

