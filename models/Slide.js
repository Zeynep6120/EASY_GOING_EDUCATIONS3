const pool = require("../db/connection");

class Slide {
  static async create(slideData) {
    const { title, description, image } = slideData;
    const query = `
      INSERT INTO slides (title, description, image)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [title, description, image]);
    return result.rows[0];
  }

  static async findById(slideId) {
    const query = "SELECT * FROM slides WHERE slide_id = $1";
    const result = await pool.query(query, [slideId]);
    return result.rows[0];
  }

  static async getAll() {
    const query = "SELECT * FROM slides ORDER BY slide_id";
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(slideId, slideData) {
    const { title, description, image } = slideData;
    const query = `
      UPDATE slides SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        image = COALESCE($3, image)
      WHERE slide_id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [
      title,
      description,
      image,
      slideId,
    ]);
    return result.rows[0];
  }

  static async delete(slideId) {
    const query = "DELETE FROM slides WHERE slide_id = $1 RETURNING *";
    const result = await pool.query(query, [slideId]);
    return result.rows[0];
  }
}

module.exports = Slide;


