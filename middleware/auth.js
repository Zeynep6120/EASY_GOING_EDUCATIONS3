const jwt = require("jsonwebtoken");
const pool = require("../db/connection");

/**
 * authenticateToken
 * - Extracts Bearer token
 * - Verifies JWT signature
 * - Adds req.user = { id, role, username, iat, exp }
 * - Blocks requests for inactive accounts (users.is_active = false)
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"] || "";

  // Accept headers like:
  //   Authorization: Bearer <token>
  const parts = String(authHeader).split(" ").filter(Boolean);
  const token =
    parts.length >= 2 && parts[0].toLowerCase() === "bearer"
      ? parts.slice(1).join(" ").trim()
      : "";

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // { id, role, username, iat, exp }

    // Safety: If the account is deactivated after login, block API access.
    const dbRes = await pool.query(
      "SELECT is_active FROM users WHERE user_id = $1",
      [req.user.id]
    );

    if (dbRes.rowCount === 0) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const isActive = dbRes.rows[0].is_active;
    if (isActive === false) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authenticateToken;
