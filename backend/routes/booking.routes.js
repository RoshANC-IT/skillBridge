import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/authorizeRole.js";
import {
  createBooking,
  getEmployerBookings,
  getWorkerBookings,
  getPendingBookings,
  updateBookingStatus,
  getBookingById,
  getWorkerEarnings,
} from "../controller/booking.controller.js";

const router = express.Router();

// Create a new booking (employer only)
router.post("/", authMiddleware, createBooking);

// Get all bookings for employer
router.get("/employer", authMiddleware, getEmployerBookings);

// Get all bookings for worker
router.get("/worker", authMiddleware, getWorkerBookings);

// Get pending bookings for worker
router.get("/worker/pending", authMiddleware, getPendingBookings);

// Get worker earnings statistics
router.get("/worker/earnings", authMiddleware, authorizeRole("worker"), getWorkerEarnings);

// Get single booking by ID
router.get("/:bookingId", authMiddleware, getBookingById);

// Update booking status
router.patch("/:bookingId/status", authMiddleware, updateBookingStatus);

export default router;

