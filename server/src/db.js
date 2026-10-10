import mongoose from "mongoose";

export async function connectDb() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
}