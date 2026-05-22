// Comprehensive Authorization and Access Control System
// Protects routes and UI elements based on user roles

const AUTH_GUARD_API = "http://localhost:3000/api/auth";
const AUTH_GUARD_API_ALT = "http://localhost:3000/api";

class AuthGuard {
  constructor() {
    this.user = null;
    this.token = null;
    this.init();
  }

  init() {
    this.loadUser();
    this.setupRouteProtection();
  }

  // Load user from localStorage
  loadUser() {
    try {
      const userStr = localStorage.getItem("user");
      this.user = userStr ? JSON.parse(userStr) : null;
      this.token = localStorage.getItem("token");
    } catch (error) {
      console.error("Error loading user:", error);
      this.user = null;
      this.token = null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(this.token && this.user);
  }

  // Check if user has specific role
  hasRole(role) {
    return this.isAuthenticated() && this.user?.role === role;
  }

  // Check if user is worker
  isWorker() {
    return this.hasRole("worker");
  }

  // Check if user is employer
  isEmployer() {
    return this.hasRole("employer");
  }

  // Verify token with backend
  async verifyToken() {
    if (!this.token) {
      return false;
    }

    try {
      const res = await fetch(`${AUTH_GUARD_API}/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.user = data.user;
          localStorage.setItem("user", JSON.stringify(data.user));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Token verification failed:", error);
      return false;
    }
  }

  // Protect route - redirect if not authorized
  protectRoute(allowedRoles = [], redirectTo = "login.html") {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split("/").pop() || "index.html";

    // Public pages that don't need authentication
    const publicPages = [
      "index.html",
      "login.html",
      "register.html",
      "landing.html",
      "service-page.html",
      "service-detail.html",
    ];

    // If page is public, allow access
    if (publicPages.includes(pageName)) {
      return true;
    }

    // Check authentication
    if (!this.isAuthenticated()) {
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = redirectUrl;
      return false;
    }

    // Check role authorization
    if (allowedRoles.length > 0 && !allowedRoles.includes(this.user.role)) {
      // Redirect to appropriate dashboard based on role
      if (this.isWorker()) {
        window.location.href = "worker-dashboard.html";
      } else if (this.isEmployer()) {
        window.location.href = "employer-dashboard.html";
      } else {
        window.location.href = redirectTo;
      }
      return false;
    }

    return true;
  }

  // Setup route protection based on page
  setupRouteProtection() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split("/").pop() || "index.html";

    // Define protected routes and their allowed roles
    const routeConfig = {
      "worker-dashboard.html": ["worker"],
      "employer-dashboard.html": ["employer"],
      "my-bookings.html": ["employer"], // Only employers can view bookings
      "post-job.html": ["employer"],
      "job-management.html": ["employer"],
      "application-detail.html": ["employer"],
      "edit-profile.html": ["worker", "employer"],
    };

    // Check if current page needs protection
    if (routeConfig[pageName]) {
      const allowedRoles = routeConfig[pageName];
      this.protectRoute(allowedRoles);
    }

    // Protect booking pages - only employers can book
    if (pageName.includes("-booking.html")) {
      this.protectRoute(["employer"]);
    }
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get current token
  getToken() {
    return this.token;
  }

  // Logout
  async logout() {
    try {
      const res = await fetch(`${AUTH_GUARD_API}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      // Clear local storage regardless of API response
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      this.user = null;
      this.token = null;

      if (res.ok) {
        window.location.href = "login.html";
      } else {
        window.location.href = "login.html";
      }
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      this.user = null;
      this.token = null;
      window.location.href = "login.html";
    }
  }

  // Show/hide elements based on role
  toggleRoleElements() {
    // Worker-only elements
    document.querySelectorAll("[data-role='worker']").forEach((el) => {
      el.style.display = this.isWorker() ? "" : "none";
    });

    // Employer-only elements
    document.querySelectorAll("[data-role='employer']").forEach((el) => {
      el.style.display = this.isEmployer() ? "" : "none";
    });

    // Authenticated user elements
    document.querySelectorAll("[data-auth='required']").forEach((el) => {
      el.style.display = this.isAuthenticated() ? "" : "none";
    });

    // Guest-only elements
    document.querySelectorAll("[data-auth='guest']").forEach((el) => {
      el.style.display = !this.isAuthenticated() ? "" : "none";
    });

    // Update user info in elements
    if (this.user) {
      document.querySelectorAll("[data-user-name]").forEach((el) => {
        el.textContent = `${this.user.firstName || ""} ${this.user.lastName || ""}`.trim() || "User";
      });

      document.querySelectorAll("[data-user-role]").forEach((el) => {
        el.textContent = this.user.role || "";
      });

      document.querySelectorAll("[data-user-email]").forEach((el) => {
        el.textContent = this.user.email || "";
      });
    }
  }

  // Add authorization header to fetch requests
  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  // Make authenticated fetch request
  async authenticatedFetch(url, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error("User not authenticated");
    }

    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, logout and redirect
    if (response.status === 401) {
      await this.logout();
      throw new Error("Session expired. Please login again.");
    }

    return response;
  }
}

// Create global instance
const authGuard = new AuthGuard();

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Toggle role-based elements
  authGuard.toggleRoleElements();

  // Setup logout buttons
  document.querySelectorAll("[data-action='logout']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      authGuard.logout();
    });
  });

  // Setup dashboard links based on role
  const dashboardLinks = document.querySelectorAll("[data-action='dashboard']");
  dashboardLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (authGuard.isWorker()) {
        window.location.href = "worker-dashboard.html";
      } else if (authGuard.isEmployer()) {
        window.location.href = "employer-dashboard.html";
      } else {
        window.location.href = "login.html";
      }
    });
  });
});

// Export for use in other scripts
window.authGuard = authGuard;

