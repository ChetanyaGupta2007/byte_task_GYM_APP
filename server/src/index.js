import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1 });
});

await connectDb();

app.listen(process.env.PORT || 4000, () => {
  console.log("API running");
});
