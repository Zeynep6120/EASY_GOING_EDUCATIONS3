const pool = require("../db/connection");

class Course {
  static async create(courseData) {
    const { title, description, duration, price, level, image, is_featured, credit_score, compulsory } =
      courseData;
    const query = `
      INSERT INTO courses (title, description, duration, price, level, image, is_featured, credit_score, compulsory)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await pool.query(query, [
      title,
      description,
      duration,
      price,
      level,
      image,
      is_featured || false,
      credit_score || 0,
      compulsory || false,
    ]);
    return result.rows[0];
  }

  static async findById(courseId) {
    const query = "SELECT * FROM courses WHERE course_id = $1";
    const result = await pool.query(query, [courseId]);
    return result.rows[0];
  }

  static async getAll() {
    const query = "SELECT * FROM courses ORDER BY is_featured DESC, title";
    const result = await pool.query(query);
    return result.rows;
  }

  static async getFeatured() {
    const query =
      "SELECT * FROM courses WHERE is_featured = true ORDER BY title";
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(courseId, courseData) {
    const { title, description, duration, price, level, image, is_featured, credit_score, compulsory } =
      courseData;
    
    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (duration !== undefined) {
      updates.push(`duration = $${paramIndex++}`);
      values.push(duration);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    if (level !== undefined) {
      updates.push(`level = $${paramIndex++}`);
      values.push(level);
    }
    if (image !== undefined) {
      updates.push(`image = $${paramIndex++}`);
      values.push(image);
    }
    if (is_featured !== undefined) {
      updates.push(`is_featured = $${paramIndex++}`);
      values.push(is_featured);
    }
    if (credit_score !== undefined) {
      updates.push(`credit_score = $${paramIndex++}`);
      values.push(credit_score);
    }
    if (compulsory !== undefined) {
      updates.push(`compulsory = $${paramIndex++}`);
      values.push(compulsory);
    }
    
    if (updates.length === 0) {
      // No fields to update, return existing course
      return await this.findById(courseId);
    }
    
    values.push(courseId);
    const query = `
      UPDATE courses SET
        ${updates.join(", ")}
      WHERE course_id = $${paramIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(courseId) {
    // Delete from all child tables first (foreign key constraints)
    // Then delete from courses table
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      // Check if course exists
      const courseCheck = await client.query("SELECT course_id FROM courses WHERE course_id = $1", [courseId]);
      if (courseCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      
      // Delete from program_courses (child table)
      await client.query("DELETE FROM program_courses WHERE course_id = $1", [courseId]);
      
      // Set course_id to NULL in students table (if column exists)
      // Check if students.course_id column exists
      const studentsCourseIdExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'students' AND column_name = 'course_id'
        )
      `);
      if (studentsCourseIdExists.rows[0].exists) {
        await client.query("UPDATE students SET course_id = NULL WHERE course_id = $1", [courseId]);
      }
      
      // Delete from courses (parent table)
      const result = await client.query(
        "DELETE FROM courses WHERE course_id = $1 RETURNING *",
        [courseId]
      );
      
      await client.query("COMMIT");
      return result.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("Error deleting course:", e);
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = Course;


