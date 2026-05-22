(() => {
  // Use shared API_BASE if available, otherwise define it
  const API_BASE = window.API_BASE || "http://localhost:3000/api";
  function getServiceSlug() {
    const body = document.body;
    if (body.dataset.serviceSlug) return body.dataset.serviceSlug;

    const fromPath = window.location.pathname.split("/").pop() || "";
    if (fromPath.endsWith("-booking.html")) {
      return fromPath.replace("-booking.html", "");
    }
    return null;
  }

  function getSavedLocation() {
    try {
      const address = localStorage.getItem("userLocation") || "";
      const coordsRaw = localStorage.getItem("userLocationCoords");
      const coords = coordsRaw ? JSON.parse(coordsRaw) : null;
      return { address, coords };
    } catch {
      return { address: "", coords: null };
    }
  }

  function initAddress() {
    const { address } = getSavedLocation();
    if (!address) return;

    const addressInputs =
      document.querySelectorAll("[data-booking-address]") ||
      document.querySelectorAll('input[placeholder*="Address" i]');

    addressInputs.forEach((input) => {
      if (!input.value) input.value = address;
    });
  }

  async function fetchWorkers(serviceSlug) {
    if (!serviceSlug) return [];
    try {
      const res = await fetch(`${API_BASE}/services/${serviceSlug}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.workers) ? data.workers : [];
    } catch {
      return [];
    }
  }

  function renderWorkers(workers) {
    const container = document.querySelector("[data-booking-workers]");
    if (!container) return;

    container.innerHTML = "";
    if (!workers.length) {
      container.innerHTML = `
        <p class="text-sm text-slate-500 dark:text-slate-400">
          No available workers right now. You can still request a booking and we’ll assign someone when they’re free.
        </p>`;
      return;
    }

    const list = document.createElement("div");
    list.className = "space-y-4";

    workers.forEach((worker, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className =
        "w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition text-left";
      card.dataset.workerId = worker.id;

      card.innerHTML = `
        <div class="size-16 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
          ${worker.name?.charAt(0) || "S"}
        </div>
        <div class="flex-1">
          <p class="font-semibold text-slate-900 dark:text-slate-100">${worker.name || "Worker"}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">@${worker.userName || "user"}</p>
          <span class="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            worker.availability === "available"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          }">
            <span class="material-symbols-outlined text-xs">circle</span>
            ${worker.availability}
          </span>
        </div>
      `;

      card.addEventListener("click", () => {
        document
          .querySelectorAll("[data-booking-worker-card]")
          .forEach((el) => el.classList.remove("ring-2", "ring-primary"));
        card.classList.add("ring-2", "ring-primary");
        card.dataset.bookingWorkerCard = "true";
        localStorage.setItem("selectedWorkerId", worker.id);
      });

      if (index === 0) {
        // default selection
        card.classList.add("ring-2", "ring-primary");
        card.dataset.bookingWorkerCard = "true";
        localStorage.setItem("selectedWorkerId", worker.id);
      }

      list.appendChild(card);
    });

    container.appendChild(list);
  }

  // Calendar state
  let currentCalendarDate = new Date();
  let selectedDate = null;

  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(date) {
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function renderCalendar(year, month) {
    const monthLabel = document.querySelector("[data-booking-month-label]");
    const calendarRoot = document.querySelector("[data-booking-calendar]");

    // Update month label
    if (monthLabel) {
      monthLabel.textContent = new Date(year, month).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }

    if (!calendarRoot) return;

    // Find navigation buttons by looking for chevron icons or SVG arrows in parent container
    const calendarContainer = calendarRoot.closest("div");
    const allButtons = calendarContainer?.querySelectorAll("button") || [];
    let prevBtn = null;
    let nextBtn = null;
    
    allButtons.forEach((btn) => {
      // Check for Material Icons
      const icon = btn.querySelector(".material-symbols-outlined");
      if (icon) {
        const iconText = icon.textContent.trim();
        if (iconText === "chevron_left" || iconText === "arrow_back" || iconText.includes("left")) {
          prevBtn = btn;
        }
        if (iconText === "chevron_right" || iconText === "arrow_forward" || iconText.includes("right")) {
          nextBtn = btn;
        }
      }
      
      // Check for SVG arrows (used in some booking pages)
      const svg = btn.querySelector("svg");
      if (svg) {
        const path = svg.querySelector("path");
        if (path) {
          const pathData = path.getAttribute("d") || "";
          // Left arrow typically has "M15 19l-7-7 7-7" or similar
          if (pathData.includes("M15 19") || pathData.includes("l-7-7")) {
            prevBtn = btn;
          }
          // Right arrow typically has "M9 5l7 7-7 7" or similar
          if (pathData.includes("M9 5") || (pathData.includes("l7 7") && !pathData.includes("M15"))) {
            nextBtn = btn;
          }
        }
      }
    });

    // Set up navigation buttons (only set once to avoid duplicate handlers)
    if (prevBtn && !prevBtn.dataset.calendarNavSetup) {
      prevBtn.dataset.calendarNavSetup = "true";
      prevBtn.onclick = (e) => {
        e.preventDefault();
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
      };
    }

    if (nextBtn && !nextBtn.dataset.calendarNavSetup) {
      nextBtn.dataset.calendarNavSetup = "true";
      nextBtn.onclick = (e) => {
        e.preventDefault();
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
      };
    }

    // Clear existing calendar date cells (keep day name headers if they exist)
    const existingCells = calendarRoot.querySelectorAll(":scope > div, :scope > button");
    existingCells.forEach((el) => {
      // Don't remove day name headers (Su, Mo, Tu, etc.)
      const text = el.textContent.trim();
      const isDayName = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(text);
      if (!isDayName) {
        el.remove();
      }
    });

    // Get calendar data
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

    // Create calendar grid
    const fragment = document.createDocumentFragment();

    // Add days from previous month (grayed out)
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const div = document.createElement("div");
      div.className = "text-slate-400 dark:text-slate-600 text-black/40 dark:text-white/40 text-sm";
      div.textContent = day;
      fragment.appendChild(div);
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      dateObj.setHours(0, 0, 0, 0);
      const iso = formatDateForInput(dateObj);
      const isToday = isCurrentMonth && day === today.getDate();
      const isPast = dateObj < today;
      const isSelected = selectedDate && formatDateForInput(selectedDate) === iso;

      const button = document.createElement("button");
      button.type = "button";
      button.className = `w-8 h-8 rounded-full text-sm font-medium transition flex items-center justify-center ${
        isSelected
          ? "bg-primary text-white font-bold"
          : isToday
          ? "bg-primary/10 text-primary font-bold"
          : isPast
          ? "text-slate-400 dark:text-slate-600 text-black/40 dark:text-white/40 cursor-not-allowed"
          : "hover:bg-primary/10 dark:hover:bg-primary/20 text-slate-900 dark:text-slate-200"
      }`;
      button.textContent = day;
      button.dataset.date = iso;
      button.disabled = isPast;

      if (!isPast) {
        button.addEventListener("click", () => {
          selectDate(dateObj);
        });
      }

      fragment.appendChild(button);
    }

    // Add days from next month to fill the grid (grayed out)
    const totalCells = fragment.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42 cells
    for (let day = 1; day <= remainingCells && day <= 14; day++) {
      const div = document.createElement("div");
      div.className = "text-slate-400 dark:text-slate-600 text-black/40 dark:text-white/40 text-sm";
      div.textContent = day;
      fragment.appendChild(div);
    }

    calendarRoot.appendChild(fragment);
  }

  function selectDate(date) {
    selectedDate = date;
    const dateInput = document.getElementById("booking-date");
    const iso = formatDateForInput(date);

    if (dateInput) {
      dateInput.value = iso;
      // Trigger change event for any listeners
      dateInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Update selected date label
    const label = document.querySelector("[data-booking-selected-date]");
    if (label) {
      label.textContent = formatDateForDisplay(date);
    }

    // Re-render calendar to show selection
    renderCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
  }

  function initCalendarAndTime() {
    const calendarRoot = document.querySelector("[data-booking-calendar]");
    const timeRoot = document.querySelector("[data-booking-slots]");
    const dateInput = document.getElementById("booking-date");
    const timeInput = document.getElementById("booking-time");

    // Create date input if it doesn't exist
    if (!dateInput && calendarRoot) {
      const input = document.createElement("input");
      input.type = "date";
      input.id = "booking-date";
      input.className = "w-full p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary";
      input.min = formatDateForInput(new Date()); // Prevent past dates
      
      // Insert before calendar or in a suitable location
      const calendarContainer = calendarRoot.closest(".rounded-xl, .space-y-6, div");
      if (calendarContainer) {
        const label = document.createElement("label");
        label.className = "block text-sm font-semibold text-slate-900 dark:text-white mb-2";
        label.textContent = "Or enter date manually:";
        label.htmlFor = "booking-date";
        calendarContainer.insertBefore(label, calendarRoot);
        calendarContainer.insertBefore(input, calendarRoot);
      }
    }

    // Set up date input change handler
    const finalDateInput = document.getElementById("booking-date");
    if (finalDateInput) {
      // Set min date to today to prevent past dates
      const today = new Date();
      finalDateInput.min = formatDateForInput(today);
      
      // Only add listener if not already set up
      if (!finalDateInput.dataset.calendarInputSetup) {
        finalDateInput.dataset.calendarInputSetup = "true";
        finalDateInput.addEventListener("change", (e) => {
          const inputValue = e.target.value;
          if (inputValue) {
            const date = new Date(inputValue + "T00:00:00");
            if (!isNaN(date.getTime())) {
              selectedDate = date;
              // Update calendar view to show the selected month
              currentCalendarDate = new Date(date);
              renderCalendar(date.getFullYear(), date.getMonth());
              
              // Update selected date label
              const label = document.querySelector("[data-booking-selected-date]");
              if (label) {
                label.textContent = formatDateForDisplay(date);
              }
            }
          }
        });
      }

      // Set initial date to today if not set
      if (!finalDateInput.value) {
        finalDateInput.value = formatDateForInput(today);
        selectedDate = today;
      }
    }

    // Initialize calendar
    if (calendarRoot) {
      const now = new Date();
      currentCalendarDate = new Date(now);
      renderCalendar(now.getFullYear(), now.getMonth());
      
      // If date input has a value, select that date
      if (finalDateInput && finalDateInput.value) {
        const date = new Date(finalDateInput.value + "T00:00:00");
        if (!isNaN(date.getTime())) {
          selectedDate = date;
          currentCalendarDate = new Date(date);
          renderCalendar(date.getFullYear(), date.getMonth());
        }
      }
    }

    // Initialize time slots
    if (timeRoot) {
      const timeButtons =
        timeRoot.querySelectorAll("[data-time], button, label");
      timeButtons.forEach((btn) => {
        const text = btn.textContent.trim();
        if (!text || !/\d/.test(text)) return;
        btn.dataset.time = btn.dataset.time || text;
        btn.addEventListener("click", () => {
          timeButtons.forEach((b) =>
            b.classList.remove(
              "bg-primary",
              "text-white",
              "border-primary"
            )
          );
          btn.classList.add("bg-primary", "text-white", "border-primary");
          if (timeInput) timeInput.value = btn.dataset.time;
        });
      });
    }
  }

  // Function to save booking to localStorage
  function saveBookingToLocalStorage(bookingData) {
    try {
      const bookings = JSON.parse(localStorage.getItem("userBookings") || "[]");
      const newBooking = {
        id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...bookingData,
        createdAt: new Date().toISOString(),
        status: bookingData.status || "pending",
      };
      bookings.push(newBooking);
      localStorage.setItem("userBookings", JSON.stringify(bookings));
      return newBooking;
    } catch (error) {
      console.error("Error saving booking to localStorage:", error);
      return null;
    }
  }

  // Make function globally available
  window.saveBookingToLocalStorage = saveBookingToLocalStorage;

  document.addEventListener("DOMContentLoaded", async () => {
    const serviceSlug = getServiceSlug();
    initAddress();
    initCalendarAndTime();

    if (serviceSlug) {
      const workers = await fetchWorkers(serviceSlug);
      renderWorkers(workers.filter((w) => w.availability !== "offline"));
    }
  });
})();



