const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const InstructorUser = require("../models/InstructorUser");
const Student = require("../models/Student");
const authenticateToken = require("../middleware/auth");
const pool = require("../db/connection");

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  // Registration writes to multiple tables (users + teachers/students).
  // Use a transaction to prevent "some fields saved, some not" situations.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Ensure sequence is synchronized with max user_id
    await client.query(`
      SELECT setval('users_user_id_seq', 
        COALESCE((SELECT MAX(user_id) FROM users), 0), 
        true
      )
    `);

    const abort = async (status, payload) => {
      await client.query("ROLLBACK");
      return res.status(status).json(payload);
    };
    const {
      username,
      password,
      name,
      surname,
      email,
      role,
      gender,
      birth_date,
      birth_place,
      phone_number,
      ssn,
      // Student specific
      father_name,
      mother_name,
      advisor_instructor_id,
      // Instructor specific
      is_advisor_instructor,
    } = req.body;

    // Validation
    if (!username || !password || !name || !surname || !email || !role) {
      return abort(400, {
        message:
          "Username, password, name, surname, email, and role are required",
      });
    }

    // Check if username already exists
    const existingUser = await User.findByUsername(username, client);
    if (existingUser) {
      return abort(400, { message: "Username already exists" });
    }

    // Check if email already exists
    const existingEmail = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingEmail.rows.length > 0) {
      return abort(400, { message: "Email already exists" });
    }

    // Validate role - Admin cannot be registered through this endpoint
    const validRoles = ["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "INSTRUCTOR", "STUDENT"];

    if (role.toUpperCase() === "ADMIN") {
      return abort(403, {
        message:
          "Admin users cannot be registered through this form. Admin accounts are created via SQL script only.",
      });
    }

    if (!validRoles.includes(role.toUpperCase())) {
      return abort(400, { message: "Invalid role" });
    }

    // Hash password before creating user
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Creating user with data:", {
      username,
      name,
      surname,
      email,
      role: role.toUpperCase(),
      gender: gender || null,
      birth_date: birth_date || null,
      birth_place: birth_place || null,
      phone_number: phone_number || null,
      ssn: ssn || null,
    });

    // Create user with all information
    // IMPORTANT: pass the transaction client so all inserts are atomic
    const user = await User.create({
      username,
      password: hashedPassword,
      name,
      surname,
      email,
      role: role.toUpperCase(),
      gender: gender || null,
      birth_date: birth_date || null,
      birth_place: birth_place || null,
      phone_number: phone_number || null,
      ssn: ssn || null,
    }, client);

    console.log("User created successfully:", {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Create role-specific records
    if (role.toUpperCase() === "MANAGER") {
      // Insert into managers specialization table
      await client.query(
        `INSERT INTO managers (
          manager_id, username, name, surname, email, gender, 
          birth_date, birth_place, phone_number, ssn, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          user.user_id,
          user.username,
          user.name,
          user.surname,
          user.email,
          user.gender || null,
          user.birth_date || null,
          user.birth_place || null,
          user.phone_number || null,
          user.ssn || null,
          user.is_active !== undefined ? user.is_active : true,
        ]
      );
    } else if (role.toUpperCase() === "ASSISTANT_MANAGER") {
      // Insert into assistant_managers specialization table
      await client.query(
        `INSERT INTO assistant_managers (
          assistant_manager_id, username, name, surname, email, gender, 
          birth_date, birth_place, phone_number, ssn, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          user.user_id,
          user.username,
          user.name,
          user.surname,
          user.email,
          user.gender || null,
          user.birth_date || null,
          user.birth_place || null,
          user.phone_number || null,
          user.ssn || null,
          user.is_active !== undefined ? user.is_active : true,
        ]
      );
    } else if (role.toUpperCase() === "INSTRUCTOR") {
      // After migration, instructors are just users with role = 'INSTRUCTOR'
      // No separate table needed - data is only in users table
      // InstructorUser.create is just a placeholder, doesn't insert anything
      console.log("Processing INSTRUCTOR role registration");
      console.log("is_advisor_instructor:", is_advisor_instructor);
      
      try {
        const instructorResult = await InstructorUser.create(
          user.user_id,
          is_advisor_instructor || false,
          {
            username: user.username,
            name: user.name,
            surname: user.surname,
            email: user.email,
            gender: user.gender,
            birth_date: user.birth_date,
            birth_place: user.birth_place,
            phone_number: user.phone_number,
            ssn: user.ssn,
            is_active: user.is_active,
          },
          client
        );
        console.log("InstructorUser.create completed (placeholder):", instructorResult);
      } catch (instructorError) {
        // InstructorUser.create is a placeholder, ignore errors
        console.log("InstructorUser.create called (placeholder, no-op):", instructorError.message);
      }
      console.log("Instructor user registration completed:", {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else if (role.toUpperCase() === "STUDENT") {
      // Convert advisor_instructor_id to integer if provided
      const advisorId = advisor_instructor_id
        ? typeof advisor_instructor_id === "string"
          ? parseInt(advisor_instructor_id)
          : advisor_instructor_id
        : null;

      await Student.create(
        user.user_id,
        father_name || null,
        mother_name || null,
        advisorId,
        {
          username: user.username,
          name: user.name,
          surname: user.surname,
          email: user.email,
          gender: user.gender,
          birth_date: user.birth_date,
          birth_place: user.birth_place,
          phone_number: user.phone_number,
          ssn: user.ssn,
          is_active: user.is_active,
        },
        client
      );
    }

    // Get full user data with role-specific info
    let fullUserData = {
      id: user.user_id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      gender: user.gender,
      birth_date: user.birth_date,
      birth_place: user.birth_place,
      phone_number: user.phone_number,
      ssn: user.ssn,
    };

    // Add role-specific data
    if (role.toUpperCase() === "MANAGER") {
      // Manager data is in managers table, but we already have it from users
      // No additional data needed
    } else if (role.toUpperCase() === "ASSISTANT_MANAGER") {
      // Assistant manager data is in assistant_managers table, but we already have it from users
      // No additional data needed
    } else if (role.toUpperCase() === "INSTRUCTOR") {
      // Check if instructor is advisor by checking students table
      const advisorCheck = await client.query(
        "SELECT EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = $1) as is_advisor",
        [user.user_id]
      );
      fullUserData.is_advisor_instructor = advisorCheck.rows[0].is_advisor || false;
    } else if (role.toUpperCase() === "STUDENT") {
      const student = await Student.findById(user.user_id, client);
      fullUserData.father_name = student?.father_name;
      fullUserData.mother_name = student?.mother_name;
      fullUserData.advisor_instructor_id = student?.advisor_instructor_id;
    }

    await client.query("COMMIT");
    console.log("Transaction committed successfully");

    // Verify the user was actually created
    const verifyUser = await pool.query(
      "SELECT user_id, username, name, surname, email, role FROM users WHERE user_id = $1",
      [user.user_id]
    );
    
    if (verifyUser.rows.length === 0) {
      console.error("ERROR: User was not found after commit!");
      throw new Error("User was not created in database");
    }
    
    console.log("Verified user exists in database:", verifyUser.rows[0]);

    // Generate token
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      await client.query("ROLLBACK");
      return res.status(500).json({ 
        message: "Server configuration error", 
        error: "JWT_SECRET is not configured. Please set JWT_SECRET in .env file." 
      });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: fullUserData,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }
    console.error("Register error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      constraint: error.constraint,
    });
    
    // Return more detailed error message
    const errorMessage = error.detail || error.hint || error.message || "Server error";
    res.status(500).json({ 
      message: "Registration failed", 
      error: errorMessage,
      code: error.code,
    });
  } finally {
    client.release();
  }
});

// Login with username
router.post("/login", async (req, res) => {
  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured in environment variables");
      return res.status(500).json({ 
        message: "Server configuration error", 
        error: "JWT_SECRET is not configured. Please set JWT_SECRET in .env file." 
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Try exact match first, then case-insensitive
    let user = await User.findByUsername(username);
    if (!user) {
      // Try case-insensitive search
      const result = await pool.query(
        "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
        [username]
      );
      user = result.rows[0] || null;
    }
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    if (user.is_active === false) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    // Check if user has a password
    if (!user.password) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    const isHashed = user.password && (
      user.password.startsWith("$2a$") ||
      user.password.startsWith("$2b$") ||
      user.password.startsWith("$2y$") ||
      user.password.startsWith("$2$")
    );

    let isMatch = false;
    
    if (isHashed) {
      // Password is hashed, use bcrypt.compare
      isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log(`Login failed for ${username}: bcrypt.compare failed`);
      }
    } else {
      // Password is plain text, compare directly (trim whitespace)
      const userPassword = String(user.password || "").trim();
      const inputPassword = String(password || "").trim();
      isMatch = userPassword === inputPassword;
      
      if (!isMatch) {
        console.log(`Login failed for ${username}: plain text password mismatch. DB: "${userPassword}", Input: "${inputPassword}"`);
      }
      
      // Plain text password'ları hash'leme - kullanıcı plain text istediği için hash'lemiyoruz
      // Eğer ileride hash'lemek isterseniz, aşağıdaki kodu aktif edebilirsiniz:
      /*
      if (isMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          "UPDATE users SET password = $1 WHERE user_id = $2",
          [hashedPassword, user.user_id]
        );
        console.log(`Password hashed and updated for user: ${username}`);
      }
      */
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Get role-specific data
    let roleData = {};
    try {
      if (user.role === "INSTRUCTOR") {
        // Check if instructor is advisor
        try {
          const advisorCheck = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = $1) as is_advisor",
            [user.user_id]
          );
          roleData = { is_advisor_instructor: advisorCheck.rows[0]?.is_advisor || false };
        } catch (advisorError) {
          console.error("Error checking advisor status:", advisorError);
          roleData = { is_advisor_instructor: false };
        }
      } else if (user.role === "STUDENT") {
        try {
          const student = await Student.findById(user.user_id);
          if (student) {
            roleData = {
              father_name: student.father_name || null,
              mother_name: student.mother_name || null,
              advisor_instructor_id: student.advisor_instructor_id || null,
              advisor_name: student.advisor_name || null,
              advisor_surname: student.advisor_surname || null,
            };
          } else {
            // Student record doesn't exist in students table, but user exists
            // This is okay, just return empty roleData
            console.warn(`Student record not found for user_id: ${user.user_id}`);
            roleData = {};
          }
        } catch (studentError) {
          console.error("Error loading student data:", studentError);
          // Continue with login even if student data fails
          roleData = {};
        }
      } else if (user.role === "MANAGER" || user.role === "ASSISTANT_MANAGER") {
        // Manager and Assistant Manager don't have role-specific tables
        roleData = {};
      }
    } catch (roleError) {
      console.error("Error loading role-specific data:", roleError);
      // Continue with login even if role-specific data fails
      roleData = {};
    }

    const userResponse = {
      id: user.user_id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      gender: user.gender || null,
      birth_date: user.birth_date || null,
      birth_place: user.birth_place || null,
      phone_number: user.phone_number || null,
      ssn: user.ssn || null,
      ...roleData,
    };

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      constraint: error.constraint,
    });
    
    // Return more detailed error message for debugging
    const errorMessage = error.detail || error.hint || error.message || "Server error";
    res.status(500).json({ 
      message: "Server error", 
      error: errorMessage,
      code: error.code,
    });
  }
});

// Update student details
router.put("/update-student-details", authenticateToken, async (req, res) => {
  try {
    const { fatherName, motherName, advisorInstructorId } = req.body;
    const studentId = req.user.id;
    await Student.updateDetails(
      studentId,
      fatherName,
      motherName,
      advisorInstructorId
    );
    res.json({ message: "Details updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile (works for all roles)
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let roleData = {};
    if (user.role === "INSTRUCTOR") {
      // Check if instructor is advisor
      const advisorCheck = await pool.query(
        "SELECT EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = $1) as is_advisor",
        [user.user_id]
      );
      roleData = { is_advisor_instructor: advisorCheck.rows[0].is_advisor || false };
    } else if (user.role === "STUDENT") {
      const student = await Student.findById(user.user_id);
      roleData = {
        father_name: student?.father_name,
        mother_name: student?.mother_name,
        advisor_instructor_id: student?.advisor_instructor_id,
        advisor_name: student?.advisor_name,
        advisor_surname: student?.advisor_surname,
      };
    }

    res.json({
      ...user,
      ...roleData,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get instructors
router.get("/instructors", async (req, res) => {
  try {
    // After migration, instructors are users with role = 'INSTRUCTOR'
    // Check advisor status via students.advisor_instructor_id
    const query = `
      SELECT 
        u.user_id as instructor_id,
        u.name,
        u.surname,
        CASE WHEN EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = u.user_id) THEN true ELSE false END as is_advisor_instructor
      FROM users u
      WHERE u.role = 'INSTRUCTOR'
      ORDER BY u.name, u.surname
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all students
router.get("/students", async (req, res) => {
  try {
    const query =
      "SELECT u.user_id, u.name, u.surname, u.email, s.father_name, s.mother_name, t.name as advisor_name FROM users u LEFT JOIN students s ON u.user_id = s.student_id LEFT JOIN users t ON s.advisor_instructor_id = t.user_id WHERE u.role = $1";
    const result = await pool.query(query, ["STUDENT"]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Seed Users - Create demo users for all roles
router.post("/seed-users", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const password = "12345";
    const hashedPassword = await bcrypt.hash(password, 10);

    const seedUsers = [
      {
        username: "admin",
        password: hashedPassword,
        name: "Admin",
        surname: "User",
        email: "admin@school.com",
        role: "ADMIN",
      },
      {
        username: "manager",
        password: hashedPassword,
        name: "Manager",
        surname: "User",
        email: "manager@school.com",
        role: "MANAGER",
      },
      {
        username: "asst",
        password: hashedPassword,
        name: "Assistant",
        surname: "Manager",
        email: "asst@school.com",
        role: "ASSISTANT_MANAGER",
      },
      {
        username: "instructor",
        password: hashedPassword,
        name: "John",
        surname: "Instructor",
        email: "instructor@school.com",
        role: "INSTRUCTOR",
        is_advisor_instructor: true,
      },
      {
        username: "student",
        password: hashedPassword,
        name: "Jane",
        surname: "Student",
        email: "student@school.com",
        role: "STUDENT",
        father_name: "Father",
        mother_name: "Mother",
      },
    ];

    const createdUsers = [];

    for (const userData of seedUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findByUsername(userData.username);
        if (existingUser) {
          createdUsers.push({
            username: userData.username,
            status: "already exists",
          });
          continue;
        }

        // Create user
        const user = await User.create({
          username: userData.username,
          password: userData.password,
          name: userData.name,
          surname: userData.surname,
          email: userData.email,
          role: userData.role,
        });

        // Create role-specific records
        if (userData.role === "INSTRUCTOR") {
          // After migration, instructors are just users with role = 'INSTRUCTOR'
          // No separate table needed
          await InstructorUser.create(
            user.user_id,
            userData.is_advisor_instructor || false,
            {
              username: user.username,
              name: user.name,
              surname: user.surname,
              email: user.email,
              gender: user.gender,
              birth_date: user.birth_date,
              birth_place: user.birth_place,
              phone_number: user.phone_number,
              ssn: user.ssn,
              is_active: user.is_active,
            }
          );
        } else if (userData.role === "STUDENT") {
          // Find advisor instructor (first advisor instructor)
          const advisorInstructors = await InstructorUser.getAdvisorInstructors();
          const advisorInstructorId =
            advisorInstructors.length > 0 ? advisorInstructors[0].user_id : null;

          await Student.create(
            user.user_id,
            userData.father_name || null,
            userData.mother_name || null,
            advisorInstructorId
          );
        }

        createdUsers.push({
          username: userData.username,
          role: userData.role,
          status: "created",
        });
      } catch (error) {
        console.error(`Error creating user ${userData.username}:`, error);
        createdUsers.push({
          username: userData.username,
          status: "error",
          error: error.message,
        });
      }
    }

    res.json({
      message: "Seed users process completed",
      users: createdUsers,
    });
  } catch (error) {
    console.error("Seed users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// API Health Check
router.get("/health", async (req, res) => {
  try {
    // Test database connection
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    });
  }
});

// Check Admin User Status
router.get("/admin-status", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, username, name, surname, email, role FROM users WHERE role = $1 OR username = $2",
      ["ADMIN", "admin"]
    );

    if (result.rows.length > 0) {
      res.json({
        exists: true,
        count: result.rows.length,
        admins: result.rows.map((admin) => ({
          id: admin.user_id,
          username: admin.username,
          name: `${admin.name} ${admin.surname}`,
          email: admin.email,
          role: admin.role,
        })),
        message: "Admin user(s) found",
      });
    } else {
      res.json({
        exists: false,
        count: 0,
        admins: [],
        message: "No admin user found. Run 'npm run db:admin' to create one.",
      });
    }
  } catch (error) {
    res.status(500).json({
      exists: false,
      error: error.message,
      message: "Error checking admin status",
    });
  }
});

module.exports = router;
