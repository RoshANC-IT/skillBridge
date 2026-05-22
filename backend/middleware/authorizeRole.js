// middleware/authorizeRole.js
export default function authorizeRole(requiredRole) {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({ message: "Unauthorized: user missing" });
      }
      if (req.user.role !== requiredRole) {
        return res.status(403).json({ message: "Access denied: insufficient permissions" });
      }
      next();
    } catch (err) {
      return res.status(500).json({ message: "Server error in authorization" });
    }
  };
}
