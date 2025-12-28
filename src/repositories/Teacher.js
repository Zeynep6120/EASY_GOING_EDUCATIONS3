const pool = require("../../db/connection");

class Teacher {
  static async create(userId, isAdvisorTeacher = false, userData = null, db = pool) {
    // If userData is provided, insert all teacher information
    if (userData) {
      const query = `
        INSERT INTO teachers (
          teacher_id, username, name, surname, email, gender, 
          birth_date, birth_place, phone_number, ssn, is_active,
          is_advisor_teacher
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const result = await db.query(query, [
        userId,
        userData.username || null,
        userData.name || null,
        userData.surname || null,
        userData.email || null,
        userData.gender || null,
        userData.birth_date || null,
        userData.birth_place || null,
        userData.phone_number || null,
        userData.ssn || null,
        userData.is_active !== undefined ? userData.is_active : true,
        isAdvisorTeacher,
      ]);
      return result.rows[0];
    } else {
      // Legacy method: only insert basic fields
      const query =
        "INSERT INTO teachers (teacher_id, is_advisor_teacher) VALUES ($1, $2) RETURNING *";
      const result = await db.query(query, [userId, isAdvisorTeacher]);
      return result.rows[0];
    }
  }

  static async findById(teacherId, db = pool) {
    const query = `
      SELECT u.*, t.is_advisor_teacher 
      FROM users u 
      JOIN teachers t ON u.user_id = t.teacher_id 
      WHERE t.teacher_id = $1
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows[0];
  }

  static async getAll(db = pool) {
    const query = `
      SELECT u.*, t.is_advisor_teacher 
      FROM users u 
      JOIN teachers t ON u.user_id = t.teacher_id
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getAdvisorTeachers(db = pool) {
    const query = `
      SELECT u.*, t.is_advisor_teacher 
      FROM users u 
      JOIN teachers t ON u.user_id = t.teacher_id 
      WHERE t.is_advisor_teacher = true
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getStudentsByAdvisor(teacherId, db = pool) {
    const query = `
      SELECT u.*, s.father_name, s.mother_name 
      FROM users u 
      JOIN students s ON u.user_id = s.student_id 
      WHERE s.advisor_teacher_id = $1
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows;
  }
}

module.exports = Teacher;


