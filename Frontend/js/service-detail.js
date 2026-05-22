const API_BASE = "http://localhost:3000/api";
const serviceSlug = new URLSearchParams(window.location.search).get("slug") || 
                     window.location.pathname.split("/").pop().replace(".html", "");

const els = {
  loadingState: document.getElementById("loadingState"),
  serviceContent: document.getElementById("serviceContent"),
  errorState: document.getElementById("errorState"),
  serviceName: document.getElementById("serviceName"),
  serviceDescription: document.getElementById("serviceDescription"),
  jobsContainer: document.getElementById("jobsContainer"),
  workersContainer: document.getElementById("workersContainer"),
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

async function fetchServiceDetails() {
  try {
    const res = await fetch(`${API_BASE}/services/${serviceSlug}`);
    if (!res.ok) {
      if (res.status === 404) {
        showError();
        return;
      }
      throw new Error("Failed to load service details");
    }

    const data = await res.json();
    renderService(data);
  } catch (error) {
    console.error(error);
    showError();
  }
}

function renderService(data) {
  els.loadingState.classList.add("hidden");
  els.serviceContent.classList.remove("hidden");

  els.serviceName.textContent = data.service.name;
  els.serviceDescription.textContent = `Browse available ${data.service.name.toLowerCase()} jobs and connect with skilled professionals.`;

  // Render jobs
  if (data.jobs && data.jobs.length > 0) {
    els.jobsContainer.innerHTML = data.jobs
      .map(
        (job) => `
        <div class="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer" onclick="window.location.href='job-detail.html?id=${job.id}'">
          <h3 class="text-lg font-semibold mb-2">${job.title}</h3>
          <p class="text-sm text-ink-muted mb-3 line-clamp-2">${job.description.substring(0, 100)}...</p>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-ink-muted">Location</p>
              <p class="text-sm font-semibold">${job.location || "Flexible"}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-ink-muted">Pay</p>
              <p class="text-sm font-semibold text-primary">${job.pay ? currencyFormatter.format(job.pay) : "Negotiable"}</p>
            </div>
          </div>
          <button
            onclick="event.stopPropagation(); window.location.href='job-detail.html?id=${job.id}'"
            class="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 text-sm"
          >
            View Details
          </button>
        </div>
      `
      )
      .join("");
  } else {
    els.jobsContainer.innerHTML =
      '<p class="text-ink-muted col-span-full text-center py-8">No jobs available for this service yet.</p>';
  }

  // Render workers
  if (data.workers && data.workers.length > 0) {
    els.workersContainer.innerHTML = data.workers
      .map(
        (worker) => `
        <div class="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              ${worker.name.charAt(0)}
            </div>
            <div>
              <h3 class="font-semibold">${worker.name}</h3>
              <p class="text-xs text-ink-muted">@${worker.userName}</p>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${
              worker.availability === "available"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            } capitalize">
              ${worker.availability}
            </span>
            <a
              href="login.html"
              class="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 text-sm"
            >
              Contact
            </a>
          </div>
        </div>
      `
      )
      .join("");
  } else {
    els.workersContainer.innerHTML =
      '<p class="text-ink-muted col-span-full text-center py-8">No workers available for this service yet.</p>';
  }
}

function showError() {
  els.loadingState.classList.add("hidden");
  els.serviceContent.classList.add("hidden");
  els.errorState.classList.remove("hidden");
}

fetchServiceDetails();

