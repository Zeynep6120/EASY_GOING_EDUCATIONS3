// Middleware to require minimum role level
// Role hierarchy: ADMIN > MANAGER > ASSISTANT_MANAGER > TEACHER > STUDENT
const roleHierarchy = {
  ADMIN: 5,
  MANAGER: 4,
  ASSISTANT_MANAGER: 3,
  TEACHER: 2,
  STUDENT: 1,
};

const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRole = req.user.role?.toUpperCase();
    const minRoleUpper = minRole.toUpperCase();

    const userLevel = roleHierarchy[userRole] || 0;
    const minLevel = roleHierarchy[minRoleUpper] || 0;

    if (userLevel < minLevel) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

module.exports = requireMinRole;

