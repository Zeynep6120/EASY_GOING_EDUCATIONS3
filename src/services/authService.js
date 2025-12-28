/**
 * Authentication Service - Business Logic Layer
 */
const User = require("../repositories/User");
const InstructorUser = require("../repositories/InstructorUser");
const Student = require("../repositories/Student");
const { hashPassword, isPasswordHashed } = require("../utils/password");
const { generateToken } = require("../utils/jwt");
const { validateRequired, isValidEmail, isValidRole } = require("../utils/validation");
const pool = require("../../db/connection");

class AuthService {
  /**
   * Register a new user
   */
  static async register(userData, client = null) {
    const db = client || pool;
    const shouldManageTransaction = !client;
    
    if (shouldManageTransaction) {
      await db.query("BEGIN");
    }

    try {
      // Ensure sequence is synchronized with max user_id
      await db.query(`
        SELECT setval('users_user_id_seq', 
          COALESCE((SELECT MAX(user_id) FROM users), 0), 
          true
        )
      `);

      // Validate required fields
      const requiredFields = ['username', 'password', 'name', 'surname', 'email', 'role'];
      const validation = validateRequired(userData, requiredFields);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Validate email format
      if (!isValidEmail(userData.email)) {
        throw new Error("Invalid email format");
      }

      // Validate role
      if (userData.role.toUpperCase() === "ADMIN") {
        throw new Error("Admin users cannot be registered through this form");
      }

      if (!isValidRole(userData.role)) {
        throw new Error("Invalid role");
      }

      // Check if username already exists
      const existingUser = await User.findByUsername(userData.username, db);
      if (existingUser) {
        throw new Error("Username already exists");
      }

      // Check if email already exists
      const existingEmail = await db.query("SELECT * FROM users WHERE email = $1", [userData.email]);
      if (existingEmail.rows.length > 0) {
        throw new Error("Email already exists");
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        role: userData.role.toUpperCase()
      }, db);

      // Create role-specific records
      const normalizedRole = userData.role.toUpperCase();
      
      if (normalizedRole === "INSTRUCTOR") {
        await InstructorUser.create({
          instructor_id: user.user_id,
          name: user.name,
          surname: user.surname,
          username: user.username,
          email: user.email,
          title: userData.title || null,
          bio: userData.bio || null,
          is_advisor_instructor: userData.is_advisor_instructor || false
        }, db);
      } else if (normalizedRole === "STUDENT") {
        // Check if advisor instructor exists (if provided)
        if (userData.advisor_instructor_id) {
          const advisorCheck = await db.query(
            "SELECT * FROM users WHERE user_id = $1 AND role = 'INSTRUCTOR'",
            [userData.advisor_instructor_id]
          );
          if (advisorCheck.rows.length === 0) {
            throw new Error("Advisor instructor not found");
          }
        }

        await Student.create(
          user.user_id,
          userData.father_name || null,
          userData.mother_name || null,
          userData.advisor_instructor_id || null,
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
            is_active: user.is_active
          },
          db
        );
      }

      if (shouldManageTransaction) {
        await db.query("COMMIT");
      }

      return user;
    } catch (error) {
      if (shouldManageTransaction) {
        await db.query("ROLLBACK");
      }
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(username, password) {
    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error("Account is deactivated");
    }

    // Handle password verification
    let isPasswordValid = false;
    
    if (isPasswordHashed(user.password)) {
      // Password is hashed, use bcrypt compare
      const bcrypt = require("bcryptjs");
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Password is plain text (legacy), compare directly
      const userPassword = String(user.password || "").trim();
      const inputPassword = String(password || "").trim();
      isPasswordValid = userPassword === inputPassword;
      
      // If password matches and is plain text, hash it for future use
      if (isPasswordValid) {
        const hashedPassword = await hashPassword(password);
        await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [
          hashedPassword,
          user.user_id
        ]);
      }
    }

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate token
    const token = generateToken({
      id: user.user_id,
      username: user.username,
      role: user.role
    });

    // Get additional user info based on role
    let additionalInfo = {};
    if (user.role === "STUDENT") {
      const advisorCheck = await pool.query(
        "SELECT advisor_instructor_id FROM students WHERE student_id = $1",
        [user.user_id]
      );
      if (advisorCheck.rows.length > 0) {
        additionalInfo.advisor_instructor_id = advisorCheck.rows[0].advisor_instructor_id;
      }
    }

    return {
      token,
      user: {
        id: user.user_id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        ...additionalInfo
      }
    };
  }
}

module.exports = AuthService;

