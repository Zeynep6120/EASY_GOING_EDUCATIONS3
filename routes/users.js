const express = require("express");
const router = express.Router();

const pool = require("../db");
const authenticateToken = require("../middleware/auth");
const { normalizeRole } = require("../middleware/rbac");

/**
 * RBAC user visibility rules (hierarchy-style):
 * ADMIN: sees all
 * MANAGER: sees everyone except ADMIN
 * ASSISTANT_MANAGER: sees INSTRUCTOR + STUDENT + self (but not ADMIN/MANAGER)
 * INSTRUCTOR: sees self + STUDENT
 * STUDENT: sees self only
 */
function buildUserListFilter(reqUser) {
  const role = normalizeRole(reqUser.role);
  const selfId = Number(reqUser.id);

  let where = "TRUE";
  const params = [];

  if (role === "ADMIN") {
    where = "TRUE";
  } else if (role === "MANAGER") {
    where = "u.role <> 'ADMIN'";
  } else if (role === "ASSISTANT_MANAGER") {
    // instructor + student + self (self may be assistant_manager)
    params.push(selfId);
    where = "(u.role IN ('INSTRUCTOR','STUDENT') OR u.user_id = $1) AND u.role NOT IN ('ADMIN','MANAGER')";
  } else if (role === "INSTRUCTOR") {
    params.push(selfId);
    where = "(u.user_id = $1 OR u.role = 'STUDENT')";
  } else if (role === "STUDENT") {
    params.push(selfId);
    where = "u.user_id = $1";
  } else {
    params.push(selfId);
    where = "u.user_id = $1";
  }

  return { where, params, role, selfId };
}

// GET /api/users
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const { where, params } = buildUserListFilter(req.user);

    const query = `
      SELECT
        u.user_id,
        u.username,
        u.name,
        u.surname,
        u.email,
        u.role,
        u.is_active,
        CASE WHEN EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = u.user_id) THEN true ELSE false END as is_advisor_instructor,
        st.father_name,
        st.mother_name,
        st.advisor_instructor_id,
        adv.username AS advisor_name,
        adv.surname  AS advisor_surname
      FROM users u
      LEFT JOIN students st ON st.student_id = u.user_id
      LEFT JOIN users adv ON adv.user_id = st.advisor_instructor_id
      WHERE ${where}
      ORDER BY u.user_id DESC;
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/:id
router.get("/users/:id", authenticateToken, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const role = normalizeRole(req.user.role);
    const selfId = Number(req.user.id);

    const targetRoleRes = await pool.query("SELECT role FROM users WHERE user_id = $1", [targetId]);
    if (targetRoleRes.rowCount === 0) return res.status(404).json({ message: "Not found" });
    const targetRole = normalizeRole(targetRoleRes.rows[0].role);

    // Permission checks
    if (role === "STUDENT" && targetId !== selfId) return res.status(403).json({ message: "Forbidden" });

    if (role === "INSTRUCTOR") {
      if (!(targetId === selfId || targetRole === "STUDENT")) return res.status(403).json({ message: "Forbidden" });
    }

    if (role === "ASSISTANT_MANAGER") {
      if (targetRole === "ADMIN" || targetRole === "MANAGER") return res.status(403).json({ message: "Forbidden" });
    }

    if (role === "MANAGER" && targetRole === "ADMIN") return res.status(403).json({ message: "Forbidden" });

    const query = `
      SELECT
        u.user_id,
        u.username,
        u.name,
        u.surname,
        u.email,
        u.role,
        u.is_active,
        u.gender,
        u.birth_date,
        u.birth_place,
        u.phone_number,
        u.ssn,
        CASE WHEN EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = u.user_id) THEN true ELSE false END as is_advisor_instructor,
        st.father_name,
        st.mother_name,
        st.advisor_instructor_id
      FROM users u
      LEFT JOIN students st ON st.student_id = u.user_id
      WHERE u.user_id = $1;
    `;
    const result = await pool.query(query, [targetId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET /users/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/users/:id/status  { is_active: boolean }
router.patch("/users/:id/status", authenticateToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const targetId = Number(req.params.id);
    const { is_active } = req.body || {};

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ message: "is_active must be boolean" });
    }

    // Only ADMIN and MANAGER can change status
    if (role !== "ADMIN" && role !== "MANAGER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Manager cannot change ADMIN status
    const targetRoleRes = await pool.query("SELECT role FROM users WHERE user_id = $1", [targetId]);
    if (targetRoleRes.rowCount === 0) return res.status(404).json({ message: "Not found" });
    const targetRole = normalizeRole(targetRoleRes.rows[0].role);
    if (role === "MANAGER" && targetRole === "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await pool.query(
      "UPDATE users SET is_active = $2 WHERE user_id = $1 RETURNING user_id, username, role, is_active",
      [targetId, is_active]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("PATCH /users/:id/status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users - Create user (ADMIN only)
router.post("/users", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const role = normalizeRole(req.user.role);
    if (role !== "ADMIN") {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden - Only ADMIN can create users" });
    }

    const User = require("../models/User");
    const bcrypt = require("bcryptjs");
    const {
      username,
      password,
      name,
      surname,
      email,
      role: newRole,
      gender,
      birth_date,
      birth_place,
      phone_number,
      ssn,
    } = req.body;

    if (!username || !name || !surname || !email || !newRole) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "username, name, surname, email, and role are required" });
    }

    // Validate role
    const validRoles = ["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "INSTRUCTOR", "STUDENT"];
    if (!validRoles.includes(normalizeRole(newRole))) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if username exists
    const existingUser = await User.findByUsername(username, client);
    if (existingUser) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check if email exists
    const existingEmail = await client.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || "12345", 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      name,
      surname,
      email,
      role: normalizeRole(newRole),
      gender: gender || null,
      birth_date: birth_date || null,
      birth_place: birth_place || null,
      phone_number: phone_number || null,
      ssn: ssn || null,
    }, client);

    // Insert into role-specific specialization tables
    const normalizedRole = normalizeRole(newRole);
    if (normalizedRole === "MANAGER") {
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
    } else if (normalizedRole === "ASSISTANT_MANAGER") {
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
    } else if (normalizedRole === "INSTRUCTOR") {
      // Instructors don't have a separate table, data is only in users table
      // Advisor status is tracked via students.advisor_instructor_id
    } else if (normalizedRole === "STUDENT") {
      // Students need father_name, mother_name, advisor_instructor_id
      // But these are not provided in this endpoint, so we'll skip specialization table
      // Student.create should be called separately with those fields
    } else if (normalizedRole === "ADMIN") {
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
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "User created successfully",
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
    console.error("POST /users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
});

// PUT /api/users/:id - Update user (ADMIN only)
router.put("/users/:id", authenticateToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    if (role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden - Only ADMIN can update users" });
    }

    const targetId = Number(req.params.id);
    const {
      username,
      password,
      name,
      surname,
      email,
      role: newRole,
      gender,
      birth_date,
      birth_place,
      phone_number,
      ssn,
    } = req.body;

    // Check if user exists
    const existingUser = await pool.query("SELECT * FROM users WHERE user_id = $1", [targetId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      // Check if username is already taken by another user
      const usernameCheck = await pool.query("SELECT * FROM users WHERE username = $1 AND user_id != $2", [username, targetId]);
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }
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
      // Check if email is already taken by another user
      const emailCheck = await pool.query("SELECT * FROM users WHERE email = $1 AND user_id != $2", [email, targetId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (newRole) {
      const validRoles = ["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "INSTRUCTOR", "STUDENT"];
      if (!validRoles.includes(normalizeRole(newRole))) {
        return res.status(400).json({ message: "Invalid role" });
      }
      updates.push(`role = $${paramCount++}`);
      values.push(normalizeRole(newRole));
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
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(targetId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE user_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    res.json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("PUT /users/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:id - Delete user (ADMIN only)
router.delete("/users/:id", authenticateToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    if (role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden - Only ADMIN can delete users" });
    }

    const targetId = Number(req.params.id);

    // Prevent deleting yourself
    if (targetId === Number(req.user.id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1", [targetId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user (cascade will handle related tables)
    await pool.query("DELETE FROM users WHERE user_id = $1", [targetId]);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE /users/:id error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/users/:id/role - Change user role (ADMIN only)
router.patch("/users/:id/role", authenticateToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    if (role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden - Only ADMIN can change user roles" });
    }

    const targetId = Number(req.params.id);
    const { role: newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({ message: "role is required" });
    }

    const validRoles = ["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "INSTRUCTOR", "STUDENT"];
    if (!validRoles.includes(normalizeRole(newRole))) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1", [targetId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update role
    const result = await pool.query(
      "UPDATE users SET role = $2 WHERE user_id = $1 RETURNING user_id, username, role",
      [targetId, normalizeRole(newRole)]
    );

    res.json({
      message: "User role updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH /users/:id/role error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
