// middleware/role.middleware.js

const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ error: "Access denied. Role not found." });
      }

      if (req.user.role !== requiredRole) {
        return res.status(403).json({ error: "Access denied. Insufficient permissions." });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: "Role validation failed." });
    }
  };
};

module.exports = roleMiddleware;