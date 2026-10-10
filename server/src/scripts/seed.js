import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { connectDb } from "../db.js";
import User from "../models/User.js";

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env"
    );
  }

  if (password.length < 12) {
    throw new Error("Admin seed password must be at least 12 characters.");
  }

  await connectDb();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.role !== "admin") {
      throw new Error("The seed email already belongs to a non-admin account.");
    }

    console.log("Admin already exists. No changes made.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    name: "Admin",
    email,
    passwordHash,
    role: "admin",
  });

  console.log("Admin created successfully.");
}

try {
  await seed();
} catch (error) {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}