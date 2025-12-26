const express = require("express");
const User = require("../models/User");
const Student = require("../models/Student");
const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");
const pool = require("../db/connection");

const router = express.Router();

// Get all students with pagination
// TEACHER, ASSISTANT_MANAGER, MANAGER, ADMIN can access
router.get("/search", authenticateToken, async (req, res) => {
  try {
    // Check role - INSTRUCTOR, ASSISTANT_MANAGER, MANAGER, ADMIN can access
    const role = (req.user?.role || '').toUpperCase();
    const allowedRoles = ['INSTRUCTOR', 'ASSISTANT_MANAGER', 'MANAGER', 'ADMIN'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const sort = req.query.sort || "name";
    const type = req.query.type || "asc";

    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['user_id', 'username', 'name', 'surname', 'email', 'gender', 'birth_date', 'birth_place', 'phone_number', 'ssn'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'name';
    
    // Validate sort type
    const sortType = type.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const offset = page * size;

    // Get students with advisor instructor info
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.name, u.surname, u.email, u.gender, u.birth_date, u.birth_place, u.phone_number, u.ssn,
              s.student_id, s.father_name, s.mother_name, s.advisor_instructor_id,
              adv.name AS advisor_name, adv.surname AS advisor_surname
       FROM users u
       LEFT JOIN students s ON s.student_id = u.user_id
       LEFT JOIN users adv ON adv.user_id = s.advisor_instructor_id
       WHERE u.role = 'STUDENT'
       ORDER BY u.${sortColumn} ${sortType}
       LIMIT $1 OFFSET $2`,
      [size, offset]
    );

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'STUDENT'"
    );
    const totalElements = parseInt(countResult.rows[0].count);

    res.json({
      content: result.rows,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      size,
      number: page,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
});

// Get all students (no pagination)
router.get("/getAll", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.name, u.surname, u.email,
              s.student_id, s.father_name, s.mother_name, s.advisor_instructor_id
       FROM users u
       LEFT JOIN students s ON s.student_id = u.user_id
       WHERE u.role = 'STUDENT'
       ORDER BY u.name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
});

// Get all students by advisor
router.get("/getAllByAdvisor", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.name, u.surname, u.email,
              s.student_id, s.father_name, s.mother_name, s.advisor_instructor_id
       FROM users u
       LEFT JOIN students s ON s.student_id = u.user_id
       WHERE u.role = 'STUDENT' AND s.advisor_instructor_id = $1
       ORDER BY u.name`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching students by advisor:", error);
    res.status(500).json({ message: "Error fetching students by advisor", error: error.message });
  }
});

// Get student by ID
router.get("/getStudentById", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  try {
    const { id } = req.query;
    
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.name, u.surname, u.email, u.gender, u.birth_date, u.birth_place, u.phone_number, u.ssn,
              s.student_id, s.father_name, s.mother_name, s.advisor_instructor_id
       FROM users u
       LEFT JOIN students s ON s.student_id = u.user_id
       WHERE u.user_id = $1 AND u.role = 'STUDENT'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Error fetching student", error: error.message });
  }
});

// Create student
router.post("/save", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      username,
      password,
      name,
      surname,
      email,
      gender,
      birth_date,
      birth_place,
      phone_number,
      ssn,
      father_name,
      mother_name,
      advisor_instructor_id,
    } = req.body;

    // Validation
    if (!username || !name || !surname || !email || !father_name || !mother_name || !advisor_instructor_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Username, name, surname, email, father_name, mother_name, and advisor_instructor_id are required",
      });
    }

    // Validate advisor_instructor_id exists and is an INSTRUCTOR
    const advisorCheck = await client.query(
      "SELECT user_id, role FROM users WHERE user_id = $1 AND role = 'INSTRUCTOR'",
      [advisor_instructor_id]
    );
    if (advisorCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        message: "Invalid advisor_instructor_id. The selected instructor does not exist or is not an INSTRUCTOR role." 
      });
    }

    // Check if username already exists
    const existingUser = await User.findByUsername(username, client);
    if (existingUser) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check if email already exists
    const existingEmail = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password before creating user
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password || "12345", 10);

    console.log("Creating student user with data:", {
      username,
      name,
      surname,
      email,
      role: "STUDENT",
      father_name,
      mother_name,
      advisor_instructor_id,
    });

    // Create student user
    const user = await User.create({
      username,
      password: hashedPassword,
      name,
      surname,
      email,
      role: "STUDENT",
      gender: gender || null,
      birth_date: birth_date || null,
      birth_place: birth_place || null,
      phone_number: phone_number || null,
      ssn: ssn || null,
    }, client);

    console.log("Student user created successfully:", {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
    });

    // Create student record with all information
    await Student.create(
      user.user_id,
      father_name,
      mother_name,
      advisor_instructor_id,
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

    console.log("Student record created in students table");

    await client.query("COMMIT");
    console.log("Transaction committed successfully");

    // Verify the student was actually created
    const verifyStudent = await pool.query(
      "SELECT user_id, username, name, surname, email, role FROM users WHERE user_id = $1",
      [user.user_id]
    );
    
    if (verifyStudent.rows.length === 0) {
      console.error("ERROR: Student was not found after commit!");
      throw new Error("Student was not created in database");
    }
    
    console.log("Verified user exists in database:", verifyStudent.rows[0]);
    
    const verifyStudentData = await pool.query(
      "SELECT student_id, father_name, mother_name, advisor_instructor_id FROM students WHERE student_id = $1",
      [user.user_id]
    );
    
    if (verifyStudentData.rows.length === 0) {
      console.error("ERROR: Student data was not found in students table after commit!");
      throw new Error("Student data was not created in students table");
    }
    
    console.log("Verified student exists in database:", {
      user: verifyStudent.rows[0],
      student_data: verifyStudentData.rows[0],
    });

    res.status(201).json({
      message: "Student created successfully",
      user: {
        user_id: user.user_id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        father_name,
        mother_name,
        advisor_instructor_id,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }
    console.error("Error creating student:", error);
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
      message: "Error creating student", 
      error: errorMessage,
      code: error.code,
    });
  } finally {
    client.release();
  }
});

// Update student
router.put("/update", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      id,
      username,
      password,
      name,
      surname,
      email,
      gender,
      birth_date,
      birth_place,
      phone_number,
      ssn,
      father_name,
      mother_name,
      advisor_instructor_id,
    } = req.body;

    if (!id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "ID is required" });
    }

    // Check if student exists
    const student = await User.findById(id, client);
    if (!student || student.role !== "STUDENT") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== student.username) {
      const existingUser = await User.findByUsername(username, client);
      if (existingUser) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== student.email) {
      const existingEmail = await client.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      if (existingEmail.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Build update query for users table
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (surname) {
      updates.push(`surname = $${paramCount++}`);
      values.push(surname);
    }
    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramCount++}`);
      values.push(gender || null);
    }
    if (birth_date !== undefined) {
      updates.push(`birth_date = $${paramCount++}`);
      values.push(birth_date || null);
    }
    if (birth_place !== undefined) {
      updates.push(`birth_place = $${paramCount++}`);
      values.push(birth_place || null);
    }
    if (phone_number !== undefined) {
      updates.push(`phone_number = $${paramCount++}`);
      values.push(phone_number || null);
    }
    if (ssn !== undefined) {
      updates.push(`ssn = $${paramCount++}`);
      values.push(ssn || null);
    }
    if (password) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE users SET ${updates.join(", ")} WHERE user_id = $${paramCount}`;
      await client.query(query, values);
    }

    // Update students table with all student information
      const studentExists = await client.query(
        "SELECT * FROM students WHERE student_id = $1",
        [id]
      );
      
      if (studentExists.rows.length > 0) {
        const studentUpdates = [];
        const studentValues = [];
        let studentParamCount = 1;

      // Update student-specific fields
        if (father_name !== undefined) {
          studentUpdates.push(`father_name = $${studentParamCount++}`);
          studentValues.push(father_name || null);
        }
        if (mother_name !== undefined) {
          studentUpdates.push(`mother_name = $${studentParamCount++}`);
          studentValues.push(mother_name || null);
        }
        if (advisor_instructor_id !== undefined) {
          studentUpdates.push(`advisor_instructor_id = $${studentParamCount++}`);
          studentValues.push(advisor_instructor_id || null);
        }

      // Update all user information in students table
      if (username !== undefined) {
        studentUpdates.push(`username = $${studentParamCount++}`);
        studentValues.push(username || null);
      }
      if (name !== undefined) {
        studentUpdates.push(`name = $${studentParamCount++}`);
        studentValues.push(name || null);
      }
      if (surname !== undefined) {
        studentUpdates.push(`surname = $${studentParamCount++}`);
        studentValues.push(surname || null);
      }
      if (email !== undefined) {
        studentUpdates.push(`email = $${studentParamCount++}`);
        studentValues.push(email || null);
      }
      if (gender !== undefined) {
        studentUpdates.push(`gender = $${studentParamCount++}`);
        studentValues.push(gender || null);
      }
      if (birth_date !== undefined) {
        studentUpdates.push(`birth_date = $${studentParamCount++}`);
        studentValues.push(birth_date || null);
      }
      if (birth_place !== undefined) {
        studentUpdates.push(`birth_place = $${studentParamCount++}`);
        studentValues.push(birth_place || null);
      }
      if (phone_number !== undefined) {
        studentUpdates.push(`phone_number = $${studentParamCount++}`);
        studentValues.push(phone_number || null);
      }
      if (ssn !== undefined) {
        studentUpdates.push(`ssn = $${studentParamCount++}`);
        studentValues.push(ssn || null);
      }

        if (studentUpdates.length > 0) {
          studentValues.push(id);
          const studentQuery = `UPDATE students SET ${studentUpdates.join(", ")} WHERE student_id = $${studentParamCount}`;
          await client.query(studentQuery, studentValues);
        }
      } else {
      // Create student record if it doesn't exist
      const currentUser = await User.findById(id, client);
        await Student.create(
          id,
          father_name || null,
          mother_name || null,
          advisor_instructor_id || null,
        {
          username: currentUser?.username || username || null,
          name: currentUser?.name || name || null,
          surname: currentUser?.surname || surname || null,
          email: currentUser?.email || email || null,
          gender: currentUser?.gender || gender || null,
          birth_date: currentUser?.birth_date || birth_date || null,
          birth_place: currentUser?.birth_place || birth_place || null,
          phone_number: currentUser?.phone_number || phone_number || null,
          ssn: currentUser?.ssn || ssn || null,
          is_active: currentUser?.is_active !== undefined ? currentUser.is_active : true,
        },
          client
        );
    }

    await client.query("COMMIT");

    const updatedStudent = await User.findById(id, client);
    const studentData = await Student.findById(id, client);

    res.json({
      message: "Student updated successfully",
      user: {
        ...updatedStudent,
        father_name: studentData?.father_name,
        mother_name: studentData?.mother_name,
        advisor_instructor_id: studentData?.advisor_instructor_id,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Error updating student", error: error.message });
  } finally {
    client.release();
  }
});

// Delete student
router.delete("/delete/:id", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;

    // Check if student exists
    const student = await User.findById(id, client);
    if (!student || student.role !== "STUDENT") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete from students table first (to avoid foreign key issues)
    await client.query("DELETE FROM students WHERE student_id = $1", [id]);
    
    // Delete from users table
    await client.query("DELETE FROM users WHERE user_id = $1", [id]);

    await client.query("COMMIT");
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Error deleting student", error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;

