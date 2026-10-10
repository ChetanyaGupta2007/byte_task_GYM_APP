import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDb } from "./db.js";
import User from "./models/User.js";
import Session from "./models/Session.js";
import Booking from "./models/Booking.js";
import Waitlist from "./models/Waitlist.js";
import authRouter from "./routes/auth.js";
import errorHandler from "./middleware/errorHandler.js";
import sessionsRouter from "./routes/sessions.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/sessions", sessionsRouter);

app.get("/health", (req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1 });
});

app.use("/api/auth", authRouter);

app.use((req, res) => {
  res.status(404).json({ error: { message: "Route not found" } });
});

app.use(errorHandler);

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Check your .env file.");
  }

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