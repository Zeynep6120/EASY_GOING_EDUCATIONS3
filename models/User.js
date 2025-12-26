const pool = require("../db/connection");

class User {
  static async findByUsername(username, db = pool) {
    const query = "SELECT * FROM users WHERE username = $1";
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  }

  static async findById(userId, db = pool) {
    const result = await db.query("SELECT * FROM users WHERE user_id = $1", [userId]);
    return result.rows[0] || null;
  }

  static async create(userData, db = pool) {
    const {
      username,
      password,
      name,
      surname,
      email,
      role,
      gender,
      birth_date,
      birth_place,
      phone_number,
      ssn,
    } = userData;

    const query = `
      INSERT INTO users (
        username, password, name, surname, email, role,
        gender, birth_date, birth_place, phone_number, ssn
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        user_id, username, name, surname, email, role, is_active,
        gender, birth_date, birth_place, phone_number, ssn;
    `;

    const values = [
      username,
      password,
      name,
      surname,
      email,
      role,
      gender || null,
      birth_date || null,
      birth_place || null,
      phone_number || null,
      ssn || null,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async getAll(db = pool) {
    const query =
      "SELECT user_id, username, name, surname, email, role, is_active FROM users ORDER BY user_id DESC";
    const result = await db.query(query);
    return result.rows;
  }

  static async getByRole(role, db = pool) {
    const query = "SELECT * FROM users WHERE role = $1";
    const result = await db.query(query, [role]);
    return result.rows;
  }

  static async setActive(userId, isActive, db = pool) {
    const query =
      "UPDATE users SET is_active = $2 WHERE user_id = $1 RETURNING user_id, username, role, is_active";
    const result = await db.query(query, [userId, !!isActive]);
    return result.rows[0] || null;
  }
}

module.exports = User;
