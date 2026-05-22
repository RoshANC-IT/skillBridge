// Use a different variable name to avoid conflict with auth-guard.js
// auth-guard.js uses API_BASE for /api/auth, we need /api for employer routes
const EMPLOYER_API_BASE = "http://localhost:3000/api"; // Backend API base for employer routes
const token = localStorage.getItem("token");
const storedUser = JSON.parse(localStorage.getItem("user") || "null");

// Debug logging
console.log("🔍 Employer Dashboard Initialization:", {
  hasToken: !!token,
  userRole: storedUser?.role,
  API_BASE: EMPLOYER_API_BASE
});

if (!token || storedUser?.role !== "employer") {
  console.warn("❌ Unauthorized access - redirecting to login");
  window.location.href = "login.html";
}

// Show ban banner immediately from localStorage (status set during login)
if (storedUser && storedUser.status === "banned") {
  document.addEventListener("DOMContentLoaded", showBannedBanner);
}

// Socket.IO for real-time updates
let socket = null;
let autoRefreshInterval = null;
let isFetching = false;

// Show notification toast
function showNotificationToast(message) {
  const toast = document.createElement("div");
  toast.className = "fixed top-4 right-4 bg-primary text-white px-6 py-4 rounded-2xl shadow-xl z-50 flex items-center gap-3 animate-[slideIn_0.3s_ease-out]";
  toast.innerHTML = `
    <span class="material-symbols-outlined">notifications_active</span>
    <span class="font-semibold">${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Initialize elements - use function to ensure DOM is ready
function initializeElements() {
  return {
    stats: {
      total: document.getElementById("statTotalJobs"),
      open: document.getElementById("statOpenJobs"),
      paused: document.getElementById("statPausedJobs"),
      applicants: document.getElementById("statApplicants"),
    },
    jobsContainer: document.getElementById("employerJobsContainer"),
    applicantsContainer: document.getElementById("recentApplicantsContainer"),
    jobForm: document.getElementById("jobForm"),
    refreshJobs: document.getElementById("refreshJobs"),
    refreshApplicants: document.getElementById("refreshApplicants"),
    employerName: document.getElementById("employerName"),
    employerRole: document.getElementById("employerRole"),
    employerId: document.getElementById("employerId"),
    employerGreeting: document.getElementById("employerGreeting"),
    avatar: document.getElementById("employerAvatar"),
    logoutButtons: [
      document.getElementById("logoutEmployer"),
      document.getElementById("mobileLogout"),
    ],
    newJobButtons: [
      document.getElementById("openJobFormButton"),
      document.getElementById("openJobFormSidebar"),
    ],
    multiWorkerModal: document.getElementById("multiWorkerModal"),
    multiWorkerSelection: document.getElementById("multiWorkerSelection"),
    workerDetailModal: document.getElementById("workerDetailModal"),
    languageSelector: document.getElementById("languageSelector"),
  };
}

let els = initializeElements();

// Re-initialize elements if DOM wasn't ready
if (!els.jobsContainer || !els.stats?.total) {
  console.warn("⚠️ Some elements not found, will retry after DOM load");
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      els = initializeElements();
      console.log("✅ Elements re-initialized after DOM load");
    });
  }
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

// Verify headers are set correctly
if (!token) {
  console.error("❌ No authentication token found!");
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function renderProfile(profile) {
  if (!els.employerName || !els.employerGreeting) {
    console.warn("⚠️ Profile elements not found");
    return;
  }

  const name = profile?.name || `${storedUser?.firstName || ''} ${storedUser?.lastName || ''}`.trim() || 'Employer';
  els.employerName.textContent = name;
  els.employerGreeting.textContent = `Welcome back, ${name.split(" ")[0]} 👋`;

  if (els.employerRole) {
    els.employerRole.textContent = profile?.role || "employer";
  }

  if (els.employerId) {
    els.employerId.textContent = profile?.id || storedUser?._id || storedUser?.id || '--';
  }

  if (els.avatar) {
    if (profile?.avatarUrl) {
      els.avatar.style.backgroundImage = `url(${profile.avatarUrl})`;
      els.avatar.style.backgroundSize = "cover";
      els.avatar.textContent = "";
    } else {
      const initials = name
        .split(" ")
        .map((chunk) => chunk[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || 'E';
      els.avatar.textContent = initials;
      els.avatar.style.backgroundImage = "";
    }
  }
}

function renderStats(stats = {}) {
  if (!els.stats) {
    console.warn("⚠️ Stats elements not found");
    return;
  }

  console.log("📊 Rendering stats:", stats);

  // Animate number changes
  const animateNumber = (element, newValue, oldValue) => {
    if (!element) {
      console.warn("⚠️ Stats element not found");
      return;
    }

    const value = newValue ?? 0;
    const old = oldValue ?? 0;

    // Always update, even if value is 0
    if (old === value && value !== 0) {
      element.textContent = value;
      return;
    }

    // Add fade animation
    element.style.opacity = "0";
    element.style.transition = "opacity 0.3s ease-in-out";

    setTimeout(() => {
      element.textContent = value;
      element.style.opacity = "1";
    }, 150);
  };

  const totalJobs = stats.totalJobs ?? 0;
  const openJobs = stats.openJobs ?? 0;
  const pausedJobs = stats.pausedJobs ?? 0;
  const applicants = stats.applicants ?? 0;

  console.log("📊 Stats values:", { totalJobs, openJobs, pausedJobs, applicants });

  animateNumber(els.stats.total, totalJobs, parseInt(els.stats.total?.textContent) || 0);
  animateNumber(els.stats.open, openJobs, parseInt(els.stats.open?.textContent) || 0);
  animateNumber(els.stats.paused, pausedJobs, parseInt(els.stats.paused?.textContent) || 0);
  animateNumber(els.stats.applicants, applicants, parseInt(els.stats.applicants?.textContent) || 0);
}

function renderJobs(jobs = []) {
  if (!els.jobsContainer) {
    console.warn("⚠️ Jobs container not found");
    return;
  }

  if (!jobs.length) {
    els.jobsContainer.innerHTML =
      '<p class="text-sm text-ink-muted border border-dashed border-gray-200 rounded-2xl p-6 text-center">No jobs posted yet. Click "New job" to get started.</p>';
    return;
  }

  els.jobsContainer.innerHTML = jobs
    .map(
      (job) => `
      <article class="border border-gray-100 rounded-2xl p-5 grid gap-3 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1" onclick="window.location.href='job-management.html?id=${job.id}'">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <p class="text-xs text-ink-muted uppercase tracking-wide">${job.location || "Flexible"}</p>
            <h4 class="text-lg font-semibold text-ink mt-1">${job.title}</h4>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${job.status === "open"
          ? "bg-emerald-50 text-emerald-600"
          : job.status === "paused"
            ? "bg-amber-50 text-amber-600"
            : job.status === "in-progress"
              ? "bg-blue-50 text-blue-600"
              : "bg-slate-100 text-slate-700"
        } capitalize">${job.status}</span>
        </div>
        <div class="flex flex-wrap gap-4 text-sm text-ink-muted">
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">currency_rupee</span><strong class="text-ink">Budget:</strong> ${job.pay ? currencyFormatter.format(job.pay) : "N/A"
        }</span>
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">people</span><strong class="text-ink">Applicants:</strong> ${job.applicants || 0}</span>
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">schedule</span><strong class="text-ink">Posted:</strong> ${new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <button
            onclick="event.stopPropagation(); window.location.href='job-management.html?id=${job.id}'"
            class="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:text-primary/80 hover:bg-primary/5 px-3 py-1.5 rounded-lg transition"
          >
            <span class="material-symbols-outlined text-base">visibility</span>
            Manage
          </button>
          <button
            data-job="${job.id}"
            class="delete-job inline-flex items-center gap-1 text-sm text-rose-600 font-semibold hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition"
            onclick="event.stopPropagation()"
          >
            <span class="material-symbols-outlined text-base">delete</span>
            Remove
          </button>
        </div>
      </article>
    `
    )
    .join("");

  document.querySelectorAll(".delete-job").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const jobId = e.currentTarget.getAttribute("data-job");
      deleteJob(jobId);
    })
  );
}

// Track previous applicants to highlight new ones
let previousApplicantIds = new Set();

function renderApplicants(applicants = []) {
  if (!els.applicantsContainer) {
    console.warn("⚠️ Applicants container not found");
    return;
  }

  if (!applicants.length) {
    els.applicantsContainer.innerHTML =
      '<p class="text-sm text-ink-muted">Waiting for new applications...</p>';
    previousApplicantIds.clear();
    return;
  }

  const currentApplicantIds = new Set(applicants.map(app => app.id));

  els.applicantsContainer.innerHTML = applicants
    .map(
      (app) => {
        const isNew = !previousApplicantIds.has(app.id);
        let progressBarHtml = '';
        if (app.status === "accepted") {
          const isAssigned = app.jobStatus === "assigned" || app.jobStatus === "in-progress" || app.jobStatus === "completed";
          const isInProgress = app.jobStatus === "in-progress" || app.jobStatus === "completed";
          const isCompleted = app.jobStatus === "completed";

          const step1Class = isAssigned ? "bg-emerald-500 text-white ring-white border-0" : "bg-gray-100 border-2 border-gray-300 ring-white";
          const step1IconHtml = isAssigned ? '<span class="material-symbols-outlined" style="font-size: 14px;">check</span>' : '<span class="w-2 h-2 rounded-full bg-gray-300 hidden"></span>';

          const step2Class = isInProgress ? "bg-emerald-500 text-white ring-white border-0" : "bg-gray-100 border-2 border-gray-300 ring-white";
          const step2IconHtml = isInProgress ? '<span class="material-symbols-outlined" style="font-size: 14px;">check</span>' : '<span class="w-2 h-2 rounded-full bg-gray-300 hidden"></span>';

          const step3Class = isCompleted ? "bg-emerald-500 text-white ring-white border-0" : "bg-gray-100 border-2 border-gray-300 ring-white";
          const step3IconHtml = isCompleted ? '<span class="material-symbols-outlined" style="font-size: 14px;">check</span>' : '<span class="w-2 h-2 rounded-full bg-gray-300 hidden"></span>';

          const line1Class = isInProgress ? "bg-emerald-500" : "bg-gray-200";
          const line2Class = isCompleted ? "bg-emerald-500" : "bg-gray-200";

          progressBarHtml = `
            <div class="mt-4 pt-4 border-t border-gray-100 mb-2">
              <div class="flex justify-between items-center mb-3">
                <p class="text-xs font-semibold text-ink-muted uppercase tracking-wider">Job Progress</p>
                <span class="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">${app.jobStatus || 'accepted'}</span>
              </div>
              <div class="flex items-center justify-between relative">
                <!-- Connecting Lines -->
                <div class="absolute left-[16%] right-[50%] top-3 h-0.5 ${line1Class} -z-10 transition-colors duration-300"></div>
                <div class="absolute left-[50%] right-[16%] top-3 h-0.5 ${line2Class} -z-10 transition-colors duration-300"></div>
                
                <!-- Step 1: Accepted -->
                <div class="flex flex-col items-center gap-1.5 z-10 w-1/3">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center ring-4 shadow-sm transition-colors duration-300 ${step1Class}">
                    ${step1IconHtml}
                  </div>
                  <span class="text-[10px] font-semibold ${isAssigned ? 'text-ink' : 'text-ink-muted'}">Assigned</span>
                </div>

                <!-- Step 2: In Progress -->
                <div class="flex flex-col items-center gap-1.5 z-10 w-1/3">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center ring-4 shadow-sm transition-colors duration-300 ${step2Class}">
                    ${step2IconHtml}
                  </div>
                  <span class="text-[10px] font-medium ${isInProgress ? 'text-ink' : 'text-ink-muted'}">In Progress</span>
                </div>

                <!-- Step 3: Completed -->
                <div class="flex flex-col items-center gap-1.5 z-10 w-1/3">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center ring-4 shadow-sm transition-colors duration-300 ${step3Class}">
                    ${step3IconHtml}
                  </div>
                  <span class="text-[10px] font-medium ${isCompleted ? 'text-ink' : 'text-ink-muted'}">Completed</span>
                </div>
              </div>
            </div>
          `;
        }

        return `
        <div class="border ${isNew ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-gray-100'} rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition cursor-pointer ${isNew ? 'animate-[pulse_2s_ease-in-out]' : ''}" onclick="window.location.href='applicant-detail.html?id=${app.id}'">
          ${isNew ? '<div class="flex items-center gap-2 mb-2"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary"><span class="material-symbols-outlined text-xs">fiber_new</span> New</span></div>' : ''}
          <div class="flex justify-between items-start mb-1">
            <p class="text-sm font-semibold text-ink">${app.workerName}</p>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${app.status === "accepted"
            ? "bg-emerald-50 text-emerald-600"
            : app.status === "rejected"
              ? "bg-rose-50 text-rose-600"
              : "bg-amber-50 text-amber-600"
          } uppercase tracking-wider">${app.status}</span>
          </div>
          <p class="text-xs text-ink-muted mb-1">${app.jobTitle}</p>
          <p class="text-[10px] text-ink-muted">${new Date(app.createdAt).toLocaleString()}</p>
          
          ${progressBarHtml}
          
          <div class="flex gap-2 mt-3">
            <button
              onclick="event.stopPropagation(); window.location.href='applicant-detail.html?id=${app.id}'"
              class="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 text-xs"
            >
              View Details
            </button>
            <button
              data-worker-id="${app.id || app.workerId || ''}"
              data-worker-name="${app.workerName || 'Worker'}"
              class="view-worker-score px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 text-xs flex items-center gap-1"
              title="View reliability score & ratings"
              onclick="event.stopPropagation()"
            >
              <span class="material-symbols-outlined text-xs">star</span>
              Score
            </button>
          </div>
        </div>
      `;
      }
    )
    .join("");

  // Update previous applicant IDs
  previousApplicantIds = currentApplicantIds;

  // Add event listeners for worker score buttons
  if (els.applicantsContainer) {
    els.applicantsContainer.querySelectorAll('.view-worker-score').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const workerId = btn.getAttribute('data-worker-id');
        const workerName = btn.getAttribute('data-worker-name');

        if (!workerId || !workerName) {
          console.warn('Missing worker data for score view');
          return;
        }

        // Mock worker data - in production, fetch from API
        const workerData = {
          name: workerName,
          id: workerId,
          acceptanceRate: Math.floor(Math.random() * 20) + 80,
          punctuality: Math.floor(Math.random() * 15) + 85,
          avgRating: parseFloat((Math.random() * 1 + 4).toFixed(1)),
          amountDue: Math.floor(Math.random() * 5000) + 1000,
          ratings: [
            { rating: 5, comment: 'Excellent work! Very professional.', date: '2024-01-15', employer: 'Previous Employer' },
            { rating: 4, comment: 'Good quality work, completed on time.', date: '2024-01-10', employer: 'Previous Employer' },
          ]
        };

        showWorkerDetail(workerData);
      });
    });
  }

  // Clear new indicators after animation
  setTimeout(() => {
    previousApplicantIds = currentApplicantIds;
  }, 3000);
}

async function fetchDashboard(showLoading = true) {
  // Prevent concurrent fetches
  if (isFetching) {
    console.log("⏳ Dashboard fetch already in progress, skipping...");
    return;
  }

  isFetching = true;

  if (showLoading) {
    if (els.jobsContainer) {
      els.jobsContainer.innerHTML =
        '<div class="animate-pulse rounded-2xl bg-white border border-gray-100 p-6"><div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div><div class="h-3 bg-gray-100 rounded w-1/3"></div></div>';
    }
  }

  try {
    const url = `${EMPLOYER_API_BASE}/employer/dashboard`;
    console.log("🌐 Fetching dashboard from:", url);

    const res = await fetch(url, {
      headers,
      method: 'GET',
      credentials: 'include'
    }).catch(networkError => {
      console.error("❌ Network error:", networkError);
      throw new Error(`Network error: ${networkError.message}. Please check if the backend server is running at ${EMPLOYER_API_BASE}`);
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Unauthorized - redirect to login
        console.warn("❌ Unauthorized - redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
        return;
      }
      const errorText = await res.text().catch(() => res.statusText);
      
      if (res.status === 403 && (errorText.includes('banned') || errorText.includes('Access denied'))) {
        showBannedOverlay();
        return;
      }

      console.error("❌ API Error Response:", {
        status: res.status,
        statusText: res.statusText,
        body: errorText
      });
      throw new Error(`Unable to load dashboard (${res.status}): ${errorText || res.statusText}`);
    }

    const data = await res.json();

    console.log("📊 Dashboard data loaded:", data);

    // Validate data structure
    if (!data) {
      throw new Error("No data received from server");
    }

    // Ensure we have the expected data structure
    const dashboardData = {
      profile: data.profile || {},
      stats: data.stats || { totalJobs: 0, openJobs: 0, pausedJobs: 0, applicants: 0 },
      jobs: data.jobs || [],
      recentApplicants: data.recentApplicants || []
    };

    console.log("📋 Processed dashboard data:", dashboardData);

    try {
      // Ensure profile object exists
      if (!dashboardData.profile || typeof dashboardData.profile !== 'object') {
        console.warn("⚠️ Invalid profile data, using defaults");
        dashboardData.profile = {
          name: `${storedUser?.firstName || ''} ${storedUser?.lastName || ''}`.trim() || 'Employer',
          role: 'employer',
          id: storedUser?._id || storedUser?.id || '--'
        };
      }
      renderProfile(dashboardData.profile);
      console.log("✅ Profile rendered:", dashboardData.profile);
    } catch (error) {
      console.error("❌ Error rendering profile:", error);
      // Fallback: use stored user data
      if (els.employerName) {
        els.employerName.textContent = `${storedUser?.firstName || ''} ${storedUser?.lastName || ''}`.trim() || 'Employer';
      }
    }

    try {
      // Ensure stats object exists
      if (!dashboardData.stats || typeof dashboardData.stats !== 'object') {
        console.warn("⚠️ Invalid stats data, using defaults");
        dashboardData.stats = { totalJobs: 0, openJobs: 0, pausedJobs: 0, applicants: 0 };
      }
      renderStats(dashboardData.stats);
      console.log("✅ Stats rendered:", dashboardData.stats);
    } catch (error) {
      console.error("❌ Error rendering stats:", error);
      // Fallback: set stats to 0
      if (els.stats?.total) els.stats.total.textContent = '0';
      if (els.stats?.open) els.stats.open.textContent = '0';
      if (els.stats?.paused) els.stats.paused.textContent = '0';
      if (els.stats?.applicants) els.stats.applicants.textContent = '0';
    }

    try {
      renderJobs(dashboardData.jobs);
      console.log("✅ Jobs rendered:", dashboardData.jobs.length);
    } catch (error) {
      console.error("❌ Error rendering jobs:", error);
    }

    try {
      renderApplicants(dashboardData.recentApplicants);
      console.log("✅ Applicants rendered:", dashboardData.recentApplicants.length);
    } catch (error) {
      console.error("❌ Error rendering applicants:", error);
    }

    // Render new features with error handling
    try {
      updatePredictiveAnalytics(dashboardData.jobs);
      console.log("✅ Analytics updated");
    } catch (error) {
      console.error("❌ Error updating analytics:", error);
    }

    // Show success indicator briefly
    if (!showLoading) {
      console.log("✅ Dashboard refreshed successfully");
    } else {
      console.log("✅ Dashboard loaded successfully");
    }
  } catch (error) {
    console.error("❌ Error fetching dashboard:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      API_BASE: EMPLOYER_API_BASE,
      hasToken: !!token
    });

    if (showLoading) {
      const errorMsg = error.message || "Failed to load dashboard";
      if (els.jobsContainer) {
        els.jobsContainer.innerHTML = `
          <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <p class="text-rose-600 font-semibold mb-2">⚠️ ${errorMsg}</p>
            <p class="text-sm text-rose-500 mb-3">Please check your connection and try again.</p>
            <button onclick="window.fetchDashboard && window.fetchDashboard(true)" class="text-primary font-semibold underline hover:text-primary/80">
              Retry
            </button>
          </div>
        `;
      }

      // Also show error in stats if container exists
      if (els.stats?.total) {
        els.stats.total.textContent = '--';
        els.stats.open.textContent = '--';
        els.stats.paused.textContent = '--';
        els.stats.applicants.textContent = '--';
      }
    }
  } finally {
    isFetching = false;
  }
}

// Make fetchDashboard available globally for retry button and debugging
window.fetchDashboard = fetchDashboard;

// Add test function to verify API connection
window.testEmployerAPI = async function () {
  console.log("🧪 Testing employer API connection...");
  try {
    const res = await fetch(`${EMPLOYER_API_BASE}/employer/dashboard`, { headers });
    console.log("API Response Status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("✅ API Test Successful! Data:", data);
      return true;
    } else {
      console.error("❌ API Test Failed:", res.status, res.statusText);
      return false;
    }
  } catch (error) {
    console.error("❌ API Test Error:", error);
    return false;
  }
};

function showBannedBanner() {
  var el = document.getElementById('bannedBanner');
  if (el) el.classList.remove('hidden');
}

// Log initialization info
console.log("📋 Employer Dashboard Script Loaded");
console.log("🔑 Token present:", !!token);
console.log("👤 User:", storedUser);
console.log("🌐 API Base:", EMPLOYER_API_BASE);

async function deleteJob(jobId) {
  if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
    return;
  }

  try {
    const res = await fetch(`${EMPLOYER_API_BASE}/employer/jobs/${jobId}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete job");
    }

    console.log("✅ Job deleted successfully");

    // Refresh dashboard to reflect deletion
    fetchDashboard(false);

    // Show success message
    const tempMessage = document.createElement("div");
    tempMessage.className = "fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg z-50 flex items-center gap-2";
    tempMessage.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Job deleted successfully';
    document.body.appendChild(tempMessage);

    setTimeout(() => {
      tempMessage.style.transition = "opacity 0.3s ease-out";
      tempMessage.style.opacity = "0";
      setTimeout(() => tempMessage.remove(), 300);
    }, 3000);
  } catch (error) {
    console.error("❌ Error deleting job:", error);
    alert(`❌ ${error.message}`);
  }
}

els.jobForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalText = submitButton?.innerHTML || "";

  // Disable button during submission
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">refresh</span> Creating...';
  }

  // Sync checkbox selections to hidden input
  const checkedSkills = Array.from(document.querySelectorAll('.job-skill-checkbox:checked')).map(cb => cb.value);
  const skillsInput = document.getElementById("skills");
  if (skillsInput) skillsInput.value = checkedSkills.join(", ");

  const payload = {
    title: document.getElementById("title").value.trim(),
    location: document.getElementById("location").value.trim(),
    pay: Number(document.getElementById("pay").value),
    description: document.getElementById("description").value.trim(),
    skills: document.getElementById("skills").value.trim(),
  };

  if (!payload.title || !payload.description) {
    alert("Title and description are required.");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
    return;
  }

  try {
    const res = await fetch(`${EMPLOYER_API_BASE}/employer/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create job");
    }

    const data = await res.json();
    console.log("✅ Job created successfully:", data);

    els.jobForm.reset();
    // Clear skill checkboxes & pills
    document.querySelectorAll('.job-skill-checkbox').forEach(cb => cb.checked = false);
    const pillsEl = document.getElementById('jobSkillsPills');
    if (pillsEl) pillsEl.innerHTML = '';

    // Refresh dashboard to show new job
    await fetchDashboard(true);

    // Show success message
    if (submitButton) {
      submitButton.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span> Created!';
      setTimeout(() => {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      }, 2000);
    }
  } catch (error) {
    console.error("❌ Error creating job:", error);
    alert(`❌ ${error.message}`);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  }
});

// ---- Job Skills Checkbox Grid ----
function setupJobSkillsGrid() {
  const grid = document.getElementById('jobSkillsGrid');
  const pills = document.getElementById('jobSkillsPills');
  if (!grid) return;

  const SKILLS = window.SKILLBRIDGE_SKILLS || [];

  // Group by category
  const groups = {};
  SKILLS.forEach(s => {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  });

  grid.innerHTML = Object.entries(groups).map(([cat, skills]) => `
    <div class="col-span-2 pt-1 pb-1">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1 border-b border-gray-200 pb-0.5">${cat}</p>
      <div class="grid grid-cols-2 gap-1.5 mt-1.5">
        ${skills.map(s => `
          <label class="flex items-center gap-1.5 p-1.5 rounded-xl border-2 border-transparent bg-white hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition has-[:checked]:border-primary has-[:checked]:bg-primary/10 text-xs shadow-sm">
            <input type="checkbox" value="${s.value}" class="job-skill-checkbox w-3.5 h-3.5 accent-primary rounded border-gray-300 shrink-0">
            <span class="text-ink font-medium leading-tight">${s.label}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  function updatePills() {
    if (!pills) return;
    const checked = Array.from(document.querySelectorAll('.job-skill-checkbox:checked')).map(cb => cb.value);
    pills.innerHTML = checked.map(v => `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
        ${v}<button type="button" onclick="document.querySelector('.job-skill-checkbox[value=\'${v}\']').click()" class="ml-0.5 hover:text-primary/60 leading-none">&times;</button>
      </span>
    `).join('');
  }

  grid.addEventListener('change', updatePills);
}

if (document.readyState === "loading") {
  document.addEventListener('DOMContentLoaded', setupJobSkillsGrid);
} else {
  setupJobSkillsGrid();
}

// Initialize Socket.IO for real-time updates
function initSocketIO() {
  if (typeof io === 'undefined') {
    console.warn("Socket.IO not available, real-time updates disabled");
    return;
  }

  const employerId = storedUser._id || storedUser.id;

  socket = io("http://localhost:3000", {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to Socket.IO server");
    socket.emit("register", employerId.toString());
  });

  socket.on("registered", (registeredUserId) => {
    console.log("✅ Registered with Socket.IO:", registeredUserId);
  });

  // Listen for new application notifications
  socket.on("notification", (data) => {
    console.log("🔔 New notification received:", data);

    if (data.type === "application:new") {
      console.log("📥 New application received for job:", data.jobId);

      // Show browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification("New Application", {
          body: data.message || `${data.workerName || "A worker"} applied to your job: ${data.jobTitle || "Job"}`,
          icon: "/favicon.ico",
          tag: `application-${data.jobId}`,
        });
      }

      // Show visual feedback
      showNotificationToast(data.message || "New application received!");

      // Refresh dashboard to show new application
      setTimeout(() => {
        fetchDashboard(false); // Refresh without showing loading
      }, 500);
    }
  });

  // Listen for dashboard update events
  socket.on("dashboard_updated", (data) => {
    console.log("📊 Dashboard update event:", data);
    if (data.type === "new_application") {
      setTimeout(() => {
        fetchDashboard(false);
      }, 500);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from Socket.IO");
  });

  socket.on("connect_error", (error) => {
    console.warn("Socket.IO connection error:", error);
  });

  socket.on("reconnect", () => {
    console.log("✅ Reconnected to Socket.IO");
    socket.emit("register", employerId.toString());
  });

  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      console.log("Notification permission:", permission);
    });
  }
}

// Setup auto-refresh every 30 seconds
function setupAutoRefresh() {
  // Clear existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  // Refresh every 30 seconds
  autoRefreshInterval = setInterval(() => {
    console.log("🔄 Auto-refreshing dashboard...");
    fetchDashboard(false); // Refresh without showing loading
  }, 30000); // 30 seconds
}

// Add refresh button listeners with error handling
function setupRefreshButtons() {
  const refreshJobsBtn = document.getElementById("refreshJobs");
  if (refreshJobsBtn) {
    refreshJobsBtn.addEventListener("click", () => {
      console.log("🔄 Manual refresh triggered");
      fetchDashboard(true);
    });
  }

  const refreshApplicantsBtn = document.getElementById("refreshApplicants");
  if (refreshApplicantsBtn) {
    refreshApplicantsBtn.addEventListener("click", () => {
      console.log("🔄 Applicants refresh triggered");
      fetchDashboard(true);
    });
  }

}

// Setup refresh buttons - will be called in initializeDashboard

els.logoutButtons
  .filter(Boolean)
  .forEach((btn) =>
    btn.addEventListener("click", () => {
      // Cleanup on logout
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    })
  );

els.newJobButtons
  .filter(Boolean)
  .forEach((btn) =>
    btn.addEventListener("click", () => {
      els.jobForm?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("title")?.focus();
    })
  );

// Initialize everything when DOM is ready
function initializeDashboard() {
  console.log("🚀 Initializing employer dashboard...");

  // Re-initialize elements in case they weren't ready
  els = initializeElements();

  // Setup refresh buttons
  setupRefreshButtons();

  // Check if critical elements exist
  const missingElements = [];
  if (!els.jobsContainer) missingElements.push('employerJobsContainer');
  if (!els.stats?.total) missingElements.push('statTotalJobs');
  if (!els.employerName) missingElements.push('employerName');

  if (missingElements.length > 0) {
    console.error("❌ Missing critical elements:", missingElements);
    console.error("Available elements:", Object.keys(els));
    console.error("Document ready state:", document.readyState);

    // Try one more time after a short delay
    setTimeout(() => {
      els = initializeElements();
      if (els.jobsContainer && els.stats?.total) {
        console.log("✅ Elements found on retry, fetching dashboard...");
        fetchDashboard(true);
      } else {
        console.error("❌ Elements still not found after retry");
        if (els.jobsContainer) {
          els.jobsContainer.innerHTML = `
            <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <p class="text-rose-600 font-semibold">⚠️ Dashboard initialization error</p>
              <p class="text-sm text-rose-500 mt-2">Some elements could not be found. Please refresh the page.</p>
              <button onclick="location.reload()" class="mt-3 text-primary font-semibold underline">Reload Page</button>
            </div>
          `;
        }
      }
    }, 500);
    return;
  }

  console.log("✅ Elements initialized:", {
    hasJobsContainer: !!els.jobsContainer,
    hasStats: !!els.stats?.total,
    hasApplicantsContainer: !!els.applicantsContainer,
    hasEmployerName: !!els.employerName
  });

  // Initialize language selector
  if (els.languageSelector) {
    // Wait for i18n to load
    setTimeout(() => {
      if (window.i18n) {
        els.languageSelector.value = window.i18n.currentLanguage || 'en';
      }
    }, 100);
  }

  // Fetch dashboard data
  console.log("📡 Fetching dashboard data...");
  checkEmployerBanAndInit();
}

async function checkEmployerBanAndInit() {
  try {
    const res = await fetch(`${EMPLOYER_API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });

    if (res.ok) {
      const data = await res.json();
      const user = data.user || data;
      if (user.status === 'banned') {
        showBannedBanner();
      }
    }
  } catch (e) {
    console.warn('Could not verify ban status, continuing...');
  }

  // Always load dashboard even for banned users
  fetchDashboard(true);
}

// Wait for DOM to be fully ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  // DOM already loaded
  setTimeout(initializeDashboard, 100);
}

// Initialize Socket.IO after a short delay
setTimeout(() => {
  initSocketIO();
}, 500);

// Setup auto-refresh
setupAutoRefresh();

// ========== NEW ENHANCED FEATURES ==========


// Predictive Analytics
function updatePredictiveAnalytics(jobs = []) {
  try {
    // Cost Forecast
    const totalBudget = jobs.reduce((sum, job) => sum + (job.pay || 0), 0);
    const forecastCost = totalBudget > 0 ? totalBudget * 1.15 : 0; // 15% buffer
    const variance = totalBudget > 0 ? ((forecastCost - totalBudget) / totalBudget * 100).toFixed(1) : 0;

    const forecastCostEl = document.getElementById('forecastCost');
    const forecastVarianceEl = document.getElementById('forecastVariance');
    if (forecastCostEl) forecastCostEl.textContent = currencyFormatter.format(forecastCost);
    if (forecastVarianceEl) {
      forecastVarianceEl.textContent = `±${variance}%`;
      forecastVarianceEl.className = variance > 0 ? 'text-sm font-semibold text-amber-600' : 'text-sm font-semibold text-emerald-600';
    }

    // Availability Forecast
    const availabilityContainer = document.getElementById('availabilityForecastContainer');
    if (availabilityContainer) {
      let daysContainer = availabilityContainer.querySelector('.grid');
      if (!daysContainer) {
        // Create grid if it doesn't exist
        daysContainer = document.createElement('div');
        daysContainer.className = 'grid grid-cols-7 gap-2';
        availabilityContainer.insertBefore(daysContainer, availabilityContainer.firstChild);
      }

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();
      daysContainer.innerHTML = days.map((day, idx) => {
        const date = new Date(today);
        date.setDate(today.getDate() + idx);
        const availability = Math.floor(Math.random() * 30) + 20; // Mock data: 20-50 workers
        return `
          <div class="text-center p-2 bg-gray-50 rounded-lg">
            <p class="text-xs text-ink-muted">${day}</p>
            <p class="text-sm font-bold text-primary mt-1">${availability}</p>
          </div>
        `;
      }).join('');

      const peakEl = document.getElementById('peakAvailability');
      if (peakEl) {
        const peakDay = days[Math.floor(Math.random() * 7)];
        peakEl.textContent = `${peakDay} - 45 workers available`;
      }
    }
  } catch (error) {
    console.error('Error in updatePredictiveAnalytics:', error);
  }
}

// Multi-Worker Booking
const workerTypes = ['Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Welder', 'Laborer'];
let selectedWorkers = [];

function renderMultiWorkerModal() {
  if (!els.multiWorkerSelection) return;

  els.multiWorkerSelection.innerHTML = selectedWorkers.map((worker, idx) => `
    <div class="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
      <div class="flex-1">
        <select class="w-full rounded-lg border border-gray-200 px-3 py-2 mb-2" data-worker-type="${idx}">
          <option value="">Select worker type</option>
          ${workerTypes.map(type => `<option value="${type}" ${worker.type === type ? 'selected' : ''}>${type}</option>`).join('')}
        </select>
        <div class="flex items-center gap-2">
          <label class="text-sm text-ink-muted">Quantity:</label>
          <input type="number" min="1" value="${worker.quantity || 1}" data-worker-qty="${idx}" 
                 class="w-20 rounded-lg border border-gray-200 px-2 py-1 text-center" />
        </div>
      </div>
      <button onclick="removeWorkerType(${idx})" class="ml-4 text-rose-600 hover:text-rose-700">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>
  `).join('');

  updateMultiWorkerTotal();

  // Add event listeners
  els.multiWorkerSelection.querySelectorAll('select[data-worker-type]').forEach(select => {
    select.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-worker-type'));
      selectedWorkers[idx].type = e.target.value;
    });
  });

  els.multiWorkerSelection.querySelectorAll('input[data-worker-qty]').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-worker-qty'));
      selectedWorkers[idx].quantity = parseInt(e.target.value) || 1;
      updateMultiWorkerTotal();
    });
  });
}

function addWorkerType() {
  selectedWorkers.push({ type: '', quantity: 1 });
  renderMultiWorkerModal();
}

function removeWorkerType(idx) {
  selectedWorkers.splice(idx, 1);
  renderMultiWorkerModal();
}

function updateMultiWorkerTotal() {
  const total = selectedWorkers.reduce((sum, w) => sum + (w.quantity || 0), 0);
  const totalEl = document.getElementById('multiWorkerTotal');
  if (totalEl) totalEl.textContent = total;
}

// Worker Reliability Score Calculation
function calculateReliabilityScore(worker) {
  const acceptanceRate = worker.acceptanceRate || 85; // Default 85%
  const punctuality = worker.punctuality || 90; // Default 90%
  const avgRating = worker.avgRating || 4.5; // Default 4.5

  // Weighted calculation: 30% acceptance, 30% punctuality, 40% ratings
  const score = (acceptanceRate * 0.3) + (punctuality * 0.3) + (avgRating * 20); // Rating out of 5 = *20 for percentage
  return Math.round(score);
}

function showWorkerDetail(worker) {
  const modal = els.workerDetailModal;
  if (!modal) return;

  const reliabilityScore = calculateReliabilityScore(worker);
  const acceptanceRate = worker.acceptanceRate || 85;
  const punctuality = worker.punctuality || 90;

  document.getElementById('workerDetailName').textContent = worker.name || 'Worker';
  document.getElementById('reliabilityScore').textContent = reliabilityScore;
  document.getElementById('acceptanceRate').textContent = `${acceptanceRate}%`;
  document.getElementById('punctualityScore').textContent = `${punctuality}%`;
  document.getElementById('reliabilityBar').style.width = `${reliabilityScore}%`;
  document.getElementById('paymentAmount').textContent = currencyFormatter.format(worker.amountDue || 0);

  // Render ratings history
  const ratingsContainer = document.getElementById('ratingsHistoryContainer');
  if (ratingsContainer) {
    const ratings = worker.ratings || [
      { rating: 5, comment: 'Excellent work! Very professional.', date: '2024-01-15', employer: 'John Doe' },
      { rating: 4, comment: 'Good quality work, completed on time.', date: '2024-01-10', employer: 'Jane Smith' },
    ];

    ratingsContainer.innerHTML = ratings.map(r => `
      <div class="border border-gray-200 rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
            <span class="text-sm font-semibold">${r.rating}/5</span>
          </div>
          <span class="text-xs text-ink-muted">${new Date(r.date).toLocaleDateString()}</span>
        </div>
        <p class="text-sm text-ink-muted mb-1">${r.comment}</p>
        <p class="text-xs text-ink-muted">- ${r.employer}</p>
      </div>
    `).join('');
  }

  modal.classList.remove('hidden');

  // Payment button handler
  const payButton = document.getElementById('payWorkerButton');
  if (payButton) {
    payButton.onclick = () => processPayment(worker);
  }
}

function processPayment(worker) {
  const amount = worker.amountDue || 0;
  if (amount <= 0) {
    alert('No amount due for this worker.');
    return;
  }

  // Simulate payment integration (replace with actual payment gateway)
  if (confirm(`Process payment of ${currencyFormatter.format(amount)} to ${worker.name}?`)) {
    // In production, integrate with Razorpay, Stripe, or other payment gateway
    showNotificationToast(`Payment of ${currencyFormatter.format(amount)} processed successfully!`);

    // Update project expenses
    updateProjectExpenses(amount);

    // Close modal
    els.workerDetailModal?.classList.add('hidden');
  }
}

function updateProjectExpenses(amount) {
  // This would typically update the backend
  console.log('Project expense updated:', amount);
  showNotificationToast('Project expenses updated!');
}

// Event Listeners
document.getElementById('openMultiWorkerBooking')?.addEventListener('click', () => {
  selectedWorkers = [{ type: '', quantity: 1 }];
  renderMultiWorkerModal();
  els.multiWorkerModal?.classList.remove('hidden');
});

document.getElementById('openMultiWorkerButton')?.addEventListener('click', () => {
  selectedWorkers = [{ type: '', quantity: 1 }];
  renderMultiWorkerModal();
  els.multiWorkerModal?.classList.remove('hidden');
});

document.getElementById('closeMultiWorkerModal')?.addEventListener('click', () => {
  els.multiWorkerModal?.classList.add('hidden');
});

document.getElementById('closeWorkerDetailModal')?.addEventListener('click', () => {
  els.workerDetailModal?.classList.add('hidden');
});

document.getElementById('addWorkerType')?.addEventListener('click', addWorkerType);

document.getElementById('submitMultiWorkerBooking')?.addEventListener('click', async () => {
  const projectName = document.getElementById('multiWorkerProjectName')?.value;
  const budget = document.getElementById('multiWorkerBudget')?.value;
  const startDate = document.getElementById('multiWorkerStartDate')?.value;
  const endDate = document.getElementById('multiWorkerEndDate')?.value;

  if (!projectName || !budget) {
    alert('Please fill in project name and budget.');
    return;
  }

  const validWorkers = selectedWorkers.filter(w => w.type && w.quantity > 0);
  if (!validWorkers.length) {
    alert('Please add at least one worker type.');
    return;
  }

  try {
    // In production, this would call the backend API
    const payload = {
      projectName,
      budget: parseFloat(budget),
      startDate,
      endDate,
      workers: validWorkers,
    };

    console.log('Multi-worker booking:', payload);
    showNotificationToast(`Team booking created: ${validWorkers.length} worker types, ${validWorkers.reduce((s, w) => s + w.quantity, 0)} total workers`);

    els.multiWorkerModal?.classList.add('hidden');

    // Refresh dashboard
    setTimeout(() => fetchDashboard(false), 1000);
  } catch (error) {
    console.error('Error creating multi-worker booking:', error);
    alert('Failed to create booking. Please try again.');
  }
});

// Language Selector
els.languageSelector?.addEventListener('change', (e) => {
  if (window.i18n) {
    window.i18n.setLanguage(e.target.value);
  }
});

// Make functions globally available
window.removeWorkerType = removeWorkerType;
window.showWorkerDetail = showWorkerDetail;


