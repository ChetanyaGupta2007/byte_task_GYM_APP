import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Session from "../models/Session.js";
import Booking from "../models/Booking.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

const HOUR = 60 * 60 * 1000;

const checkInSchema = z.object({
  code: z
    .string({ required_error: "code is required" })
    .trim()
    .toUpperCase()
    .length(6, "Code must be 6 characters"),
});

const idSchema = z.object({
  id: z
    .string()
    .refine((value) => mongoose.isValidObjectId(value), "Invalid session id"),
});

router.post(
  "/checkin",
  validate(checkInSchema),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({ checkInCode: req.body.code })
      .populate("user", "name email")
      .populate("session");

    if (!booking) {
      throw new AppError(404, "Check-in code not found");
    }

    if (booking.status === "cancelled") {
      throw new AppError(409, "Booking is cancelled");
    }

    if (booking.checkedInAt) {
      throw new AppError(409, "Code already used");
    }

    const now = Date.now();
    const start = booking.session.startsAt.getTime();
    if (now < start || now >= start + HOUR) {
      throw new AppError(409, "Code only works during the session's hour");
    }

    const updated = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        status: "confirmed",
        checkedInAt: { $exists: false },
      },
      { checkedInAt: new Date() },
      { new: true }
    );
    if (!updated) {
      throw new AppError(409, "Code already used");
    }

    res.json({
      checkIn: {
        member: { name: booking.user.name, email: booking.user.email },
        sessionStartsAt: booking.session.startsAt,
        checkedInAt: updated.checkedInAt,
      },
    });
  })
);

router.get(
  "/sessions/:id/bookings",
  validate(idSchema, "params"),
  asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);
    if (!session) {
      throw new AppError(404, "Session not found");
    }

    const bookings = await Booking.find({ session: session._id })
      .populate("user", "name email")
      .sort({ createdAt: 1 });

    res.json({
      session: {
        id: session._id,
        startsAt: session.startsAt,
        capacity: session.capacity,
        bookedCount: session.bookedCount,
      },
      bookings: bookings.map((booking) => ({
        id: booking._id,
        status: booking.status,
        createdAt: booking.createdAt,
        checkedInAt: booking.checkedInAt || null,
        member: {
          id: booking.user._id,
          name: booking.user.name,
          email: booking.user.email,
        },
      })),
    });
  })
);

export default router;