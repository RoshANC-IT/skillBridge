import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";

// Helper function to calculate earnings (used by both endpoint and Socket.IO)
async function getWorkerEarningsData(workerId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  const completedBookings = await Booking.find({
    worker: workerId,
    status: { $in: ["confirmed", "completed"] },
  })
    .select("price serviceType serviceSlug createdAt bookingDate")
    .sort({ createdAt: 1 });

  const todayBookings = completedBookings.filter(
    (b) => new Date(b.createdAt) >= today && new Date(b.createdAt) <= todayEnd
  );
  const todayEarnings = todayBookings.reduce((sum, b) => sum + (b.price || 0), 0);

  const monthBookings = completedBookings.filter(
    (b) => new Date(b.createdAt) >= monthStart && new Date(b.createdAt) <= monthEnd
  );
  const monthEarnings = monthBookings.reduce((sum, b) => sum + (b.price || 0), 0);

  const lifetimeEarnings = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);

  const breakdownByType = {};
  completedBookings.forEach((booking) => {
    const serviceType = booking.serviceType || booking.serviceSlug || "Unknown";
    if (!breakdownByType[serviceType]) {
      breakdownByType[serviceType] = { total: 0, count: 0 };
    }
    breakdownByType[serviceType].total += booking.price || 0;
    breakdownByType[serviceType].count += 1;
  });

  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStartDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEndDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthBookingsData = completedBookings.filter(
      (b) => new Date(b.createdAt) >= monthStartDate && new Date(b.createdAt) <= monthEndDate
    );

    const earnings = monthBookingsData.reduce((sum, b) => sum + (b.price || 0), 0);
    monthlyData.push({
      month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      earnings,
      count: monthBookingsData.length,
    });
  }

  return {
    today: { earnings: todayEarnings, count: todayBookings.length },
    thisMonth: { earnings: monthEarnings, count: monthBookings.length },
    lifetime: { earnings: lifetimeEarnings, count: completedBookings.length },
    breakdownByType,
    monthlyGrowth: monthlyData,
  };
}

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const {
      workerId,
      serviceType,
      serviceSlug,
      bookingDate,
      bookingTime,
      address,
      city,
      postalCode,
      phone,
      email,
      notes,
      price,
      packageName,
    } = req.body;

    const employerId = req.user._id || req.user.id;

    // Validate required fields
    if (!workerId || !serviceType || !serviceSlug || !bookingDate || !bookingTime || !address || !city) {
      return res.status(400).json({
        message: "Missing required fields: workerId, serviceType, serviceSlug, bookingDate, bookingTime, address, city",
      });
    }

    // Verify worker exists
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Check for duplicate booking within the last 5 seconds (prevent double-submission)
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existingBooking = await Booking.findOne({
      employer: employerId,
      worker: workerId,
      serviceType,
      bookingDate: new Date(bookingDate),
      bookingTime: bookingTime.trim(),
      address: address.trim(),
      status: { $in: ["pending", "confirmed"] },
      createdAt: { $gte: fiveSecondsAgo },
    });

    if (existingBooking) {
      console.warn("⚠️ Duplicate booking attempt detected, returning existing booking:", existingBooking._id);
      await existingBooking.populate("worker", "firstName lastName userName email phoneNumber workerType city avatarUrl");
      await existingBooking.populate("employer", "firstName lastName userName email city");
      return res.status(200).json({
        message: "Booking already exists",
        booking: existingBooking,
        isDuplicate: true,
      });
    }

    // Create booking
    const booking = await Booking.create({
      employer: employerId,
      worker: workerId,
      serviceType,
      serviceSlug,
      bookingDate: new Date(bookingDate),
      bookingTime,
      address,
      city,
      postalCode: postalCode || "",
      phone: phone || "",
      email: email || "",
      notes: notes || "",
      price: price || 0,
      packageName: packageName || "",
      status: "pending",
    });

    // Populate worker and employer details
    await booking.populate("worker", "firstName lastName userName email phoneNumber workerType city avatarUrl");
    await booking.populate("employer", "firstName lastName userName email city");

    // Emit Socket.IO notification to worker
    const io = req.app.get("io");
    if (io && workerId) {
      io.to(workerId.toString()).emit("new_booking", {
        booking: booking.toObject(),
        message: `New booking request for ${serviceType}`,
      });
    }

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ message: error.message || "Failed to create booking" });
  }
};

// Get all bookings for an employer
export const getEmployerBookings = async (req, res) => {
  try {
    const employerId = req.user._id || req.user.id;

    const bookings = await Booking.find({ employer: employerId })
      .populate("worker", "firstName lastName userName email phoneNumber workerType city avatarUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching employer bookings:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch bookings" });
  }
};

// Get all bookings for a worker
export const getWorkerBookings = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;
    const { status } = req.query; // Optional status filter

    const query = { worker: workerId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("employer", "firstName lastName userName email city")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching worker bookings:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch bookings" });
  }
};

// Get pending bookings for a worker
export const getPendingBookings = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;

    const bookings = await Booking.find({ worker: workerId, status: "pending" })
      .populate("employer", "firstName lastName userName email city")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings, count: bookings.length });
  } catch (error) {
    console.error("Error fetching pending bookings:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch pending bookings" });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "in-progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check authorization - only employer or worker can update
    const userId = req.user._id || req.user.id;
    if (booking.employer.toString() !== userId.toString() && booking.worker.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to update this booking" });
    }

    booking.status = status;
    await booking.save();

    // Populate for notification
    await booking.populate("worker", "firstName lastName userName email phoneNumber workerType city avatarUrl");
    await booking.populate("employer", "firstName lastName userName email city");

    // Emit Socket.IO notification to employer when worker accepts/rejects
    const io = req.app.get("io");
    if (io && booking.employer) {
      const employerId = booking.employer._id || booking.employer;
      io.to(employerId.toString()).emit("booking_status_updated", {
        booking: booking.toObject(),
        message: `Booking ${status === "confirmed" ? "accepted" : status} by worker`,
      });
    }

    // Emit earnings update to worker when booking is accepted/confirmed
    if (io && status === "confirmed" && booking.worker) {
      const workerId = booking.worker._id || booking.worker;
      // Fetch updated earnings
      const earningsData = await getWorkerEarningsData(workerId.toString());
      io.to(workerId.toString()).emit("earnings_updated", earningsData);
    }

    // Broadcast stats update to all clients when booking is confirmed/accepted
    // This will trigger home page stats to refresh
    if (io && status === "confirmed") {
      console.log("📊 Broadcasting stats update due to booking acceptance");
      // Emit to a public channel that home page can listen to
      io.emit("stats_updated", {
        type: "booking_accepted",
        bookingId: booking._id.toString(),
        serviceType: booking.serviceType,
        timestamp: new Date().toISOString(),
        message: "A worker has accepted a booking - stats updated",
      });
    }

    return res.status(200).json({
      message: "Booking status updated",
      booking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({ message: error.message || "Failed to update booking" });
  }
};

// Get single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id || req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate("worker", "firstName lastName userName email phoneNumber workerType city avatarUrl")
      .populate("employer", "firstName lastName userName email city");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check authorization
    if (booking.employer._id.toString() !== userId.toString() && booking.worker._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to view this booking" });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch booking" });
  }
};

// Get worker earnings statistics
export const getWorkerEarnings = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;
    const earningsData = await getWorkerEarningsData(workerId.toString());
    return res.status(200).json(earningsData);
  } catch (error) {
    console.error("Error fetching worker earnings:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch earnings" });
  }
};

