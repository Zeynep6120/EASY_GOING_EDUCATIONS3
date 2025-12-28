const express = require("express");
const User = require("../models/User");
const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");
const pool = require("../db/connection");

const router = express.Router();

// Get all assistant managers with pagination
router.get("/search", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toUpperCase();
    const userId = req.user?.id;
    
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const sort = req.query.sort || "name";
    const type = req.query.type || "asc";

    const offset = page * size;

    // If user is ASSISTANT_MANAGER (not ADMIN or MANAGER), only show their own data
    let query, countQuery, queryParams;
    if (userRole === "ASSISTANT_MANAGER") {
      // Assistant Manager can only see their own data
      query = `SELECT user_id, username, name, surname, email, gender, birth_date, birth_place, phone_number, ssn
               FROM users 
               WHERE role = 'ASSISTANT_MANAGER' AND user_id = $1
               ORDER BY ${sort} ${type.toUpperCase()}
               LIMIT $2 OFFSET $3`;
      countQuery = "SELECT COUNT(*) FROM users WHERE role = 'ASSISTANT_MANAGER' AND user_id = $1";
      queryParams = [userId, size, offset];
    } else {
      // ADMIN and MANAGER can see all assistant managers
      query = `SELECT user_id, username, name, surname, email, gender, birth_date, birth_place, phone_number, ssn
               FROM users 
               WHERE role = 'ASSISTANT_MANAGER'
               ORDER BY ${sort} ${type.toUpperCase()}
               LIMIT $1 OFFSET $2`;
      countQuery = "SELECT COUNT(*) FROM users WHERE role = 'ASSISTANT_MANAGER'";
      queryParams = [size, offset];
    }

    // Get assistant managers
    const result = await pool.query(query, queryParams);

    // Get total count
    const countParams = userRole === "ASSISTANT_MANAGER" ? [userId] : [];
    const countResult = await pool.query(countQuery, countParams);
    const totalElements = parseInt(countResult.rows[0].count);

    res.json({
      content: result.rows,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      size,
      number: page,
    });
  } catch (error) {
    console.error("Error fetching assistant managers:", error);
    res.status(500).json({ message: "Error fetching assistant managers", error: error.message });
  }
});

// Get assistant manager by ID
router.get("/getViceDeanById/:id", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toUpperCase();
    const userId = req.user?.id;
    const { id } = req.params;
    const assistantManager = await User.findById(id);

    if (!assistantManager || assistantManager.role !== "ASSISTANT_MANAGER") {
      return res.status(404).json({ message: "Assistant manager not found" });
    }

    // If user is ASSISTANT_MANAGER (not ADMIN or MANAGER), they can only access their own data
    if (userRole === "ASSISTANT_MANAGER" && parseInt(id) !== userId) {
      return res.status(403).json({ message: "Forbidden: You can only access your own data" });
    }

    res.json(assistantManager);
  } catch (error) {
    console.error("Error fetching assistant manager:", error);
    res.status(500).json({ message: "Error fetching assistant manager", error: error.message });
  }
});

// Create assistant manager
router.post("/save", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
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

    // Create assistant manager user
    const user = await User.create({
      username,
      password: password || "12345", // Default password if not provided
      name,
      surname,
      email,
      role: "ASSISTANT_MANAGER",
      gender: gender || null,
      birth_date: birth_date || null,
      birth_place: birth_place || null,
      phone_number: phone_number || null,
      ssn: ssn || null,
    }, client);

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

    await client.query("COMMIT");

    res.status(201).json({
      message: "Assistant manager created successfully",
      user: {
        user_id: user.user_id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating assistant manager:", error);
    res.status(500).json({ message: "Error creating assistant manager", error: error.message });
  } finally {
    client.release();
  }
});

// Update assistant manager
router.put("/update", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userRole = (req.user?.role || '').toUpperCase();
    const userId = req.user?.id;

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
    } = req.body;

    if (!id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "ID is required" });
    }

    // If user is ASSISTANT_MANAGER (not ADMIN or MANAGER), they can only update their own data
    if (userRole === "ASSISTANT_MANAGER" && parseInt(id) !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden: You can only update your own data" });
    }

    // Check if assistant manager exists
    const assistantManager = await User.findById(id, client);
    if (!assistantManager || assistantManager.role !== "ASSISTANT_MANAGER") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Assistant manager not found" });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== assistantManager.username) {
      const existingUser = await User.findByUsername(username, client);
      if (existingUser) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== assistantManager.email) {
      const existingEmail = await client.query(
        "SELECT * FROM users WHERE email = $1 AND user_id != $2",
        [email, id]
      );
      if (existingEmail.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Build update query
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

    if (updates.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE user_id = $${paramCount} RETURNING *`;
    const result = await client.query(query, values);
    const updatedUser = result.rows[0];

    // Update assistant_managers table
    try {
      const assistantManagerUpdates = [];
      const assistantManagerValues = [];
      let assistantManagerParamCount = 1;

      if (username) {
        assistantManagerUpdates.push(`username = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(username);
      }
      if (name) {
        assistantManagerUpdates.push(`name = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(name);
      }
      if (surname) {
        assistantManagerUpdates.push(`surname = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(surname);
      }
      if (email) {
        assistantManagerUpdates.push(`email = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(email);
      }
      if (gender !== undefined) {
        assistantManagerUpdates.push(`gender = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(gender || null);
      }
      if (birth_date !== undefined) {
        assistantManagerUpdates.push(`birth_date = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(birth_date || null);
      }
      if (birth_place !== undefined) {
        assistantManagerUpdates.push(`birth_place = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(birth_place || null);
      }
      if (phone_number !== undefined) {
        assistantManagerUpdates.push(`phone_number = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(phone_number || null);
      }
      if (ssn !== undefined) {
        assistantManagerUpdates.push(`ssn = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(ssn || null);
      }

      if (assistantManagerUpdates.length > 0) {
        assistantManagerValues.push(id);
        await client.query(
          `UPDATE assistant_managers SET ${assistantManagerUpdates.join(", ")} WHERE assistant_manager_id = $${assistantManagerParamCount}`,
          assistantManagerValues
        );
      }
    } catch (assistantManagerUpdateError) {
      // If assistant_managers table doesn't exist, that's okay - we'll just update users table
      console.warn("Could not update assistant_managers table:", assistantManagerUpdateError.message);
    }

    await client.query("COMMIT");

    res.json({
      message: "Assistant manager updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating assistant manager:", error);
    res.status(500).json({ message: "Error updating assistant manager", error: error.message });
  } finally {
    client.release();
  }
});

// Delete assistant manager
router.delete("/delete/:id", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userRole = (req.user?.role || '').toUpperCase();
    const { id } = req.params;

    // Only ADMIN and MANAGER can delete assistant managers, ASSISTANT_MANAGER cannot delete anyone (including themselves)
    if (userRole === "ASSISTANT_MANAGER") {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden: Only ADMIN and MANAGER can delete assistant managers" });
    }

    // Check if assistant manager exists
    const assistantManager = await User.findById(id, client);
    if (!assistantManager || assistantManager.role !== "ASSISTANT_MANAGER") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Assistant manager not found" });
    }

    // Delete from assistant_managers table first (to avoid foreign key constraint issues)
    try {
      await client.query("DELETE FROM assistant_managers WHERE assistant_manager_id = $1", [id]);
    } catch (assistantManagerDeleteError) {
      // If assistant_managers table doesn't exist or record doesn't exist, that's okay
      console.warn("Could not delete from assistant_managers table:", assistantManagerDeleteError.message);
    }

    // Delete from users table
    await client.query("DELETE FROM users WHERE user_id = $1", [id]);

    await client.query("COMMIT");

    res.json({ message: "Assistant manager deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting assistant manager:", error);
    res.status(500).json({ message: "Error deleting assistant manager", error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;

