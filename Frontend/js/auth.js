// Debug: Log that auth.js is loading
console.log("📦 auth.js script is loading...");

// Use existing API_BASE if defined, otherwise create it (avoiding redeclaration error)
var API_BASE = window.API_BASE || "http://localhost:3000/api/auth"; // backend prefix
if (!window.API_BASE) {
  window.API_BASE = API_BASE; // Make it globally available
}

// Define toggleAuthButtons FIRST (since checkAuth depends on it)
function toggleAuthButtons(isLoggedIn) {
  console.log("🔄 Toggling auth buttons. Is logged in:", isLoggedIn);
  
  // Show/hide logout buttons
  const logoutButtons = document.querySelectorAll('[data-action="logout"]');
  logoutButtons.forEach(btn => {
    if (isLoggedIn) {
      btn.classList.remove("hidden");
      btn.style.display = "";
    } else {
      btn.classList.add("hidden");
      btn.style.display = "none";
    }
  });
  
  // Show/hide login buttons/links (using data-action="login" attribute)
  const loginLinks = document.querySelectorAll('[data-action="login"]');
  loginLinks.forEach(link => {
    if (isLoggedIn) {
      // Hide login when logged in - use !important to override Tailwind
      link.style.setProperty("display", "none", "important");
      link.classList.add("hidden");
    } else {
      // Show login when logged out
      link.classList.remove("hidden");
      // Handle responsive classes for desktop login link
      if (link.id === "login-link") {
        // Desktop login link - show on sm screens and up, hide on mobile
        link.style.removeProperty("display");
        // Let Tailwind handle it, but ensure it's visible
        const mediaQuery = window.matchMedia("(min-width: 640px)");
        const updateDisplay = () => {
          if (mediaQuery.matches) {
            link.style.setProperty("display", "inline-flex", "important");
          } else {
            link.style.setProperty("display", "none", "important");
          }
        };
        updateDisplay();
        // Update on resize
        mediaQuery.addEventListener("change", updateDisplay);
      } else {
        // Mobile or other login links - always show when logged out
        link.style.removeProperty("display");
      }
    }
  });
  
  // Also handle login links without data-action for backward compatibility
  document.querySelectorAll('a[href="login.html"]').forEach(link => {
    // Only toggle if it doesn't already have data-action (to avoid double toggling)
    if (!link.hasAttribute('data-action')) {
      if (isLoggedIn) {
        link.classList.add("hidden");
        link.style.setProperty("display", "none", "important");
      } else {
        link.classList.remove("hidden");
        link.style.removeProperty("display");
      }
    }
  });
  
  // Show/hide "My Bookings" buttons
  document.querySelectorAll('[data-action="my-bookings"]').forEach(btn => {
    if (isLoggedIn) {
      btn.classList.remove("hidden");
      btn.style.display = "";
    } else {
      btn.classList.add("hidden");
      btn.style.display = "none";
    }
  });
  
  // Show/hide profile menu
  const profileMenu = document.getElementById("profile-menu");
  if (profileMenu) {
    if (isLoggedIn) {
      profileMenu.classList.remove("hidden");
      profileMenu.style.display = "";
    } else {
      profileMenu.classList.add("hidden");
      profileMenu.style.display = "none";
    }
  }
  
  console.log("✅ Auth buttons toggled. Login buttons:", loginLinks.length, "Logout buttons:", logoutButtons.length);
}

// Define checkAuth function (depends on toggleAuthButtons)
function checkAuth() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  const authStatus = document.getElementById("authStatus");

  const isLoggedIn = !!(user && token);

  if (isLoggedIn) {
    if (authStatus) {
      authStatus.textContent = `Welcome, ${user.role ?? "user"}`;
    }
    // User is logged in: hide login, show logout and profile
    toggleAuthButtons(true);
  } else {
    if (authStatus) {
      authStatus.textContent = "Not logged in";
    }
    // User is logged out: show login, hide logout and profile
    toggleAuthButtons(false);
  }
  
  // Refresh profile menu if it exists and user is logged in
  if (isLoggedIn) {
    if (typeof window.initProfileMenu === 'function') {
      window.initProfileMenu();
    } else if (typeof window.SkillLinkHome !== 'undefined' && window.SkillLinkHome.initProfileMenu) {
      window.SkillLinkHome.initProfileMenu();
    }
  }
}

// Export to window IMMEDIATELY - using try-catch to ensure it works
try {
  if (typeof window !== 'undefined') {
    window.checkAuth = checkAuth;
    window.toggleAuthButtons = toggleAuthButtons;
    console.log("✅ checkAuth and toggleAuthButtons exported to window");
  }
} catch (e) {
  console.error("Error exporting functions:", e);
}

async function handleLogout() {
  try {
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include"
    });

    // Clear local storage regardless of API response
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    if (res.ok) {
      // Refresh UI immediately
      checkAuth();
      alert("✅ Logged out successfully");
      
      // Redirect after a short delay to allow UI update
      setTimeout(() => {
        window.location.href = "login.html";
      }, 500);
    } else {
      // Even if API fails, we've cleared local storage
      checkAuth();
      alert("✅ Logged out locally");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 500);
    }
  } catch (err) {
    console.error(err);
    // Clear local storage even on error
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    checkAuth();
    alert("✅ Logged out locally");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 500);
  }
}

function toggleLogoutVisibility(show) {
  // Legacy function - redirects to new function
  toggleAuthButtons(show);
}

// Function to initialize auth on page
function initAuth() {
  // Check auth state on page load
  checkAuth();
  
  // Attach logout handlers
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    // Remove existing listeners to avoid duplicates
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener("click", (event) => {
      event.preventDefault();
      handleLogout();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Small delay to ensure all elements are rendered
  setTimeout(() => {
    initAuth();
  }, 100);
});

// Also check auth immediately if DOM is already loaded
if (document.readyState === "loading") {
  // DOM is still loading, wait for DOMContentLoaded
} else {
  // DOM is already loaded, check auth immediately with a small delay
  setTimeout(() => {
    checkAuth();
  }, 100);
}

// Export functions to window immediately so they're available before DOMContentLoaded
// Use try-catch to ensure exports work even if there are errors
try {
  window.handleLogout = handleLogout;
  window.checkAuth = checkAuth;
  window.toggleAuthButtons = toggleAuthButtons;
  window.toggleLogoutVisibility = toggleLogoutVisibility;
  console.log("✅ All auth functions exported to window:", {
    checkAuth: typeof window.checkAuth,
    toggleAuthButtons: typeof window.toggleAuthButtons,
    handleLogout: typeof window.handleLogout
  });
} catch (e) {
  console.error("❌ Error exporting functions:", e);
}

// Final fallback: ensure checkAuth is available
if (typeof window.checkAuth !== 'function') {
  console.error("❌ CRITICAL: checkAuth was not exported properly!");
  // Try to define it directly
  window.checkAuth = function() {
    console.warn("⚠️ Using fallback checkAuth function");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (user && token) {
      console.log("User is logged in");
      if (typeof window.toggleAuthButtons === 'function') {
        window.toggleAuthButtons(true);
      }
    } else {
      console.log("User is logged out");
      if (typeof window.toggleAuthButtons === 'function') {
        window.toggleAuthButtons(false);
      }
    }
  };
  console.log("✅ Fallback checkAuth function created");
}

// Run checkAuth immediately if DOM is ready, otherwise wait
(function() {
  if (document.readyState === "loading") {
    // DOM is still loading, wait for DOMContentLoaded
    document.addEventListener("DOMContentLoaded", function() {
      setTimeout(function() {
        if (typeof window.checkAuth === 'function') {
          window.checkAuth();
        }
      }, 50);
    });
  } else {
    // DOM is already loaded, check auth immediately
    setTimeout(function() {
      if (typeof window.checkAuth === 'function') {
        window.checkAuth();
      }
    }, 50);
  }
})();

console.log("✅ auth.js finished loading. checkAuth available:", typeof window.checkAuth === 'function');
