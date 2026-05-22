const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const storedUser = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !storedUser || storedUser.role !== "employer") {
  window.location.href = "login.html";
}

const els = {
  applicationsContainer: document.getElementById("applicationsContainer"),
  emptyState: document.getElementById("emptyState"),
};

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function fetchAllApplications() {
  try {
    // Get all jobs first
    const jobsRes = await fetch(`${API_BASE}/employer/jobs`, { headers });
    if (!jobsRes.ok) throw new Error("Failed to load jobs");

    const jobsData = await jobsRes.json();
    const jobIds = jobsData.jobs.map((job) => job._id);

    // Get all applications for these jobs
    const applications = [];
    for (const jobId of jobIds) {
      const appRes = await fetch(`${API_BASE}/employer/jobs/${jobId}/applicants`, { headers });
      if (appRes.ok) {
        const appData = await appRes.json();
        applications.push(...appData.applicants.map((app) => ({ ...app, jobId })));
      }
    }

    renderApplications(applications);
  } catch (error) {
    console.error(error);
    els.applicationsContainer.innerHTML = `<p class="text-rose-500 col-span-full text-center py-8">Failed to load applications. Please try again.</p>`;
  }
}

function renderApplications(applications) {
  if (!applications.length) {
    els.applicationsContainer.classList.add("hidden");
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.applicationsContainer.classList.remove("hidden");
  els.emptyState.classList.add("hidden");

  els.applicationsContainer.innerHTML = applications
    .map(
      (app) => `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition cursor-pointer" onclick="window.location.href='applicant-detail.html?id=${app._id}'">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-1">${app.worker?.firstName || ""} ${app.worker?.lastName || ""}</h3>
            <p class="text-sm text-ink-muted mb-3">${app.worker?.email || "N/A"}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${
            app.status === "accepted"
              ? "bg-emerald-50 text-emerald-600"
              : app.status === "rejected"
              ? "bg-rose-50 text-rose-600"
              : "bg-amber-50 text-amber-600"
          } capitalize">${app.status}</span>
        </div>
        <div class="space-y-2 mb-4">
          <p class="text-sm">
            <span class="font-semibold text-ink">Applied for:</span>
            <span class="text-ink-muted"> Job #${app.jobId.toString().slice(-6)}</span>
          </p>
          <p class="text-xs text-ink-muted">
            ${new Date(app.createdAt).toLocaleDateString()}
          </p>
        </div>
        ${app.coverLetter ? `<p class="text-sm text-ink-muted mb-4 line-clamp-2">${app.coverLetter.substring(0, 100)}${app.coverLetter.length > 100 ? "..." : ""}</p>` : ""}
        <button
          onclick="event.stopPropagation(); window.location.href='applicant-detail.html?id=${app._id}'"
          class="w-full px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 text-sm"
        >
          View Details
        </button>
      </div>
    `
    )
    .join("");
}

fetchAllApplications();
