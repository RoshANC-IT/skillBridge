// Enhanced Dynamic Cart & Real-time Summary for all booking pages
// Updates based on actual selections from booking-dynamic.js

(() => {
  const SERVICE_NAME_MAP = {
    "home-cleaning": "Deep Home Cleaning",
    "appliance-repair": "Appliance Repair",
    "electrical-work": "Electrical Fixes",
    "plumbing": "Plumbing Services",
    "painting": "Painting Service",
    "pest-control": "Pest Control",
    "carpentry": "Carpentry & Modular",
    "home-security": "Home Security Setup",
    "mason": "Professional Masons",
    "carpenter": "Expert Carpenters",
    "electrician": "Certified Electricians",
    "plumber": "Skilled Plumbers",
    "welder": "Welding Specialists"
  };

  const CURRENCY = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  function getSelectedService() {
    try {
      const slug = localStorage.getItem("selectedService");
      const pkgRaw = localStorage.getItem("selectedPackage");
      if (!slug || !pkgRaw) {
        // Try to get from current booking data
        const bookingData = localStorage.getItem("currentBookingData");
        if (bookingData) {
          const data = JSON.parse(bookingData);
          return {
            slug: data.serviceSlug,
            title: data.serviceName,
            pkg: { name: data.serviceName, price: data.price || 0 }
          };
        }
        return null;
      }
      const pkg = JSON.parse(pkgRaw);
      return {
        slug,
        title: SERVICE_NAME_MAP[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        pkg
      };
    } catch {
      return null;
    }
  }

  function getCart() {
    try {
      const raw = localStorage.getItem("bookingCart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem("bookingCart", JSON.stringify(cart));
  }

  function createEl(tag, className = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function updateInlineSummary(current) {
    // Get real-time data from booking-dynamic.js selections
    const bookingData = localStorage.getItem("currentBookingData");
    let realTimeData = null;
    
    if (bookingData) {
      try {
        realTimeData = JSON.parse(bookingData);
      } catch (e) {
        console.error("Error parsing booking data:", e);
      }
    }

    // Update service name from real-time data or current selection
    const serviceName = realTimeData?.serviceName || current?.title || "Service";
    const serviceNameEls = document.querySelectorAll("[data-booking-service-name]");
    serviceNameEls.forEach(el => {
      el.textContent = serviceName;
    });

    // Update worker name from real-time data
    const workerName = realTimeData?.workerName || "Select a worker";
    const workerNameEls = document.querySelectorAll("[data-booking-worker-name]");
    workerNameEls.forEach(el => {
      el.textContent = workerName;
    });

    // Update date from real-time data
    const date = realTimeData?.date || "Select date";
    const dateEls = document.querySelectorAll("[data-booking-date]");
    dateEls.forEach(el => {
      el.textContent = date;
    });

    // Update time from real-time data
    const time = realTimeData?.time || "Select time";
    const timeEls = document.querySelectorAll("[data-booking-time]");
    timeEls.forEach(el => {
      el.textContent = time;
    });

    // Update package name
    const pkgNameEls = document.querySelectorAll("[data-booking-package-name]");
    pkgNameEls.forEach(el => {
      el.textContent = current?.pkg?.name || serviceName;
    });

    // Update price
    const priceEls = document.querySelectorAll("[data-booking-price]");
    if (priceEls.length) {
      const price = realTimeData?.price || current?.pkg?.price || 0;
      const unit = current?.pkg?.unit;
      const priceLabel = unit
        ? `${CURRENCY.format(price)}/${unit}`
        : CURRENCY.format(price);
      priceEls.forEach(el => {
        el.textContent = priceLabel;
      });
    }
  }

  function renderCartPanel(container, cart, current) {
    container.innerHTML = "";

    const header = createEl(
      "div",
      "flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-3"
    );
    header.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-xl">shopping_cart</span>
        <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">Booking Summary</span>
      </div>
      <span class="text-xs font-medium rounded-full bg-primary/10 text-primary px-3 py-1">
        ${cart.length} item${cart.length === 1 ? "" : "s"}
      </span>
    `;
    container.appendChild(header);

    // Show current booking details
    const bookingData = localStorage.getItem("currentBookingData");
    if (bookingData) {
      try {
        const data = JSON.parse(bookingData);
        const details = createEl("div", "space-y-2 mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50");
        details.innerHTML = `
          <div class="text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-500 dark:text-slate-400">Service:</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">${data.serviceName || "Not selected"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 dark:text-slate-400">Worker:</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">${data.workerName || "Not selected"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 dark:text-slate-400">Date:</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">${data.date || "Not selected"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 dark:text-slate-400">Time:</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">${data.time || "Not selected"}</span>
            </div>
          </div>
        `;
        container.appendChild(details);
      } catch (e) {
        console.error("Error rendering booking details:", e);
      }
    }

    if (!cart.length) {
      const empty = createEl(
        "p",
        "text-xs text-slate-500 dark:text-slate-400"
      );
      empty.textContent = "Your cart is empty. Complete the booking form above.";
      container.appendChild(empty);
      return;
    }

    const list = createEl("div", "space-y-2 max-h-52 overflow-y-auto pr-1");
    let total = 0;

    cart.forEach((item, index) => {
      const linePrice = item.pkg ? Number(item.pkg.price || 0) * (item.qty || 1) : 0;
      total += linePrice;

      const row = createEl(
        "div",
        "flex items-start justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 px-3 py-2"
      );
      row.innerHTML = `
        <div class="text-xs">
          <p class="font-semibold text-slate-800 dark:text-slate-100">${item.title}</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">${item.pkg?.name || "Package"}</p>
          <p class="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Qty: ${item.qty || 1}</p>
        </div>
        <div class="flex flex-col items-end gap-1">
          <span class="text-xs font-semibold text-slate-800 dark:text-slate-100">
            ${CURRENCY.format(linePrice)}
          </span>
          <button
            type="button"
            data-cart-remove="${index}"
            class="text-[11px] text-rose-500 hover:text-rose-600"
          >
            Remove
          </button>
        </div>
      `;
      list.appendChild(row);
    });

    container.appendChild(list);

    const footer = createEl("div", "mt-3 border-t border-slate-200 dark:border-slate-700 pt-3");
    footer.innerHTML = `
      <div class="flex items-center justify-between text-xs mb-2">
        <span class="text-slate-600 dark:text-slate-300">Estimated total</span>
        <span class="font-bold text-slate-900 dark:text-white">${CURRENCY.format(total)}</span>
      </div>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
        Taxes and final price will be confirmed on booking.
      </p>
    `;

    const btnRow = createEl("div", "flex gap-2");
    const checkoutBtn = createEl(
      "button",
      "flex-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
    );
    checkoutBtn.type = "button";
    checkoutBtn.textContent = "Proceed to booking";
    checkoutBtn.addEventListener("click", () => {
      const primaryBtn =
        document.querySelector("[data-booking-primary]") ||
        document.querySelector("button[id*='book']");
      if (primaryBtn) {
        primaryBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        primaryBtn.focus();
      }
    });

    const clearBtn = createEl(
      "button",
      "px-3 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
    );
    clearBtn.type = "button";
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", () => {
      saveCart([]);
      renderCartPanel(container, [], current);
      updateCartBadge(0);
    });

    btnRow.appendChild(checkoutBtn);
    btnRow.appendChild(clearBtn);
    footer.appendChild(btnRow);
    container.appendChild(footer);

    // Wire up remove buttons
    container.querySelectorAll("[data-cart-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = Number(btn.getAttribute("data-cart-remove"));
        const updated = getCart().filter((_, i) => i !== index);
        saveCart(updated);
        renderCartPanel(container, updated, current);
        updateCartBadge(updated.length);
      });
    });
  }

  function updateCartBadge(count) {
    const badgeEls = document.querySelectorAll("[data-booking-cart-count]");
    badgeEls.forEach(el => {
      el.textContent = String(count);
    });
  }

  // Expose function for booking-dynamic.js to call
  window.updateCartDisplay = function(bookingData) {
    const current = getSelectedService();
    updateInlineSummary(current);
    
    // Update cart panel if it exists
    const panelInner = document.querySelector('[data-booking-cart-panel]');
    if (panelInner) {
      const cart = getCart();
      renderCartPanel(panelInner, cart, current);
    }
  };

  function initFloatingCart(current) {
    // Avoid duplicate
    if (document.querySelector("[data-booking-cart-root]")) return;

    const root = createEl(
      "div",
      "fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:inset-auto sm:right-4 sm:bottom-4 sm:left-auto"
    );
    root.setAttribute("data-booking-cart-root", "true");

    const card = createEl(
      "div",
      "w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
    );

    const bar = createEl(
      "button",
      "flex w-full items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white sm:hidden"
    );
    bar.type = "button";
    bar.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-base">shopping_cart</span>
        <span>Cart</span>
      </div>
      <span class="rounded-full bg-white/10 px-2 py-1 text-[11px]" data-booking-cart-count>0</span>
    `;

    const panel = createEl(
      "div",
      "mt-2 hidden sm:block"
    );

    // On small screens toggle panel visibility
    bar.addEventListener("click", () => {
      panel.classList.toggle("hidden");
    });

    card.appendChild(bar);

    const panelInner = createEl(
      "div",
      "sm:block text-xs text-slate-800 dark:text-slate-100"
    );
    panelInner.setAttribute("data-booking-cart-panel", "true");
    panel.appendChild(panelInner);
    card.appendChild(panel);
    root.appendChild(card);
    document.body.appendChild(root);

    const cart = getCart();
    renderCartPanel(panelInner, cart, current);
    updateCartBadge(cart.length);
  }

  // Watch for changes in booking data
  function watchBookingData() {
    setInterval(() => {
      const current = getSelectedService();
      updateInlineSummary(current);
      
      const panelInner = document.querySelector('[data-booking-cart-panel]');
      if (panelInner) {
        const cart = getCart();
        renderCartPanel(panelInner, cart, current);
      }
    }, 1000); // Update every second
  }

  document.addEventListener("DOMContentLoaded", () => {
    const current = getSelectedService();
    updateInlineSummary(current);
    initFloatingCart(current);
    watchBookingData();
  });
})();
