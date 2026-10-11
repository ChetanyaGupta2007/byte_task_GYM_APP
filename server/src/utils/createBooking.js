import crypto from "crypto";
import Booking from "../models/Booking.js";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

export async function createBooking(userId, sessionId) {
  while (true) {
    try {
      return await Booking.create({
        user: userId,
        session: sessionId,
        checkInCode: generateCode(),
      });
    } catch (error) {
      if (!error.keyPattern?.checkInCode) {
        throw error;
      }
    }
  }
}