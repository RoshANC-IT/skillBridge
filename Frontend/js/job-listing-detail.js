const API_BASE = "http://localhost:3000/api";

// Get job ID from URL or use mock data from localStorage
const jobId = new URLSearchParams(window.location.search).get("id");
const jobData = jobId ? null : JSON.parse(localStorage.getItem("selectedJob") || "null");

const els = {
  loadingState: document.getElementById("loadingState"),
  jobContent: document.getElementById("jobContent"),
  errorState: document.getElementById("errorState"),
  jobTitle: document.getElementById("jobTitle"),
  jobStatus: document.getElementById("jobStatus"),
  jobCategory: document.getElementById("jobCategory"),
  jobLocation: document.getElementById("jobLocation"),
  jobPay: document.getElementById("jobPay"),
  jobPrice: document.getElementById("jobPrice"),
  jobPriceNote: document.getElementById("jobPriceNote"),
  jobEta: document.getElementById("jobEta"),
  jobRating: document.getElementById("jobRating"),
  jobReviews: document.getElementById("jobReviews"),
  jobDescription: document.getElementById("jobDescription"),
  jobSkills: document.getElementById("jobSkills"),
  employerName: document.getElementById("employerName"),
  employerEmail: document.getElementById("employerEmail"),
  employerInitial: document.getElementById("employerInitial"),
  requestBtn: document.getElementById("requestBtn"),
  notLoggedInState: document.getElementById("notLoggedInState"),
  loggedInState: document.getElementById("loggedInState"),
  responseTime: document.getElementById("responseTime"),
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getToken() {
  return localStorage.getItem("token");
}

function checkAuth() {
  const token = getToken();
  if (token) {
    els.notLoggedInState.classList.add("hidden");
    els.loggedInState.classList.remove("hidden");
  } else {
    els.notLoggedInState.classList.remove("hidden");
    els.loggedInState.classList.add("hidden");
  }
}

async function fetchJobDetails() {
  // If we have job data from localStorage (from home page), use it
  if (jobData && !jobId) {
    renderJob(jobData);
    return;
  }

  // Otherwise, try to fetch from API if we have a jobId
  if (!jobId) {
    showError();
    return;
  }

  try {
    // Try public endpoint first (no auth required)
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    const job = data.services?.find(s => s.id === jobId);
    
    if (job) {
      renderJob(job);
    } else {
      showError();
    }
  } catch (error) {
    console.error("Error fetching job:", error);
    // Fallback to mock data if API fails
    if (jobData) {
      renderJob(jobData);
    } else {
      showError();
    }
  }
}

function renderJob(job) {
  els.loadingState.classList.add("hidden");
  els.jobContent.classList.remove("hidden");

  // Basic info
  els.jobTitle.textContent = job.title || "Professional Service";
  els.jobLocation.textContent = job.location || "Location not specified";
  els.jobCategory.textContent = job.category || "Service";
  els.jobStatus.textContent = job.status || "Available";
  
  // Status styling
  const statusColors = {
    open: "bg-emerald-500/20 text-emerald-200",
    "in-progress": "bg-blue-500/20 text-blue-200",
    closed: "bg-gray-500/20 text-gray-200",
  };
  els.jobStatus.className = `px-4 py-1.5 rounded-full text-xs font-bold ${statusColors[job.status] || statusColors.open} backdrop-blur-sm`;

  // Pricing
  const price = job.pay || job.salary || job.priceRange?.replace(/[^\d]/g, "") || "0";
  els.jobPay.textContent = price.includes("₹") ? price : currencyFormatter.format(parseInt(price) || 0);
  els.jobPrice.textContent = price.includes("₹") ? price : currencyFormatter.format(parseInt(price) || 0);
  els.jobPriceNote.textContent = job.priceNote || "Final price may vary based on requirements";

  // ETA and Rating
  els.jobEta.textContent = job.eta || "Same day available";
  els.jobRating.textContent = (job.rating || 4.8).toFixed(1);
  els.jobReviews.textContent = job.reviews || 50;
  els.responseTime.textContent = job.eta || "Fast response";

  // Description
  els.jobDescription.textContent = job.description || "No description provided.";

  // Skills/Requirements
  if (job.skills && job.skills.length > 0) {
    els.jobSkills.innerHTML = job.skills
      .map(
        (skill) => `
        <span class="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
          ${skill}
        </span>
      `
      )
      .join("");
  } else {
    els.jobSkills.innerHTML = '<p class="text-ink-muted">No specific requirements listed.</p>';
  }

  // Employer info
  const employerName = job.employer?.name || "Employer";
  els.employerName.textContent = employerName;
  els.employerEmail.textContent = job.employer?.email || "Contact via platform";
  els.employerInitial.textContent = employerName.charAt(0).toUpperCase();

  // Setup request button
  if (els.requestBtn) {
    els.requestBtn.addEventListener("click", () => {
      const token = getToken();
      if (token) {
        // Navigate to jobs page or create application
        window.location.href = `jobs.html?apply=${jobId || job.id}`;
      } else {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
      }
    });
  }
}

function showError() {
  els.loadingState.classList.add("hidden");
  els.jobContent.classList.add("hidden");
  els.errorState.classList.remove("hidden");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  fetchJobDetails();
});

