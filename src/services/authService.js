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
      
      if (normalizedRole === "MANAGER") {
        await db.query(
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
      } else if (normalizedRole === "ASSISTANT_MANAGER") {
        await db.query(
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
      } else if (normalizedRole === "INSTRUCTOR") {
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
          },
          db
        );
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
    // Find user - try exact match first, then case-insensitive
    let user = await User.findByUsername(username);
    if (!user) {
      const result = await pool.query(
        "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
        [username]
      );
      user = result.rows[0] || null;
    }

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error("Account is deactivated");
    }

    // Check if user has a password
    if (!user.password) {
      throw new Error("Invalid credentials");
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

    // Get role-specific data
    let roleData = {};
    try {
      if (user.role === "INSTRUCTOR") {
        const advisorCheck = await pool.query(
          "SELECT EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = $1) as is_advisor",
          [user.user_id]
        );
        roleData = { is_advisor_instructor: advisorCheck.rows[0]?.is_advisor || false };
      } else if (user.role === "STUDENT") {
        const student = await Student.findById(user.user_id);
        if (student) {
          roleData = {
            father_name: student.father_name || null,
            mother_name: student.mother_name || null,
            advisor_instructor_id: student.advisor_instructor_id || null,
            advisor_name: student.advisor_name || null,
            advisor_surname: student.advisor_surname || null,
          };
        }
      }
    } catch (roleError) {
      console.error("Error loading role-specific data:", roleError);
      roleData = {};
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
        gender: user.gender || null,
        birth_date: user.birth_date || null,
        birth_place: user.birth_place || null,
        phone_number: user.phone_number || null,
        ssn: user.ssn || null,
        ...roleData
      }
    };
  }
}

module.exports = AuthService;

