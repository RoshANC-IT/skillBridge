import express from "express";
import { handleChatMessage } from "../controllers/chat.controller.js";

const router = express.Router();

// Route: POST /api/chat
// We don't make auth mandatory here so that non-logged-in users can also use the chatbot on the landing page.
// The frontend can pass the role (employer, worker, guest) in the body.
router.post("/", handleChatMessage);

export default router;
