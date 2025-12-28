const pool = require("../../db/connection");

class EducationTerm {
  static async create(termData) {
    const { term_name, start_date, end_date } = termData;
    const query =
      "INSERT INTO education_terms (term_name, start_date, end_date) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [term_name, start_date, end_date]);
    return result.rows[0];
  }

  static async findById(termId) {
    const query = "SELECT * FROM education_terms WHERE term_id = $1";
    const result = await pool.query(query, [termId]);
    return result.rows[0];
  }

  static async getAll() {
    const query = "SELECT * FROM education_terms ORDER BY start_date DESC";
    const result = await pool.query(query);
    return result.rows;
  }

  // Convenience helper: the term that includes today's date.
  // Returns null if no term matches.
  static async getCurrent() {
    const result = await pool.query(
      `
      SELECT *
      FROM education_terms
      WHERE start_date <= CURRENT_DATE
        AND end_date   >= CURRENT_DATE
      ORDER BY start_date DESC
      LIMIT 1;
      `
    );
    return result.rows[0] || null;
  }

  static async update(termId, termData) {
    const { term_name, start_date, end_date } = termData;
    const query =
      "UPDATE education_terms SET term_name = $1, start_date = $2, end_date = $3 WHERE term_id = $4 RETURNING *";
    const result = await pool.query(query, [
      term_name,
      start_date,
      end_date,
      termId,
    ]);
    return result.rows[0];
  }

  static async delete(termId) {
    const query = "DELETE FROM education_terms WHERE term_id = $1 RETURNING *";
    const result = await pool.query(query, [termId]);
    return result.rows[0];
  }
}

module.exports = EducationTerm;


