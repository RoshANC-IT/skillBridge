// controllers/services.controller.js
import Job from "../models/job.model.js";
import User from "../models/user.model.js";

// Get all services (public route)
export const getAllServices = async (req, res) => {
  const { category, search } = req.query;

  const query = {
    status: { $in: ["open", "in-progress"] },
  };

  if (category && category !== "all") {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } },
    ];
  }

  const jobs = await Job.find(query)
    .populate("employer", "firstName lastName")
    .select("-applicants")
    .sort({ createdAt: -1 })
    .limit(100);

  return res.json({
    services: jobs.map((job) => ({
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
    })),
  });
};

// Get jobs by specific service/title (public route)
export const getJobsByJobSlug = async (req, res) => {
  const { jobSlug } = req.params;

  // Map job slugs to search terms
  const jobMap = {
    "kitchen-deep-clean": ["kitchen", "deep clean", "cleaning"],
    "bathroom-waterproofing": ["bathroom", "waterproofing", "waterproof"],
    "ac-gas-refill-service": ["ac", "air conditioner", "gas refill", "service"],
    "modular-wardrobe-fix": ["wardrobe", "modular", "furniture", "fix"],
    "full-home-painting": ["painting", "home painting", "paint"],
    "smart-door-lock-install": [
      "smart lock",
      "door lock",
      "installation",
      "security",
    ],
    "mason-wall-construction": ["mason", "construction", "wall", "brick"],
    "carpenter-custom-furniture": ["carpenter", "furniture", "custom"],
    "electrician-new-wiring": ["electrician", "wiring", "electrical"],
    "plumber-pipeline-work": ["plumber", "pipeline", "plumbing"],
    "welder-gate-installation": ["welder", "gate", "welding", "metal"],
  };

  const searchTerms = jobMap[jobSlug] || [jobSlug.replace(/-/g, " ")];

  // Find jobs matching the search terms
  const jobs = await Job.find({
    $or: searchTerms.map((term) => ({
      $or: [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { skills: { $in: [new RegExp(term, "i")] } },
      ],
    })),
    status: { $in: ["open", "in-progress"] },
  })
    .populate("employer", "firstName lastName email")
    .select("-applicants")
    .sort({ createdAt: -1 })
    .limit(20);

  // Get workers for this service type
  const workers = await User.find({
    role: "worker",
    availability: { $in: ["available", "busy"] },
  })
    .select("firstName lastName userName email availability avatarUrl")
    .limit(10);

  // Get job metadata
  const jobTitle = jobSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return res.json({
    job: {
      slug: jobSlug,
      title: jobTitle,
      searchTerms,
    },
    jobs: jobs.map((job) => ({
      id: job._id,
      title: job.title,
      description: job.description,
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
    })),
    workers: workers.map((worker) => ({
      id: worker._id,
      name: `${worker.firstName} ${worker.lastName}`.trim(),
      userName: worker.userName,
      email: worker.email,
      availability: worker.availability,
      avatarUrl: worker.avatarUrl,
    })),
  });
};

// Get service by category/slug (public route)
export const getServiceBySlug = async (req, res) => {
  const { slug } = req.params;
  const categoryMap = {
    "home-cleaning": ["cleaning", "home", "house"],
    "appliance-repair": ["repair", "appliance", "ac", "fridge"],
    "electrical-work": ["electrical", "electric", "wiring"],
    plumbing: ["plumbing", "plumber", "pipe"],
    painting: ["painting", "paint", "color"],
    "pest-control": ["pest", "control", "exterminator"],
    mason: ["construction", "mason", "brick", "tile"],
    carpenter: ["carpentry", "carpenter", "furniture"],
    electrician: ["electrical", "electric", "wiring"],
    plumber: ["plumbing", "plumber", "pipe"],
    welder: ["welding", "welder", "metal"],
  };

  const categories = categoryMap[slug] || [slug];

  // Build regex patterns for search
  const regexPatterns = categories.map((c) => new RegExp(c, "i"));

  const jobs = await Job.find({
    $or: [
      { category: { $regex: regexPatterns[0] } },
      { title: { $regex: regexPatterns[0] } },
      { description: { $regex: regexPatterns[0] } },
      { skills: { $in: regexPatterns } },
    ],
    status: { $in: ["open", "in-progress"] },
  })
    .populate("employer", "firstName lastName email")
    .select("-applicants")
    .sort({ createdAt: -1 })
    .limit(20);

  // Get city filter from query
  const { city } = req.query;

  // Map service slug to worker type (handle both formats: "Pest Control" and "pest-control")
  // Database might have: "Pest Control", "pest-control", "pest control", "Pest-Control", etc.
  const serviceToWorkerTypeMap = {
    "home-cleaning": [
      "Home Cleaning",
      "home-cleaning",
      "home cleaning",
      "Home-Cleaning",
    ],
    "appliance-repair": [
      "Appliance Repair",
      "appliance-repair",
      "appliance repair",
      "Appliance-Repair",
    ],
    "electrical-work": [
      "Electrical Work",
      "electrical-work",
      "electrical work",
      "Electrical-Work",
    ],
    plumbing: ["Plumbing", "plumbing"],
    painting: ["Painting", "painting"],
    "pest-control": [
      "Pest Control",
      "pest-control",
      "pest control",
      "Pest-Control",
      "PEST-CONTROL",
    ],
    carpentry: ["Carpentry", "carpentry"],
    "home-security": [
      "Home Security",
      "home-security",
      "home security",
      "Home-Security",
    ],
    mason: ["Mason", "mason"],
    carpenter: ["Carpenter", "carpenter"],
    electrician: ["Electrician", "electrician"],
    plumber: ["Plumber", "plumber"],
    welder: ["Welder", "welder"],
  };

  const requiredWorkerTypes = serviceToWorkerTypeMap[slug] || [];

  console.log(
    `[Services Route] Fetching workers for slug: ${slug}, workerTypes: ${requiredWorkerTypes.join(
      ", "
    )}, city: ${city}`
  );

  // Get workers for this service type
  let workerQuery = {
    role: "worker",
    availability: { $in: ["available", "busy"] },
  };

  // First, try to get workers with workerType (if specified)
  let filteredWorkers = [];

  if (requiredWorkerTypes.length > 0) {
    // Get all workers first, then filter by normalized workerType (handles format variations)
    const allWorkers = await User.find(workerQuery)
      .select(
        "firstName lastName userName email availability avatarUrl workerType city phoneNumber"
      )
      .limit(100); // Get more to filter

    // Normalize function: removes spaces/hyphens and converts to lowercase for comparison
    const normalizeType = (type) => {
      if (!type) return "";
      return type.toLowerCase().trim().replace(/[-\s]/g, "");
    };

    // Normalize required types
    const normalizedRequired = requiredWorkerTypes.map(normalizeType);

    // Filter workers by normalized workerType
    filteredWorkers = allWorkers.filter((worker) => {
      const workerTypes = (worker.workerType || "").split(',').map(normalizeType);
      return workerTypes.some(t => normalizedRequired.includes(t));
    });

    console.log(
      `Found ${filteredWorkers.length} workers matching types (${requiredWorkerTypes.join(
        "/"
      )}) out of ${allWorkers.length} total workers`
    );

    // If city was provided, prioritize workers from that city but don't exclude others
    if (city && filteredWorkers.length > 0) {
      const cityLower = city.trim().toLowerCase();
      const cityMatched = filteredWorkers.filter((worker) => {
        const workerCity = (worker.city || "").trim().toLowerCase();
        return (
          workerCity.includes(cityLower) ||
          cityLower.includes(workerCity) ||
          workerCity === cityLower
        );
      });

      // If we have city-matched workers, prioritize them; otherwise show all
      if (cityMatched.length > 0) {
        filteredWorkers = cityMatched;
        console.log(
          `Prioritized ${filteredWorkers.length} workers from city "${city}"`
        );
      } else {
        console.log(
          `No workers from "${city}", showing all ${filteredWorkers.length} workers with matching type`
        );
      }
    }

    // Limit to 20 workers
    filteredWorkers = filteredWorkers.slice(0, 20);
  } else {
    // No workerType specified, just filter by city if provided (but make it optional)
    if (city) {
      // Try with city first
      workerQuery.city = { $regex: city.trim(), $options: "i" };
      filteredWorkers = await User.find(workerQuery)
        .select(
          "firstName lastName userName email availability avatarUrl workerType city phoneNumber"
        )
        .limit(20);

      // If no workers with city, show all workers
      if (filteredWorkers.length === 0) {
        delete workerQuery.city;
        filteredWorkers = await User.find(workerQuery)
          .select(
            "firstName lastName userName email availability avatarUrl workerType city phoneNumber"
          )
          .limit(20);
      }
    } else {
      filteredWorkers = await User.find(workerQuery)
        .select(
          "firstName lastName userName email availability avatarUrl workerType city phoneNumber"
        )
        .limit(20);
    }
  }

  // Limit to 10 workers
  const limitedWorkers = filteredWorkers.slice(0, 10);

  // Map workers with their data
  const workersWithLocation = limitedWorkers.map((worker) => {
    return {
      id: worker._id,
      name: `${worker.firstName} ${worker.lastName}`.trim(),
      userName: worker.userName,
      email: worker.email,
      availability: worker.availability,
      avatarUrl: worker.avatarUrl,
      workerType: worker.workerType || "",
      city: worker.city || "",
      phoneNumber: worker.phoneNumber || "",
      locationLabel: worker.city || "", // Use city as locationLabel for consistency
    };
  });

  return res.json({
    service: {
      slug,
      category: categories[0],
      name: slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    },
    jobs: jobs.map((job) => ({
      id: job._id,
      title: job.title,
      description: job.description,
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
    })),
    workers: workersWithLocation,
  });
};
