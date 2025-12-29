const pool = require("../../db/connection");

// Note: This model is for users with INSTRUCTOR role (formerly TEACHER)
// The Instructor model (repositories/Instructor.js) is for public web content

class InstructorUser {
  static async create(userId, isAdvisorInstructor = false, userData = null, db = pool) {
    // Since teachers table is removed, we only store data in users table
    // is_advisor_instructor flag can be stored in a separate table or as metadata
    // For now, we'll just update the user's role and store advisor status elsewhere if needed
    
    // Note: After migration, there's no separate instructors table for users
    // All instructor data is in users table with role = 'INSTRUCTOR'
    // Advisor status can be tracked via a separate advisors table or metadata
    
    return { user_id: userId, is_advisor_instructor };
  }

  static async findById(instructorId, db = pool) {
    const query = `
      SELECT u.*
      FROM users u 
      WHERE u.user_id = $1 AND u.role = 'INSTRUCTOR'
    `;
    const result = await db.query(query, [instructorId]);
    return result.rows[0];
  }

  static async getAll(db = pool) {
    const query = `
      SELECT u.*
      FROM users u 
      WHERE u.role = 'INSTRUCTOR'
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getAdvisorInstructors(db = pool) {
    // After migration, advisor status is in students.advisor_instructor_id
    // We can find advisors by checking which users are referenced as advisors
    const query = `
      SELECT DISTINCT u.*
      FROM users u 
      JOIN students s ON s.advisor_instructor_id = u.user_id
      WHERE u.role = 'INSTRUCTOR'
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getStudentsByAdvisor(instructorId, db = pool) {
    const query = `
      SELECT u.*, s.father_name, s.mother_name 
      FROM users u 
      JOIN students s ON u.user_id = s.student_id 
      WHERE s.advisor_instructor_id = $1
    `;
    const result = await db.query(query, [instructorId]);
    return result.rows;
  }
}

module.exports = InstructorUser;

