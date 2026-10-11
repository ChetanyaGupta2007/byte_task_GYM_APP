import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Session from "../models/Session.js";
import Booking from "../models/Booking.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { promoteFromWaitlist } from "../utils/waitlist.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireMember } from "../middleware/auth.js";

const router = express.Router();

const createSchema = z.object({
  sessionId: z
    .string({ required_error: "sessionId is required" })
    .refine((value) => mongoose.isValidObjectId(value), "Invalid sessionId"),
});

const idSchema = z.object({
  id: z
    .string()
    .refine((value) => mongoose.isValidObjectId(value), "Invalid booking id"),
});

function toBookingView(booking) {
  return {
    id: booking._id,
    status: booking.status,
    createdAt: booking.createdAt,
    session: {
      id: booking.session._id,
      startsAt: booking.session.startsAt,
    },
  };
}

router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("session")
      .sort({ createdAt: -1 });

    res.json({ bookings: bookings.map(toBookingView) });
  })
);

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

router.post(
  "/:id/cancel",
  requireAuth,
  validate(idSchema, "params"),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!booking) {
      throw new AppError(404, "Booking not found");
    }

    if (booking.status === "cancelled") {
      throw new AppError(409, "Booking is already cancelled");
    }

    const session = await Session.findById(booking.session);
    if (session.startsAt <= new Date()) {
      throw new AppError(409, "Session has already started");
    }

    const cancelled = await Booking.findOneAndUpdate(
      { _id: booking._id, status: "confirmed" },
      { status: "cancelled" }
    );
    if (!cancelled) {
      throw new AppError(409, "Booking is already cancelled");
    }

    const promoted = await promoteFromWaitlist(session);

    const updated = promoted
      ? await Session.findById(session._id)
      : await Session.findByIdAndUpdate(
          session._id,
          { $inc: { bookedCount: -1 } },
          { new: true }
        );

    res.json({
      booking: { id: booking._id, status: "cancelled" },
      seatsRemaining: updated.capacity - updated.bookedCount,
    });
  })
);

export default router;