// Booking Confirmation Page - Dynamic loading from backend
(function() {
  'use strict';

  const API_BASE = window.API_BASE || "http://localhost:3000/api";

  // Get booking ID from URL parameters
  function getBookingIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('bookingId');
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      
      let dateText = "";
      if (dateObj.getTime() === today.getTime()) {
        dateText = "Today, " + date.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      } else if (dateObj.getTime() === today.getTime() + 86400000) {
        dateText = "Tomorrow, " + date.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      } else {
        dateText = date.toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      }
      return dateText;
    } catch (e) {
      return dateString;
    }
  }

  // Format time for display
  function formatTime(timeString) {
    if (!timeString) return '-';
    try {
      // Handle both 24h and 12h formats
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const time12 = hour > 12 
        ? `${hour - 12}:${minutes || '00'} PM` 
        : `${hour === 12 ? 12 : hour}:${minutes || '00'} AM`;
      return time12;
    } catch (e) {
      return timeString;
    }
  }

  // Format price
  function formatPrice(price) {
    if (!price && price !== 0) return '-';
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });
    return formatter.format(price);
  }

  // Get status badge HTML
  function getStatusBadge(status) {
    const statusConfig = {
      pending: { 
        text: "Pending", 
        class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        icon: "schedule"
      },
      confirmed: { 
        text: "Confirmed", 
        class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: "check_circle"
      },
      "in-progress": { 
        text: "In Progress", 
        class: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        icon: "build"
      },
      completed: { 
        text: "Completed", 
        class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: "check_circle"
      },
      cancelled: { 
        text: "Cancelled", 
        class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: "cancel"
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return `
      <span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${config.class}">
        <span class="material-symbols-outlined text-xs">${config.icon}</span>
        <span>${config.text}</span>
      </span>
    `;
  }

  // Load booking details from backend
  async function loadBookingDetails(bookingId) {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const successContent = document.getElementById('success-content');
    const errorMessage = document.getElementById('error-message');

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please login to view booking details");
      }

      const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        mode: "cors",
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.message || "Failed to load booking details");
      }

      const data = await response.json();
      const booking = data.booking;

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Hide loading, show success
      loadingState.classList.add('hidden');
      errorState.classList.add('hidden');
      successContent.classList.remove('hidden');

      // Populate booking details
      populateBookingDetails(booking);

    } catch (error) {
      console.error("Error loading booking:", error);
      loadingState.classList.add('hidden');
      successContent.classList.add('hidden');
      errorState.classList.remove('hidden');
      errorMessage.textContent = error.message || "An error occurred while loading booking details.";
    }
  }

  // Populate booking details in UI
  function populateBookingDetails(booking) {
    // Booking ID
    const bookingIdEl = document.getElementById('booking-id');
    if (bookingIdEl) {
      bookingIdEl.textContent = `Booking ID: ${booking._id || booking.id}`;
    }

    // Service Type
    const serviceTypeEl = document.getElementById('service-type');
    if (serviceTypeEl) {
      serviceTypeEl.textContent = booking.serviceType || '-';
    }

    // Status
    const statusEl = document.getElementById('booking-status');
    if (statusEl) {
      statusEl.innerHTML = getStatusBadge(booking.status || 'pending');
    }

    // Worker Info
    const workerNameEl = document.getElementById('worker-name');
    if (workerNameEl && booking.worker) {
      const worker = booking.worker;
      workerNameEl.textContent = `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || worker.userName || 'Worker';
    }

    const workerTypeEl = document.getElementById('worker-type');
    if (workerTypeEl && booking.worker) {
      workerTypeEl.textContent = booking.worker.workerType || 'Professional';
    }

    const workerCityEl = document.getElementById('worker-city');
    if (workerCityEl && booking.worker) {
      workerCityEl.textContent = booking.worker.city ? `📍 ${booking.worker.city}` : '';
    }

    // Worker Avatar
    const workerAvatarEl = document.getElementById('worker-avatar');
    if (workerAvatarEl && booking.worker) {
      if (booking.worker.avatarUrl) {
        workerAvatarEl.innerHTML = `<img src="${booking.worker.avatarUrl}" alt="Worker" class="h-full w-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-3xl text-primary\\'>person</span>'" />`;
      } else {
        // Keep default icon if no avatar
        workerAvatarEl.innerHTML = '<span class="material-symbols-outlined text-3xl text-primary">person</span>';
      }
    }

    // Date
    const dateEl = document.getElementById('booking-date');
    if (dateEl) {
      dateEl.textContent = formatDate(booking.bookingDate);
    }

    // Time
    const timeEl = document.getElementById('booking-time');
    if (timeEl) {
      timeEl.textContent = formatTime(booking.bookingTime);
    }

    // Address
    const addressEl = document.getElementById('booking-address');
    if (addressEl) {
      addressEl.textContent = booking.address || '-';
    }

    const cityEl = document.getElementById('booking-city');
    if (cityEl) {
      cityEl.textContent = booking.city ? `${booking.city}` : '';
    }

    const postalEl = document.getElementById('booking-postal');
    if (postalEl) {
      postalEl.textContent = booking.postalCode ? `Postal Code: ${booking.postalCode}` : '';
    }

    // Price
    const priceEl = document.getElementById('booking-price');
    if (priceEl) {
      priceEl.textContent = formatPrice(booking.price);
    }

    const packageEl = document.getElementById('package-name');
    if (packageEl) {
      if (booking.packageName) {
        packageEl.textContent = `Package: ${booking.packageName}`;
      } else {
        packageEl.textContent = '';
      }
    }

    // Notes
    if (booking.notes && booking.notes.trim()) {
      const notesSection = document.getElementById('notes-section');
      const notesEl = document.getElementById('booking-notes');
      if (notesSection) notesSection.classList.remove('hidden');
      if (notesEl) notesEl.textContent = booking.notes;
    }
  }

  // Initialize page
  function init() {
    const bookingId = getBookingIdFromURL();
    
    if (!bookingId) {
      // No booking ID in URL, show error
      document.getElementById('loading-state').classList.add('hidden');
      document.getElementById('success-content').classList.add('hidden');
      document.getElementById('error-state').classList.remove('hidden');
      document.getElementById('error-message').textContent = "No booking ID provided. Please access this page from a booking confirmation link.";
      return;
    }

    // Load booking details
    loadBookingDetails(bookingId);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

