import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    coverLetter: { type: String },
    appliedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: "" },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["open", "assigned", "in-progress", "completed", "paused", "closed"],
      default: "open",
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    locationLabel: { type: String, default: "" },
    pay: { type: Number, default: null },
    salary: { type: Number, default: null },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
    skills: [{ type: String }],
    applicants: [applicantSchema],
  },
  { timestamps: true }
);

jobSchema.index({ location: "2dsphere" });

export default mongoose.model("Job", jobSchema);
