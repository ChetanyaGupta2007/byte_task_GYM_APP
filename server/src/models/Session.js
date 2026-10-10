import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
{
startsAt: {
type: Date,
required: true,
validate: {
validator(value) {
return (
value.getUTCMinutes() === 0 &&
value.getUTCSeconds() === 0 &&
value.getUTCMilliseconds() === 0
);
},
message: "startsAt must fall exactly on the UTC hour.",
},
},


capacity: {
  type: Number,
  required: true,
  default: 20,
  min: 1,
  validate: {
    validator: Number.isInteger,
    message: "Capacity must be an integer.",
  },
},

bookedCount: {
  type: Number,
  required: true,
  default: 0,
  min: 0,
  validate: {
    validator: Number.isInteger,
    message: "bookedCount must be an integer.",
  },
},


},
{
timestamps: { createdAt: true, updatedAt: false },
}
);

sessionSchema.index({ startsAt: 1 }, { unique: true });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
