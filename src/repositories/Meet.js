const pool = require("../../db/connection");

class Meet {
  /**
   * Create a meeting.
   * @param {{instructor_id:number, date:string, start_time:string, stop_time:string, description?:string|null}} meetData
   */
  static async create(meetData) {
    const { instructor_id, teacher_id, date, start_time, stop_time, description } = meetData;
    // Support both instructor_id (new) and teacher_id (legacy) for backward compatibility
    const instructorId = instructor_id || teacher_id;
    const query = `
      INSERT INTO meets (instructor_id, date, start_time, stop_time, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [
      instructorId,
      date,
      start_time,
      stop_time,
      description,
    ]);
    return result.rows[0];
  }

  static async findById(meetId) {
    const query = `
      SELECT m.*, 
             u.name as instructor_name, u.surname as instructor_surname
      FROM meets m
      LEFT JOIN users u ON m.instructor_id = u.user_id
      WHERE m.meet_id = $1
    `;
    const result = await pool.query(query, [meetId]);
    return result.rows[0];
  }

  static async getByInstructor(instructorId) {
    const query = `
      SELECT m.*
      FROM meets m
      WHERE m.instructor_id = $1
      ORDER BY m.date DESC, m.start_time DESC
    `;
    const result = await pool.query(query, [instructorId]);
    return result.rows;
  }

  // Alias for backward compatibility
  static async getByTeacher(teacherId) {
    return this.getByInstructor(teacherId);
  }

  static async getByStudent(studentId) {
    const query = `
      SELECT m.*, 
             u.name as instructor_name, u.surname as instructor_surname
      FROM meets m
      JOIN meet_students ms ON m.meet_id = ms.meet_id
      LEFT JOIN users u ON m.instructor_id = u.user_id
      WHERE ms.student_id = $1
      ORDER BY m.date DESC, m.start_time DESC
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  static async getAll() {
    const query = `
      SELECT m.*, 
             u.name as instructor_name, u.surname as instructor_surname
      FROM meets m
      LEFT JOIN users u ON m.instructor_id = u.user_id
      ORDER BY m.date DESC, m.start_time DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async addStudent(meetId, studentId) {
    const query = `
      INSERT INTO meet_students (meet_id, student_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [meetId, studentId]);
    return result.rows[0];
  }

  static async getStudents(meetId) {
    const query = `
      SELECT u.*
      FROM users u
      JOIN meet_students ms ON u.user_id = ms.student_id
      WHERE ms.meet_id = $1
    `;
    const result = await pool.query(query, [meetId]);
    return result.rows;
  }

  // Alias for getStudents (for route compatibility)
  static async getMeetStudents(meetId) {
    return this.getStudents(meetId);
  }

  static async removeStudent(meetId, studentId) {
    const query = `
      DELETE FROM meet_students
      WHERE meet_id = $1 AND student_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [meetId, studentId]);
    return result.rows[0];
  }

  static async update(meetId, meetData) {
    const { date, start_time, stop_time, description } = meetData;
    const query = `
      UPDATE meets SET
        date = COALESCE($1, date),
        start_time = COALESCE($2, start_time),
        stop_time = COALESCE($3, stop_time),
        description = COALESCE($4, description)
      WHERE meet_id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [
      date,
      start_time,
      stop_time,
      description,
      meetId,
    ]);
    return result.rows[0];
  }

  static async delete(meetId) {
    // meet_students has FK to meets without ON DELETE CASCADE.
    // Delete children first in a transaction.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM meet_students WHERE meet_id = $1", [meetId]);
      const result = await client.query(
        "DELETE FROM meets WHERE meet_id = $1 RETURNING *",
        [meetId]
      );
      await client.query("COMMIT");
      return result.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = Meet;


