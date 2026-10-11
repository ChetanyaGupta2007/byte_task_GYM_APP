import Waitlist from "../models/Waitlist.js";
import Booking from "../models/Booking.js";

export async function promoteFromWaitlist(session) {
  if (session.startsAt <= new Date()) {
    return null;
  }

  while (true) {
    const entry = await Waitlist.findOneAndDelete(
      { session: session._id },
      { sort: { createdAt: 1, _id: 1 } }
    );

    if (!entry) {
      return null;
    }

    try {
      return await Booking.create({
        user: entry.user,
        session: session._id,
      });
    } catch (error) {
      if (error.code === 11000) {
        continue;
      }
      console.error("Waitlist promotion failed:", error);
      return null;
    }
  }
}