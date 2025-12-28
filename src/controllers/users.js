const express = require("express");
const router = express.Router();

const pool = require("../../db/connection");
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const role = normalizeRole(req.user.role);
    const targetId = Number(req.params.id);
    const { is_active } = req.body || {};

    if (typeof is_active !== "boolean") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "is_active must be boolean" });
    }

    // Only ADMIN and MANAGER can change status
    if (role !== "ADMIN" && role !== "MANAGER") {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden" });
    }

    // Manager cannot change ADMIN status
    const targetRoleRes = await client.query("SELECT role FROM users WHERE user_id = $1", [targetId]);
    if (targetRoleRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Not found" });
    }
    const targetRole = normalizeRole(targetRoleRes.rows[0].role);
    if (role === "MANAGER" && targetRole === "ADMIN") {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update users table
    const result = await client.query(
      "UPDATE users SET is_active = $2 WHERE user_id = $1 RETURNING user_id, username, role, is_active",
      [targetId, is_active]
    );

    // Update role-specific specialization tables
    if (targetRole === "ADMIN") {
      await client.query("UPDATE admins SET is_active = $2 WHERE admin_id = $1", [targetId, is_active]);
      console.log("Admin record is_active updated in admins table");
    } else if (targetRole === "MANAGER") {
      await client.query("UPDATE managers SET is_active = $2 WHERE manager_id = $1", [targetId, is_active]);
      console.log("Manager record is_active updated in managers table");
    } else if (targetRole === "ASSISTANT_MANAGER") {
      await client.query("UPDATE assistant_managers SET is_active = $2 WHERE assistant_manager_id = $1", [targetId, is_active]);
      console.log("Assistant Manager record is_active updated in assistant_managers table");
    } else if (targetRole === "STUDENT") {
      await client.query("UPDATE students SET is_active = $2 WHERE student_id = $1", [targetId, is_active]);
      console.log("Student record is_active updated in students table");
    }
    // Note: instructors table doesn't have is_active column

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PATCH /users/:id/status error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
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

    const User = require("../repositories/User");
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
      // Insert into instructors table
      await client.query(
        `INSERT INTO instructors (
          instructor_id, name, surname, username, email, title, bio, image, social_links
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (instructor_id) DO UPDATE SET
          name = EXCLUDED.name,
          surname = EXCLUDED.surname,
          username = EXCLUDED.username,
          email = EXCLUDED.email`,
        [
          user.user_id,
          user.name,
          user.surname,
          user.username,
          user.email,
          null, // title
          null, // bio
          null, // image
          null, // social_links
        ]
      );
      console.log("Instructor record created in instructors table");
    } else if (normalizedRole === "STUDENT") {
      // Insert into students table
      // If father_name, mother_name, advisor_instructor_id are not provided, use null/defaults
      const Student = require("../repositories/Student");
      const {
        father_name,
        mother_name,
        advisor_instructor_id,
      } = req.body;
      
      await Student.create(
        user.user_id,
        father_name || null,
        mother_name || null,
        advisor_instructor_id || null,
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
          is_active: user.is_active !== undefined ? user.is_active : true,
        },
        client
      );
      console.log("Student record created in students table");
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const role = normalizeRole(req.user.role);
    if (role !== "ADMIN") {
      await client.query("ROLLBACK");
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
      is_active,
    } = req.body;

    // Check if user exists
    const existingUser = await client.query("SELECT * FROM users WHERE user_id = $1", [targetId]);
    if (existingUser.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      // Check if username is already taken by another user
      const usernameCheck = await client.query("SELECT * FROM users WHERE username = $1 AND user_id != $2", [username, targetId]);
      if (usernameCheck.rows.length > 0) {
        await client.query("ROLLBACK");
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
      const emailCheck = await client.query("SELECT * FROM users WHERE email = $1 AND user_id != $2", [email, targetId]);
      if (emailCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Email already exists" });
      }
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (newRole) {
      const validRoles = ["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "INSTRUCTOR", "STUDENT"];
      if (!validRoles.includes(normalizeRole(newRole))) {
        await client.query("ROLLBACK");
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
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
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

    values.push(targetId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE user_id = $${paramCount} RETURNING *`;
    const result = await client.query(query, values);

    // Update role-specific specialization tables
    const currentRole = normalizeRole(existingUser.rows[0].role);
    const updatedRole = newRole ? normalizeRole(newRole) : currentRole;
    const updatedUserData = result.rows[0]; // Get the updated user data including is_active

    // If user is an ADMIN, also update admins table
    if (currentRole === "ADMIN" || updatedRole === "ADMIN") {
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
      // Update is_active if it was changed
      if (is_active !== undefined) {
        adminUpdates.push(`is_active = $${adminParamCount++}`);
        adminValues.push(is_active);
      } else {
        // Use current value from updated user data
        adminUpdates.push(`is_active = $${adminParamCount++}`);
        adminValues.push(updatedUserData.is_active !== undefined ? updatedUserData.is_active : true);
      }

      if (adminUpdates.length > 0) {
        adminValues.push(targetId);
        const adminQuery = `UPDATE admins SET ${adminUpdates.join(", ")} WHERE admin_id = $${adminParamCount}`;
        await client.query(adminQuery, adminValues);
        console.log("Admin record updated in admins table");
      }

      // If role is being changed to ADMIN, ensure admin record exists
      if (updatedRole === "ADMIN" && currentRole !== "ADMIN") {
        const adminExists = await client.query("SELECT 1 FROM admins WHERE admin_id = $1", [targetId]);
        if (adminExists.rows.length === 0) {
          // Create admin record
          const u = updatedUserData;
          await client.query(
            `INSERT INTO admins (
              admin_id, username, name, surname, email, gender, 
              birth_date, birth_place, phone_number, ssn, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              targetId,
              u.username,
              u.name,
              u.surname,
              u.email,
              u.gender || null,
              u.birth_date || null,
              u.birth_place || null,
              u.phone_number || null,
              u.ssn || null,
              u.is_active !== undefined ? u.is_active : true,
            ]
          );
          console.log("Admin record created in admins table for role change");
        }
      }
    }

    // If user is a MANAGER, also update managers table
    if (currentRole === "MANAGER" || updatedRole === "MANAGER") {
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
      // Update is_active if it was changed
      if (is_active !== undefined) {
        managerUpdates.push(`is_active = $${managerParamCount++}`);
        managerValues.push(is_active);
      } else {
        // Use current value from updated user data
        managerUpdates.push(`is_active = $${managerParamCount++}`);
        managerValues.push(updatedUserData.is_active !== undefined ? updatedUserData.is_active : true);
      }

      if (managerUpdates.length > 0) {
        managerValues.push(targetId);
        const managerQuery = `UPDATE managers SET ${managerUpdates.join(", ")} WHERE manager_id = $${managerParamCount}`;
        await client.query(managerQuery, managerValues);
        console.log("Manager record updated in managers table");
      }

      // If role is being changed to MANAGER, ensure manager record exists
      if (updatedRole === "MANAGER" && currentRole !== "MANAGER") {
        const managerExists = await client.query("SELECT 1 FROM managers WHERE manager_id = $1", [targetId]);
        if (managerExists.rows.length === 0) {
          // Create manager record
          const updatedUser = await client.query("SELECT * FROM users WHERE user_id = $1", [targetId]);
          if (updatedUser.rows.length > 0) {
            const u = updatedUser.rows[0];
            await client.query(
              `INSERT INTO managers (
                manager_id, username, name, surname, email, gender, 
                birth_date, birth_place, phone_number, ssn, is_active
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                targetId,
                u.username,
                u.name,
                u.surname,
                u.email,
                u.gender || null,
                u.birth_date || null,
                u.birth_place || null,
                u.phone_number || null,
                u.ssn || null,
                u.is_active !== undefined ? u.is_active : true,
              ]
            );
            console.log("Manager record created in managers table for role change");
          }
        }
      }
    }

    // If user is an ASSISTANT_MANAGER, also update assistant_managers table
    if (currentRole === "ASSISTANT_MANAGER" || updatedRole === "ASSISTANT_MANAGER") {
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
      // Update is_active if it was changed
      if (is_active !== undefined) {
        assistantManagerUpdates.push(`is_active = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(is_active);
      } else {
        // Use current value from updated user data
        assistantManagerUpdates.push(`is_active = $${assistantManagerParamCount++}`);
        assistantManagerValues.push(updatedUserData.is_active !== undefined ? updatedUserData.is_active : true);
      }

      if (assistantManagerUpdates.length > 0) {
        assistantManagerValues.push(targetId);
        const assistantManagerQuery = `UPDATE assistant_managers SET ${assistantManagerUpdates.join(", ")} WHERE assistant_manager_id = $${assistantManagerParamCount}`;
        await client.query(assistantManagerQuery, assistantManagerValues);
        console.log("Assistant Manager record updated in assistant_managers table");
      }

      // If role is being changed to ASSISTANT_MANAGER, ensure assistant_manager record exists
      if (updatedRole === "ASSISTANT_MANAGER" && currentRole !== "ASSISTANT_MANAGER") {
        const assistantManagerExists = await client.query("SELECT 1 FROM assistant_managers WHERE assistant_manager_id = $1", [targetId]);
        if (assistantManagerExists.rows.length === 0) {
          // Create assistant_manager record
          const updatedUser = await client.query("SELECT * FROM users WHERE user_id = $1", [targetId]);
          if (updatedUser.rows.length > 0) {
            const u = updatedUser.rows[0];
            await client.query(
              `INSERT INTO assistant_managers (
                assistant_manager_id, username, name, surname, email, gender, 
                birth_date, birth_place, phone_number, ssn, is_active
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                targetId,
                u.username,
                u.name,
                u.surname,
                u.email,
                u.gender || null,
                u.birth_date || null,
                u.birth_place || null,
                u.phone_number || null,
                u.ssn || null,
                u.is_active !== undefined ? u.is_active : true,
              ]
            );
            console.log("Assistant Manager record created in assistant_managers table for role change");
          }
        }
      }
    }

    // If user is a STUDENT, also update students table
    if (currentRole === "STUDENT" || updatedRole === "STUDENT") {
      const studentUpdates = [];
      const studentValues = [];
      let studentParamCount = 1;

      if (username) {
        studentUpdates.push(`username = $${studentParamCount++}`);
        studentValues.push(username);
      }
      if (name) {
        studentUpdates.push(`name = $${studentParamCount++}`);
        studentValues.push(name);
      }
      if (surname) {
        studentUpdates.push(`surname = $${studentParamCount++}`);
        studentValues.push(surname);
      }
      if (email) {
        studentUpdates.push(`email = $${studentParamCount++}`);
        studentValues.push(email);
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
      // Update is_active if it was changed
      if (is_active !== undefined) {
        studentUpdates.push(`is_active = $${studentParamCount++}`);
        studentValues.push(is_active);
      } else {
        // Use current value from updated user data
        studentUpdates.push(`is_active = $${studentParamCount++}`);
        studentValues.push(updatedUserData.is_active !== undefined ? updatedUserData.is_active : true);
      }

      if (studentUpdates.length > 0) {
        studentValues.push(targetId);
        const studentQuery = `UPDATE students SET ${studentUpdates.join(", ")} WHERE student_id = $${studentParamCount}`;
        await client.query(studentQuery, studentValues);
        console.log("Student record updated in students table");
      }

      // If role is being changed to STUDENT, ensure student record exists
      if (updatedRole === "STUDENT" && currentRole !== "STUDENT") {
        const Student = require("../repositories/Student");
        const studentExists = await client.query("SELECT 1 FROM students WHERE student_id = $1", [targetId]);
        if (studentExists.rows.length === 0) {
          // Create student record
          const updatedUser = await client.query("SELECT * FROM users WHERE user_id = $1", [targetId]);
          if (updatedUser.rows.length > 0) {
            const u = updatedUser.rows[0];
            await Student.create(
              targetId,
              null, // father_name
              null, // mother_name
              null, // advisor_instructor_id
              {
                username: u.username,
                name: u.name,
                surname: u.surname,
                email: u.email,
                gender: u.gender,
                birth_date: u.birth_date,
                birth_place: u.birth_place,
                phone_number: u.phone_number,
                ssn: u.ssn,
                is_active: u.is_active !== undefined ? u.is_active : true,
              },
              client
            );
            console.log("Student record created in students table for role change");
          }
        }
      }
    }

    // If user is an INSTRUCTOR, also update instructors table
    if (currentRole === "INSTRUCTOR" || updatedRole === "INSTRUCTOR") {
      const instructorUpdates = [];
      const instructorValues = [];
      let instructorParamCount = 1;

      if (username) {
        instructorUpdates.push(`username = $${instructorParamCount++}`);
        instructorValues.push(username);
      }
      if (name) {
        instructorUpdates.push(`name = $${instructorParamCount++}`);
        instructorValues.push(name);
      }
      if (surname) {
        instructorUpdates.push(`surname = $${instructorParamCount++}`);
        instructorValues.push(surname);
      }
      if (email) {
        instructorUpdates.push(`email = $${instructorParamCount++}`);
        instructorValues.push(email);
      }
      // Note: instructors table doesn't have is_active column, so we skip it

      if (instructorUpdates.length > 0) {
        instructorValues.push(targetId);
        const instructorQuery = `UPDATE instructors SET ${instructorUpdates.join(", ")} WHERE instructor_id = $${instructorParamCount}`;
        await client.query(instructorQuery, instructorValues);
        console.log("Instructor record updated in instructors table");
      }

      // If role is being changed to INSTRUCTOR, ensure instructor record exists
      if (updatedRole === "INSTRUCTOR" && currentRole !== "INSTRUCTOR") {
        const instructorExists = await client.query("SELECT 1 FROM instructors WHERE instructor_id = $1", [targetId]);
        if (instructorExists.rows.length === 0) {
          // Create instructor record
          const updatedUser = await client.query("SELECT * FROM users WHERE user_id = $1", [targetId]);
          if (updatedUser.rows.length > 0) {
            const u = updatedUser.rows[0];
            await client.query(
              `INSERT INTO instructors (
                instructor_id, name, surname, username, email, title, bio, image, social_links
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (instructor_id) DO UPDATE SET
                name = EXCLUDED.name,
                surname = EXCLUDED.surname,
                username = EXCLUDED.username,
                email = EXCLUDED.email`,
              [
                targetId,
                u.name,
                u.surname,
                u.username,
                u.email,
                null, // title
                null, // bio
                null, // image
                null, // social_links
              ]
            );
            console.log("Instructor record created in instructors table for role change");
          }
        }
      }
    }

    await client.query("COMMIT");
    console.log("Transaction committed successfully");

    res.json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PUT /users/:id error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

// DELETE /api/users/:id - Delete user (ADMIN only)
router.delete("/users/:id", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const role = normalizeRole(req.user.role);
    if (role !== "ADMIN") {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden - Only ADMIN can delete users" });
    }

    const targetId = Number(req.params.id);

    // Prevent deleting yourself
    if (targetId === Number(req.user.id)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    // Check if user exists
    const user = await client.query("SELECT * FROM users WHERE user_id = $1", [targetId]);
    if (user.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const userToDelete = user.rows[0];
    const normalizedRoleToDelete = normalizeRole(userToDelete.role);

    // Delete from role-specific specialization tables first
    if (normalizedRoleToDelete === "MANAGER") {
      await client.query("DELETE FROM managers WHERE manager_id = $1", [targetId]);
      console.log(`Manager record for user_id ${targetId} deleted from managers table via /users DELETE`);
    } else if (normalizedRoleToDelete === "ASSISTANT_MANAGER") {
      await client.query("DELETE FROM assistant_managers WHERE assistant_manager_id = $1", [targetId]);
      console.log(`Assistant Manager record for user_id ${targetId} deleted from assistant_managers table via /users DELETE`);
    } else if (normalizedRoleToDelete === "INSTRUCTOR") {
      // Delete from instructor_programs first (if any assignments exist)
      try {
        await client.query("DELETE FROM instructor_programs WHERE instructor_id = $1", [targetId]);
      } catch (instructorProgramsDeleteError) {
        console.warn("Could not delete from instructor_programs table:", instructorProgramsDeleteError.message);
      }
      await client.query("DELETE FROM instructors WHERE instructor_id = $1", [targetId]);
      console.log(`Instructor record for user_id ${targetId} deleted from instructors table via /users DELETE`);
    } else if (normalizedRoleToDelete === "STUDENT") {
      await client.query("DELETE FROM student_programs WHERE student_id = $1", [targetId]);
      await client.query("DELETE FROM students WHERE student_id = $1", [targetId]);
      console.log(`Student record for user_id ${targetId} deleted from students table via /users DELETE`);
    }

    // Delete user from users table
    await client.query("DELETE FROM users WHERE user_id = $1", [targetId]);
    console.log(`User record for user_id ${targetId} deleted from users table`);

    await client.query("COMMIT");
    console.log("Transaction committed successfully");

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DELETE /users/:id error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
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
