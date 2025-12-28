const pool = require("../../db/connection");

class StudentInfo {
  static async getAll() {
    const query = `
      SELECT
        si.student_info_id,
        si.student_id,
        u.name as student_name,
        u.surname as student_surname,
        si.lesson_id,
        l.lesson_name,
        si.term_id,
        et.term_name,
        si.absentee,
        si.midterm_exam,
        si.final_exam,
        si.average,
        si.note,
        si.info_note
      FROM student_info si
      JOIN users u ON si.student_id = u.user_id
      JOIN lessons l ON si.lesson_id = l.lesson_id
      JOIN education_terms et ON si.term_id = et.term_id
      ORDER BY si.student_info_id DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async create(infoData) {
    const {
      student_id,
      lesson_id,
      term_id,
      absentee,
      midterm_exam,
      final_exam,
      average,
      note,
      info_note,
    } = infoData;

    // Calculate average if not provided
    let calculatedAverage = average;
    if (!calculatedAverage && midterm_exam !== null && final_exam !== null) {
      calculatedAverage = (midterm_exam * 0.4 + final_exam * 0.6).toFixed(2);
    }

    const query = `
      INSERT INTO student_info (
        student_id, lesson_id, term_id, absentee, 
        midterm_exam, final_exam, average, note, info_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (student_id, lesson_id, term_id) 
      DO UPDATE SET
        absentee = EXCLUDED.absentee,
        midterm_exam = EXCLUDED.midterm_exam,
        final_exam = EXCLUDED.final_exam,
        average = EXCLUDED.average,
        note = EXCLUDED.note,
        info_note = EXCLUDED.info_note
      RETURNING *
    `;

    const result = await pool.query(query, [
      student_id,
      lesson_id,
      term_id,
      absentee || 0,
      midterm_exam,
      final_exam,
      calculatedAverage,
      note,
      info_note,
    ]);

    return result.rows[0];
  }

  static async findById(infoId) {
    const query = `
      SELECT si.*, 
             u.name as student_name, u.surname as student_surname,
             l.lesson_name,
             et.term_name
      FROM student_info si
      JOIN users u ON si.student_id = u.user_id
      JOIN lessons l ON si.lesson_id = l.lesson_id
      JOIN education_terms et ON si.term_id = et.term_id
      WHERE si.student_info_id = $1
    `;
    const result = await pool.query(query, [infoId]);
    return result.rows[0];
  }

  static async getByStudent(studentId) {
    const query = `
      SELECT si.*, 
             l.lesson_name, l.credit_score,
             et.term_name
      FROM student_info si
      JOIN lessons l ON si.lesson_id = l.lesson_id
      JOIN education_terms et ON si.term_id = et.term_id
      WHERE si.student_id = $1
      ORDER BY et.start_date DESC, l.lesson_name
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  static async getByLesson(lessonId) {
    const query = `
      SELECT
        si.student_info_id,
        si.student_id,
        u.name as student_name,
        u.surname as student_surname,
        si.lesson_id,
        l.lesson_name,
        si.term_id,
        et.term_name,
        si.absentee,
        si.midterm_exam,
        si.final_exam,
        si.average,
        si.note,
        si.info_note
      FROM student_info si
      JOIN users u ON si.student_id = u.user_id
      JOIN lessons l ON si.lesson_id = l.lesson_id
      JOIN education_terms et ON si.term_id = et.term_id
      WHERE si.lesson_id = $1
      ORDER BY si.student_info_id DESC
    `;
    const result = await pool.query(query, [lessonId]);
    return result.rows;
  }

  static async getByTerm(termId) {
    const query = `
      SELECT
        si.student_info_id,
        si.student_id,
        u.name as student_name,
        u.surname as student_surname,
        si.lesson_id,
        l.lesson_name,
        si.term_id,
        et.term_name,
        si.absentee,
        si.midterm_exam,
        si.final_exam,
        si.average,
        si.note,
        si.info_note
      FROM student_info si
      JOIN users u ON si.student_id = u.user_id
      JOIN lessons l ON si.lesson_id = l.lesson_id
      JOIN education_terms et ON si.term_id = et.term_id
      WHERE si.term_id = $1
      ORDER BY si.student_info_id DESC
    `;
    const result = await pool.query(query, [termId]);
    return result.rows;
  }

  static async getByStudentAndLesson(studentId, lessonId) {
    const query = `
      SELECT si.*, 
             l.lesson_name,
             et.term_name
      FROM student_info si
      JOIN lessons l ON si.lesson_id = l.lesson_id
      JOIN education_terms et ON si.term_id = et.term_id
      WHERE si.student_id = $1 AND si.lesson_id = $2
      ORDER BY et.start_date DESC
    `;
    const result = await pool.query(query, [studentId, lessonId]);
    return result.rows;
  }

  static async getByStudentAndTerm(studentId, termId) {
    const query = `
      SELECT si.*, 
             l.lesson_name, l.credit_score,
             et.term_name
      FROM student_info si
      JOIN lessons l ON si.lesson_id = l.lesson_id
      JOIN education_terms et ON si.term_id = et.term_id
      WHERE si.student_id = $1 AND si.term_id = $2
      ORDER BY l.lesson_name
    `;
    const result = await pool.query(query, [studentId, termId]);
    return result.rows;
  }

  static async update(infoId, infoData) {
    const { absentee, midterm_exam, final_exam, average, note, info_note } =
      infoData;

    let calculatedAverage = average;
    if (!calculatedAverage && midterm_exam !== null && final_exam !== null) {
      calculatedAverage = (midterm_exam * 0.4 + final_exam * 0.6).toFixed(2);
    }

    const query = `
      UPDATE student_info SET
        absentee = COALESCE($1, absentee),
        midterm_exam = COALESCE($2, midterm_exam),
        final_exam = COALESCE($3, final_exam),
        average = COALESCE($4, average),
        note = COALESCE($5, note),
        info_note = COALESCE($6, info_note)
      WHERE student_info_id = $7
      RETURNING *
    `;

    const result = await pool.query(query, [
      absentee,
      midterm_exam,
      final_exam,
      calculatedAverage,
      note,
      info_note,
      infoId,
    ]);

    return result.rows[0];
  }

  static async delete(infoId) {
    const query =
      "DELETE FROM student_info WHERE student_info_id = $1 RETURNING *";
    const result = await pool.query(query, [infoId]);
    return result.rows[0];
  }
}

module.exports = StudentInfo;


