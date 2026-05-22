// routes/worker.routes.js
import express from "express";
const router = express.Router();
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/authorizeRole.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validate, applyRules } from "../middleware/validate.js";
import {
  applyToJob,
  getWorkerDashboard,
  getWorkerNotifications,
  updateWorkerAvailability,
  getWorkerJobs,
  getWorkerJobDetails,
  getWorkerApplicationDetails,
  updateJobProgress,
} from "../controller/worker.controller.js";

// APPLY to a job
router.post(
  "/jobs/:jobId/apply",
  authMiddleware,
  authorizeRole("worker"),
  validate(applyRules),
  asyncHandler(applyToJob)
);

// Worker update job status
router.patch(
  "/jobs/:jobId/status",
  authMiddleware,
  authorizeRole("worker"),
  asyncHandler(updateJobProgress)
);

// Dashboard
router.get(
  "/dashboard",
  authMiddleware,
  authorizeRole("worker"),
  asyncHandler(getWorkerDashboard)
);

// Notifications
router.get(
  "/notifications",
  authMiddleware,
  authorizeRole("worker"),
  asyncHandler(getWorkerNotifications)
);

// Availability
router.put(
  "/availability",
  authMiddleware,
  authorizeRole("worker"),
  asyncHandler(updateWorkerAvailability)
);

// Get all available jobs for workers to browse
router.get(
  "/jobs",
  authMiddleware,
  authorizeRole("worker"),
  asyncHandler(getWorkerJobs)
);

// Get job details for worker
router.get(
  "/jobs/:jobId",
  authMiddleware,
  authorizeRole("worker"),
  asyncHandler(getWorkerJobDetails)
);

// Get application details for worker
router.get(
  "/applications/:applicationId",
  authMiddleware,
  authorizeRole("worker"),
  asyncHandler(getWorkerApplicationDetails)
);

export default router;
