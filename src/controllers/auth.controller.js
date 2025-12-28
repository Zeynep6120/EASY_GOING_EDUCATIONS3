const AuthService = require("../services/authService");
const { sendSuccess, sendError } = require("../utils/response");
const pool = require("../../db/connection");
const User = require("../repositories/User");
const Student = require("../repositories/Student");

/**
 * Auth Controller - Handles HTTP requests/responses
 * Delegates business logic to AuthService
 */
class AuthController {
  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      const client = await pool.connect();
      try {
        const user = await AuthService.register(req.body, client);
        
        // Get full user data with role-specific info
        const fullUserData = await AuthController._getFullUserData(user, client);
        
        await client.query("COMMIT");
        client.release();

        // Generate token
        const { generateToken } = require("../utils/jwt");
        const token = generateToken({
          id: user.user_id,
          role: user.role,
          username: user.username
        });

        // Frontend expects { token, user, message } format directly
        return res.status(201).json({
          message: "User registered successfully",
          token,
          user: fullUserData
        });
      } catch (error) {
        await client.query("ROLLBACK");
        client.release();
        throw error;
      }
    } catch (error) {
      console.error("Register error:", error);
      const errorMessage = error.detail || error.hint || error.message || "Registration failed";
      const statusCode = error.code === "23505" ? 400 : 500;
      // Frontend expects { message, error } format
      return res.status(statusCode).json({
        message: errorMessage,
        error: errorMessage
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          message: "JWT_SECRET is not configured. Please set JWT_SECRET in .env file.",
          error: "JWT_SECRET is not configured. Please set JWT_SECRET in .env file."
        });
      }

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          message: "Username and password are required",
          error: "Username and password are required"
        });
      }

      const result = await AuthService.login(username, password);
      // Frontend expects { token, user, message } format directly
      return res.status(200).json({
        message: "Login successful",
        token: result.token,
        user: result.user
      });
    } catch (error) {
      console.error("Login error:", error);
      // Frontend expects { message } or { error } format
      return res.status(400).json({
        message: error.message || "Invalid username or password",
        error: error.message || "Invalid username or password"
      });
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return sendError(res, "User not found", 404);
      }

      const fullUserData = await AuthController._getFullUserData(user);
      return sendSuccess(res, fullUserData, null);
    } catch (error) {
      console.error("Profile error:", error);
      return sendError(res, "Server error", 500);
    }
  }

  /**
   * Update student details
   */
  static async updateStudentDetails(req, res) {
    try {
      const { fatherName, motherName, advisorInstructorId } = req.body;
      const studentId = req.user.id;
      await Student.updateDetails(
        studentId,
        fatherName,
        motherName,
        advisorInstructorId
      );
      return sendSuccess(res, null, "Details updated successfully");
    } catch (error) {
      return sendError(res, "Server error", 500);
    }
  }

  /**
   * Get instructors
   */
  static async getInstructors(req, res) {
    try {
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
      return sendSuccess(res, result.rows, null);
    } catch (error) {
      return sendError(res, "Server error", 500);
    }
  }

  /**
   * Get all students
   */
  static async getStudents(req, res) {
    try {
      const query =
        "SELECT u.user_id, u.name, u.surname, u.email, s.father_name, s.mother_name, t.name as advisor_name FROM users u LEFT JOIN students s ON u.user_id = s.student_id LEFT JOIN users t ON s.advisor_instructor_id = t.user_id WHERE u.role = $1";
      const result = await pool.query(query, ["STUDENT"]);
      return sendSuccess(res, result.rows, null);
    } catch (error) {
      return sendError(res, "Server error", 500);
    }
  }

  /**
   * Seed users (development only)
   */
  static async seedUsers(req, res) {
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
          const existingUser = await User.findByUsername(userData.username);
          if (existingUser) {
            createdUsers.push({ username: userData.username, status: "already exists" });
            continue;
          }

          const user = await AuthService.register(userData);
          createdUsers.push({ username: userData.username, role: userData.role, status: "created" });
        } catch (error) {
          console.error(`Error creating user ${userData.username}:`, error);
          createdUsers.push({ username: userData.username, status: "error", error: error.message });
        }
      }

      return sendSuccess(res, {
        users: createdUsers
      }, "Seed users process completed");
    } catch (error) {
      console.error("Seed users error:", error);
      return sendError(res, error.message || "Server error", 500);
    }
  }

  /**
   * Health check
   */
  static async health(req, res) {
    try {
      await pool.query("SELECT 1");
      return sendSuccess(res, {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected"
      }, null);
    } catch (error) {
      return sendError(res, {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message
      }, 503);
    }
  }

  /**
   * Get admin status
   */
  static async getAdminStatus(req, res) {
    try {
      const result = await pool.query(
        "SELECT user_id, username, name, surname, email, role FROM users WHERE role = $1 OR username = $2",
        ["ADMIN", "admin"]
      );

      if (result.rows.length > 0) {
        return sendSuccess(res, {
          exists: true,
          count: result.rows.length,
          admins: result.rows.map((admin) => ({
            id: admin.user_id,
            username: admin.username,
            name: `${admin.name} ${admin.surname}`,
            email: admin.email,
            role: admin.role,
          }))
        }, "Admin user(s) found");
      } else {
        return sendSuccess(res, {
          exists: false,
          count: 0,
          admins: []
        }, "No admin user found. Run 'npm run db:admin' to create one.");
      }
    } catch (error) {
      return sendError(res, {
        exists: false,
        error: error.message,
        message: "Error checking admin status"
      }, 500);
    }
  }

  /**
   * Helper: Get full user data with role-specific info
   */
  static async _getFullUserData(user, client = null) {
    const db = client || pool;
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

    if (user.role === "INSTRUCTOR") {
      const advisorCheck = await db.query(
        "SELECT EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = $1) as is_advisor",
        [user.user_id]
      );
      fullUserData.is_advisor_instructor = advisorCheck.rows[0]?.is_advisor || false;
    } else if (user.role === "STUDENT") {
      const student = await Student.findById(user.user_id, client);
      fullUserData.father_name = student?.father_name;
      fullUserData.mother_name = student?.mother_name;
      fullUserData.advisor_instructor_id = student?.advisor_instructor_id;
    }

    return fullUserData;
  }
}

module.exports = AuthController;

