import express from "express";
import { getLiveStats } from "../controller/stats.controller.js";

const router = express.Router();

// Get live statistics (public endpoint, no auth required)
router.get("/", getLiveStats);

export default router;









