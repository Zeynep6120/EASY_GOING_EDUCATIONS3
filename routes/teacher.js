const express = require("express");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");
const pool = require("../db/connection");

const router = express.Router();

// Get all teachers with pagination
router.get("/search", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  try {
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

    // Get teachers with advisor status
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.name, u.surname, u.email, u.gender, u.birth_date, u.birth_place, u.phone_number, u.ssn,
              t.teacher_id, t.is_advisor_teacher
       FROM users u
       LEFT JOIN teachers t ON t.teacher_id = u.user_id
       WHERE u.role = 'TEACHER'
       ORDER BY u.${sortColumn} ${sortType}
       LIMIT $1 OFFSET $2`,
      [size, offset]
    );

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'TEACHER'"
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
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Error fetching teachers", error: error.message });
  }
});

// Get all teachers (no pagination)
router.get("/getAll", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.name, u.surname, u.email,
              t.teacher_id, t.is_advisor_teacher
       FROM users u
       LEFT JOIN teachers t ON t.teacher_id = u.user_id
       WHERE u.role = 'TEACHER'
       ORDER BY u.name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Error fetching teachers", error: error.message });
  }
});

// Get teacher by ID
router.get("/getSavedTeacherById/:id", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.name, u.surname, u.email, u.gender, u.birth_date, u.birth_place, u.phone_number, u.ssn,
              t.teacher_id, t.is_advisor_teacher
       FROM users u
       LEFT JOIN teachers t ON t.teacher_id = u.user_id
       WHERE u.user_id = $1 AND u.role = 'TEACHER'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching teacher:", error);
    res.status(500).json({ message: "Error fetching teacher", error: error.message });
  }
});

// Create teacher
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
      is_advisor_teacher,
    } = req.body;

    // Validation
    if (!username || !name || !surname || !email) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Username, name, surname, and email are required",
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

    // Create teacher user
    const user = await User.create({
      username,
      password: password || "12345",
      name,
      surname,
      email,
      role: "TEACHER",
      gender: gender || null,
      birth_date: birth_date || null,
      birth_place: birth_place || null,
      phone_number: phone_number || null,
      ssn: ssn || null,
    }, client);

    // Create teacher record with all information
    await Teacher.create(
      user.user_id,
      is_advisor_teacher || false,
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

    await client.query("COMMIT");

    res.status(201).json({
      message: "Teacher created successfully",
      user: {
        user_id: user.user_id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        is_advisor_teacher: is_advisor_teacher || false,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating teacher:", error);
    res.status(500).json({ message: "Error creating teacher", error: error.message });
  } finally {
    client.release();
  }
});

// Update teacher
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
      is_advisor_teacher,
    } = req.body;

    if (!id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "ID is required" });
    }

    // Check if teacher exists
    const teacher = await User.findById(id, client);
    if (!teacher || teacher.role !== "TEACHER") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== teacher.username) {
      const existingUser = await User.findByUsername(username, client);
      if (existingUser) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== teacher.email) {
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

    // Update teachers table with all teacher information
    const teacherExists = await client.query(
      "SELECT * FROM teachers WHERE teacher_id = $1",
      [id]
    );
    
    if (teacherExists.rows.length > 0) {
      const teacherUpdates = [];
      const teacherValues = [];
      let teacherParamCount = 1;

      // Update teacher-specific fields
      if (is_advisor_teacher !== undefined) {
        teacherUpdates.push(`is_advisor_teacher = $${teacherParamCount++}`);
        teacherValues.push(is_advisor_teacher);
      }

      // Update all user information in teachers table
      if (username !== undefined) {
        teacherUpdates.push(`username = $${teacherParamCount++}`);
        teacherValues.push(username || null);
      }
      if (name !== undefined) {
        teacherUpdates.push(`name = $${teacherParamCount++}`);
        teacherValues.push(name || null);
      }
      if (surname !== undefined) {
        teacherUpdates.push(`surname = $${teacherParamCount++}`);
        teacherValues.push(surname || null);
      }
      if (email !== undefined) {
        teacherUpdates.push(`email = $${teacherParamCount++}`);
        teacherValues.push(email || null);
      }
      if (gender !== undefined) {
        teacherUpdates.push(`gender = $${teacherParamCount++}`);
        teacherValues.push(gender || null);
      }
      if (birth_date !== undefined) {
        teacherUpdates.push(`birth_date = $${teacherParamCount++}`);
        teacherValues.push(birth_date || null);
      }
      if (birth_place !== undefined) {
        teacherUpdates.push(`birth_place = $${teacherParamCount++}`);
        teacherValues.push(birth_place || null);
      }
      if (phone_number !== undefined) {
        teacherUpdates.push(`phone_number = $${teacherParamCount++}`);
        teacherValues.push(phone_number || null);
      }
      if (ssn !== undefined) {
        teacherUpdates.push(`ssn = $${teacherParamCount++}`);
        teacherValues.push(ssn || null);
      }

      if (teacherUpdates.length > 0) {
        teacherValues.push(id);
        const teacherQuery = `UPDATE teachers SET ${teacherUpdates.join(", ")} WHERE teacher_id = $${teacherParamCount}`;
        await client.query(teacherQuery, teacherValues);
      }
    } else {
      // Create teacher record if it doesn't exist
      const currentUser = await User.findById(id, client);
      await Teacher.create(
        id,
        is_advisor_teacher !== undefined ? is_advisor_teacher : false,
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

    const updatedTeacher = await User.findById(id, client);
    const teacherData = await Teacher.findById(id, client);

    res.json({
      message: "Teacher updated successfully",
      user: {
        ...updatedTeacher,
        is_advisor_teacher: teacherData?.is_advisor_teacher || false,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating teacher:", error);
    res.status(500).json({ message: "Error updating teacher", error: error.message });
  } finally {
    client.release();
  }
});

// Delete teacher
router.delete("/delete/:id", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if teacher exists
    const teacher = await User.findById(id);
    if (!teacher || teacher.role !== "TEACHER") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Delete teacher (cascade will handle teachers table)
    await pool.query("DELETE FROM users WHERE user_id = $1", [id]);

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({ message: "Error deleting teacher", error: error.message });
  }
});

module.exports = router;

