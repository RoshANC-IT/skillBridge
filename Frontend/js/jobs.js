const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const storedUser = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !storedUser || storedUser.role !== "worker") {
  window.location.href = "login.html";
}

const els = {
  jobsContainer: document.getElementById("jobsContainer"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  skillFilter: document.getElementById("skillFilter"),
  searchBtn: document.getElementById("searchBtn"),
  emptyState: document.getElementById("emptyState"),
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

async function fetchJobs(search = "", status = "open", skill = "all") {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (skill) params.append("skill", skill);

    const res = await fetch(`${API_BASE}/worker/jobs?${params.toString()}`, { headers });
    if (!res.ok) throw new Error("Failed to load jobs");

    const data = await res.json();
    renderJobs(data.jobs || []);
  } catch (error) {
    console.error(error);
    els.jobsContainer.innerHTML = `<p class="text-rose-500 col-span-full text-center py-8">Failed to load jobs. Please try again.</p>`;
  }
}

function renderJobs(jobs) {
  if (!jobs.length) {
    els.jobsContainer.classList.add("hidden");
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.jobsContainer.classList.remove("hidden");
  els.emptyState.classList.add("hidden");

  els.jobsContainer.innerHTML = jobs
    .map(
      (job) => `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition cursor-pointer" onclick="window.location.href='job-detail.html?id=${job.id}'">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-2">${job.title}</h3>
            <div class="flex flex-wrap items-center gap-3 text-sm text-ink-muted mb-3">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-base">location_on</span>
                ${job.location || "Flexible"}
              </span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-base">payments</span>
                ${job.pay ? currencyFormatter.format(job.pay) : "Negotiable"}
              </span>
            </div>
          </div>
          ${job.hasApplied ? '<span class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">Applied</span>' : ""}
        </div>
        <p class="text-sm text-ink-muted mb-4 line-clamp-2">${job.description.substring(0, 120)}${job.description.length > 120 ? "..." : ""}</p>
        <div class="flex items-center justify-between">
          <div class="flex flex-wrap gap-1">
            ${job.skills && job.skills.length > 0
              ? job.skills
                  .slice(0, 2)
                  .map(
                    (skill) =>
                      `<span class="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">${skill}</span>`
                  )
                  .join("")
              : ""}
          </div>
          <button
            onclick="event.stopPropagation(); window.location.href='job-detail.html?id=${job.id}'"
            class="px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 text-sm"
          >
            ${job.hasApplied ? "View Details" : "View & Apply"}
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

// Initialize skill filter from global SKILLBRIDGE_SKILLS if available
function initSkillFilter() {
  if (!els.skillFilter) return;
  const SKILLS = window.SKILLBRIDGE_SKILLS || [];
  const groups = {};
  SKILLS.forEach(s => {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  });
  
  let html = '<option value="all">All Skills</option>';
  Object.entries(groups).forEach(([cat, skills]) => {
    html += `<optgroup label="${cat}">`;
    skills.forEach(s => {
      html += `<option value="${s.value}">${s.label}</option>`;
    });
    html += `</optgroup>`;
  });
  els.skillFilter.innerHTML = html;
}

els.searchBtn?.addEventListener("click", () => {
  const search = els.searchInput.value.trim();
  const status = els.statusFilter.value;
  const skill = els.skillFilter?.value || "all";
  fetchJobs(search, status, skill);
});

els.searchInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    els.searchBtn.click();
  }
});

initSkillFilter();
fetchJobs();
