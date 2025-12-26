const express = require("express");
const User = require("../models/User");
const InstructorUser = require("../models/InstructorUser");
const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");
const pool = require("../db/connection");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Get all instructors with pagination
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

    // Get instructors (after migration, teachers table is removed, all data is in users table)
    // Check if user is advisor by checking students.advisor_instructor_id
    const result = await pool.query(
      `SELECT 
        u.user_id, u.username, u.name, u.surname, u.email, u.gender, u.birth_date, u.birth_place, u.phone_number, u.ssn,
        CASE WHEN EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = u.user_id) THEN true ELSE false END as is_advisor_instructor
       FROM users u
       WHERE u.role = 'INSTRUCTOR'
       ORDER BY u.${sortColumn} ${sortType}
       LIMIT $1 OFFSET $2`,
      [size, offset]
    );

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'INSTRUCTOR'"
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
    console.error("Error fetching instructors:", error);
    res.status(500).json({ message: "Error fetching instructors", error: error.message });
  }
});

// Get all instructors (no pagination)
router.get("/getAll", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.user_id, u.username, u.name, u.surname, u.email,
        CASE WHEN EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = u.user_id) THEN true ELSE false END as is_advisor_instructor
       FROM users u
       WHERE u.role = 'INSTRUCTOR'
       ORDER BY u.name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({ message: "Error fetching instructors", error: error.message });
  }
});

// Get instructor by ID
router.get("/getSavedInstructorById/:id", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        u.user_id, u.username, u.name, u.surname, u.email, u.gender, u.birth_date, u.birth_place, u.phone_number, u.ssn,
        CASE WHEN EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = u.user_id) THEN true ELSE false END as is_advisor_instructor
       FROM users u
       WHERE u.user_id = $1 AND u.role = 'INSTRUCTOR'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching instructor:", error);
    res.status(500).json({ message: "Error fetching instructor", error: error.message });
  }
});

// Create instructor
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
      is_advisor_instructor,
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

    // Hash password before creating user
    const hashedPassword = await bcrypt.hash(password || "12345", 10);

    console.log("Creating instructor user with data:", {
      username,
      name,
      surname,
      email,
      role: "INSTRUCTOR",
    });

    // Create instructor user
    const user = await User.create({
      username,
      password: hashedPassword,
      name,
      surname,
      email,
      role: "INSTRUCTOR",
      gender: gender || null,
      birth_date: birth_date || null,
      birth_place: birth_place || null,
      phone_number: phone_number || null,
      ssn: ssn || null,
    }, client);

    console.log("Instructor user created successfully:", {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
    });

    // Note: After migration, there's no separate instructors table for users
    // All instructor data is in users table with role = 'INSTRUCTOR'
    // Advisor status is tracked via students.advisor_instructor_id

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

    res.status(201).json({
      message: "Instructor created successfully",
      user: {
        user_id: user.user_id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        is_advisor_instructor: is_advisor_instructor || false,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(err => {
      console.error("Error during rollback:", err);
    });
    console.error("Error creating instructor:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Error creating instructor", error: error.message });
  } finally {
    client.release();
  }
});

// Update instructor
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
      is_advisor_instructor,
    } = req.body;

    if (!id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "ID is required" });
    }

    // Check if instructor exists
    const instructor = await User.findById(id, client);
    if (!instructor || instructor.role !== "INSTRUCTOR") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Instructor not found" });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== instructor.username) {
      const existingUser = await User.findByUsername(username, client);
      if (existingUser) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== instructor.email) {
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

    // Note: After migration, advisor status is tracked via students.advisor_instructor_id
    // We don't need to update a separate instructors table

    await client.query("COMMIT");

    const updatedInstructor = await User.findById(id, client);
    
    // Check if user is advisor
    const advisorCheck = await client.query(
      "SELECT EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = $1) as is_advisor",
      [id]
    );
    const isAdvisor = advisorCheck.rows[0].is_advisor;

    res.json({
      message: "Instructor updated successfully",
      user: {
        ...updatedInstructor,
        is_advisor_instructor: isAdvisor,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating instructor:", error);
    res.status(500).json({ message: "Error updating instructor", error: error.message });
  } finally {
    client.release();
  }
});

// Delete instructor
router.delete("/delete/:id", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;

    // Check if instructor exists
    const instructor = await User.findById(id, client);
    if (!instructor || instructor.role !== "INSTRUCTOR") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Instructor not found" });
    }

    // Check if instructor is assigned as advisor to any students
    const advisorCheck = await client.query(
      "SELECT COUNT(*) as count FROM students WHERE advisor_instructor_id = $1",
      [id]
    );
    if (parseInt(advisorCheck.rows[0].count) > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        message: "Cannot delete instructor. This instructor is assigned as advisor to one or more students. Please reassign students first." 
      });
    }

    // Delete from instructor_programs table (if any assignments exist)
    try {
      await client.query("DELETE FROM instructor_programs WHERE instructor_id = $1", [id]);
    } catch (instructorProgramsDeleteError) {
      // If instructor_programs table doesn't exist, that's okay
      console.warn("Could not delete from instructor_programs table:", instructorProgramsDeleteError.message);
    }

    // Delete from users table
    await client.query("DELETE FROM users WHERE user_id = $1", [id]);

    await client.query("COMMIT");

    res.json({ message: "Instructor deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting instructor:", error);
    res.status(500).json({ message: "Error deleting instructor", error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;

