const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const storedUser = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !storedUser || storedUser.role !== "employer") {
  window.location.href = "login.html";
}

const jobId = new URLSearchParams(window.location.search).get("id");
if (!jobId) {
  window.location.href = "employer-dashboard.html";
}

const els = {
  loadingState: document.getElementById("loadingState"),
  jobContent: document.getElementById("jobContent"),
  errorState: document.getElementById("errorState"),
  jobTitle: document.getElementById("jobTitle"),
  jobStatus: document.getElementById("jobStatus"),
  jobCategory: document.getElementById("jobCategory"),
  jobLocation: document.getElementById("jobLocation"),
  jobPay: document.getElementById("jobPay"),
  applicantCount: document.getElementById("applicantCount"),
  applicantCountText: document.getElementById("applicantCountText"),
  jobSkills: document.getElementById("jobSkills"),
  jobDescription: document.getElementById("jobDescription"),
  assignedWorkerSection: document.getElementById("assignedWorkerSection"),
  assignedWorkerName: document.getElementById("assignedWorkerName"),
  assignedWorkerEmail: document.getElementById("assignedWorkerEmail"),
  applicantsContainer: document.getElementById("applicantsContainer"),
  refreshApplicants: document.getElementById("refreshApplicants"),
  editJobBtn: document.getElementById("editJobBtn"),
  deleteJobBtn: document.getElementById("deleteJobBtn"),
};

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

async function fetchJobDetails() {
  try {
    const res = await fetch(`${API_BASE}/employer/jobs/${jobId}`, { headers });
    if (!res.ok) {
      if (res.status === 404 || res.status === 403) {
        showError();
        return;
      }
      throw new Error("Failed to load job details");
    }

    const data = await res.json();
    renderJob(data.job, data.applicants);
  } catch (error) {
    console.error(error);
    showError();
  }
}

function renderJob(job, applicants) {
  els.loadingState.classList.add("hidden");
  els.jobContent.classList.remove("hidden");

  els.jobTitle.textContent = job.title;
  els.jobCategory.textContent = job.category || "General";
  els.jobLocation.textContent = job.location || "Flexible";
  els.jobPay.textContent = job.pay ? currencyFormatter.format(job.pay) : "Negotiable";
  els.jobDescription.textContent = job.description;
  els.applicantCount.textContent = `${applicants.length} applicant${applicants.length !== 1 ? "s" : ""}`;
  els.applicantCountText.textContent = `${applicants.length} applicant${applicants.length !== 1 ? "s" : ""} for this job`;

  // Status
  const statusColors = {
    open: "bg-emerald-50 text-emerald-600",
    "in-progress": "bg-blue-50 text-blue-600",
    paused: "bg-amber-50 text-amber-600",
    closed: "bg-gray-100 text-gray-700",
  };
  els.jobStatus.textContent = job.status;
  els.jobStatus.className = `px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status] || statusColors.open} capitalize`;

  // Skills
  if (job.skills && job.skills.length > 0) {
    els.jobSkills.innerHTML = job.skills
      .map(
        (skill) =>
          `<span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">${skill}</span>`
      )
      .join("");
  } else {
    els.jobSkills.innerHTML = '<span class="text-ink-muted text-sm">No specific skills required</span>';
  }

  // Assigned worker
  if (job.assignedWorker) {
    els.assignedWorkerSection.classList.remove("hidden");
    els.assignedWorkerName.textContent = job.assignedWorker.name;
    els.assignedWorkerEmail.textContent = job.assignedWorker.email;
  } else {
    els.assignedWorkerSection.classList.add("hidden");
  }

  // Applicants
  renderApplicants(applicants);
}

function renderApplicants(applicants) {
  if (!applicants.length) {
    els.applicantsContainer.innerHTML =
      '<p class="text-ink-muted text-center py-8 border border-dashed border-gray-200 rounded-xl">No applicants yet. Share this job to attract workers!</p>';
    return;
  }

  els.applicantsContainer.innerHTML = applicants
    .map(
      (app) => `
      <div class="border border-gray-100 rounded-xl p-5 bg-white hover:shadow-md transition">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold">${app.worker?.name || "Worker"}</h3>
              <span class="px-3 py-1 rounded-full text-xs font-semibold ${app.status === "accepted"
          ? "bg-emerald-50 text-emerald-600"
          : app.status === "rejected"
            ? "bg-rose-50 text-rose-600"
            : "bg-amber-50 text-amber-600"
        } capitalize">${app.status}</span>
            </div>
            <div class="flex flex-wrap gap-4 text-sm text-ink-muted mb-3">
              <span>${app.worker?.email || "N/A"}</span>
              <span>@${app.worker?.userName || "username"}</span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-base">schedule</span>
                Applied ${new Date(app.appliedAt).toLocaleDateString()}
              </span>
            </div>
            ${app.coverLetter ? `<p class="text-sm text-ink-muted bg-gray-50 rounded-lg p-3 mb-3">${app.coverLetter}</p>` : ""}
          </div>
          <div class="flex gap-2">
            ${app.status === "pending" ? `
              <button onclick="updateApplicationStatus('${app.id}', 'accepted')" class="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 text-sm">
                Accept
              </button>
              <button onclick="updateApplicationStatus('${app.id}', 'rejected')" class="px-4 py-2 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 text-sm">
                Reject
              </button>
            ` : ""}
            <a href="applicant-detail.html?id=${app.id}" class="px-4 py-2 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 text-sm">
              View Details
            </a>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

async function updateApplicationStatus(applicationId, status) {
  // if (!confirm(`Are you sure you want to ${status} this application?`)) return;

  try {
    const res = await fetch(`${API_BASE}/employer/applications/${applicationId}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to update application");
    }

    alert(`✅ Application ${status} successfully!`);
    fetchJobDetails();
  } catch (error) {
    console.error(error);
    alert(`❌ ${error.message}`);
  }
}

window.updateApplicationStatus = updateApplicationStatus;

function showError() {
  els.loadingState.classList.add("hidden");
  els.jobContent.classList.add("hidden");
  els.errorState.classList.remove("hidden");
}

els.refreshApplicants?.addEventListener("click", fetchJobDetails);

els.deleteJobBtn?.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;

  try {
    const res = await fetch(`${API_BASE}/employer/jobs/${jobId}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) throw new Error("Failed to delete job");

    alert("✅ Job deleted successfully!");
    window.location.href = "employer-dashboard.html";
  } catch (error) {
    console.error(error);
    alert(`❌ ${error.message}`);
  }
});

fetchJobDetails();

