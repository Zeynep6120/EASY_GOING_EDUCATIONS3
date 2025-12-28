const pool = require("../../db/connection");

class ContactMessage {
  static async create(messageData) {
    const { name, email, subject, message } = messageData;
    const query = `
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [name, email, subject, message]);
    return result.rows[0];
  }

  static async findById(msgId) {
    const query = "SELECT * FROM contact_messages WHERE msg_id = $1";
    const result = await pool.query(query, [msgId]);
    return result.rows[0];
  }

  static async getAll() {
    const query = "SELECT * FROM contact_messages ORDER BY date DESC";
    const result = await pool.query(query);
    return result.rows;
  }

  static async delete(msgId) {
    const query = "DELETE FROM contact_messages WHERE msg_id = $1 RETURNING *";
    const result = await pool.query(query, [msgId]);
    return result.rows[0];
  }

  static async updateResponded(msgId, isResponded) {
    const query = `
      UPDATE contact_messages 
      SET is_responded = $1 
      WHERE msg_id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [isResponded, msgId]);
    return result.rows[0];
  }
}

module.exports = ContactMessage;


