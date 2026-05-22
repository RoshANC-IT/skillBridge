// routes/services.routes.js
import express from "express";
const router = express.Router();
import asyncHandler from "../utils/asyncHandler.js";
import {
  getAllServices,
  getJobsByJobSlug,
  getServiceBySlug,
} from "../controller/services.controller.js";

// Get all services (public route)
router.get("/", asyncHandler(getAllServices));

// Get jobs by specific service/title (public route)
router.get("/job/:jobSlug", asyncHandler(getJobsByJobSlug));

// Get service by category/slug (public route)
router.get("/:slug", asyncHandler(getServiceBySlug));

export default router;
