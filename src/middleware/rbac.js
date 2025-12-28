const ROLE_ORDER = {
  STUDENT: 1,
  INSTRUCTOR: 2,
  ASSISTANT_MANAGER: 3,
  MANAGER: 4,
  ADMIN: 5,
  // Backward compatibility
  TEACHER: 2,
};

function normalizeRole(role) {
  return String(role || "").toUpperCase();
}

function requireRoles(...allowed) {
  const allowedSet = new Set(allowed.map(normalizeRole));
  return (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    if (allowedSet.has(role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}

function requireMinRole(minRole) {
  const min = normalizeRole(minRole);
  return (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    const roleValue = ROLE_ORDER[role] || 0;
    const minValue = ROLE_ORDER[min] || 0;
    if (roleValue >= minValue) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}

module.exports = {
  ROLE_ORDER,
  normalizeRole,
  requireRoles,
  requireMinRole,
};
