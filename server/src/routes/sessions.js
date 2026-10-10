import express from "express";
import { z } from "zod";
import Session from "../models/Session.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const createSchema = z.object({
  startsAt: z
    .string({ required_error: "startsAt is required" })
    .datetime("startsAt must be a UTC time like 2026-10-20T06:00:00Z")
    .transform((value) => new Date(value))
    .refine(
      (date) =>
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0 &&
        date.getUTCMilliseconds() === 0,
      "startsAt must be exactly on the hour"
    )
    .refine((date) => date > new Date(), "startsAt must be in the future"),
  capacity: z
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(20, "Capacity can be at most 20")
    .default(20),
});

function toSessionView(session) {
  return {
    id: session._id,
    startsAt: session.startsAt,
    capacity: session.capacity,
    bookedCount: session.bookedCount,
    seatsRemaining: session.capacity - session.bookedCount,
  };
}

router.post(
  "/",
  requireAuth,
  requireAdmin,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { startsAt, capacity } = req.body;

    const existing = await Session.findOne({ startsAt });
    if (existing) {
      throw new AppError(409, "A session already starts at this time");
    }

    const session = await Session.create({ startsAt, capacity });

    res.status(201).json({ session: toSessionView(session) });
  })
);

export default router;