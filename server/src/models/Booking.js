import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
      required: true,
    },

    checkInCode: {
      type: String,
    },

    checkedInAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);


bookingSchema.index(
  { user: 1, session: 1 },
  { unique: true, partialFilterExpression: { status: "confirmed" } }
);


bookingSchema.index(
  { checkInCode: 1 },
  { unique: true, partialFilterExpression: { checkInCode: { $type: "string" } } }
);

bookingSchema.index({ session: 1, status: 1 });

bookingSchema.index({ user: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;