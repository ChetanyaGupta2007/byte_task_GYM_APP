import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Session from "../models/Session.js";
import Booking from "../models/Booking.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireMember } from "../middleware/auth.js";

const router = express.Router();

const createSchema = z.object({
  sessionId: z
    .string({ required_error: "sessionId is required" })
    .refine((value) => mongoose.isValidObjectId(value), "Invalid sessionId"),
});

router.post(
  "/",
  requireAuth,
  requireMember,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const session = await Session.findById(req.body.sessionId);
    if (!session) {
      throw new AppError(404, "Session not found");
    }

    if (session.startsAt <= new Date()) {
      throw new AppError(409, "Session has already started");
    }

    const existing = await Booking.findOne({
      user: req.user._id,
      session: session._id,
      status: "confirmed",
    });
    if (existing) {
      throw new AppError(409, "You already booked this session");
    }

    const claimed = await Session.findOneAndUpdate(
      {
        _id: session._id,
        startsAt: { $gt: new Date() },
        $expr: { $lt: ["$bookedCount", "$capacity"] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );
    if (!claimed) {
      throw new AppError(409, "Session is full");
    }

    let booking;
    try {
      booking = await Booking.create({
        user: req.user._id,
        session: session._id,
      });
    } catch (error) {
      await Session.updateOne(
        { _id: session._id },
        { $inc: { bookedCount: -1 } }
      );
      throw error;
    }

    res.status(201).json({
      booking: {
        id: booking._id,
        sessionId: booking.session,
        status: booking.status,
        createdAt: booking.createdAt,
      },
      seatsRemaining: claimed.capacity - claimed.bookedCount,
    });
  })
);

export default router;