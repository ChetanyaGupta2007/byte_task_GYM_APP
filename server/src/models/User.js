import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

const User = mongoose.model("User", userSchema);

export default User;