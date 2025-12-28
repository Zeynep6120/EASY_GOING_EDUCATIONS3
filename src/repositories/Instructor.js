const pool = require("../../db/connection");

class Instructor {
  static async create(instructorData) {
    const { name, title, bio, image, social_links } = instructorData;
    const query = `
      INSERT INTO instructors (name, title, bio, image, social_links)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [
      name,
      title,
      bio,
      image,
      social_links ? JSON.stringify(social_links) : null,
    ]);
    return result.rows[0];
  }

  static async findById(instructorId) {
    const query = "SELECT * FROM instructors WHERE instructor_id = $1";
    const result = await pool.query(query, [instructorId]);
    return result.rows[0];
  }

  static async getAll() {
    const query = "SELECT * FROM instructors ORDER BY name";
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(instructorId, instructorData) {
    const { name, title, bio, image, social_links } = instructorData;
    const query = `
      UPDATE instructors SET
        name = COALESCE($1, name),
        title = COALESCE($2, title),
        bio = COALESCE($3, bio),
        image = COALESCE($4, image),
        social_links = COALESCE($5, social_links)
      WHERE instructor_id = $6
      RETURNING *
    `;
    const result = await pool.query(query, [
      name,
      title,
      bio,
      image,
      social_links ? JSON.stringify(social_links) : null,
      instructorId,
    ]);
    return result.rows[0];
  }

  static async delete(instructorId) {
    const query =
      "DELETE FROM instructors WHERE instructor_id = $1 RETURNING *";
    const result = await pool.query(query, [instructorId]);
    return result.rows[0];
  }
}

module.exports = Instructor;


