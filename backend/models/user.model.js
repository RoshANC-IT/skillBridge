import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    profileName: {
      type: String,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["worker", "employer", "admin"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
    },
    availability: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "available",
    },
    // Worker-specific fields
    workerType: {
      type: String,
      trim: true,
      // Only required for workers, validated in controller
    },
    city: {
      type: String,
      trim: true,
      // Only required for workers, validated in controller
    },
    phoneNumber: {
      type: String,
      trim: true,
      // Only required for workers, validated in controller
    },
    address: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    experience: {
      type: Number,
      min: 0,
      max: 50,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
