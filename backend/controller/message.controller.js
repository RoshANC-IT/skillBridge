import Message from "../models/message.model.js";


/**
 * POST /api/messages
 * body (multipart/form-data):
 *   - receiver: ObjectId (required)
 *   - message: string (optional if attachments)
 *   - attachments[]: files (optional)
 *
 * Requires: authMiddleware sets req.user.{_id|id}
 */
export const sendMessage = async (req, res) => {
  try {
    const sender = req.user._id || req.user.id;
    const { receiver, message } = req.body;

    if (!receiver || (!message && (!req.files || req.files.length === 0))) {
      return res.status(400).json({ message: "Provide text or at least one attachment" });
    }

    // Upload files (if any) to Cloudinary
    let attachments = null;
    if (req.files?.length) {
      const uploads = await Promise.all(
        req.files.map(async (file) => {
          // if skipping Cloudinary, use local path: const url = `/uploads/${file.filename}`
          const upload= await cloudinary.uploader.upload_stream({
            resource_type: "auto",
            folder: "skilllink/messages",
          }, (err, result) => {
            // This branch is handled by stream below, keeping for clarity
          });

          // Because upload_stream needs a stream, wrap it:
          const resPromise = new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "auto", folder: "skilllink/messages" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            stream.end(file.buffer);
          });

          const result = await resPromise;
          return {
            url: result.secure_url,
            publicId: result.public_id,
            mimeType: file.mimetype,
            bytes: file.size,
            originalName: file.originalname,
          };
        })
      );
      attachments = uploads;
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      message: message || "",
      attachments,
      deliveredAt: new Date(),
    });

    const io = req.app.get("io");
    const payload = {
      _id: newMessage._id,
      sender: sender.toString(),
      receiver: receiver.toString(),
      message: newMessage.message,
      attachments: newMessage.attachments,
      read: newMessage.read,
      deliveredAt: newMessage.deliveredAt,
      seenAt: newMessage.seenAt,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    };

    // Notify receiver + echo to sender
    io?.to(receiver.toString()).emit("message:new", payload);
    io?.to(sender.toString()).emit("message:sent", payload);

    return res.status(201).json(payload);
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/messages/:userId
 * query: limit, cursor (ISO date)
 * returns messages between me and :userId, paginated (older-than cursor)
 */
export const getConversation = async (req, res) => {
  try {
    const myId = req.user._id || req.user.id;
    const { userId } = req.params;

    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const baseFilter = {
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    };

    const filter = cursor
      ? { ...baseFilter, createdAt: { $lt: cursor } }
      : baseFilter;

    // newest first
    const docs = await Message.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit);

    // next cursor is the *oldest* item we returned
    const nextCursor = docs.length ? docs[docs.length - 1].createdAt.toISOString() : null;

    // return oldest → newest for UI
    const messages = [...docs].reverse();

    return res.json({ messages, nextCursor, pageSize: messages.length });
  } catch (err) {
    console.error("getConversation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/messages/read/:userId
 * Marks all messages from :userId → me as read, emits read receipt.
 */
export const markAsRead = async (req, res) => {
  try {
    const myId = req.user._id || req.user.id;
    const { userId } = req.params;

    const now = new Date();
    const result = await Message.updateMany(
      { sender: userId, receiver: myId, read: false },
      { $set: { read: true, seenAt: now } }
    );

    const io = req.app.get("io");
    io?.to(userId.toString()).emit("message:read", {
      by: myId.toString(),
      at: now.toISOString(),
    });

    return res.json({ updated: result.modifiedCount });
  } catch (err) {
    console.error("markAsRead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
