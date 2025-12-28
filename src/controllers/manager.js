const express = require("express");
const User = require("../repositories/User");
const authenticateToken = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");
const pool = require("../../db/connection");

const router = express.Router();

// Get all managers with pagination
router.get("/search", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toUpperCase();
    const userId = req.user?.id;
    
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const sort = req.query.sort || "name";
    const type = req.query.type || "asc";

    const offset = page * size;

    // If user is MANAGER (not ADMIN), only show their own data
    let query, countQuery, queryParams;
    if (userRole === "MANAGER") {
      // Manager can only see their own data
      query = `SELECT user_id, username, name, surname, email, gender, birth_date, birth_place, phone_number, ssn
               FROM users 
               WHERE role = 'MANAGER' AND user_id = $1
               ORDER BY ${sort} ${type.toUpperCase()}
               LIMIT $2 OFFSET $3`;
      countQuery = "SELECT COUNT(*) FROM users WHERE role = 'MANAGER' AND user_id = $1";
      queryParams = [userId, size, offset];
    } else {
      // ADMIN can see all managers
      query = `SELECT user_id, username, name, surname, email, gender, birth_date, birth_place, phone_number, ssn
               FROM users 
               WHERE role = 'MANAGER'
               ORDER BY ${sort} ${type.toUpperCase()}
               LIMIT $1 OFFSET $2`;
      countQuery = "SELECT COUNT(*) FROM users WHERE role = 'MANAGER'";
      queryParams = [size, offset];
    }

    // Get managers
    const result = await pool.query(query, queryParams);

    // Get total count
    const countParams = userRole === "MANAGER" ? [userId] : [];
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
    console.error("Error fetching managers:", error);
    res.status(500).json({ message: "Error fetching managers", error: error.message });
  }
});

// Get manager by ID
router.get("/getManagerById/:id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toUpperCase();
    const userId = req.user?.id;
    const { id } = req.params;
    const manager = await User.findById(id);

    if (!manager || manager.role !== "MANAGER") {
      return res.status(404).json({ message: "Manager not found" });
    }

    // If user is MANAGER (not ADMIN), they can only access their own data
    if (userRole === "MANAGER" && parseInt(id) !== userId) {
      return res.status(403).json({ message: "Forbidden: You can only access your own data" });
    }

    res.json(manager);
  } catch (error) {
    console.error("Error fetching manager:", error);
    res.status(500).json({ message: "Error fetching manager", error: error.message });
  }
});

// Create manager
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

    // Create manager user
    const user = await User.create({
      username,
      password: password || "12345", // Default password if not provided
      name,
      surname,
      email,
      role: "MANAGER",
      gender: gender || null,
      birth_date: birth_date || null,
      birth_place: birth_place || null,
      phone_number: phone_number || null,
      ssn: ssn || null,
    }, client);

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

    await client.query("COMMIT");

    res.status(201).json({
      message: "Manager created successfully",
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
    console.error("Error creating manager:", error);
    res.status(500).json({ message: "Error creating manager", error: error.message });
  } finally {
    client.release();
  }
});

// Update manager
router.put("/update", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
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

    // If user is MANAGER (not ADMIN), they can only update their own data
    if (userRole === "MANAGER" && parseInt(id) !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden: You can only update your own data" });
    }

    // Check if manager exists
    const manager = await User.findById(id, client);
    if (!manager || manager.role !== "MANAGER") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Manager not found" });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== manager.username) {
      const existingUser = await User.findByUsername(username, client);
      if (existingUser) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== manager.email) {
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

    // Update managers table
    try {
      const managerUpdates = [];
      const managerValues = [];
      let managerParamCount = 1;

      if (username) {
        managerUpdates.push(`username = $${managerParamCount++}`);
        managerValues.push(username);
      }
      if (name) {
        managerUpdates.push(`name = $${managerParamCount++}`);
        managerValues.push(name);
      }
      if (surname) {
        managerUpdates.push(`surname = $${managerParamCount++}`);
        managerValues.push(surname);
      }
      if (email) {
        managerUpdates.push(`email = $${managerParamCount++}`);
        managerValues.push(email);
      }
      if (gender !== undefined) {
        managerUpdates.push(`gender = $${managerParamCount++}`);
        managerValues.push(gender || null);
      }
      if (birth_date !== undefined) {
        managerUpdates.push(`birth_date = $${managerParamCount++}`);
        managerValues.push(birth_date || null);
      }
      if (birth_place !== undefined) {
        managerUpdates.push(`birth_place = $${managerParamCount++}`);
        managerValues.push(birth_place || null);
      }
      if (phone_number !== undefined) {
        managerUpdates.push(`phone_number = $${managerParamCount++}`);
        managerValues.push(phone_number || null);
      }
      if (ssn !== undefined) {
        managerUpdates.push(`ssn = $${managerParamCount++}`);
        managerValues.push(ssn || null);
      }

      if (managerUpdates.length > 0) {
        managerValues.push(id);
        await client.query(
          `UPDATE managers SET ${managerUpdates.join(", ")} WHERE manager_id = $${managerParamCount}`,
          managerValues
        );
      }
    } catch (managerUpdateError) {
      // If managers table doesn't exist, that's okay - we'll just update users table
      console.warn("Could not update managers table:", managerUpdateError.message);
    }

    await client.query("COMMIT");

    res.json({
      message: "Manager updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating manager:", error);
    res.status(500).json({ message: "Error updating manager", error: error.message });
  } finally {
    client.release();
  }
});

// Delete manager
router.delete("/delete/:id", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userRole = (req.user?.role || '').toUpperCase();
    const { id } = req.params;

    // Only ADMIN can delete managers, MANAGER cannot delete anyone (including themselves)
    if (userRole === "MANAGER") {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden: Only ADMIN can delete managers" });
    }

    // Check if manager exists
    const manager = await User.findById(id, client);
    if (!manager || manager.role !== "MANAGER") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Manager not found" });
    }

    // Delete from managers table first (to avoid foreign key constraint issues)
    try {
      await client.query("DELETE FROM managers WHERE manager_id = $1", [id]);
    } catch (managerDeleteError) {
      // If managers table doesn't exist or record doesn't exist, that's okay
      console.warn("Could not delete from managers table:", managerDeleteError.message);
    }

    // Delete from users table
    await client.query("DELETE FROM users WHERE user_id = $1", [id]);

    await client.query("COMMIT");

    res.json({ message: "Manager deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting manager:", error);
    res.status(500).json({ message: "Error deleting manager", error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;

