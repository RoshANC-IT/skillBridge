const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const storedUser = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !storedUser || storedUser.role !== "worker") {
  window.location.href = "login.html";
}

const jobId = new URLSearchParams(window.location.search).get("id");
if (!jobId) {
  window.location.href = "worker-dashboard.html";
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
  employerName: document.getElementById("employerName"),
  employerFullName: document.getElementById("employerFullName"),
  employerEmail: document.getElementById("employerEmail"),
  jobSkills: document.getElementById("jobSkills"),
  jobDescription: document.getElementById("jobDescription"),
  applyForm: document.getElementById("applyForm"),
  notAppliedState: document.getElementById("notAppliedState"),
  appliedState: document.getElementById("appliedState"),
  viewApplicationLink: document.getElementById("viewApplicationLink"),
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
    const res = await fetch(`${API_BASE}/worker/jobs/${jobId}`, { headers });
    if (!res.ok) {
      if (res.status === 404) {
        showError();
        return;
      }
      throw new Error("Failed to load job details");
    }

    const data = await res.json();
    renderJob(data.job, data.hasApplied, data.applicationId);
  } catch (error) {
    console.error(error);
    showError();
  }
}

function renderJob(job, hasApplied, applicationId) {
  els.loadingState.classList.add("hidden");
  els.jobContent.classList.remove("hidden");

  els.jobTitle.textContent = job.title;
  els.jobStatus.textContent = job.status;
  els.jobCategory.textContent = job.category || "General";
  els.jobLocation.textContent = job.location || "Flexible";
  els.jobPay.textContent = job.pay ? currencyFormatter.format(job.pay) : "Negotiable";
  els.employerName.textContent = job.employer?.name || "Employer";
  els.employerFullName.textContent = job.employer?.name || "Employer";
  els.employerEmail.textContent = job.employer?.email || "N/A";
  els.jobDescription.textContent = job.description;

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

  // Application state
  if (hasApplied) {
    els.notAppliedState.classList.add("hidden");
    els.appliedState.classList.remove("hidden");
    if (applicationId) {
      els.viewApplicationLink.href = `application-detail.html?id=${applicationId}`;
    }
  } else {
    els.notAppliedState.classList.remove("hidden");
    els.appliedState.classList.add("hidden");
  }

  // Status colors
  const statusColors = {
    open: "bg-emerald-50 text-emerald-600",
    "in-progress": "bg-blue-50 text-blue-600",
    paused: "bg-amber-50 text-amber-600",
    closed: "bg-gray-100 text-gray-700",
  };
  els.jobStatus.className = `px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status] || statusColors.open} capitalize`;
}

function showError() {
  els.loadingState.classList.add("hidden");
  els.jobContent.classList.add("hidden");
  els.errorState.classList.remove("hidden");
}

els.applyForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const coverLetter = document.getElementById("coverLetter").value.trim();

  if (!coverLetter) {
    alert("Please provide a cover letter");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/worker/jobs/${jobId}/apply`, {
      method: "POST",
      headers,
      body: JSON.stringify({ coverLetter }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to submit application");
    }

    const data = await res.json();
    alert("✅ Application submitted successfully!");
    fetchJobDetails();
  } catch (error) {
    console.error(error);
    alert(`❌ ${error.message}`);
  }
});

fetchJobDetails();

