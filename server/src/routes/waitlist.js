import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Session from "../models/Session.js";
import Booking from "../models/Booking.js";
import Waitlist from "../models/Waitlist.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireMember } from "../middleware/auth.js";

const router = express.Router();

const sessionIdField = z
  .string({ required_error: "sessionId is required" })
  .refine((value) => mongoose.isValidObjectId(value), "Invalid sessionId");

const bodySchema = z.object({ sessionId: sessionIdField });
const paramsSchema = z.object({ sessionId: sessionIdField });

async function getPosition(sessionId, entry) {
  const ahead = await Waitlist.countDocuments({
    session: sessionId,
    $or: [
      { createdAt: { $lt: entry.createdAt } },
      { createdAt: entry.createdAt, _id: { $lt: entry._id } },
    ],
  });
  return ahead + 1;
}

router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const entries = await Waitlist.find({ user: req.user._id })
      .populate("session")
      .sort({ createdAt: -1 });

    const waitlist = await Promise.all(
      entries.map(async (entry) => ({
        id: entry._id,
        joinedAt: entry.createdAt,
        position: await getPosition(entry.session._id, entry),
        session: {
          id: entry.session._id,
          startsAt: entry.session.startsAt,
        },
      }))
    );

    res.json({ waitlist });
  })
);

router.post(
  "/",
  requireAuth,
  requireMember,
  validate(bodySchema),
  asyncHandler(async (req, res) => {
    const session = await Session.findById(req.body.sessionId);
    if (!session) {
      throw new AppError(404, "Session not found");
    }

    if (session.startsAt <= new Date()) {
      throw new AppError(409, "Session has already started");
    }

    if (session.bookedCount < session.capacity) {
      throw new AppError(409, "Session still has free seats, book it instead");
    }

    const booking = await Booking.findOne({
      user: req.user._id,
      session: session._id,
      status: "confirmed",
    });
    if (booking) {
      throw new AppError(409, "You already booked this session");
    }

    const onList = await Waitlist.findOne({
      user: req.user._id,
      session: session._id,
    });
    if (onList) {
      throw new AppError(409, "You are already on the waitlist");
    }

    const entry = await Waitlist.create({
      user: req.user._id,
      session: session._id,
    });

    res.status(201).json({
      waitlist: {
        id: entry._id,
        sessionId: session._id,
        position: await getPosition(session._id, entry),
      },
    });
  })
);

router.delete(
  "/:sessionId",
  requireAuth,
  requireMember,
  validate(paramsSchema, "params"),
  asyncHandler(async (req, res) => {
    const removed = await Waitlist.findOneAndDelete({
      user: req.user._id,
      session: req.params.sessionId,
    });
    if (!removed) {
      throw new AppError(404, "You are not on this waitlist");
    }

    res.json({ ok: true });
  })
);

export default router;