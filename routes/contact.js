const express = require("express");
const router = express.Router();
const ContactMessage = require("../models/ContactMessage");
const authenticateToken = require("../middleware/auth");
const { requireMinRole, requireRoles } = require("../middleware/rbac");
const pool = require("../db/connection");

// Create contact message (public)
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Name, email, and message are required",
      });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      subject: subject || null,
      message,
    });

    res.status(201).json({
      message: "Contact message sent successfully",
      data: contactMessage,
    });
  } catch (error) {
    console.error("Contact message error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all contact messages with pagination (ADMIN, MANAGER, ASSISTANT_MANAGER only)
router.get("/contactMessages/getAll", authenticateToken, requireMinRole("ASSISTANT_MANAGER"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const sort = req.query.sort || "date";
    const type = req.query.type || "desc";

    const offset = page * size;

    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['msg_id', 'id', 'name', 'email', 'subject', 'date'];
    let sortColumn = allowedSortColumns.includes(sort) ? sort : 'date';
    if (sortColumn === 'id') {
      sortColumn = 'msg_id';
    }
    
    // Validate sort type
    const sortType = type.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Check if is_responded column exists
    const columnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contact_messages' AND column_name = 'is_responded'
      )
    `);
    const hasIsRespondedColumn = columnCheck.rows[0].exists;

    // Get contact messages
    const selectColumns = hasIsRespondedColumn
      ? `msg_id as id, name, email, subject, message, date, COALESCE(is_responded, false) as is_responded`
      : `msg_id as id, name, email, subject, message, date, false as is_responded`;
    
    const result = await pool.query(
      `SELECT ${selectColumns}
       FROM contact_messages
       ORDER BY ${sortColumn} ${sortType}
       LIMIT $1 OFFSET $2`,
      [size, offset]
    );

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM contact_messages"
    );
    const totalElements = parseInt(countResult.rows[0].count);

    res.json({
      content: result.rows,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      size,
      number: page,
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
    res.status(500).json({ 
      message: "Error fetching contact messages", 
      error: error.detail || error.hint || error.message,
      code: error.code,
    });
  }
});

// Delete contact message (ADMIN only)
router.delete("/contactMessages/delete/:id", authenticateToken, requireRoles("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ContactMessage.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Contact message not found" });
    }

    res.json({ message: "Contact message deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact message:", error);
    res.status(500).json({ message: "Error deleting contact message", error: error.message });
  }
});

// Mark contact message as responded (ADMIN, MANAGER only)
router.patch("/contactMessages/:id/responded", authenticateToken, requireMinRole("MANAGER"), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_responded } = req.body;
    
    if (typeof is_responded !== "boolean") {
      return res.status(400).json({ message: "is_responded must be a boolean" });
    }

    const updated = await ContactMessage.updateResponded(id, is_responded);
    
    if (!updated) {
      return res.status(404).json({ message: "Contact message not found" });
    }

    res.json({ message: "Contact message updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating contact message:", error);
    res.status(500).json({ message: "Error updating contact message", error: error.message });
  }
});

module.exports = router;

