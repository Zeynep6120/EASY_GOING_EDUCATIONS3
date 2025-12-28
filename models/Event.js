const pool = require("../db/connection");

class Event {
  static async create(eventData) {
    const { title, time, location, image } = eventData;
    const query = `
      INSERT INTO events (title, time, location, image)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [title, time, location, image]);
    return result.rows[0];
  }

  static async findById(eventId) {
    const query = "SELECT * FROM events WHERE event_id = $1";
    const result = await pool.query(query, [eventId]);
    return result.rows[0];
  }

  static async getAll() {
    const query = "SELECT * FROM events ORDER BY time DESC";
    const result = await pool.query(query);
    return result.rows;
  }

  static async getUpcoming() {
    const query =
      "SELECT * FROM events WHERE time >= CURRENT_TIMESTAMP ORDER BY time ASC";
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(eventId, eventData) {
    const { title, time, location, image } = eventData;
    const query = `
      UPDATE events SET
        title = COALESCE($1, title),
        time = COALESCE($2, time),
        location = COALESCE($3, location),
        image = COALESCE($4, image)
      WHERE event_id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [
      title,
      time,
      location,
      image,
      eventId,
    ]);
    return result.rows[0];
  }

  static async delete(eventId) {
    const query = "DELETE FROM events WHERE event_id = $1 RETURNING *";
    const result = await pool.query(query, [eventId]);
    return result.rows[0];
  }
}

module.exports = Event;


