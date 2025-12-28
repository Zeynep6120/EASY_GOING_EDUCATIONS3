const pool = require("../../db/connection");

class Lesson {
  static async create(lessonData) {
    const { lesson_name, credit_score, compulsory } = lessonData;
    const query =
      "INSERT INTO lessons (lesson_name, credit_score, compulsory) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [
      lesson_name,
      credit_score,
      compulsory || false,
    ]);
    return result.rows[0];
  }

  static async findById(lessonId) {
    const query = "SELECT * FROM lessons WHERE lesson_id = $1";
    const result = await pool.query(query, [lessonId]);
    return result.rows[0];
  }

  static async getAll() {
    const query = "SELECT * FROM lessons ORDER BY lesson_name";
    const result = await pool.query(query);
    return result.rows;
  }

  static async getByCompulsory(compulsory) {
    const query =
      "SELECT * FROM lessons WHERE compulsory = $1 ORDER BY lesson_name";
    const result = await pool.query(query, [compulsory]);
    return result.rows;
  }

  static async update(lessonId, lessonData) {
    const { lesson_name, credit_score, compulsory } = lessonData;
    const query =
      "UPDATE lessons SET lesson_name = $1, credit_score = $2, compulsory = $3 WHERE lesson_id = $4 RETURNING *";
    const result = await pool.query(query, [
      lesson_name,
      credit_score,
      compulsory,
      lessonId,
    ]);
    return result.rows[0];
  }

  static async delete(lessonId) {
    const query = "DELETE FROM lessons WHERE lesson_id = $1 RETURNING *";
    const result = await pool.query(query, [lessonId]);
    return result.rows[0];
  }
}

module.exports = Lesson;


