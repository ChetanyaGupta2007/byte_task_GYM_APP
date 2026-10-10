import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "Authentication required");
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  const user = await User.findById(payload.id);
  if (!user) {
    throw new AppError(401, "Invalid or expired token");
  }

  req.user = user;
  next();
});

export function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return next(new AppError(403, "Admin access required"));
  }
  next();
}