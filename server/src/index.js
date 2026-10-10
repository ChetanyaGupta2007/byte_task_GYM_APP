import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDb } from "./db.js";
import User from "./models/User.js";
import Session from "./models/Session.js";
import Booking from "./models/Booking.js";
import Waitlist from "./models/Waitlist.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1 });
});

async function start() {
  await connectDb();

  
  await Promise.all([
    User.init(),
    Session.init(),
    Booking.init(),
    Waitlist.init(),
  ]);

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});