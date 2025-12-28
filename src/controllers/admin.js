const express = require("express");
const User = require("../repositories/User");
const authenticateToken = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const pool = require("../../db/connection");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Get all admins with pagination
router.get("/getAll", authenticateToken, requireRoles("ADMIN"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const sort = req.query.sort || "name";
    const type = req.query.type || "asc";

    const offset = page * size;

    // Get admins
    const result = await pool.query(
      `SELECT user_id, username, name, surname, email, gender, birth_date, birth_place, phone_number, ssn
       FROM users 
       WHERE role = 'ADMIN'
       ORDER BY ${sort} ${type.toUpperCase()}
       LIMIT $1 OFFSET $2`,
      [size, offset]
    );

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'ADMIN'"
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
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Error fetching admins", error: error.message });
  }
});

// Create admin
router.post("/save", authenticateToken, requireRoles("ADMIN"), async (req, res) => {
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

    // Hash password before creating user
    const hashedPassword = await bcrypt.hash(password || "12345", 10);

    // Create admin user
    const user = await User.create({
      username,
      password: hashedPassword,
      name,
      surname,
      email,
      role: "ADMIN",
      gender: gender || null,
      birth_date: birth_date || null,
      birth_place: birth_place || null,
      phone_number: phone_number || null,
      ssn: ssn || null,
    }, client);

    // Insert into admins specialization table
    // Check if admins table exists, if not create it
    try {
      await client.query(
        `INSERT INTO admins (
          admin_id, username, name, surname, email, gender, 
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
    } catch (insertError) {
      // If admins table doesn't exist, create it and try again
      if (insertError.code === '42P01' || insertError.message.includes('does not exist')) {
        console.log("Admins table not found, creating it...");
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
              admin_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
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
          // Try insert again
          await client.query(
            `INSERT INTO admins (
              admin_id, username, name, surname, email, gender, 
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
        } catch (createError) {
          console.error("Error creating admins table or inserting:", createError);
          throw createError;
        }
      } else {
        // Log the error for debugging
        console.error("Error inserting into admins table:", insertError);
        throw insertError;
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Admin created successfully",
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
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Error creating admin", error: error.message });
  } finally {
    client.release();
  }
});

// Get admin by ID
router.get("/getAdminById/:id", authenticateToken, requireRoles("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findById(id);

    if (!admin || admin.role !== "ADMIN") {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json(admin);
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({ message: "Error fetching admin", error: error.message });
  }
});

// Update admin
router.put("/update", authenticateToken, requireRoles("ADMIN"), async (req, res) => {
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
    } = req.body;

    if (!id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "ID is required" });
    }

    // Check if admin exists
    const admin = await User.findById(id, client);
    if (!admin || admin.role !== "ADMIN") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== admin.username) {
      const existingUser = await User.findByUsername(username, client);
      if (existingUser) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== admin.email) {
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

    // Update admins table
    try {
      const adminUpdates = [];
      const adminValues = [];
      let adminParamCount = 1;

      if (username) {
        adminUpdates.push(`username = $${adminParamCount++}`);
        adminValues.push(username);
      }
      if (name) {
        adminUpdates.push(`name = $${adminParamCount++}`);
        adminValues.push(name);
      }
      if (surname) {
        adminUpdates.push(`surname = $${adminParamCount++}`);
        adminValues.push(surname);
      }
      if (email) {
        adminUpdates.push(`email = $${adminParamCount++}`);
        adminValues.push(email);
      }
      if (gender !== undefined) {
        adminUpdates.push(`gender = $${adminParamCount++}`);
        adminValues.push(gender || null);
      }
      if (birth_date !== undefined) {
        adminUpdates.push(`birth_date = $${adminParamCount++}`);
        adminValues.push(birth_date || null);
      }
      if (birth_place !== undefined) {
        adminUpdates.push(`birth_place = $${adminParamCount++}`);
        adminValues.push(birth_place || null);
      }
      if (phone_number !== undefined) {
        adminUpdates.push(`phone_number = $${adminParamCount++}`);
        adminValues.push(phone_number || null);
      }
      if (ssn !== undefined) {
        adminUpdates.push(`ssn = $${adminParamCount++}`);
        adminValues.push(ssn || null);
      }

      if (adminUpdates.length > 0) {
        adminValues.push(id);
        await client.query(
          `UPDATE admins SET ${adminUpdates.join(", ")} WHERE admin_id = $${adminParamCount}`,
          adminValues
        );
      }
    } catch (adminUpdateError) {
      // If admins table doesn't exist, that's okay - we'll just update users table
      console.warn("Could not update admins table:", adminUpdateError.message);
    }

    await client.query("COMMIT");

    res.json({
      message: "Admin updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating admin:", error);
    res.status(500).json({ message: "Error updating admin", error: error.message });
  } finally {
    client.release();
  }
});

// Delete admin
router.delete("/delete/:id", authenticateToken, requireRoles("ADMIN"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;

    // Check if admin exists
    const admin = await User.findById(id, client);
    if (!admin || admin.role !== "ADMIN") {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Admin not found" });
    }

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    // Delete from admins table first (to avoid foreign key constraint issues)
    try {
      await client.query("DELETE FROM admins WHERE admin_id = $1", [id]);
    } catch (adminDeleteError) {
      // If admins table doesn't exist or record doesn't exist, that's okay
      console.warn("Could not delete from admins table:", adminDeleteError.message);
    }

    // Delete from users table
    await client.query("DELETE FROM users WHERE user_id = $1", [id]);

    await client.query("COMMIT");

    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting admin:", error);
    res.status(500).json({ message: "Error deleting admin", error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;

