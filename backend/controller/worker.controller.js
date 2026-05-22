// controllers/worker.controller.js
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";

// APPLY to a job
export const applyToJob = async (req, res) => {
  const { jobId } = req.params;
  const { coverLetter } = req.body;
  const workerId = req.user._id || req.user.id;

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.status !== "open")
    return res.status(400).json({ message: "Job is not open for applications" });

  if (job.employer?.toString() === workerId.toString()) {
    return res.status(400).json({ message: "You cannot apply to your own job" });
  }

  const already = job.applicants.find(
    (a) => a.workerId.toString() === workerId.toString()
  );
  if (already)
    return res.status(400).json({ message: "You already applied to this job" });

  job.applicants.push({
    workerId,
    coverLetter,
    status: "pending",
    appliedAt: new Date(),
  });
  await job.save();

  await Application.create({
    job: job._id,
    worker: workerId,
    coverLetter,
    status: "pending",
  });

  const io = req.app.get("io");
  if (io) {
    // Get worker details for notification
    const worker = await User.findById(workerId).select("firstName lastName");
    const workerName = worker
      ? `${worker.firstName} ${worker.lastName}`.trim()
      : "A worker";

    io.to(job.employer.toString()).emit("notification", {
      type: "application:new",
      jobId: job._id.toString(),
      jobTitle: job.title,
      from: workerId.toString(),
      workerName: workerName,
      message: `${workerName} applied to your job: ${job.title}`,
      at: new Date().toISOString(),
    });

    // Also emit a dashboard update event
    io.to(job.employer.toString()).emit("dashboard_updated", {
      type: "new_application",
      jobId: job._id.toString(),
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(201).json({ message: "Application submitted" });
};

const buildWorkerDashboard = async (workerId) => {
  const jobs = await Job.find({
    "applicants.workerId": workerId,
  })
    .select("title status employer applicants pay salary locationLabel createdAt")
    .populate("employer", "firstName lastName");

  const stats = {
    totalApplications: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  };

  const applications = [];

  // Get all applications for this worker to map job IDs to application IDs
  const allApplications = await Application.find({ worker: workerId }).select(
    "job _id"
  );
  const jobToAppIdMap = new Map();
  allApplications.forEach((app) => {
    jobToAppIdMap.set(app.job.toString(), app._id.toString());
  });

  jobs.forEach((job) => {
    const mine = job.applicants.find(
      (a) => a.workerId.toString() === workerId.toString()
    );
    if (!mine) return;

    stats.totalApplications += 1;
    stats[mine.status] = (stats[mine.status] || 0) + 1;

    applications.push({
      jobId: job._id,
      applicationId: jobToAppIdMap.get(job._id.toString()) || null,
      title: job.title,
      employerName: job.employer
        ? `${job.employer.firstName} ${job.employer.lastName}`.trim()
        : "Employer",
      myStatus: mine.status,
      jobStatus: job.status,
      appliedAt: mine.appliedAt,
      pay: job.pay ?? job.salary,
      location: job.locationLabel,
    });
  });

  // Get booking notifications
  const pendingBookings = await Booking.find({
    worker: workerId,
    status: "pending",
  })
    .populate("employer", "firstName lastName userName")
    .sort({ createdAt: -1 })
    .limit(10);

  const bookingNotifications = pendingBookings.map((booking) => ({
    id: `booking-${booking._id}`,
    type: "booking",
    bookingId: booking._id,
    message: `New booking request for ${booking.serviceType} from ${booking.employer
        ? `${booking.employer.firstName} ${booking.employer.lastName}`.trim()
        : "an employer"
      }`,
    createdAt: booking.createdAt,
    status: "pending",
    booking: {
      serviceType: booking.serviceType,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      city: booking.city,
      price: booking.price,
    },
  }));

  // Get application notifications
  const applicationNotifications = applications
    .filter((app) => app.myStatus !== "pending")
    .map((app) => ({
      id: `${app.jobId}-${app.myStatus}`,
      type: "application",
      jobId: app.jobId,
      jobTitle: app.title,
      message:
        app.myStatus === "accepted"
          ? `Great news! ${app.title} application is accepted.`
          : `Heads up! ${app.title} application was ${app.myStatus}.`,
      createdAt: app.appliedAt,
      status: app.myStatus,
    }));

  // Combine and sort all notifications
  const notifications = [...bookingNotifications, ...applicationNotifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  return {
    applications,
    stats,
    notifications,
    pendingBookingsCount: pendingBookings.length,
  };
};

export const getWorkerDashboard = async (req, res) => {
  const workerId = req.user._id || req.user.id;
  const { applications, stats, notifications } = await buildWorkerDashboard(
    workerId
  );

  return res.json({
    profile: {
      id: workerId,
      name: `${req.user.firstName} ${req.user.lastName}`.trim(),
      role: req.user.role,
      availability: req.user.availability,
      avatarUrl: req.user.avatarUrl,
    },
    stats,
    applications,
    notifications,
  });
};

export const getWorkerNotifications = async (req, res) => {
  const workerId = req.user._id || req.user.id;
  const { notifications } = await buildWorkerDashboard(workerId);
  res.json({ notifications });
};

export const updateWorkerAvailability = async (req, res) => {
  const { availability } = req.body;
  if (!["available", "busy", "offline"].includes(availability)) {
    return res.status(400).json({ message: "Invalid availability status" });
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { availability },
    { new: true }
  ).select("firstName lastName role availability avatarUrl");

  return res.json({
    message: "Availability updated",
    user: updated,
  });
};

// Get all available jobs for workers to browse
export const getWorkerJobs = async (req, res) => {
  const workerId = req.user._id || req.user.id;
  const { status = "open", category, search } = req.query;

  const query = {
    status: status === "all" ? { $in: ["open", "in-progress"] } : status,
    employer: { $ne: workerId }, // Exclude own jobs
  };

  if (category && category !== "all") {
    query.category = category;
  }

  const { skill } = req.query;
  if (skill && skill !== "all") {
    query.skills = skill; // If job.skills array contains the skill, it will match
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const jobs = await Job.find(query)
    .populate("employer", "firstName lastName")
    .select("-applicants")
    .sort({ createdAt: -1 })
    .limit(50);

  const jobIds = jobs.map((job) => job._id);
  const applications = await Application.find({
    job: { $in: jobIds },
    worker: workerId,
  });

  const appliedJobIds = new Set(applications.map((app) => app.job.toString()));

  return res.json({
    jobs: jobs.map((job) => ({
      id: job._id,
      title: job.title,
      description: job.description,
      category: job.category,
      location: job.locationLabel,
      pay: job.pay ?? job.salary,
      skills: job.skills,
      status: job.status,
      createdAt: job.createdAt,
      employer: job.employer
        ? {
          id: job.employer._id,
          name: `${job.employer.firstName} ${job.employer.lastName}`.trim(),
        }
        : null,
      hasApplied: appliedJobIds.has(job._id.toString()),
    })),
  });
};

// Get job details for worker
export const getWorkerJobDetails = async (req, res) => {
  const job = await Job.findById(req.params.jobId)
    .populate("employer", "firstName lastName email")
    .select("-applicants");

  if (!job) return res.status(404).json({ message: "Job not found" });

  const workerId = req.user._id || req.user.id;
  const hasApplied = await Application.findOne({
    job: job._id,
    worker: workerId,
  });

  return res.json({
    job: {
      id: job._id,
      title: job.title,
      description: job.description,
      category: job.category,
      location: job.locationLabel,
      pay: job.pay ?? job.salary,
      skills: job.skills,
      status: job.status,
      createdAt: job.createdAt,
      employer: job.employer
        ? {
          id: job.employer._id,
          name: `${job.employer.firstName} ${job.employer.lastName}`.trim(),
          email: job.employer.email,
        }
        : null,
    },
    hasApplied: !!hasApplied,
    applicationId: hasApplied?._id,
  });
};

// Get application details for worker
export const getWorkerApplicationDetails = async (req, res) => {
  const workerId = req.user._id || req.user.id;
  const application = await Application.findById(req.params.applicationId)
    .populate("job")
    .populate("worker", "firstName lastName email");

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (application.worker._id.toString() !== workerId.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const job = await Job.findById(application.job._id || application.job).populate(
    "employer",
    "firstName lastName email"
  );

  return res.json({
    application: {
      id: application._id,
      status: application.status,
      coverLetter: application.coverLetter,
      appliedAt: application.createdAt,
      updatedAt: application.updatedAt,
    },
    job: {
      id: job._id,
      title: job.title,
      description: job.description,
      location: job.locationLabel,
      pay: job.pay ?? job.salary,
      skills: job.skills,
      status: job.status,
      employer: job.employer
        ? {
          id: job.employer._id,
          name: `${job.employer.firstName} ${job.employer.lastName}`.trim(),
          email: job.employer.email,
        }
        : null,
    },
  });
};

// Worker updates the progress/status of their assigned job
export const updateJobProgress = async (req, res) => {
  const { jobId } = req.params;
  const { status } = req.body;
  const workerId = req.user._id || req.user.id;

  if (!["in-progress", "completed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status update for worker" });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (String(job.worker) !== String(workerId)) {
    return res.status(403).json({ message: "Forbidden: You are not assigned to this job" });
  }

  if (job.status !== "assigned" && job.status !== "in-progress") {
    return res.status(400).json({ message: `Cannot transition job from ${job.status} to ${status}` });
  }

  job.status = status;
  await job.save();

  return res.json({ message: `Job marked as ${status}`, job });
};
