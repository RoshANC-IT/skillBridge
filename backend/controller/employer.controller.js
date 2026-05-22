// controllers/employer.controller.js
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";

/**
 * Create Job (Employer only).
 * Body should include: title, description, latitude, longitude, optional: category, salary, skills (array or comma string)
 */
export const createJob = async (req, res) => {
  const {
    title,
    description,
    category,
    latitude,
    longitude,
    salary,
    skills,
    location,
    pay,
  } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ message: "Missing required fields: title, description" });
  }

  const normalizedPay =
    pay === undefined || pay === null || pay === "" ? null : Number(pay);
  const normalizedSalary =
    salary === undefined || salary === null || salary === "" ? null : Number(salary);

  const jobPayload = {
    title,
    description,
    category: category || "",
    employer: req.user._id || req.user.id,
    salary: normalizedSalary ?? normalizedPay,
    pay: normalizedPay ?? normalizedSalary,
    locationLabel: location || "",
    skills: Array.isArray(skills)
      ? skills
      : skills
        ? skills.split(",").map((s) => s.trim())
        : [],
  };

  if (latitude !== undefined && longitude !== undefined) {
    jobPayload.location = {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    };
  }

  const job = await Job.create(jobPayload);
  return res.status(201).json({ job });
};

// Get jobs posted by employer
export const getEmployerJobs = async (req, res) => {
  const jobs = await Job.find({ employer: req.user._id || req.user.id }).sort({
    createdAt: -1,
  });
  return res.json({ jobs });
};

// Update job (only owner)
export const updateJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.employer.toString() !== (req.user._id || req.user.id).toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const updatable = [
    "title",
    "description",
    "category",
    "salary",
    "pay",
    "skills",
    "isActive",
    "status",
    "locationLabel",
  ];
  updatable.forEach((f) => {
    if (req.body[f] !== undefined) job[f] = req.body[f];
  });

  if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
    job.location = {
      type: "Point",
      coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
    };
  }

  await job.save();
  return res.json({ job });
};

// Delete job
export const deleteJob = async (req, res) => {
  const job = await Job.findOneAndDelete({
    _id: req.params.id,
    employer: req.user._id || req.user.id,
  });
  if (!job)
    return res
      .status(404)
      .json({ message: "Job not found or unauthorized" });
  return res.json({ message: "Job deleted" });
};

// View applicants for a job
export const getJobApplicants = async (req, res) => {
  const applications = await Application.find({ job: req.params.jobId }).populate(
    "worker",
    "firstName lastName userName email availability"
  );
  return res.json({ applicants: applications });
};

// Employer updates application status (accept/reject)
export const updateApplicationStatus = async (req, res) => {
  const { status } = req.body; // accepted / rejected / pending
  if (!["accepted", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const app = await Application.findById(req.params.appId).populate("job");
  if (!app) return res.status(404).json({ message: "Application not found" });

  // ensure employer owns the job
  const job = await Job.findById(app.job._id || app.job);
  if (!job) return res.status(404).json({ message: "Related job not found" });
  if (job.employer.toString() !== (req.user._id || req.user.id).toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Update status
  const timestamp = new Date();
  app.status = status;
  app.statusUpdatedAt = timestamp;
  await app.save();

  // If accepted, update job record
  if (status === "accepted") {
    job.status = "assigned";
    job.worker = app.worker;
  } else if (status === "rejected") {
    job.status = "open";
    job.worker = null;
  }

  // Also update the applicant status inside the job document
  const workerIdStr = app.worker._id ? app.worker._id.toString() : app.worker.toString();
  const applicantIndex = job.applicants.findIndex(
    (a) => a.workerId.toString() === workerIdStr
  );
  if (applicantIndex !== -1) {
    job.applicants[applicantIndex].status = status;
  }

  await job.save();

  // Emit socket notification to worker
  const io = req.app.get("io");
  io?.to(app.worker.toString()).emit("notification", {
    type: `application:${status}`,
    jobId: job._id.toString(),
    jobTitle: job.title,
    message: `Your application was ${status}`,
    at: timestamp.toISOString(),
  });

  return res.json({ application: app, job });
};

export const getEmployerDashboard = async (req, res) => {
  const employerId = req.user._id || req.user.id;
  const jobs = await Job.find({ employer: employerId })
    .sort({ createdAt: -1 })
    .populate("applicants.workerId", "firstName lastName");

  const jobIds = jobs.map((job) => job._id);
  const applications = await Application.find({ job: { $in: jobIds } })
    .populate("worker", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(5);

  // Calculate stats more accurately
  const totalApplications = await Application.countDocuments({
    job: { $in: jobIds },
  });

  const stats = {
    totalJobs: jobs.length,
    openJobs: jobs.filter((job) => job.status === "open").length,
    pausedJobs: jobs.filter((job) => job.status === "paused").length,
    applicants: totalApplications, // Use Application model count instead of job.applicants.length
  };

  const jobTitleMap = jobs.reduce((acc, job) => {
    acc[job._id.toString()] = job.title;
    return acc;
  }, {});

  // Get application counts for all jobs at once
  const jobsWithApplicantCounts = await Promise.all(
    jobs.map(async (job) => {
      const applicationCount = await Application.countDocuments({ job: job._id });
      return {
        id: job._id,
        title: job.title,
        status: job.status,
        applicants: applicationCount, // Use Application count for accuracy
        pay: job.pay ?? job.salary,
        location: job.locationLabel,
        createdAt: job.createdAt,
      };
    })
  );

  return res.json({
    profile: {
      id: employerId,
      name: `${req.user.firstName} ${req.user.lastName}`.trim(),
      role: req.user.role,
    },
    stats,
    jobs: jobsWithApplicantCounts,
    recentApplicants: applications.map((app) => ({
      id: app._id,
      workerName: app.worker
        ? `${app.worker.firstName} ${app.worker.lastName}`.trim()
        : "Worker",
      jobTitle: jobTitleMap[app.job.toString()] || "Job",
      status: app.status,
      createdAt: app.createdAt,
    })),
  });
};

// Get job details with applicants for employer
export const getEmployerJobDetails = async (req, res) => {
  const employerId = req.user._id || req.user.id;
  const job = await Job.findById(req.params.jobId)
    .populate("applicants.workerId", "firstName lastName email userName availability")
    .populate("worker", "firstName lastName email");

  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.employer.toString() !== employerId.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const applications = await Application.find({ job: job._id })
    .populate("worker", "firstName lastName email userName availability")
    .sort({ createdAt: -1 });

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
      updatedAt: job.updatedAt,
      assignedWorker: job.worker
        ? {
          id: job.worker._id,
          name: `${job.worker.firstName} ${job.worker.lastName}`.trim(),
          email: job.worker.email,
        }
        : null,
    },
    applicants: applications.map((app) => ({
      id: app._id,
      worker: app.worker
        ? {
          id: app.worker._id,
          name: `${app.worker.firstName} ${app.worker.lastName}`.trim(),
          email: app.worker.email,
          userName: app.worker.userName,
          availability: app.worker.availability,
        }
        : null,
      status: app.status,
      coverLetter: app.coverLetter,
      appliedAt: app.createdAt,
      updatedAt: app.updatedAt,
    })),
  });
};

// Get application details for employer
export const getEmployerApplicationDetails = async (req, res) => {
  const employerId = req.user._id || req.user.id;
  const application = await Application.findById(req.params.applicationId)
    .populate("job")
    .populate("worker", "firstName lastName email userName availability");

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  const job = await Job.findById(application.job._id || application.job);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.employer.toString() !== employerId.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

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
      status: job.status,
    },
    worker: application.worker
      ? {
        id: application.worker._id,
        name: `${application.worker.firstName} ${application.worker.lastName}`.trim(),
        email: application.worker.email,
        userName: application.worker.userName,
        availability: application.worker.availability,
      }
      : null,
  });
};
