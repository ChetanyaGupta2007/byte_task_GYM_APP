import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
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


},
{
timestamps: { createdAt: true, updatedAt: false },
}
);

waitlistSchema.index(
{ user: 1, session: 1 },
{ unique: true }
);

waitlistSchema.index({ session: 1, createdAt: 1, _id: 1 });

const Waitlist = mongoose.model("Waitlist", waitlistSchema);

export default Waitlist;
