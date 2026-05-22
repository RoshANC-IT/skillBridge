import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: String,            // if using Cloudinary
    mimeType: String,            // e.g. "image/png"
    bytes: Number,               // size in bytes
    originalName: String,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    message:  { type: String, trim: true },  // optional if attachments present
    attachments: [attachmentSchema],         // 0..n files

    read: { type: Boolean, default: false },
    deliveredAt: Date,
    seenAt: Date,
  },
  { timestamps: true }
);

// helpful compound index for conversation queries + pagination
messageSchema.index(
  { sender: 1, receiver: 1, createdAt: -1 }
);
messageSchema.index(
  { receiver: 1, sender: 1, createdAt: -1 }
);


export default mongoose.model("Message", messageSchema);
