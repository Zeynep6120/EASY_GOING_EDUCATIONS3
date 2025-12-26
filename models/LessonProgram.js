const pool = require("../db/connection");

class LessonProgram {
  static async create(programData) {
    // Support both 'day' and 'day_of_week' for compatibility
    const day_of_week = programData.day_of_week || programData.day;
    const { start_time, stop_time, education_term_id, term_id } = programData;
    const final_term_id = education_term_id || term_id;
    
    const query =
      "INSERT INTO lesson_programs (day_of_week, start_time, stop_time, education_term_id) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await pool.query(query, [
      day_of_week,
      start_time,
      stop_time,
      final_term_id,
    ]);
    return result.rows[0];
  }

  // Programs assigned to an instructor
  static async getByInstructor(instructorId) {
    const query = `
      SELECT lp.*, et.term_name
      FROM lesson_programs lp
      JOIN education_terms et ON lp.education_term_id = et.term_id
      JOIN instructor_programs ip ON ip.lesson_program_id = lp.lesson_program_id
      WHERE ip.instructor_id = $1
      ORDER BY 
        CASE lp.day_of_week
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          WHEN 'SUNDAY' THEN 7
          ELSE 8
        END,
        lp.start_time
    `;
    const result = await pool.query(query, [instructorId]);
    return result.rows;
  }

  // Alias for backward compatibility
  static async getByTeacher(teacherId) {
    return this.getByInstructor(teacherId);
  }

  // Programs enrolled by a student
  static async getByStudent(studentId) {
    const query = `
      SELECT lp.*, et.term_name
      FROM lesson_programs lp
      JOIN education_terms et ON lp.education_term_id = et.term_id
      JOIN student_programs sp ON sp.lesson_program_id = lp.lesson_program_id
      WHERE sp.student_id = $1
      ORDER BY 
        CASE lp.day_of_week
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          WHEN 'SUNDAY' THEN 7
          ELSE 8
        END,
        lp.start_time
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  static async isTeacherAssigned(programId, teacherId) {
    const q = `SELECT 1 FROM teacher_programs WHERE lesson_program_id = $1 AND teacher_id = $2`;
    const r = await pool.query(q, [programId, teacherId]);
    return r.rowCount > 0;
  }

  static async isStudentEnrolled(programId, studentId) {
    const q = `SELECT 1 FROM student_programs WHERE lesson_program_id = $1 AND student_id = $2`;
    const r = await pool.query(q, [programId, studentId]);
    return r.rowCount > 0;
  }

  static async findById(programId) {
    const query = `
      SELECT lp.*, et.term_name, et.start_date, et.end_date
      FROM lesson_programs lp
      JOIN education_terms et ON lp.education_term_id = et.term_id
      WHERE lp.lesson_program_id = $1
    `;
    const result = await pool.query(query, [programId]);
    return result.rows[0];
  }

  // Alias for findById (for route compatibility)
  static async getById(programId) {
    return this.findById(programId);
  }

  static async getAll() {
    const query = `
      SELECT lp.*, et.term_name
      FROM lesson_programs lp
      JOIN education_terms et ON lp.education_term_id = et.term_id
      ORDER BY 
        CASE lp.day_of_week
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          WHEN 'SUNDAY' THEN 7
          ELSE 8
        END,
        lp.start_time
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getByTerm(termId) {
    const query = `
      SELECT lp.*, et.term_name
      FROM lesson_programs lp
      JOIN education_terms et ON lp.education_term_id = et.term_id
      WHERE lp.education_term_id = $1
      ORDER BY 
        CASE lp.day_of_week
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          WHEN 'SUNDAY' THEN 7
          ELSE 8
        END,
        lp.start_time
    `;
    const result = await pool.query(query, [termId]);
    return result.rows;
  }

  static async addLesson(programId, lessonId) {
    // Alias for addCourse - kept for backward compatibility
    return this.addCourse(programId, lessonId);
  }

  static async addCourse(programId, courseId) {
    const query =
      "INSERT INTO program_courses (lesson_program_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *";
    const result = await pool.query(query, [programId, courseId]);
    return result.rows[0];
  }

  static async removeLesson(programId, lessonId) {
    // Alias for removeCourse - kept for backward compatibility
    return this.removeCourse(programId, lessonId);
  }

  static async removeCourse(programId, courseId) {
    const q =
      "DELETE FROM program_courses WHERE lesson_program_id = $1 AND course_id = $2 RETURNING *";
    const r = await pool.query(q, [programId, courseId]);
    return r.rows[0];
  }

  static async getLessons(programId) {
    // Alias for getCourses - kept for backward compatibility
    return this.getCourses(programId);
  }

  static async getCourses(programId) {
    const query = `
      SELECT c.*
      FROM courses c
      JOIN program_courses pc ON c.course_id = pc.course_id
      WHERE pc.lesson_program_id = $1
    `;
    const result = await pool.query(query, [programId]);
    return result.rows;
  }

  static async assignInstructor(programId, instructorId) {
    const query =
      "INSERT INTO instructor_programs (lesson_program_id, instructor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *";
    const result = await pool.query(query, [programId, instructorId]);
    return result.rows[0];
  }

  // Alias for backward compatibility
  static async assignTeacher(programId, teacherId) {
    return this.assignInstructor(programId, teacherId);
  }

  static async removeInstructor(programId, instructorId) {
    const q =
      "DELETE FROM instructor_programs WHERE lesson_program_id = $1 AND instructor_id = $2 RETURNING *";
    const r = await pool.query(q, [programId, instructorId]);
    return r.rows[0];
  }

  // Alias for backward compatibility
  static async removeTeacher(programId, teacherId) {
    return this.removeInstructor(programId, teacherId);
  }

  static async getInstructors(programId) {
    const query = `
      SELECT u.*
      FROM users u
      JOIN instructor_programs ip ON u.user_id = ip.instructor_id
      WHERE ip.lesson_program_id = $1
    `;
    const result = await pool.query(query, [programId]);
    return result.rows;
  }

  // Alias for backward compatibility
  static async getTeachers(programId) {
    return this.getInstructors(programId);
  }

  static async enrollStudent(programId, studentId) {
    const query =
      "INSERT INTO student_programs (lesson_program_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *";
    const result = await pool.query(query, [programId, studentId]);
    return result.rows[0];
  }

  static async removeStudent(programId, studentId) {
    const q =
      "DELETE FROM student_programs WHERE lesson_program_id = $1 AND student_id = $2 RETURNING *";
    const r = await pool.query(q, [programId, studentId]);
    return r.rows[0];
  }

  static async getStudents(programId) {
    const query = `
      SELECT u.*
      FROM users u
      JOIN student_programs sp ON u.user_id = sp.student_id
      WHERE sp.lesson_program_id = $1
    `;
    const result = await pool.query(query, [programId]);
    return result.rows;
  }

  static async update(programId, programData) {
    // Support both 'day' and 'day_of_week' for compatibility
    const day_of_week = programData.day_of_week || programData.day;
    const { start_time, stop_time, education_term_id, term_id } = programData;
    const final_term_id = education_term_id || term_id;
    
    const query =
      "UPDATE lesson_programs SET day_of_week = $1, start_time = $2, stop_time = $3, education_term_id = $4 WHERE lesson_program_id = $5 RETURNING *";
    const result = await pool.query(query, [
      day_of_week,
      start_time,
      stop_time,
      final_term_id,
      programId,
    ]);
    return result.rows[0];
  }

  static async delete(programId) {
    const query =
      "DELETE FROM lesson_programs WHERE lesson_program_id = $1 RETURNING *";
    const result = await pool.query(query, [programId]);
    return result.rows[0];
  }
}

module.exports = LessonProgram;


