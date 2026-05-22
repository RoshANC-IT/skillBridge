const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const storedUser = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !storedUser || storedUser.role !== "worker") {
  window.location.href = "login.html";
}

const applicationId = new URLSearchParams(window.location.search).get("id");
if (!applicationId) {
  window.location.href = "worker-dashboard.html";
}

const els = {
  loadingState: document.getElementById("loadingState"),
  applicationContent: document.getElementById("applicationContent"),
  errorState: document.getElementById("errorState"),
  jobTitle: document.getElementById("jobTitle"),
  applicationStatus: document.getElementById("applicationStatus"),
  appliedDate: document.getElementById("appliedDate"),
  jobLocation: document.getElementById("jobLocation"),
  jobPay: document.getElementById("jobPay"),
  employerName: document.getElementById("employerName"),
  employerFullName: document.getElementById("employerFullName"),
  employerEmail: document.getElementById("employerEmail"),
  jobDescription: document.getElementById("jobDescription"),
  coverLetter: document.getElementById("coverLetter"),
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

async function fetchApplicationDetails() {
  try {
    const res = await fetch(`${API_BASE}/worker/applications/${applicationId}`, { headers });
    if (!res.ok) {
      if (res.status === 404 || res.status === 403) {
        showError();
        return;
      }
      throw new Error("Failed to load application details");
    }

    const data = await res.json();
    renderApplication(data.application, data.job);
  } catch (error) {
    console.error(error);
    showError();
  }
}

function renderApplication(application, job) {
  els.loadingState.classList.add("hidden");
  els.applicationContent.classList.remove("hidden");

  els.jobTitle.textContent = job.title;
  els.jobLocation.textContent = job.location || "Flexible";
  els.jobPay.textContent = job.pay ? currencyFormatter.format(job.pay) : "Negotiable";
  els.employerName.textContent = job.employer?.name || "Employer";
  els.employerFullName.textContent = job.employer?.name || "Employer";
  els.employerEmail.textContent = job.employer?.email || "N/A";
  els.jobDescription.textContent = job.description;
  els.coverLetter.textContent = application.coverLetter || "No cover letter provided.";

  // Status
  const statusColors = {
    pending: "bg-amber-50 text-amber-600",
    accepted: "bg-emerald-50 text-emerald-600",
    rejected: "bg-rose-50 text-rose-600",
  };
  els.applicationStatus.textContent = application.status;
  els.applicationStatus.className = `px-4 py-2 rounded-full text-sm font-semibold ${statusColors[application.status] || statusColors.pending} capitalize`;

  // Dates
  if (application.appliedAt) {
    els.appliedDate.textContent = `Applied on ${new Date(application.appliedAt).toLocaleDateString()}`;
  }
}

function showError() {
  els.loadingState.classList.add("hidden");
  els.applicationContent.classList.add("hidden");
  els.errorState.classList.remove("hidden");
}

fetchApplicationDetails();

