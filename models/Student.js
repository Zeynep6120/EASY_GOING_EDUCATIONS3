const pool = require("../db/connection");

class Student {
  static async create(
    userId,
    fatherName = null,
    motherName = null,
    advisorInstructorId = null,
    userData = null,
    db = pool
  ) {
    // Support both advisorInstructorId (new) and advisorTeacherId (legacy) for backward compatibility
    const advisorId = advisorInstructorId || (arguments[3] && typeof arguments[3] === 'number' ? arguments[3] : null);
    
    // If userData is provided, insert all student information
    if (userData) {
      const query = `
        INSERT INTO students (
          student_id, username, name, surname, email, gender, 
          birth_date, birth_place, phone_number, ssn, is_active,
          father_name, mother_name, advisor_instructor_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        fatherName,
        motherName,
        advisorId,
      ]);
      return result.rows[0];
    } else {
      // Legacy method: only insert basic fields
      const query =
        "INSERT INTO students (student_id, father_name, mother_name, advisor_instructor_id) VALUES ($1, $2, $3, $4) RETURNING *";
      const result = await db.query(query, [
        userId,
        fatherName,
        motherName,
        advisorId,
      ]);
      return result.rows[0];
    }
  }

  static async findById(studentId, db = pool) {
    const query = `
      SELECT u.*, s.father_name, s.mother_name, s.advisor_instructor_id,
             t.name as advisor_name, t.surname as advisor_surname
      FROM users u 
      JOIN students s ON u.user_id = s.student_id 
      LEFT JOIN users t ON s.advisor_instructor_id = t.user_id
      WHERE s.student_id = $1
    `;
    const result = await db.query(query, [studentId]);
    return result.rows[0];
  }

  static async getAll(db = pool) {
    const query = `
      SELECT u.*, s.father_name, s.mother_name, s.advisor_instructor_id,
             t.name as advisor_name, t.surname as advisor_surname
      FROM users u 
      JOIN students s ON u.user_id = s.student_id 
      LEFT JOIN users t ON s.advisor_instructor_id = t.user_id
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async updateDetails(
    studentId,
    fatherName,
    motherName,
    advisorInstructorId,
    db = pool
  ) {
    // Support both advisorInstructorId (new) and advisorTeacherId (legacy) for backward compatibility
    const advisorId = advisorInstructorId || (arguments[3] && typeof arguments[3] === 'number' ? arguments[3] : null);
    const query =
      "UPDATE students SET father_name = $1, mother_name = $2, advisor_instructor_id = $3 WHERE student_id = $4 RETURNING *";
    const result = await db.query(query, [
      fatherName,
      motherName,
      advisorId,
      studentId,
    ]);
    return result.rows[0];
  }

  static async getByAdvisor(advisorInstructorId, db = pool) {
    // Support both advisorInstructorId (new) and advisorTeacherId (legacy) for backward compatibility
    const advisorId = advisorInstructorId || (arguments[0] && typeof arguments[0] === 'number' ? arguments[0] : null);
    const query = `
      SELECT u.*, s.father_name, s.mother_name 
      FROM users u 
      JOIN students s ON u.user_id = s.student_id 
      WHERE s.advisor_instructor_id = $1
    `;
    const result = await db.query(query, [advisorId]);
    return result.rows;
  }
}

module.exports = Student;
