const API_BASE = "http://localhost:3000/api";
let token, storedUser, els, requestOptions, state;
let currentBookingTab = "pending"; // Track current active tab
let applicationStats = { totalApplications: 0, accepted: 0, pending: 0, rejected: 0 }; // Store application stats separately
let incomeGrowthChart = null;
let jobTypeChart = null;
let currentLanguage = localStorage.getItem("dashboardLanguage") || "en";

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  token = localStorage.getItem("token");
  storedUser = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !storedUser || storedUser.role !== "worker") {
    window.location.href = "login.html";
    return;
  }

  // Show ban banner immediately from localStorage (status set during login)
  if (storedUser.status === "banned") {
    setTimeout(showBannedBanner, 50);
  }

  els = {
    userName: document.getElementById("userName"),
    userFirstName: document.getElementById("userFirstName"),
    userRole: document.getElementById("userRole"),
    userId: document.getElementById("userId"),
    avatar: document.getElementById("userAvatar"),
    availabilityToggle: document.getElementById("availabilityToggle"),
    availabilityLabel: document.getElementById("availabilityLabel"),
    availabilityTrack: document.getElementById("availabilityTrack"),
    availabilityThumb: document.getElementById("availabilityThumb"),
    statsTotal: document.getElementById("statsTotal"),
    statsAccepted: document.getElementById("statsAccepted"),
    statsPending: document.getElementById("statsPending"),
    statsRejected: document.getElementById("statsRejected"),
    applicationsContainer: document.getElementById("applicationsContainer"),
    notificationsContainer: document.getElementById("notificationsContainer"),
    refreshApplications: document.getElementById("refreshApplications"),
    refreshNotifications: document.getElementById("refreshNotifications"),
    bookingsContainer: document.getElementById("bookingsContainer"),
    refreshBookings: document.getElementById("refreshBookings"),
    tabPending: document.getElementById("tab-pending"),
    tabAccepted: document.getElementById("tab-accepted"),
    tabRejected: document.getElementById("tab-rejected"),
    badgePending: document.getElementById("badge-pending"),
    badgeAccepted: document.getElementById("badge-accepted"),
    badgeRejected: document.getElementById("badge-rejected"),
    notificationBadge: document.getElementById("notificationBadge"),
    updateProfileBtn: document.getElementById("updateProfileBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    sidebar: document.getElementById("sidebar"),
    sidebarToggle: document.getElementById("sidebarToggle"),
    closeSidebar: document.getElementById("closeSidebar"),
    sidebarBackdrop: document.getElementById("sidebarBackdrop"),
    themeToggle: document.getElementById("themeToggle"),
    refreshEarnings: document.getElementById("refreshEarnings"),
    todayEarnings: document.getElementById("todayEarnings"),
    monthEarnings: document.getElementById("monthEarnings"),
    lifetimeEarnings: document.getElementById("lifetimeEarnings"),
    todayCount: document.getElementById("todayCount"),
    monthCount: document.getElementById("monthCount"),
    lifetimeCount: document.getElementById("lifetimeCount"),
    languageSelect: document.getElementById("languageSelect"),
  };

  // Check if required elements exist
  if (!els.userName || !els.applicationsContainer) {
    console.error("Required DOM elements not found");
    return;
  }

  requestOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // Initialize state
  state = {
    availability: storedUser.availability || "available",
  };

  // Initialize dashboard
  bindEvents();
  initLanguageSupport();

  // Check ban status immediately before loading dashboard
  checkBanStatusAndInit();
});

async function checkBanStatusAndInit() {
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
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

  // Always load dashboard (even for banned users)
  fetchDashboard();
  initSocketIO();
  fetchEarnings();

  // Periodic refresh
  setInterval(() => {
    if (els.notificationsContainer) refreshNotificationsOnly();
    if (els.bookingsContainer) fetchBookingsByStatus(currentBookingTab);
    updateBookingStats();
    fetchEarnings();
  }, 30000);
}

const availabilityColors = {
  available: { track: "#86efac", thumb: "translateX(24px)" },
  busy: { track: "#fbbf24", thumb: "translateX(0)" },
  offline: { track: "#cbd5f5", thumb: "translateX(0)" },
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatDate = (value) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

function renderProfile(profile) {
  if (!els || !els.userName) return;

  const fullName = profile?.name || `${storedUser?.firstName || ""} ${storedUser?.lastName || ""}`.trim() || "Worker";
  if (els.userName) els.userName.textContent = fullName;
  if (els.userFirstName) els.userFirstName.textContent = profile?.name?.split(" ")[0] || storedUser?.firstName || "Pro";
  if (els.userRole) els.userRole.textContent = profile?.role || storedUser?.role || "worker";
  if (els.userId) els.userId.textContent = profile?.id || storedUser?._id || storedUser?.id || "--";

  if (els.avatar) {
    if (profile?.avatarUrl) {
      els.avatar.style.backgroundImage = `url(${profile.avatarUrl})`;
      els.avatar.style.backgroundSize = "cover";
      els.avatar.textContent = "";
    } else {
      const initials = fullName
        .split(" ")
        .map((chunk) => chunk[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "W";
      els.avatar.textContent = initials;
      els.avatar.style.backgroundImage = "";
    }
  }

  updateAvailabilityUI(profile?.availability || state?.availability || "available");
}

function updateAvailabilityUI(status) {
  state.availability = status;
  els.availabilityLabel.textContent = status;
  const config = availabilityColors[status] || availabilityColors.busy;
  els.availabilityTrack.style.backgroundColor = config.track;
  els.availabilityThumb.style.transform = config.thumb;
  els.availabilityToggle.checked = status === "available";
}

async function updateBookingStats() {
  try {
    // Fetch all bookings to calculate stats
    const res = await fetch(`${API_BASE}/bookings/worker`, {
      method: "GET",
      headers: requestOptions.headers,
    });

    if (!res.ok) {
      console.error("Failed to fetch bookings for stats:", res.status);
      return;
    }

    const data = await res.json();
    const bookings = data.bookings || [];

    // Calculate booking stats
    const bookingStats = {
      pending: bookings.filter(b => b.status === "pending").length,
      accepted: bookings.filter(b => b.status === "confirmed").length,
      rejected: bookings.filter(b => b.status === "cancelled").length,
      total: bookings.length,
    };

    // Update booking badges on tabs
    if (els.badgePending) els.badgePending.textContent = bookingStats.pending;
    if (els.badgeAccepted) els.badgeAccepted.textContent = bookingStats.accepted;
    if (els.badgeRejected) els.badgeRejected.textContent = bookingStats.rejected;

    // Update main stats cards - combine application stats with booking stats
    // Use stored applicationStats instead of reading from DOM
    const combinedStats = {
      total: applicationStats.totalApplications + bookingStats.total,
      accepted: applicationStats.accepted + bookingStats.accepted,
      pending: applicationStats.pending + bookingStats.pending,
      rejected: applicationStats.rejected + bookingStats.rejected,
    };

    // Update stats display with combined values
    if (els.statsTotal) {
      els.statsTotal.textContent = combinedStats.total;
    }
    if (els.statsAccepted) {
      els.statsAccepted.textContent = combinedStats.accepted;
    }
    if (els.statsPending) {
      els.statsPending.textContent = combinedStats.pending;
    }
    if (els.statsRejected) {
      els.statsRejected.textContent = combinedStats.rejected;
    }

    console.log("✅ Stats updated:", {
      applications: applicationStats,
      bookings: bookingStats,
      combined: combinedStats
    });
  } catch (error) {
    console.error("Error updating booking stats:", error);
  }
}

function renderStats(stats) {
  if (!els) return;

  // Store application stats for later combination with booking stats
  applicationStats = {
    totalApplications: stats?.totalApplications ?? 0,
    accepted: stats?.accepted ?? 0,
    pending: stats?.pending ?? 0,
    rejected: stats?.rejected ?? 0,
  };

  // Update stats display (will be combined with booking stats by updateBookingStats)
  if (els.statsTotal) els.statsTotal.textContent = applicationStats.totalApplications;
  if (els.statsAccepted) els.statsAccepted.textContent = applicationStats.accepted;
  if (els.statsPending) els.statsPending.textContent = applicationStats.pending;
  if (els.statsRejected) els.statsRejected.textContent = applicationStats.rejected;

  // Also update booking stats to combine with application stats
  updateBookingStats();
}

function renderApplications(applications = []) {
  if (!els || !els.applicationsContainer) return;

  if (!applications.length) {
    els.applicationsContainer.innerHTML =
      `<div class="text-center py-8">
        <p class="text-sm text-ink-muted mb-3">No applications yet.</p>
        <a href="jobs.html" class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition">
          <span class="material-symbols-outlined text-base">search</span>
          Browse Gigs
        </a>
      </div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  applications.forEach((app) => {
    const card = document.createElement("article");
    card.className =
      "bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-3 hover:-translate-y-0.5 transition cursor-pointer";
    card.onclick = () => {
      // Navigate to application detail if we have the ID, otherwise to job detail
      if (app.applicationId) {
        window.location.href = `application-detail.html?id=${app.applicationId}`;
      } else {
        window.location.href = `job-detail.html?id=${app.jobId}`;
      }
    };

    const statusColor =
      app.myStatus === "accepted"
        ? "bg-emerald-50 text-emerald-600"
        : app.myStatus === "rejected"
          ? "bg-rose-50 text-rose-600"
          : "bg-amber-50 text-amber-600";

    let progressBarHtml = '';
    if (app.myStatus === "accepted") {
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

      let actionButtonsHtml = '';
      if (app.jobStatus === "assigned") {
        actionButtonsHtml = `
          <div class="mt-4 flex gap-2">
            <button onclick="event.stopPropagation(); window.updateJobProgress('${app.jobId}', 'in-progress')" class="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 text-xs text-center transition">
              Start Work
            </button>
          </div>
        `;
      } else if (app.jobStatus === "in-progress") {
        actionButtonsHtml = `
          <div class="mt-4 flex gap-2">
            <button onclick="event.stopPropagation(); window.updateJobProgress('${app.jobId}', 'completed')" class="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 text-xs text-center transition">
              Complete Work
            </button>
          </div>
        `;
      }

      progressBarHtml = `
      <div class="mt-4 pt-4 border-t border-gray-100">
        <div class="flex justify-between items-center mb-3">
          <p class="text-xs font-semibold text-ink-muted uppercase tracking-wider">Job Progress</p>
          <span class="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">${app.jobStatus}</span>
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
        ${actionButtonsHtml}
      </div>
      `;
    }

    card.innerHTML = `
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-ink-muted">${app.employerName || "Employer"}</p>
          <h4 class="text-lg font-semibold text-ink">${app.title}</h4>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor} capitalize">${app.myStatus}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 text-sm text-ink-muted">
        <p><span class="font-semibold text-ink">Job:</span> ${app.jobStatus}</p>
        <p><span class="font-semibold text-ink">Pay:</span> ${app.pay ? currencyFormatter.format(app.pay) : "N/A"
      }</p>
        <p><span class="font-semibold text-ink">Applied:</span> ${formatDate(app.appliedAt)}</p>
        <p><span class="font-semibold text-ink">Location:</span> ${app.location || "Flexible"}</p>
      </div>
      ${progressBarHtml}
      <button
        onclick="event.stopPropagation(); window.location.href='${app.applicationId ? `application-detail.html?id=${app.applicationId}` : `job-detail.html?id=${app.jobId}`}'"
        class="mt-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 text-sm"
      >
        View Details
      </button>
    `;

    fragment.appendChild(card);
  });

  els.applicationsContainer.innerHTML = "";
  els.applicationsContainer.appendChild(fragment);
}

function renderNotifications(notifications = []) {
  if (!els || !els.notificationsContainer) {
    console.warn("Notifications container not found");
    return;
  }

  console.log("Rendering notifications:", notifications.length);

  if (!notifications.length) {
    els.notificationsContainer.innerHTML =
      '<p class="text-sm text-ink-muted">No notifications yet. We will keep you posted.</p>';
    updateNotificationBadge(0);
    return;
  }

  // Update badge with booking notifications count
  updateNotificationBadge(bookingNotifications.length);

  // Create container with spacing
  const notificationsHTML = notifications
    .map(
      (note) => {
        const icon = note.type === "booking" ? "event" : "notifications";
        const color = note.type === "booking" ? "text-emerald-600" : "text-primary";
        const bgColor = note.type === "booking" ? "bg-emerald-50" : "";

        return `
          <div class="flex gap-3 items-start border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition ${bgColor} mb-3">
            <span class="material-symbols-outlined ${color} flex-shrink-0">${icon}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-ink">${note.message || "Notification"}</p>
              <p class="text-xs text-ink-muted mt-1">${formatDate(note.createdAt)}</p>
              ${note.type === "booking" && note.booking ? `
                <div class="mt-2 flex flex-wrap gap-2 text-xs">
                  <span class="px-2 py-1 bg-white rounded-full text-ink-muted">${note.booking.serviceType || "Service"}</span>
                  <span class="px-2 py-1 bg-white rounded-full text-ink-muted">${formatDate(note.booking.bookingDate)}</span>
                  <span class="px-2 py-1 bg-white rounded-full text-ink-muted">${currencyFormatter.format(note.booking.price || 0)}</span>
                </div>
              ` : ""}
            </div>
            ${note.type === "booking" ? `
              <button 
                onclick="viewBooking('${note.bookingId}')" 
                class="text-xs text-primary font-semibold hover:underline flex-shrink-0"
              >
                View
              </button>
            ` : ""}
          </div>
        `;
      }
    )
    .join("");

  els.notificationsContainer.innerHTML = `<div class="space-y-3">${notificationsHTML}</div>`;
  console.log("Notifications rendered successfully");
}

function viewBooking(bookingId) {
  // Switch to pending tab if not already there
  if (currentBookingTab !== "pending") {
    switchBookingTab("pending");
  }
  // Scroll to bookings section
  setTimeout(() => {
    document.getElementById("bookingsContainer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Highlight the booking after a short delay to allow rendering
    setTimeout(() => {
      const bookingCard = document.querySelector(`[data-booking-id="${bookingId}"]`);
      if (bookingCard) {
        bookingCard.scrollIntoView({ behavior: "smooth", block: "center" });
        bookingCard.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          bookingCard.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 3000);
      }
    }, 500);
  }, 300);
}

window.viewBooking = viewBooking;

function renderBookings(bookings = [], status = "pending") {
  if (!els || !els.bookingsContainer) return;

  if (!bookings.length) {
    const emptyMessages = {
      pending: "No pending booking requests at the moment.",
      confirmed: "No accepted bookings yet.",
      cancelled: "No rejected bookings.",
    };
    els.bookingsContainer.innerHTML = `
      <p class="text-sm text-ink-muted border border-dashed border-gray-200 rounded-2xl p-6 text-center">
        ${emptyMessages[status] || "No bookings found."}
      </p>
    `;

    // Update notification badge only for pending
    if (status === "pending") {
      updateNotificationBadge(0);
    }
    return;
  }

  // Update notification badge for pending bookings
  if (status === "pending") {
    updateNotificationBadge(bookings.length);
  }

  const fragment = document.createDocumentFragment();

  bookings.forEach((booking) => {
    const card = document.createElement("article");
    card.className = "bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition";
    card.dataset.bookingId = booking._id || booking.id;

    const employerName = booking.employer
      ? `${booking.employer.firstName || ""} ${booking.employer.lastName || ""}`.trim() || booking.employer.userName || "Employer"
      : "Employer";

    const statusBadge = {
      pending: '<span class="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Pending</span>',
      confirmed: '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Accepted</span>',
      cancelled: '<span class="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">Rejected</span>',
      "in-progress": '<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">In Progress</span>',
      completed: '<span class="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">Completed</span>',
    };

    card.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">event</span>
              <h4 class="text-lg font-semibold text-ink">${booking.serviceType || "Service Request"}</h4>
            </div>
            ${statusBadge[booking.status] || statusBadge.pending}
          </div>
          <p class="text-sm text-ink-muted mb-3">From: <span class="font-semibold text-ink">${employerName}</span></p>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-ink-muted">Date</p>
              <p class="font-semibold text-ink">${formatDate(booking.bookingDate)}</p>
            </div>
            <div>
              <p class="text-ink-muted">Time</p>
              <p class="font-semibold text-ink">${booking.bookingTime || "N/A"}</p>
            </div>
            <div>
              <p class="text-ink-muted">Location</p>
              <p class="font-semibold text-ink">${booking.city || "N/A"}</p>
            </div>
            <div>
              <p class="text-ink-muted">Amount</p>
              <p class="font-semibold text-primary">${currencyFormatter.format(booking.price || 0)}</p>
            </div>
          </div>
          ${booking.address ? `<p class="text-xs text-ink-muted mt-2"><span class="font-semibold">Address:</span> ${booking.address}</p>` : ""}
          ${booking.notes ? `<p class="text-xs text-ink-muted mt-1"><span class="font-semibold">Notes:</span> ${booking.notes}</p>` : ""}
        </div>
      </div>
      ${status === "pending" ? `
        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button
            onclick="acceptBooking('${booking._id || booking.id}')"
            class="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition text-sm flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-base">check_circle</span>
            Accept
          </button>
          <button
            onclick="rejectBooking('${booking._id || booking.id}')"
            class="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition text-sm flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-base">cancel</span>
            Reject
          </button>
        </div>
      ` : ""}
    `;

    fragment.appendChild(card);
  });

  els.bookingsContainer.innerHTML = "";
  els.bookingsContainer.appendChild(fragment);
}

async function fetchBookingsByStatus(status = "pending") {
  if (!els || !els.bookingsContainer) return;

  // Show loading state
  els.bookingsContainer.innerHTML = `
    <div class="animate-pulse rounded-2xl bg-gray-50 p-6">
      <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div class="h-3 bg-gray-100 rounded w-1/3"></div>
    </div>
  `;

  try {
    const statusMap = {
      pending: "pending",
      confirmed: "confirmed",
      cancelled: "cancelled",
    };

    const queryStatus = statusMap[status] || status;
    const res = await fetch(`${API_BASE}/bookings/worker?status=${queryStatus}`, {
      method: "GET",
      headers: requestOptions.headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(errorData.message || `Failed to load bookings (${res.status})`);
    }

    const data = await res.json();
    renderBookings(data.bookings || [], queryStatus);

    // Update stats after fetching
    updateBookingStats();
  } catch (error) {
    console.error("Error fetching bookings:", error);
    const errorMessage = error.message || "Unable to load bookings";
    els.bookingsContainer.innerHTML = `
      <div class="rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <p class="text-amber-600 text-sm">${errorMessage}</p>
        <button onclick="switchBookingTab('${status}')" class="mt-2 text-xs text-amber-700 underline">Retry</button>
      </div>
    `;
  }
}

function switchBookingTab(tabStatus) {
  currentBookingTab = tabStatus;

  // Update tab buttons
  const tabs = [els.tabPending, els.tabAccepted, els.tabRejected];
  tabs.forEach(tab => {
    if (tab) {
      tab.classList.remove("active", "border-primary", "text-primary");
      tab.classList.add("border-transparent", "text-ink-muted");
    }
  });

  // Activate selected tab
  const activeTab = {
    pending: els.tabPending,
    confirmed: els.tabAccepted,
    cancelled: els.tabRejected,
  }[tabStatus];

  if (activeTab) {
    activeTab.classList.add("active", "border-primary", "text-primary");
    activeTab.classList.remove("border-transparent", "text-ink-muted");
  }

  // Fetch and render bookings for selected tab
  fetchBookingsByStatus(tabStatus);
}

window.switchBookingTab = switchBookingTab;

function updateNotificationBadge(count) {
  if (!els.notificationBadge) return;
  if (count > 0) {
    els.notificationBadge.textContent = count > 99 ? "99+" : count;
    els.notificationBadge.classList.remove("hidden");
    // Add pulse animation
    els.notificationBadge.classList.add("animate-pulse");
    setTimeout(() => {
      els.notificationBadge.classList.remove("animate-pulse");
    }, 2000);
  } else {
    els.notificationBadge.classList.add("hidden");
  }
}

// Legacy function for backward compatibility - now uses tab system
async function fetchPendingBookings() {
  if (currentBookingTab === "pending") {
    fetchBookingsByStatus("pending");
  } else {
    switchBookingTab("pending");
  }
}

async function acceptBooking(bookingId) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: requestOptions.headers,
      body: JSON.stringify({ status: "confirmed" }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to accept booking" }));
      throw new Error(errorData.message || "Failed to accept booking");
    }

    alert("✅ Booking accepted successfully!");

    // Immediately update stats
    await updateBookingStats();

    // Refresh current tab
    await fetchBookingsByStatus(currentBookingTab);

    // Refresh dashboard (which will also update stats)
    fetchDashboard(false);
  } catch (error) {
    console.error(error);
    alert(`❌ ${error.message}`);
  }
}

async function rejectBooking(bookingId) {
  if (!confirm("Are you sure you want to reject this booking request?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: requestOptions.headers,
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to reject booking" }));
      throw new Error(errorData.message || "Failed to reject booking");
    }

    alert("❌ Booking rejected");

    // Immediately update stats
    await updateBookingStats();

    // Refresh current tab
    await fetchBookingsByStatus(currentBookingTab);

    // Refresh dashboard (which will also update stats)
    fetchDashboard(false);
  } catch (error) {
    console.error(error);
    alert(`❌ ${error.message}`);
  }
}

// Make functions globally available for onclick handlers
window.acceptBooking = acceptBooking;
window.rejectBooking = rejectBooking;

async function fetchDashboard(showLoader = true) {
  if (!els || !els.applicationsContainer) {
    console.error("Elements not initialized");
    return;
  }

  if (showLoader) {
    els.applicationsContainer.innerHTML =
      '<div class="animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-gray-100"><div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div><div class="h-3 bg-gray-100 rounded w-1/3"></div></div>';
    if (els.bookingsContainer) {
      els.bookingsContainer.innerHTML =
        '<div class="animate-pulse rounded-2xl bg-gray-50 p-6"><div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div><div class="h-3 bg-gray-100 rounded w-1/3"></div></div>';
    }
  }

  try {
    const res = await fetch(`${API_BASE}/worker/dashboard`, {
      method: "GET",
      headers: requestOptions.headers,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      if (res.status === 403 && (errorText.includes('banned') || errorText.includes('Access denied') || errorText.includes('Account has been banned'))) {
        showBannedOverlay();
        return;
      }
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
      }
      throw new Error(errorData.message || `Failed to load dashboard (${res.status})`);
    }

    const data = await res.json();

    if (data.profile) renderProfile(data.profile);
    if (data.stats) renderStats(data.stats);
    if (data.applications) renderApplications(data.applications || []);

    // Always render notifications, even if empty array
    console.log("Dashboard notifications:", data.notifications?.length || 0);
    renderNotifications(data.notifications || []);

    // Fetch bookings for current tab
    fetchBookingsByStatus(currentBookingTab);
    updateBookingStats();
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    const errorMessage = error.message || "Unable to load dashboard. Please check your connection and try again.";

    if (els.applicationsContainer) {
      els.applicationsContainer.innerHTML = `
        <div class="rounded-2xl bg-red-50 border border-red-200 p-6">
          <p class="text-rose-600 text-sm font-semibold mb-2">⚠️ Error Loading Dashboard</p>
          <p class="text-rose-500 text-sm">${errorMessage}</p>
          <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700">
            Retry
          </button>
        </div>
      `;
    }

    if (els.notificationsContainer) {
      els.notificationsContainer.innerHTML = `<p class="text-rose-500 text-sm">${errorMessage}</p>`;
    }
  }
}

async function refreshNotificationsOnly() {
  if (!els || !els.notificationsContainer) {
    console.warn("Notifications container not found for refresh");
    return;
  }

  try {
    console.log("Fetching notifications...");
    const res = await fetch(`${API_BASE}/worker/notifications`, {
      method: "GET",
      headers: requestOptions.headers,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      if (res.status === 403 && (errorText.includes('banned') || errorText.includes('Access denied') || errorText.includes('Account has been banned'))) {
        showBannedOverlay();
        return;
      }
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch(e) {
        errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
      }
      throw new Error(errorData.message || "Failed to load notifications");
    }

    const data = await res.json();
    console.log("Notifications data received:", data);
    renderNotifications(data.notifications || []);

    // Also update pending bookings count in badge
    const bookingNotifications = (data.notifications || []).filter(n => n.type === "booking");
    updateNotificationBadge(bookingNotifications.length);
  } catch (error) {
    console.error("Error refreshing notifications:", error);
    if (els.notificationsContainer) {
      els.notificationsContainer.innerHTML = `
        <div class="rounded-2xl bg-red-50 border border-red-200 p-4">
          <p class="text-rose-600 text-sm font-semibold mb-1">Error Loading Notifications</p>
          <p class="text-rose-500 text-sm">${error.message}</p>
          <button onclick="refreshNotificationsOnly()" class="mt-2 text-xs text-rose-700 underline">Retry</button>
        </div>
      `;
    }
  }
}

window.refreshNotificationsOnly = refreshNotificationsOnly;

async function updateJobProgress(jobId, status) {
  try {
    const res = await fetch(`${API_BASE}/worker/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: requestOptions.headers,
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update job status");
    }

    // Refresh dashboard to show new status
    initializeDashboard();

  } catch (error) {
    console.error("Error updating job status:", error);
    alert(error.message || "Could not update job status");
  }
}
window.updateJobProgress = updateJobProgress;

async function updateAvailability(isAvailable) {
  const newStatus = isAvailable ? "available" : "busy";
  updateAvailabilityUI(newStatus);

  try {
    const res = await fetch(`${API_BASE}/worker/availability`, {
      method: "PUT",
      headers: requestOptions.headers,
      body: JSON.stringify({ availability: newStatus }),
    });
    if (!res.ok) throw new Error("Unable to update availability");
    const data = await res.json();
    storedUser.availability = data.user.availability;
    localStorage.setItem("user", JSON.stringify(storedUser));
  } catch (error) {
    console.error(error);
    updateAvailabilityUI(state.availability);
    alert(error.message);
  }
}

let socket = null;

// Track if Socket.IO is already initialized
let socketIOInitialized = false;

function initSocketIO() {
  // Prevent duplicate Socket.IO initialization
  if (socketIOInitialized && socket && socket.connected) {
    console.warn("⚠️ Socket.IO already initialized and connected, skipping duplicate initialization");
    return;
  }

  if (!storedUser || (!storedUser._id && !storedUser.id)) {
    console.warn("User ID not found, skipping Socket.IO connection");
    return;
  }

  const userId = storedUser._id || storedUser.id;

  // Close existing connection if any
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
  }

  socket = io("http://localhost:3000", {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to Socket.IO server");
    socket.emit("register", userId.toString());
    socketIOInitialized = true;
  });

  socket.on("registered", (registeredUserId) => {
    console.log("✅ Registered with Socket.IO:", registeredUserId);
  });

  // Track processed booking IDs to prevent duplicates
  const processedBookingIds = new Set();

  socket.on("new_booking", (data) => {
    console.log("🔔 New booking notification:", data);

    const bookingId = data.booking?._id || data.booking?.id;

    // Prevent duplicate notification processing
    if (bookingId && processedBookingIds.has(bookingId.toString())) {
      console.warn("⚠️ Duplicate booking notification ignored:", bookingId);
      return;
    }

    // Mark this booking as processed
    if (bookingId) {
      processedBookingIds.add(bookingId.toString());
      // Clean up old IDs after 1 hour to prevent memory leak
      setTimeout(() => {
        processedBookingIds.delete(bookingId.toString());
      }, 60 * 60 * 1000);
    }

    // Show browser notification if permitted
    if (Notification.permission === "granted") {
      const booking = data.booking || {};
      const employerName = booking.employer
        ? `${booking.employer.firstName || ""} ${booking.employer.lastName || ""}`.trim()
        : "An employer";

      new Notification("New Booking Request", {
        body: `You have a new booking request for ${booking.serviceType || "service"} from ${employerName}`,
        icon: "/favicon.ico",
        tag: `booking-${booking._id || booking.id}`,
      });
    }

    // Add notification to the list dynamically
    addNotificationToUI({
      id: `booking-${bookingId || Date.now()}`,
      type: "booking",
      bookingId: bookingId,
      message: data.message || `New booking request for ${data.booking?.serviceType || "service"}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      booking: {
        serviceType: data.booking?.serviceType,
        bookingDate: data.booking?.bookingDate,
        bookingTime: data.booking?.bookingTime,
        city: data.booking?.city,
        price: data.booking?.price,
      },
    });

    // Refresh bookings and stats
    if (currentBookingTab === "pending") {
      fetchBookingsByStatus("pending");
    }
    updateBookingStats();
    refreshNotificationsOnly();
    fetchDashboard(false);
  });

  socket.on("booking_status_updated", (data) => {
    console.log("📊 Booking status updated:", data);
    updateBookingStats();
    if (els.bookingsContainer) {
      fetchBookingsByStatus(currentBookingTab);
    }
  });

  socket.on("earnings_updated", (earningsData) => {
    console.log("💰 Earnings updated:", earningsData);
    renderEarnings(earningsData);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from Socket.IO server");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log(`✅ Reconnected to Socket.IO after ${attemptNumber} attempts`);
    socket.emit("register", userId.toString());
  });

  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      console.log("Notification permission:", permission);
    });
  }
}

function addNotificationToUI(notification) {
  if (!els.notificationsContainer) return;

  const existingNotifications = Array.from(els.notificationsContainer.children);

  // Check if notification already exists
  const exists = existingNotifications.some(el => {
    const button = el.querySelector(`[onclick*="${notification.bookingId}"]`);
    return button !== null;
  });

  if (exists) return;

  // Create notification element
  const icon = notification.type === "booking" ? "event" : "notifications";
  const color = notification.type === "booking" ? "text-emerald-600" : "text-primary";
  const bgColor = notification.type === "booking" ? "bg-emerald-50" : "";

  const notificationEl = document.createElement("div");
  notificationEl.className = `flex gap-3 items-start border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition ${bgColor}`;
  notificationEl.innerHTML = `
    <span class="material-symbols-outlined ${color} flex-shrink-0">${icon}</span>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-ink">${notification.message}</p>
      <p class="text-xs text-ink-muted mt-1">${formatDate(notification.createdAt)}</p>
      ${notification.type === "booking" && notification.booking ? `
        <div class="mt-2 flex flex-wrap gap-2 text-xs">
          <span class="px-2 py-1 bg-white rounded-full text-ink-muted">${notification.booking.serviceType}</span>
          <span class="px-2 py-1 bg-white rounded-full text-ink-muted">${formatDate(notification.booking.bookingDate)}</span>
          <span class="px-2 py-1 bg-white rounded-full text-ink-muted">${currencyFormatter.format(notification.booking.price || 0)}</span>
        </div>
      ` : ""}
    </div>
    ${notification.type === "booking" ? `
      <button 
        onclick="viewBooking('${notification.bookingId}')" 
        class="text-xs text-primary font-semibold hover:underline flex-shrink-0"
      >
        View
      </button>
    ` : ""}
  `;

  // Add to top of container
  els.notificationsContainer.insertBefore(notificationEl, els.notificationsContainer.firstChild);

  // Limit to 10 notifications
  while (els.notificationsContainer.children.length > 10) {
    els.notificationsContainer.removeChild(els.notificationsContainer.lastChild);
  }

  // Update badge
  const bookingNotifications = Array.from(els.notificationsContainer.children).filter(
    el => el.querySelector(".material-symbols-outlined.text-emerald-600")
  );
  updateNotificationBadge(bookingNotifications.length);

  // Add animation
  notificationEl.style.opacity = "0";
  notificationEl.style.transform = "translateY(-10px)";
  setTimeout(() => {
    notificationEl.style.transition = "all 0.3s ease";
    notificationEl.style.opacity = "1";
    notificationEl.style.transform = "translateY(0)";
  }, 10);
}

// Earnings functions
async function fetchEarnings() {
  if (!els.todayEarnings) return;

  try {
    const res = await fetch(`${API_BASE}/bookings/worker/earnings`, requestOptions);
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = "login.html";
        return;
      }
      throw new Error(`Failed to fetch earnings: ${res.status}`);
    }

    const data = await res.json();
    renderEarnings(data);
  } catch (error) {
    console.error("Error fetching earnings:", error);
    if (els.todayEarnings) els.todayEarnings.textContent = "Error";
    if (els.monthEarnings) els.monthEarnings.textContent = "Error";
    if (els.lifetimeEarnings) els.lifetimeEarnings.textContent = "Error";
  }
}

function renderEarnings(data) {
  if (!data) return;

  // Update earnings cards
  if (els.todayEarnings) {
    els.todayEarnings.textContent = currencyFormatter.format(data.today?.earnings || 0);
  }
  if (els.todayCount) {
    const count = data.today?.count || 0;
    els.todayCount.textContent = `${count} ${i18n('bookings', currentLanguage)}`;
  }

  if (els.monthEarnings) {
    els.monthEarnings.textContent = currencyFormatter.format(data.thisMonth?.earnings || 0);
  }
  if (els.monthCount) {
    const count = data.thisMonth?.count || 0;
    els.monthCount.textContent = `${count} ${i18n('bookings', currentLanguage)}`;
  }

  if (els.lifetimeEarnings) {
    els.lifetimeEarnings.textContent = currencyFormatter.format(data.lifetime?.earnings || 0);
  }
  if (els.lifetimeCount) {
    const count = data.lifetime?.count || 0;
    els.lifetimeCount.textContent = `${count} ${i18n('bookings', currentLanguage)}`;
  }

  // Render charts
  renderIncomeGrowthChart(data.monthlyGrowth || []);
  renderJobTypeChart(data.breakdownByType || {});
}

function renderIncomeGrowthChart(monthlyData) {
  const ctx = document.getElementById("incomeGrowthChart");
  if (!ctx) return;

  const chartData = {
    labels: monthlyData.map(m => m.month),
    datasets: [{
      label: i18n('earnings', currentLanguage),
      data: monthlyData.map(m => m.earnings),
      borderColor: "#6b3df4",
      backgroundColor: "rgba(107, 61, 244, 0.1)",
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }]
  };

  if (incomeGrowthChart) {
    incomeGrowthChart.destroy();
  }

  incomeGrowthChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return currencyFormatter.format(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "₹" + value.toLocaleString("en-IN");
            }
          }
        }
      }
    }
  });
}

function renderJobTypeChart(breakdown) {
  const ctx = document.getElementById("jobTypeChart");
  if (!ctx) return;

  const types = Object.keys(breakdown);
  const earnings = types.map(type => breakdown[type].total);

  const colors = [
    "#6b3df4", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"
  ];

  if (jobTypeChart) {
    jobTypeChart.destroy();
  }

  if (types.length === 0) {
    ctx.parentElement.innerHTML = `<p class="text-center text-ink-muted mt-12">${i18n('no-earnings-data', currentLanguage)}</p>`;
    return;
  }

  jobTypeChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: types,
      datasets: [{
        data: earnings,
        backgroundColor: colors.slice(0, types.length),
        borderWidth: 2,
        borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            padding: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = currencyFormatter.format(context.parsed);
              const count = breakdown[label].count;
              return `${label}: ${value} (${count} ${i18n('bookings', currentLanguage)})`;
            }
          }
        }
      }
    }
  });
}

// Language support
const translations = {
  en: {
    'income-tracker-title': 'Income Tracker',
    'income-tracker-subtitle': 'Track your earnings and growth',
    'income-tracker-nav': 'Income Tracker',
    'today-earnings': "Today's Earnings",
    'month-earnings': 'This Month',
    'lifetime-earnings': 'Lifetime Earnings',
    'income-growth': 'Income Growth (Last 6 Months)',
    'breakdown-by-type': 'Breakdown by Service Type',
    'refresh': 'Refresh',
    'bookings': 'bookings',
    'earnings': 'Earnings',
    'no-earnings-data': 'No earnings data available yet',
    'language-label': 'Language:',
  },
  hi: {
    'income-tracker-title': 'आय ट्रैकर',
    'income-tracker-subtitle': 'अपनी कमाई और वृद्धि पर नज़र रखें',
    'income-tracker-nav': 'आय ट्रैकर',
    'today-earnings': "आज की कमाई",
    'month-earnings': 'इस महीने',
    'lifetime-earnings': 'कुल कमाई',
    'income-growth': 'आय वृद्धि (पिछले 6 महीने)',
    'breakdown-by-type': 'सेवा प्रकार के अनुसार विभाजन',
    'refresh': 'ताज़ा करें',
    'bookings': 'बुकिंग',
    'earnings': 'कमाई',
    'no-earnings-data': 'अभी तक कमाई डेटा उपलब्ध नहीं है',
    'language-label': 'भाषा:',
  },
  mr: {
    'income-tracker-title': 'उत्पन्न ट्रॅकर',
    'income-tracker-subtitle': 'तुमची कमाई आणि वाढ ट्रॅक करा',
    'income-tracker-nav': 'उत्पन्न ट्रॅकर',
    'today-earnings': "आजची कमाई",
    'month-earnings': 'या महिन्यात',
    'lifetime-earnings': 'आयुष्यभर कमाई',
    'income-growth': 'उत्पन्न वाढ (गेल्या 6 महिने)',
    'breakdown-by-type': 'सेवा प्रकारानुसार विभाजन',
    'refresh': 'ताजेतवाने करा',
    'bookings': 'बुकिंग',
    'earnings': 'कमाई',
    'no-earnings-data': 'अद्याप कमाई डेटा उपलब्ध नाही',
    'language-label': 'भाषा:',
  }
};

function i18n(key, lang = 'en') {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

function initLanguageSupport() {
  if (!els.languageSelect) return;

  els.languageSelect.value = currentLanguage;
  els.languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('dashboardLanguage', currentLanguage);
    updateLanguageLabels();
    fetchEarnings(); // Re-fetch to update labels
  });

  updateLanguageLabels();
}

function updateLanguageLabels() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = i18n(key, currentLanguage);
  });
}

function bindEvents() {
  els.refreshApplications?.addEventListener("click", () => fetchDashboard(false));
  els.refreshNotifications?.addEventListener("click", refreshNotificationsOnly);
  els.refreshBookings?.addEventListener("click", () => {
    fetchBookingsByStatus(currentBookingTab);
    updateBookingStats();
  });
  els.refreshEarnings?.addEventListener("click", () => fetchEarnings());

  // Tab switching
  els.tabPending?.addEventListener("click", () => switchBookingTab("pending"));
  els.tabAccepted?.addEventListener("click", () => switchBookingTab("confirmed"));
  els.tabRejected?.addEventListener("click", () => switchBookingTab("cancelled"));
  els.updateProfileBtn?.addEventListener("click", () => (window.location.href = "edit-profile.html"));
  els.logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
  els.availabilityToggle?.addEventListener("change", (e) => updateAvailability(e.target.checked));

  const openSidebar = () => {
    els.sidebar.classList.remove("-translate-x-full");
    els.sidebarBackdrop.classList.remove("hidden");
  };
  const closeSidebar = () => {
    els.sidebar.classList.add("-translate-x-full");
    els.sidebarBackdrop.classList.add("hidden");
  };

  els.sidebarToggle?.addEventListener("click", openSidebar);
  els.closeSidebar?.addEventListener("click", closeSidebar);
  els.sidebarBackdrop?.addEventListener("click", closeSidebar);

  els.themeToggle?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
  });
}

window.updateNotificationBadge = updateNotificationBadge;
window.formatDate = formatDate;

function showBannedBanner() {
  var el = document.getElementById('bannedBanner');
  if (el) el.classList.remove('hidden');
}
