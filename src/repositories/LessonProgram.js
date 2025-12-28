const pool = require("../../db/connection");

class LessonProgram {
  static async create(programData) {
    // Support both 'day' and 'day_of_week' for compatibility
    const day_of_week = programData.day_of_week || programData.day;
    const { start_time, stop_time, education_term_id, term_id } = programData;
    const final_term_id = education_term_id || term_id;
    
    const query =
      "INSERT INTO course_programs (day_of_week, start_time, stop_time, education_term_id) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await pool.query(query, [
      day_of_week,
      start_time,
      stop_time,
      final_term_id,
    ]);
    
    // Update the new record with program_id, day, time, and term
    if (result.rows.length > 0) {
      const newProgram = result.rows[0];
      const updateQuery = `
        UPDATE course_programs lp
        SET 
          program_id = lp.course_program_id,
          day = lp.day_of_week,
          time = CONCAT(lp.start_time::text, ' - ', lp.stop_time::text),
          term = et.term_name
        FROM education_terms et
        WHERE lp.course_program_id = $1
        AND lp.education_term_id = et.term_id
        RETURNING lp.*, et.term_name
      `;
      const updateResult = await pool.query(updateQuery, [newProgram.course_program_id]);
      if (updateResult.rows.length > 0) {
        return updateResult.rows[0];
      }
    }
    
    return result.rows[0];
  }

  // Programs assigned to an instructor
  static async getByInstructor(instructorId) {
    const query = `
      SELECT 
        lp.course_program_id,
        lp.day_of_week,
        lp.start_time,
        lp.stop_time,
        lp.education_term_id,
        et.term_name,
        COALESCE(ip.course_id, lp.course_id) as course_id,
        COALESCE(ip.course_name, lp.course_name) as course_name
      FROM course_programs lp
      JOIN education_terms et ON lp.education_term_id = et.term_id
      JOIN instructor_programs ip ON ip.course_program_id = lp.course_program_id
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
      FROM course_programs lp
      JOIN education_terms et ON lp.education_term_id = et.term_id
      JOIN student_programs sp ON sp.course_program_id = lp.course_program_id
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
    const q = `SELECT 1 FROM teacher_programs WHERE course_program_id = $1 AND teacher_id = $2`;
    const r = await pool.query(q, [programId, teacherId]);
    return r.rowCount > 0;
  }

  static async isStudentEnrolled(programId, studentId) {
    const q = `SELECT 1 FROM student_programs WHERE course_program_id = $1 AND student_id = $2`;
    const r = await pool.query(q, [programId, studentId]);
    return r.rowCount > 0;
  }

  static async isInstructorAssigned(programId, instructorId) {
    const q = `SELECT 1 FROM instructor_programs WHERE course_program_id = $1 AND instructor_id = $2`;
    const r = await pool.query(q, [programId, instructorId]);
    return r.rowCount > 0;
  }

  static async findById(programId) {
    const query = `
      SELECT lp.*, et.term_name, et.start_date, et.end_date
      FROM course_programs lp
      JOIN education_terms et ON lp.education_term_id = et.term_id
      WHERE lp.course_program_id = $1
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
      FROM course_programs lp
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
    // course_id and course_name are already in course_programs table, so they're included in lp.*
    return result.rows;
  }

  static async getByTerm(termId) {
    const query = `
      SELECT lp.*, et.term_name
      FROM course_programs lp
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
    // Update course_programs with course information directly
    // Note: program_lessons table doesn't exist in current schema
    const updateQuery = `
      UPDATE course_programs lp
      SET 
        course_id = c.course_id,
        course_name = c.title,
        program_id = lp.course_program_id,
        day = lp.day_of_week,
        time = CONCAT(lp.start_time::text, ' - ', lp.stop_time::text),
        term = et.term_name
      FROM courses c, education_terms et
      WHERE lp.course_program_id = $1
      AND c.course_id = $2
      AND lp.education_term_id = et.term_id
      RETURNING lp.*
    `;
    const result = await pool.query(updateQuery, [programId, courseId]);
    
    if (result.rows.length === 0) {
      throw new Error("Course program not found or course not found");
    }
    
    return result.rows[0];
  }

  static async removeLesson(programId, lessonId) {
    // Alias for removeCourse - kept for backward compatibility
    return this.removeCourse(programId, lessonId);
  }

  static async removeCourse(programId, courseId) {
    // Update course_programs to clear course info
    // Note: program_lessons table doesn't exist in current schema
    const updateQuery = `
      UPDATE course_programs lp
      SET 
        course_id = NULL,
        course_name = NULL,
        program_id = lp.course_program_id,
        day = lp.day_of_week,
        time = CONCAT(lp.start_time::text, ' - ', lp.stop_time::text),
        term = et.term_name
      FROM education_terms et
      WHERE lp.course_program_id = $1
      AND lp.course_id = $2
      AND lp.education_term_id = et.term_id
      RETURNING lp.*
    `;
    const result = await pool.query(updateQuery, [programId, courseId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  static async getLessons(programId) {
    // Alias for getCourses - kept for backward compatibility
    return this.getCourses(programId);
  }

  static async getCourses(programId) {
    // First, try to get course from instructor_programs table (primary source for instructor's programs)
    let query = `
      SELECT 
        ip.course_id,
        ip.course_name as title,
        ip.course_name,
        c.description,
        c.duration,
        c.level
      FROM instructor_programs ip
      LEFT JOIN courses c ON c.course_id = ip.course_id
      WHERE ip.course_program_id = $1 AND ip.course_id IS NOT NULL
    `;
    let result = await pool.query(query, [programId]);
    
    // If no results from instructor_programs, try course_programs table
    if (result.rows.length === 0) {
      query = `
        SELECT 
          cp.course_id,
          cp.course_name as title,
          cp.course_name,
          c.description,
          c.duration,
          c.level
        FROM course_programs cp
        LEFT JOIN courses c ON c.course_id = cp.course_id
        WHERE cp.course_program_id = $1 AND cp.course_id IS NOT NULL
      `;
      result = await pool.query(query, [programId]);
    }
    
    return result.rows;
  }

  static async assignInstructor(programId, instructorId) {
    const query =
      "INSERT INTO instructor_programs (course_program_id, instructor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *";
    const result = await pool.query(query, [programId, instructorId]);
    return result.rows[0];
  }

  // Alias for backward compatibility
  static async assignTeacher(programId, teacherId) {
    return this.assignInstructor(programId, teacherId);
  }

  static async removeInstructor(programId, instructorId) {
    const q =
      "DELETE FROM instructor_programs WHERE course_program_id = $1 AND instructor_id = $2 RETURNING *";
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
      WHERE ip.course_program_id = $1
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
      "INSERT INTO student_programs (course_program_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *";
    const result = await pool.query(query, [programId, studentId]);
    return result.rows[0];
  }

  static async removeStudent(programId, studentId) {
    const q =
      "DELETE FROM student_programs WHERE course_program_id = $1 AND student_id = $2 RETURNING *";
    const r = await pool.query(q, [programId, studentId]);
    return r.rows[0];
  }

  static async getStudents(programId) {
    const query = `
      SELECT 
        u.*,
        s.name,
        s.surname,
        s.student_id,
        CONCAT(s.name, ' ', s.surname) as student_name,
        CONCAT(s.name, ' ', s.surname) as full_name
      FROM users u
      JOIN student_programs sp ON u.user_id = sp.student_id
      LEFT JOIN students s ON s.student_id = u.user_id
      WHERE sp.course_program_id = $1
      ORDER BY s.name, s.surname
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
      "UPDATE course_programs SET day_of_week = $1, start_time = $2, stop_time = $3, education_term_id = $4 WHERE course_program_id = $5 RETURNING *";
    const result = await pool.query(query, [
      day_of_week,
      start_time,
      stop_time,
      final_term_id,
      programId,
    ]);
    
    // Update program_id, day, time, and term columns
    if (result.rows.length > 0) {
      const updateQuery = `
        UPDATE course_programs lp
        SET 
          program_id = lp.course_program_id,
          day = lp.day_of_week,
          time = CONCAT(lp.start_time::text, ' - ', lp.stop_time::text),
          term = et.term_name
        FROM education_terms et
        WHERE lp.course_program_id = $1
        AND lp.education_term_id = et.term_id
        RETURNING lp.*, et.term_name
      `;
      const updateResult = await pool.query(updateQuery, [programId]);
      if (updateResult.rows.length > 0) {
        return updateResult.rows[0];
      }
    }
    
    return result.rows[0];
  }

  static async delete(programId) {
    const query =
      "DELETE FROM course_programs WHERE course_program_id = $1 RETURNING *";
    const result = await pool.query(query, [programId]);
    return result.rows[0];
  }
}

module.exports = LessonProgram;


