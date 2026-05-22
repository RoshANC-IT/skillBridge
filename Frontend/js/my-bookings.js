const API_BASE = "http://localhost:3000/api";
const API_BASE_ALT = "http://localhost:3000/api";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

// Redirect if not logged in
if (!token || !user) {
  window.location.href = "login.html?redirect=my-bookings.html";
}

const els = {
  bookingsContainer: document.getElementById("bookingsContainer"),
  loadingState: document.getElementById("loadingState"),
  emptyState: document.getElementById("emptyState"),
  filterTabs: document.querySelectorAll(".filter-tab"),
};

let allBookings = [];
let currentFilter = "all";

// Service type icons mapping
const serviceIcons = {
  "home-cleaning": "cleaning_services",
  "appliance-repair": "construction",
  "electrical-work": "electrical_services",
  "plumbing": "plumbing",
  "painting": "format_paint",
  "pest-control": "pest_control",
  default: "handyman",
};

// Status colors mapping
const statusColors = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

function formatDate(dateString) {
  if (!dateString) return "Not set";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function formatTime(timeString) {
  if (!timeString) return "";
  // If time is in HH:MM format, format it nicely
  if (timeString.includes(":")) {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  return timeString;
}

function getServiceIcon(serviceType) {
  if (!serviceType) return serviceIcons.default;
  const normalized = serviceType.toLowerCase().replace(/\s+/g, "-");
  return serviceIcons[normalized] || serviceIcons[serviceType] || serviceIcons.default;
}

function getServiceName(serviceType) {
  if (!serviceType) return "Service";
  return serviceType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusColor(status) {
  return statusColors[status?.toLowerCase()] || statusColors.pending;
}

function isUpcoming(booking) {
  if (!booking.date) return false;
  try {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  } catch {
    return false;
  }
}

function isCompleted(booking) {
  return booking.status?.toLowerCase() === "completed";
}

function isCancelled(booking) {
  return booking.status?.toLowerCase() === "cancelled";
}

function filterBookings(bookings, filter) {
  if (filter === "all") return bookings;
  if (filter === "upcoming") return bookings.filter(isUpcoming);
  if (filter === "completed") return bookings.filter(isCompleted);
  if (filter === "cancelled") return bookings.filter(isCancelled);
  return bookings;
}

function renderBookings(bookings) {
  if (!els.bookingsContainer) return;

  const filtered = filterBookings(bookings, currentFilter);

  if (filtered.length === 0) {
    els.bookingsContainer.innerHTML = "";
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");
  els.bookingsContainer.innerHTML = filtered
    .map((booking) => {
      const serviceIcon = getServiceIcon(booking.serviceType);
      const serviceName = getServiceName(booking.serviceType);
      const status = booking.status || "pending";
      const statusColor = getStatusColor(status);
      const statusClass = status.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-'); // Normalize status for CSS class
      const date = formatDate(booking.date);
      const time = formatTime(booking.time);
      const workerName = booking.workerName || "Worker";
      const location = booking.location || "Location not specified";

      return `
        <div class="booking-card group flex flex-col rounded-3xl border-2 border-slate-200/60 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800/50">
          <div class="mb-4 flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="service-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary ring-2 ring-primary/10 dark:ring-primary/20">
                <span class="material-symbols-outlined text-2xl">${serviceIcon}</span>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">${serviceName}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Booking ID: ${booking.id || booking._id || "N/A"}</p>
              </div>
            </div>
            <span class="status-badge ${statusClass} rounded-full px-3 py-1 text-xs font-semibold ${statusColor} relative" data-status="${statusClass}">
              ${status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          <div class="mb-4 space-y-2.5 text-sm">
            <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span class="material-symbols-outlined text-base text-primary">calendar_today</span>
              <span>${date}</span>
            </div>
            ${time ? `
            <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span class="material-symbols-outlined text-base text-primary">schedule</span>
              <span>${time}</span>
            </div>
            ` : ""}
            <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span class="material-symbols-outlined text-base text-primary">person</span>
              <span>${workerName}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span class="material-symbols-outlined text-base text-primary">location_on</span>
              <span class="truncate">${location}</span>
            </div>
          </div>

          ${booking.notes ? `
          <div class="mb-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-3.5 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Notes</p>
            <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">${booking.notes}</p>
          </div>
          ` : ""}

          <div class="mt-auto flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            ${isUpcoming(booking) && !isCancelled(booking) ? `
            <button onclick="cancelBooking('${booking.id || booking._id}')" class="flex-1 rounded-xl border-2 border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-all duration-300 hover:bg-rose-50 hover:border-rose-400 hover:shadow-md dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20">
              <span class="flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-base">close</span>
                Cancel
              </span>
            </button>
            ` : ""}
            <button onclick="viewBookingDetails('${booking.id || booking._id}')" class="btn-primary flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 relative overflow-hidden">
              <span class="relative z-10 flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-base">visibility</span>
                View Details
              </span>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function fetchBookingsFromAPI() {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Try multiple possible endpoints
  const endpoints = [
    `${API_BASE}/bookings`,
    `${API_BASE}/user/bookings`,
    `${API_BASE_ALT}/bookings`,
    `${API_BASE_ALT}/user/bookings`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.bookings || [];
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${endpoint}:`, error);
    }
  }

  return null;
}

function fetchBookingsFromLocalStorage() {
  try {
    const bookings = JSON.parse(localStorage.getItem("userBookings") || "[]");
    // Filter bookings for current user
    if (user && user._id) {
      return bookings.filter((b) => b.employerId === user._id || b.userId === user._id);
    }
    return bookings;
  } catch {
    return [];
  }
}

async function loadBookings() {
  if (!els.loadingState) return;

  els.loadingState.classList.remove("hidden");
  els.emptyState.classList.add("hidden");
  els.bookingsContainer.innerHTML = "";

  try {
    // Try API first
    let bookings = await fetchBookingsFromAPI();

    // Fallback to localStorage
    if (!bookings || bookings.length === 0) {
      bookings = fetchBookingsFromLocalStorage();
    }

    allBookings = Array.isArray(bookings) ? bookings : [];
    renderBookings(allBookings);
  } catch (error) {
    console.error("Error loading bookings:", error);
    // Try localStorage as fallback
    allBookings = fetchBookingsFromLocalStorage();
    renderBookings(allBookings);
  } finally {
    els.loadingState.classList.add("hidden");
  }
}

function setupFilters() {
  els.filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Update active state - just toggle the 'active' class, CSS handles the rest
      els.filterTabs.forEach((t) => {
        t.classList.remove("active");
      });
      tab.classList.add("active");

      // Update filter
      currentFilter = tab.dataset.filter || "all";
      renderBookings(allBookings);
    });
  });
}

function cancelBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  // Update booking status in localStorage
  const bookings = fetchBookingsFromLocalStorage();
  const updated = bookings.map((b) =>
    (b.id === bookingId || b._id === bookingId) ? { ...b, status: "cancelled" } : b
  );
  localStorage.setItem("userBookings", JSON.stringify(updated));

  // Reload bookings
  loadBookings();
}

function viewBookingDetails(bookingId) {
  const booking = allBookings.find((b) => (b.id === bookingId || b._id === bookingId));
  if (!booking) {
    alert("Booking details not found");
    return;
  }

  const details = `
Booking Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service: ${getServiceName(booking.serviceType)}
Status: ${booking.status || "pending"}
Date: ${formatDate(booking.date)}
Time: ${formatTime(booking.time) || "Not set"}
Worker: ${booking.workerName || "Not assigned"}
Location: ${booking.location || "Not specified"}
${booking.notes ? `Notes: ${booking.notes}` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
  alert(details);
}

// Make functions globally available
window.cancelBooking = cancelBooking;
window.viewBookingDetails = viewBookingDetails;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  setupFilters();
  loadBookings();
});


