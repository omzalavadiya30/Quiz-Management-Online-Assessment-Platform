import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/constants.js";

export function verifyToken(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const roles = allowedRoles.flat();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role permissions" });
    }

    return next();
  };
}

export function requireAdmin(req, res, next) {
  return requireRole("ADMIN")(req, res, next);
}

export function requireStudent(req, res, next) {
  return requireRole("STUDENT")(req, res, next);
}

export default verifyToken;
