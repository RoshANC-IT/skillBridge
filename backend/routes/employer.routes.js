// routes/employer.routes.js
import express from "express";
const router = express.Router();
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/authorizeRole.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createJob,
  getEmployerJobs,
  updateJob,
  deleteJob,
  getJobApplicants,
  updateApplicationStatus,
  getEmployerDashboard,
  getEmployerJobDetails,
  getEmployerApplicationDetails,
} from "../controller/employer.controller.js";

/**
 * Create Job (Employer only).
 * Body should include: title, description, latitude, longitude, optional: category, salary, skills (array or comma string)
 */
router.post(
  "/jobs",
  authMiddleware,
  authorizeRole("employer"),
  asyncHandler(createJob)
);

// Get jobs posted by employer
router.get(
  "/jobs",
  authMiddleware,
  authorizeRole("employer"),
  asyncHandler(getEmployerJobs)
);

// Update job (only owner)
router.put(
  "/jobs/:id",
  authMiddleware,
  authorizeRole("employer"),
  asyncHandler(updateJob)
);

// Delete job
router.delete(
  "/jobs/:id",
  authMiddleware,
  authorizeRole("employer"),
  asyncHandler(deleteJob)
);

// View applicants for a job
router.get(
  "/jobs/:jobId/applicants",
  authMiddleware,
  authorizeRole("employer"),
  asyncHandler(getJobApplicants)
);

// Employer updates application status (accept/reject)
router.patch(
  "/applications/:appId/status",
  authMiddleware,
  authorizeRole("employer"),
  asyncHandler(updateApplicationStatus)
);

router.get(
  "/dashboard",
  authMiddleware,
  authorizeRole("employer"),
  asyncHandler(getEmployerDashboard)
);

// Get job details with applicants for employer
router.get(
  "/jobs/:jobId",
  authMiddleware,
  authorizeRole("employer"),
  asyncHandler(getEmployerJobDetails)
);

// Get application details for employer
router.get(
  "/applications/:applicationId",
  authMiddleware,
  authorizeRole("employer"),
  asyncHandler(getEmployerApplicationDetails)
);

export default router;
