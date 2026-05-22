const PROFILE_API = "http://localhost:3000/api";
const PROFILE_API_ALT = "http://localhost:3000/api";

const token = localStorage.getItem("token");
const storedUser = JSON.parse(localStorage.getItem("user") || "null");

// Redirect if not logged in
if (!token || !storedUser) {
  window.location.href = "login.html?redirect=edit-profile.html";
}

let els = {};
let currentUser = null;
let avatarFile = null;

// Initialize DOM elements
function initElements() {
  els = {
    loadingState: document.getElementById("loadingState"),
    profileForm: document.getElementById("profileForm"),
    avatarPreview: document.getElementById("avatarPreview"),
    avatarInput: document.getElementById("avatarInput"),
    saveButton: document.getElementById("saveButton"),
    workerFields: document.getElementById("workerFields"),
    toastContainer: document.getElementById("toastContainer"),
  };
  
  // Create toast container if it doesn't exist
  if (!els.toastContainer) {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "fixed bottom-4 right-4 z-50 space-y-2";
    document.body.appendChild(container);
    els.toastContainer = container;
  }

  // Setup avatar input listener
  if (els.avatarInput) {
    els.avatarInput.addEventListener("change", handleAvatarChange);
  }

  // Setup form submit listener
  if (els.profileForm) {
    els.profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  }

  // Setup bio character counter
  const bioEl = document.getElementById("bio");
  const bioCountEl = document.getElementById("bioCharCount");
  if (bioEl && bioCountEl) {
    bioEl.addEventListener("input", () => {
      const len = bioEl.value.length;
      bioCountEl.textContent = len;
      if (len > 500) {
        bioCountEl.parentElement.classList.add("text-red-500");
        bioCountEl.parentElement.classList.remove("text-slate-400", "dark:text-slate-500");
      } else {
        bioCountEl.parentElement.classList.remove("text-red-500");
        bioCountEl.parentElement.classList.add("text-slate-400", "dark:text-slate-500");
      }
    });
  }
}

// Toast notification system
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  const bgColor = type === "success" 
    ? "bg-emerald-500" 
    : type === "error" 
    ? "bg-rose-500" 
    : type === "info"
    ? "bg-blue-500"
    : "bg-slate-500";
  
  toast.className = `${bgColor} text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 min-w-[300px] max-w-md ${type === "success" ? "success-toast" : "error-toast"}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined">
      ${type === "success" ? "check_circle" : type === "error" ? "error" : "info"}
    </span>
    <span class="flex-1 font-semibold">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white">
      <span class="material-symbols-outlined text-lg">close</span>
    </button>
  `;
  
  els.toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Handle avatar file change
function handleAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    showToast("Please select an image file", "error");
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast("Image size must be less than 5MB", "error");
    return;
  }

  avatarFile = file;

  // Preview image
  const reader = new FileReader();
  reader.onload = (event) => {
    els.avatarPreview.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// Fetch current user profile
async function fetchUserProfile() {
  const endpoints = [
    `${PROFILE_API}/auth/verify`,
    `${PROFILE_API_ALT}/auth/verify`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        return data.user || data;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${endpoint}:`, error);
    }
  }

  // Fallback to localStorage
  return storedUser;
}

// Set avatar preview with initials fallback
function setAvatarPreview(user) {
  if (!els.avatarPreview) return;
  
  if (user.avatarUrl) {
    els.avatarPreview.src = user.avatarUrl;
  } else {
    const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
    els.avatarPreview.src = `data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#7f13ec"/>
            <stop offset="100%" style="stop-color:#a855f7"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#g)"/>
        <text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
      </svg>
    `)}`;
  }
}

// Populate form fields from user data
function populateForm(user) {
  const fields = {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    userName: user.userName || "",
    email: user.email || "",
    phoneNumber: user.phoneNumber || "",
    city: user.city || "",
    profileName: user.profileName || "",
    address: user.address || "",
    bio: user.bio || "",
    experience: user.experience || "",
    hourlyRate: user.hourlyRate || "",
  };

  for (const [id, value] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  // Set avatar
  setAvatarPreview(user);

  // Bio character count
  const bioCountEl = document.getElementById("bioCharCount");
  if (bioCountEl && fields.bio) {
    bioCountEl.textContent = fields.bio.length;
  }

  // Show worker-specific fields if user is a worker
  if (user.role === "worker" && els.workerFields) {
    els.workerFields.classList.remove("hidden");
    
    // Set checked status for skills
    const userSkills = (user.workerType || "").split(",").map(s => s.trim());
    document.querySelectorAll('.worker-skill-checkbox').forEach(cb => {
      cb.checked = userSkills.includes(cb.value);
    });
    // Update pills preview
    if (typeof window._updateSkillPills === 'function') window._updateSkillPills();

    const availabilityEl = document.getElementById("availability");
    if (availabilityEl) availabilityEl.value = user.availability || "available";
  } else if (els.workerFields) {
    els.workerFields.classList.add("hidden");
  }
}

// Load user profile data
async function loadProfile() {
  // Only show loading if form is not already visible
  const formAlreadyVisible = els.profileForm && els.profileForm.style.display !== "none";
  
  if (!formAlreadyVisible) {
    if (els.loadingState) els.loadingState.classList.remove("hidden");
    if (els.profileForm) els.profileForm.style.display = "none";
  }

  try {
    // Try to fetch from API, fallback to localStorage
    currentUser = await fetchUserProfile();
    
    if (!currentUser) {
      currentUser = storedUser;
    }
    
    if (!currentUser) {
      console.warn("No user data found. Showing empty form.");
      showToast("Using cached data. Please refresh if information seems outdated.", "info");
      if (els.loadingState) els.loadingState.classList.add("hidden");
      if (els.profileForm) els.profileForm.style.display = "";
      return;
    }

    // Populate form fields
    populateForm(currentUser);

    // Show form
    if (els.loadingState) els.loadingState.classList.add("hidden");
    if (els.profileForm) els.profileForm.style.display = "";
  } catch (error) {
    console.error("Error loading profile:", error);
    
    // Try to use localStorage user data as fallback
    if (storedUser) {
      currentUser = storedUser;
      populateForm(currentUser);
      
      if (els.loadingState) els.loadingState.classList.add("hidden");
      if (els.profileForm) els.profileForm.style.display = "";
      showToast("Loaded profile from cache. Some data may be outdated.", "info");
    } else {
      showToast("Failed to load profile. Please refresh the page.", "error");
      if (els.loadingState) els.loadingState.classList.add("hidden");
      // Still show form so user can try to fill it
      if (els.profileForm) els.profileForm.style.display = "";
    }
  }
}

// Form validation
function validateForm() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const userName = document.getElementById("userName").value.trim();

  let isValid = true;

  // Clear previous errors
  document.querySelectorAll("[id$='Error']").forEach((el) => {
    el.classList.add("hidden");
    el.textContent = "";
  });

  // Validate firstName
  if (!firstName) {
    const errorEl = document.getElementById("firstNameError");
    errorEl.textContent = "First name is required";
    errorEl.classList.remove("hidden");
    isValid = false;
  }

  // Validate lastName
  if (!lastName) {
    const errorEl = document.getElementById("lastNameError");
    errorEl.textContent = "Last name is required";
    errorEl.classList.remove("hidden");
    isValid = false;
  }

  // Validate userName
  if (!userName) {
    const errorEl = document.getElementById("userNameError");
    errorEl.textContent = "Username is required";
    errorEl.classList.remove("hidden");
    isValid = false;
  } else if (userName.length < 3) {
    const errorEl = document.getElementById("userNameError");
    errorEl.textContent = "Username must be at least 3 characters";
    errorEl.classList.remove("hidden");
    isValid = false;
  }

  // Validate phone number if provided
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  if (phoneNumber && !/^[\d\s\-\+\(\)]+$/.test(phoneNumber)) {
    const errorEl = document.getElementById("phoneNumberError");
    errorEl.textContent = "Please enter a valid phone number";
    errorEl.classList.remove("hidden");
    isValid = false;
  }

  return isValid;
}

// Update profile
async function updateProfile() {
  if (!validateForm()) {
    showToast("Please fix the errors in the form", "error");
    return;
  }

  const saveButtonText = els.saveButton.innerHTML;
  els.saveButton.disabled = true;
  els.saveButton.innerHTML = `
    <span class="relative z-10 flex items-center justify-center gap-2">
      <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Saving...
    </span>
  `;

  try {
    // Prepare update data
    const updateData = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      userName: document.getElementById("userName").value.trim(),
      phoneNumber: document.getElementById("phoneNumber").value.trim() || undefined,
      city: document.getElementById("city").value.trim() || undefined,
      profileName: document.getElementById("profileName").value.trim() || undefined,
    };

    // Add new fields
    const addressEl = document.getElementById("address");
    if (addressEl) updateData.address = addressEl.value.trim() || undefined;
    
    const bioEl = document.getElementById("bio");
    if (bioEl) updateData.bio = bioEl.value.trim() || undefined;
    
    const experienceEl = document.getElementById("experience");
    if (experienceEl && experienceEl.value) updateData.experience = parseInt(experienceEl.value) || undefined;
    
    const hourlyRateEl = document.getElementById("hourlyRate");
    if (hourlyRateEl && hourlyRateEl.value) updateData.hourlyRate = parseInt(hourlyRateEl.value) || undefined;

    // Add worker-specific fields
    if (currentUser.role === "worker") {
      const checkedSkills = Array.from(document.querySelectorAll('.worker-skill-checkbox:checked')).map(cb => cb.value);
      updateData.workerType = checkedSkills.join(", ") || undefined;
      const availabilityEl = document.getElementById("availability");
      if (availabilityEl) updateData.availability = availabilityEl.value || undefined;
    }

    // Use universal profile update endpoint
    const endpoints = [
      `${PROFILE_API}/auth/profile`,
      `${PROFILE_API_ALT}/auth/profile`,
      `${PROFILE_API}/worker/update-profile/${currentUser._id || currentUser.id}`,
      `${PROFILE_API_ALT}/worker/update-profile/${currentUser._id || currentUser.id}`,
    ];

    let success = false;
    let updatedUser = null;

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (res.ok) {
          updatedUser = await res.json();
          success = true;
          break;
        }
      } catch (error) {
        console.warn(`Failed to update via ${endpoint}:`, error);
        continue;
      }
    }

    if (!success) {
      throw new Error("Failed to update profile. Please try again.");
    }

    // Handle avatar upload if file selected
    if (avatarFile) {
      try {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        
        const userId = currentUser._id || currentUser.id;
        const avatarEndpoints = [
          `${PROFILE_API}/auth/upload-avatar`,
          `${PROFILE_API_ALT}/auth/upload-avatar`,
          `${PROFILE_API}/worker/upload-avatar/${userId}`,
          `${PROFILE_API_ALT}/worker/upload-avatar/${userId}`,
        ];

        for (const avatarEndpoint of avatarEndpoints) {
          try {
            const avatarRes = await fetch(avatarEndpoint, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });

            if (avatarRes.ok) {
              const avatarData = await avatarRes.json();
              if (avatarData.avatarUrl) {
                updatedUser.avatarUrl = avatarData.avatarUrl;
              }
              break;
            }
          } catch (error) {
            console.warn(`Failed to upload avatar via ${avatarEndpoint}:`, error);
          }
        }
      } catch (error) {
        console.warn("Avatar upload failed:", error);
        // Don't fail the whole update if avatar upload fails
      }
    }

    // Update localStorage
    const finalUser = updatedUser.user || updatedUser;
    if (finalUser) {
      // Ensure we have the proper structure
      const userToStore = {
        ...finalUser,
        _id: finalUser._id || finalUser.id,
        id: finalUser._id || finalUser.id,
      };
      localStorage.setItem("user", JSON.stringify(userToStore));
      currentUser = userToStore;
    }

    showToast("Profile updated successfully!", "success");

    // Reload profile after a short delay
    setTimeout(() => {
      loadProfile();
    }, 1000);
  } catch (error) {
    console.error("Error updating profile:", error);
    showToast(error.message || "Failed to update profile. Please try again.", "error");
  } finally {
    els.saveButton.disabled = false;
    els.saveButton.innerHTML = saveButtonText;
  }
}

// Initialize on page load
function initEditProfile() {
  // Initialize DOM elements first
  initElements();
  setupMultiSelectDropdown();
  
  // Ensure elements exist
  if (!els.profileForm || !els.loadingState) {
    console.error("Required form elements not found. Elements:", els);
    // Try direct access as fallback
    const form = document.getElementById("profileForm");
    const loading = document.getElementById("loadingState");
    if (form && loading) {
      loading.classList.add("hidden");
      form.style.display = "";
    }
    return;
  }
  
  // If we have localStorage data, show form immediately with that data
  if (storedUser) {
    currentUser = storedUser;
    populateForm(storedUser);
    
    // Show form immediately
    els.loadingState.classList.add("hidden");
    els.profileForm.style.display = "";
    
    // Then try to load fresh data in the background
    loadProfile();
  } else {
    // No localStorage data, show loading and fetch
    loadProfile();
  }
  
  // Fallback: show form after 3 seconds even if loading fails
  setTimeout(() => {
    if (els.profileForm && els.profileForm.style.display === "none") {
      console.warn("Form still hidden after 3 seconds. Showing anyway.");
      if (els.loadingState) els.loadingState.classList.add("hidden");
      els.profileForm.style.display = "";
      
      // Try to populate from localStorage
      if (storedUser) {
        currentUser = storedUser;
        populateForm(storedUser);
      }
    }
  }, 3000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEditProfile);
} else {
  initEditProfile();
}
function setupMultiSelectDropdown() {
  const optionsContainer = document.getElementById("workerTypeOptions");
  const pillsContainer = document.getElementById("selectedSkillsPills");

  if (!optionsContainer) return;

  const SKILLS = window.SKILLBRIDGE_SKILLS || [];

  // Group by category
  const groups = {};
  SKILLS.forEach(s => {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  });

  optionsContainer.innerHTML = Object.entries(groups).map(([cat, skills]) => `
    <div class="col-span-2 sm:col-span-3 pt-1">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">${cat}</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        ${skills.map(skill => `
          <label class="flex items-center gap-2 p-2 rounded-lg border-2 border-transparent bg-white hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition has-[:checked]:border-primary has-[:checked]:bg-primary/10 dark:bg-slate-800 dark:hover:bg-primary/10">
            <input type="checkbox" value="${skill.value}" class="worker-skill-checkbox w-4 h-4 accent-primary rounded border-gray-300">
            <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">${skill.label}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  function updatePills() {
    if (!pillsContainer) return;
    const checked = Array.from(document.querySelectorAll('.worker-skill-checkbox:checked')).map(cb => cb.value);
    pillsContainer.innerHTML = checked.map(v => `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
        ${v}
        <button type="button" onclick="document.querySelector('.worker-skill-checkbox[value=\\'${v}\\']').click()" class="ml-0.5 hover:text-primary/60">&times;</button>
      </span>
    `).join('');
  }

  optionsContainer.addEventListener('change', updatePills);

  // Expose updatePills for populateForm to call after pre-checking boxes
  window._updateSkillPills = updatePills;
}

// Make functions globally available for debugging
window.editProfile = {
  loadProfile,
  updateProfile,
  showToast,
};
