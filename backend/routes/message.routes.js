import express from "express";
import {
  sendMessage,
  getConversation,
  markAsRead,
} from "../controller/message.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Send a message
router.post("/", authMiddleware, sendMessage);

// Get conversation with a specific user
router.get("/:userId", authMiddleware, getConversation);

// Mark messages from :userId as read
router.patch("/read/:userId", authMiddleware, markAsRead);

export default router;
