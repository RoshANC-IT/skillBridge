// Enhanced Dynamic booking page functionality
// Fully responsive, clickable, with backend integration, dynamic calendar, time slots, and real-time updates

(function() {
  'use strict';

  // Define API_BASE - use window.API_BASE if already set, otherwise use default
  const API_BASE = window.API_BASE || "http://localhost:3000/api";
  // API_BASE_ALT is deprecated - use API_BASE instead
  // const API_BASE_ALT = "http://localhost:5500/api";
  
  // Make it available globally for other scripts if needed
  if (!window.API_BASE) {
    window.API_BASE = API_BASE;
  }

  // Service configuration
  const SERVICE_CONFIG = {
    "home-cleaning": {
      name: "Home Cleaning",
      icon: "cleaning_services",
      types: ["Deep Cleaning", "Regular Cleaning", "Move-in/Move-out", "Post-Construction"],
      basePrice: 1299
    },
    "appliance-repair": {
      name: "Appliance Repair",
      icon: "construction",
      types: ["AC Repair", "Refrigerator", "Washing Machine", "Microwave", "Other"],
      basePrice: 499
    },
    "electrical-work": {
      name: "Electrical Work",
      icon: "electrical_services",
      types: ["Wiring", "Installation", "Repair", "Panel Upgrade", "Other"],
      basePrice: 249
    },
    "plumbing": {
      name: "Plumbing",
      icon: "plumbing",
      types: ["Leak Repair", "Installation", "Drain Cleaning", "Water Heater", "Other"],
      basePrice: 349
    },
    "painting": {
      name: "Painting",
      icon: "format_paint",
      types: ["Interior", "Exterior", "Wall Painting", "Ceiling", "Other"],
      basePrice: 15
    },
    "pest-control": {
      name: "Pest Control",
      icon: "pest_control",
      types: ["Cockroach Control", "Ant Control", "Rodent Control", "Mosquito Control", "Termite Control", "General"],
      basePrice: 799
    },
    "carpentry": {
      name: "Carpentry & Modular",
      icon: "chair",
      types: ["Furniture Repair", "Custom Furniture", "Modular Wardrobe", "Doors & Windows", "Shelves & Cabinets", "Other"],
      basePrice: 499
    },
    "home-security": {
      name: "Home Security Setup",
      icon: "shield",
      types: ["CCTV Installation", "Alarm System", "Smart Locks", "Access Control", "Security Consultation", "Other"],
      basePrice: 1999
    },
    "mason": {
      name: "Mason Services",
      icon: "handyman",
      types: ["Brickwork", "Tiles", "Flooring", "Wall Construction", "Plastering", "Other"],
      basePrice: 350
    },
    "carpenter": {
      name: "Carpenter Services",
      icon: "chair",
      types: ["Furniture", "Doors", "Windows", "Repairs", "Custom Work", "Other"],
      basePrice: 600
    },
    "electrician": {
      name: "Electrician Services",
      icon: "electrical_services",
      types: ["Wiring", "Panels", "Installations", "Repairs", "Maintenance", "Other"],
      basePrice: 400
    },
    "plumber": {
      name: "Plumber Services",
      icon: "plumbing",
      types: ["Pipes", "Fixtures", "Repairs", "Installations", "Maintenance", "Other"],
      basePrice: 450
    },
    "welder": {
      name: "Welder Services",
      icon: "hardware",
      types: ["Metal Work", "Gates", "Fabrication", "Repairs", "Installations", "Other"],
      basePrice: 500
    }
  };

  let selectedWorker = null;
  let selectedDate = null;
  let selectedTime = null;
  let selectedServiceType = null;
  let currentServiceSlug = null;
  let currentConfig = null;
  let userCity = null;

  // Get service slug from page
  function getServiceSlug() {
    const body = document.body;
    if (body.dataset.serviceSlug) return body.dataset.serviceSlug;
    
    const path = window.location.pathname.split("/").pop() || "";
    if (path.endsWith("-booking.html")) {
      return path.replace("-booking.html", "");
    }
    return null;
  }

  // Extract city from user location
  function getUserCity() {
    // First try to get from city input field
    const cityInput = document.getElementById("city");
    if (cityInput && cityInput.value) {
      return cityInput.value.trim();
    }

    // Try to get from saved location
    const savedLocation = localStorage.getItem("userLocation") || "";
    if (!savedLocation) return null;
    
    // Common Indian cities to match
    const cities = [
      "Mumbai", "Pune", "Bengaluru", "Bangalore", "Delhi", "Noida", "Gurgaon",
      "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi",
      "Indore", "Nagpur", "Lucknow", "Chandigarh", "Bhopal", "Visakhapatnam",
      "Surat", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik"
    ];
    
    const locationLower = savedLocation.toLowerCase();
    for (const city of cities) {
      if (locationLower.includes(city.toLowerCase())) {
        return city;
      }
    }
    
    // Try to extract city from address pattern (usually before postal code or at end)
    const patterns = [
      /,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,?\s*\d{6}/i, // City before postal code
      /,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i, // City at end
      /([A-Z][a-z]+)\s+(?:Mumbai|Pune|Bengaluru|Delhi|Hyderabad|Chennai|Kolkata)/i
    ];
    
    for (const pattern of patterns) {
      const match = savedLocation.match(pattern);
      if (match && match[1]) {
        const city = match[1].trim();
        if (city.length > 2) {
          return city;
        }
      }
    }
    
    return null;
  }

  // Filter workers by city
  function filterWorkersByCity(workers, city) {
    if (!city || !workers || workers.length === 0) {
      return workers;
    }

    const cityLower = city.toLowerCase();
    
    return workers.filter(worker => {
      // Prefer city field from user model (most reliable)
      const workerCity = (worker.city || "").toLowerCase();
      
      // Match if city field contains the search city
      if (workerCity && workerCity.includes(cityLower)) {
        return true;
      }
      
      // Fallback: check locationLabel or location fields
      const workerLocation = (worker.locationLabel || worker.location || worker.address || "").toLowerCase();
      if (workerLocation && workerLocation.includes(cityLower)) {
        return true;
      }
      
      // Also check common city variations
      const cityVariations = {
        "bangalore": "bengaluru",
        "bengaluru": "bangalore",
        "gurgaon": "gurugram",
        "gurugram": "gurgaon"
      };
      
      const variation = cityVariations[cityLower];
      if (variation) {
        if ((workerCity && workerCity.includes(variation)) || 
            (workerLocation && workerLocation.includes(variation))) {
          return true;
        }
      }
      
      return false;
    });
  }

  // Initialize dynamic booking page
  // Track initialization state
  let bookingInitialized = false;
  
  async function initDynamicBooking() {
    // Prevent duplicate initialization
    if (bookingInitialized) {
      console.warn("⚠️ initDynamicBooking already called, skipping duplicate initialization");
      return;
    }
    bookingInitialized = true;
    const serviceSlug = getServiceSlug();
    if (!serviceSlug) {
      console.warn("Service slug not found");
      return;
    }

    currentServiceSlug = serviceSlug;
    currentConfig = SERVICE_CONFIG[serviceSlug] || {
      name: serviceSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      icon: "handyman",
      types: [],
      basePrice: 0
    };

    // Update page title and breadcrumb
    updatePageMetadata(currentConfig, serviceSlug);

    // Load service types FIRST - this must render immediately
    console.log("Service config:", currentConfig);
    console.log("Service types to render:", currentConfig.types);
    
    if (currentConfig.types && currentConfig.types.length > 0) {
      // Force render immediately
      renderServiceTypes(currentConfig.types, currentConfig);
      
      // Also try again after a short delay to ensure it renders
      setTimeout(() => {
        const container = document.querySelector("[data-service-types]");
        if (container && container.children.length === 0) {
          console.log("Container empty, retrying render");
          renderServiceTypes(currentConfig.types, currentConfig);
        }
      }, 200);
    } else {
      console.warn("No service types configured for:", serviceSlug);
      // Hide service types section if no types
      const serviceTypesSection = document.querySelector("[data-service-types]")?.closest("section");
      if (serviceTypesSection) {
        serviceTypesSection.style.display = "none";
      }
    }

    // Load workers from backend
    await loadAndRenderWorkers(serviceSlug);

    // Initialize dynamic calendar (this sets default date)
    initDynamicCalendar();

    // Initialize time slots immediately (will be updated when date/worker changes)
    // Use multiple attempts to ensure time slots render
    function ensureTimeSlotsRender() {
      const timeContainer = document.querySelector("[data-time-slots]");
      if (timeContainer) {
        // Check if already has time slots
        if (timeContainer.querySelector('.time-slot-btn')) {
          console.log("Time slots already rendered");
          return;
        }
        console.log("Initializing time slots...");
        initTimeSlots();
      } else {
        console.warn("Time slots container not found, retrying...");
        setTimeout(ensureTimeSlotsRender, 200);
      }
    }
    
    // Try immediately
    setTimeout(ensureTimeSlotsRender, 100);
    
    // Also try after a short delay as fallback
    setTimeout(ensureTimeSlotsRender, 400);

    // Initialize address fields and get user city
    initAddressFields();
    userCity = getUserCity();
    console.log("User city detected:", userCity);

    // Initialize booking summary with real-time updates
    initBookingSummary(serviceSlug, currentConfig);

    // Setup booking button
    setupBookingButton(serviceSlug);

    // Setup real-time summary updates
    setupRealTimeUpdates();
  }

  function updatePageMetadata(config, serviceSlug) {
    // Update title
    const title = document.querySelector("title");
    if (title) {
      title.textContent = `${config.name} Booking | Skill Bridge`;
    }

    // Update breadcrumb
    const breadcrumb = document.querySelector("[data-booking-breadcrumb]");
    if (breadcrumb) {
      breadcrumb.textContent = config.name;
    }

    // Update main heading
    const heading = document.querySelector("[data-booking-heading]");
    if (heading) {
      heading.textContent = `${config.name} Booking`;
    }
  }

  function renderServiceTypes(types, config) {
    const container = document.querySelector("[data-service-types]");
    if (!container) {
      console.error("Service types container not found! Looking for [data-service-types]");
      // Try to find it with a delay
      setTimeout(() => {
        const retryContainer = document.querySelector("[data-service-types]");
        if (retryContainer && types.length > 0) {
          console.log("Found container on retry, rendering now");
          renderServiceTypes(types, config);
        }
      }, 500);
      return;
    }

    console.log(`Rendering ${types.length} service types into container:`, container);

    // Clear loading state if any
    container.innerHTML = "";

    // Render service types using innerHTML for better performance
    container.innerHTML = types.map((type, index) => {
      return `
        <label class="relative flex cursor-pointer items-center justify-center rounded-lg border-2 border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-700 transition-all hover:border-primary/50 hover:scale-105 has-[:checked]:border-primary has-[:checked]:bg-primary/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary/50 dark:has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20">
          ${type}
          <input ${index === 0 ? 'checked' : ''} type="radio" name="service_type" value="${type}" class="absolute h-0 w-0 opacity-0" />
        </label>
      `;
    }).join("");

    // Set initial service type
    if (types.length > 0) {
      // Check for saved service type first
      const savedType = localStorage.getItem("selectedServiceType");
      if (savedType && types.includes(savedType)) {
        selectedServiceType = savedType;
        const savedInput = container.querySelector(`input[value="${savedType}"]`);
        if (savedInput) {
          savedInput.checked = true;
        }
      } else {
        selectedServiceType = types[0];
        const firstInput = container.querySelector('input[type="radio"][name="service_type"]');
        if (firstInput) {
          firstInput.checked = true;
        }
        localStorage.setItem("selectedServiceType", selectedServiceType);
      }
      console.log("✅ Initial service type set:", selectedServiceType);
    }

    // Add change listeners
    container.querySelectorAll('input[type="radio"][name="service_type"]').forEach((input, index) => {
      input.addEventListener('change', (e) => {
        selectedServiceType = e.target.value;
        localStorage.setItem("selectedServiceType", selectedServiceType);
        console.log("✅ Service type changed to:", selectedServiceType);
        updateBookingSummary();
        updateCart();
        updateCompletionStatus(); // Explicitly update button state
      });
    });

    console.log(`Successfully rendered ${types.length} service types`);
  }

  async function loadAndRenderWorkers(serviceSlug) {
    const container = document.querySelector("[data-booking-workers]");
    if (!container) {
      console.warn("⚠️ Workers container [data-booking-workers] not found");
      // Retry after a short delay
      setTimeout(() => {
        const retryContainer = document.querySelector("[data-booking-workers]");
        if (retryContainer && serviceSlug) {
          console.log("🔄 Retrying worker loading...");
          loadAndRenderWorkers(serviceSlug);
        }
      }, 300);
      return;
    }

    console.log("👷 Loading workers for:", serviceSlug);
    container.innerHTML = '<div class="text-center py-8"><div class="inline-flex items-center gap-2 text-slate-500"><span class="material-symbols-outlined animate-spin">refresh</span><span>Loading workers...</span></div></div>';

    try {
      let workers = [];
      
      // Get user city for filtering
      userCity = getUserCity();
      const cityParam = userCity ? `&city=${encodeURIComponent(userCity)}` : "";

      // Try primary endpoint: /api/services/:slug with city filter
      try {
        const url = `${API_BASE}/services/${serviceSlug}${cityParam ? `?city=${encodeURIComponent(userCity)}` : ""}`;
        console.log(`🔍 Fetching workers from: ${url}`);
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          console.log(`✅ Workers from services endpoint:`, {
            total: data.workers?.length || 0,
            service: serviceSlug,
            city: userCity,
            workers: data.workers?.map(w => ({ name: w.name || `${w.firstName} ${w.lastName}`, city: w.city, workerType: w.workerType }))
          });
          
          // Handle different response structures
          if (Array.isArray(data.workers)) {
            workers = data.workers;
          } else if (Array.isArray(data)) {
            workers = data;
          } else if (data.data && Array.isArray(data.data.workers)) {
            workers = data.data.workers;
          }
          
          // Filter workers by workerType matching the service (handle multiple formats)
          if (workers.length > 0) {
            const serviceToWorkerTypeMap = {
              "home-cleaning": ["Home Cleaning", "home-cleaning", "home cleaning"],
              "appliance-repair": ["Appliance Repair", "appliance-repair", "appliance repair"],
              "electrical-work": ["Electrical Work", "electrical-work", "electrical work"],
              "plumbing": ["Plumbing", "plumbing"],
              "painting": ["Painting", "painting"],
              "pest-control": ["Pest Control", "pest-control", "pest control"],
              "carpentry": ["Carpentry", "carpentry"],
              "home-security": ["Home Security", "home-security", "home security"],
              "mason": ["Mason", "mason"],
              "carpenter": ["Carpenter", "carpenter"],
              "electrician": ["Electrician", "electrician"],
              "plumber": ["Plumber", "plumber"],
              "welder": ["Welder", "welder"],
            };
            
            const requiredWorkerTypes = serviceToWorkerTypeMap[serviceSlug] || [];
            if (requiredWorkerTypes.length > 0) {
              // Normalize workerType for comparison (case-insensitive, handle spaces/hyphens)
              const normalizeType = (type) => {
                if (!type) return "";
                return type.toLowerCase().trim().replace(/[-\s]/g, "");
              };
              
              const normalizedRequired = requiredWorkerTypes.map(normalizeType);
              
              const filteredWorkers = workers.filter(worker => {
                const workerType = worker.workerType || worker.workType || "";
                const normalizedWorkerType = normalizeType(workerType);
                return normalizedRequired.includes(normalizedWorkerType);
              });
              
              if (filteredWorkers.length > 0) {
                workers = filteredWorkers;
                console.log(`Filtered workers by type (${requiredWorkerTypes.join("/")}):`, workers.length);
              } else {
                console.warn(`No workers found with types ${requiredWorkerTypes.join("/")}, showing all workers`);
              }
            }
          }
        }
      } catch (e) {
        console.log("Primary endpoint failed:", e);
      }

      // If no workers, try direct workers endpoint with city filter
      if (workers.length === 0) {
        try {
          const url = `${API_BASE}/workers${cityParam ? `?city=${encodeURIComponent(userCity)}` : ""}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            console.log("Workers from workers endpoint:", data);
            
            // Handle different response structures
            if (Array.isArray(data)) {
              workers = data;
            } else if (Array.isArray(data.workers)) {
              workers = data.workers;
            } else if (data.data && Array.isArray(data.data)) {
              workers = data.data;
            }
            
            // Filter by role and availability
            workers = workers.filter(w => {
              const role = w.role || w.userRole;
              const availability = w.availability || "available";
              return role === "worker" && (availability === "available" || availability === "busy");
            });
            
            // Also filter by workerType if available (handle multiple formats)
            const serviceToWorkerTypeMap = {
              "home-cleaning": ["Home Cleaning", "home-cleaning", "home cleaning"],
              "appliance-repair": ["Appliance Repair", "appliance-repair", "appliance repair"],
              "electrical-work": ["Electrical Work", "electrical-work", "electrical work"],
              "plumbing": ["Plumbing", "plumbing"],
              "painting": ["Painting", "painting"],
              "pest-control": ["Pest Control", "pest-control", "pest control"],
              "carpentry": ["Carpentry", "carpentry"],
              "home-security": ["Home Security", "home-security", "home security"],
              "mason": ["Mason", "mason"],
              "carpenter": ["Carpenter", "carpenter"],
              "electrician": ["Electrician", "electrician"],
              "plumber": ["Plumber", "plumber"],
              "welder": ["Welder", "welder"],
            };
            
            const requiredWorkerTypes = serviceToWorkerTypeMap[serviceSlug] || [];
            if (requiredWorkerTypes.length > 0 && workers.length > 0) {
              // Normalize workerType for comparison
              const normalizeType = (type) => {
                if (!type) return "";
                return type.toLowerCase().trim().replace(/[-\s]/g, "");
              };
              
              const normalizedRequired = requiredWorkerTypes.map(normalizeType);
              
              const filteredWorkers = workers.filter(worker => {
                const workerType = worker.workerType || worker.workType || "";
                const normalizedWorkerType = normalizeType(workerType);
                return normalizedRequired.includes(normalizedWorkerType);
              });
              
              if (filteredWorkers.length > 0) {
                workers = filteredWorkers;
                console.log(`Filtered workers from fallback endpoint by type (${requiredWorkerTypes.join("/")}):`, workers.length);
              }
            }
          }
        } catch (e) {
          console.log("Workers endpoint also failed:", e);
        }
      }

      // City filtering is now optional - prioritize local workers but show all if needed
      // Backend already handles this, so we just log here
      if (userCity && workers.length > 0) {
        const cityLower = userCity.trim().toLowerCase();
        const localWorkers = workers.filter(worker => {
          const workerCity = (worker.city || worker.locationLabel || worker.location || "").toLowerCase();
          return workerCity.includes(cityLower) || cityLower.includes(workerCity);
        });
        
        console.log(`Workers: ${workers.length} total, ${localWorkers.length} from "${userCity}"`);
        // Don't filter - show all workers, backend already prioritized local ones
      }

      console.log(`Found ${workers.length} workers for service: ${serviceSlug}`);

      if (workers.length === 0) {
        console.warn("No workers found for service:", serviceSlug);
        container.innerHTML = `
          <div class="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">person_off</span>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">No workers available for this service type right now.</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">We'll assign someone when available.</p>
          </div>
        `;
        return;
      }

      // Render workers with city badge and worker type
      container.innerHTML = workers.map(worker => {
        const firstName = worker.firstName || "";
        const lastName = worker.lastName || "";
        const name = worker.name || `${firstName} ${lastName}`.trim() || "Worker";
        const availability = worker.availability || "available";
        const isAvailable = availability === "available";
        const workerId = worker.id || worker._id || worker.userId;
        const userName = worker.userName || "";
        const avatarUrl = worker.avatarUrl || "";
        // Use city field directly from user model (preferred) or fallback to locationLabel
        const workerCity = worker.city || worker.locationLabel || worker.location || "";
        const isLocalWorker = userCity && workerCity && workerCity.toLowerCase().includes(userCity.toLowerCase());
        
        // Get worker type - this is important for display
        const workerType = worker.workerType || worker.workType || "";
        
        return `
          <button type="button" data-worker-id="${workerId}" data-worker-name="${name}" data-worker-type="${workerType}" class="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer worker-card">
            ${avatarUrl ? 
              `<img src="${avatarUrl}" alt="${name}" class="size-16 rounded-lg object-cover shrink-0" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />` : 
              ""
            }
            <div class="size-16 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0" ${avatarUrl ? 'style="display:none;"' : ''}>
              ${name.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-semibold text-slate-900 dark:text-slate-100 truncate">${name}</p>
                ${isLocalWorker ? '<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"><span class="material-symbols-outlined text-xs">location_on</span>Local</span>' : ''}
              </div>
              ${userName ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">@${userName}</p>` : ''}
              ${workerType ? `<p class="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1 flex items-center gap-1" data-worker-type-display><span class="material-symbols-outlined text-xs">work</span>${workerType}</p>` : ''}
              ${workerCity ? `<p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><span class="material-symbols-outlined text-xs">place</span>${workerCity}</p>` : ''}
              <span class="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                isAvailable
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              }">
                <span class="material-symbols-outlined text-xs">circle</span>
                ${availability}
              </span>
            </div>
            ${isAvailable ? '<span class="material-symbols-outlined text-primary shrink-0">check_circle</span>' : ''}
          </button>
        `;
      }).join("");

      // Add click handlers
      container.querySelectorAll('.worker-card').forEach(card => {
        card.addEventListener('click', function() {
          // Remove previous selection
          container.querySelectorAll('.worker-card').forEach(c => {
            c.classList.remove('ring-2', 'ring-primary', 'bg-primary/10', 'border-primary');
          });
          
          // Add selection to clicked card
          this.classList.add('ring-2', 'ring-primary', 'bg-primary/10', 'border-primary');
          
          const workerId = this.dataset.workerId;
          const workerName = this.dataset.workerName;
          
          // Get worker type from data attribute or element
          const workerType = this.dataset.workerType || this.querySelector('[data-worker-type-display]')?.textContent.trim() || null;
          
          selectedWorker = { 
            id: workerId, 
            name: workerName,
            workerType: workerType
          };
          
          console.log("✅ Selected worker:", selectedWorker);
          
          // Store in localStorage
          localStorage.setItem("selectedWorkerId", workerId);
          localStorage.setItem("selectedWorkerName", workerName);
          if (workerType) {
            localStorage.setItem("selectedWorkerType", workerType);
          }
          
          // Update summary and reload time slots
          updateBookingSummary();
          updateCart();
          if (selectedDate) {
            loadTimeSlotsForWorker(workerId, selectedDate);
          }
        });
      });

      // Auto-select first available worker
      const firstAvailable = container.querySelector('.worker-card');
      if (firstAvailable) {
        firstAvailable.click();
      }

    } catch (error) {
      console.error("Error loading workers:", error);
      container.innerHTML = `
        <div class="rounded-xl border-2 border-dashed border-red-300 dark:border-red-700 p-8 text-center">
          <span class="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
          <p class="text-sm text-red-500">Failed to load workers. Please refresh the page.</p>
          <button onclick="location.reload()" class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Retry</button>
        </div>
      `;
    }
  }

  // Calendar state for widget
  let currentCalendarDate = new Date();
  let calendarSelectedDate = null;

  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(date) {
    return date.toLocaleDateString("en-IN", {
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

  function renderCalendarWidget(year, month) {
    const calendarRoot = document.querySelector("[data-booking-calendar]");
    const monthLabel = document.querySelector("[data-booking-month-label]");
    
    if (!calendarRoot) {
      console.warn("Calendar widget container not found");
      return;
    }

    // Update month label
    if (monthLabel) {
      monthLabel.textContent = new Date(year, month).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }

    // Set up navigation buttons
    const prevBtn = document.querySelector("[data-calendar-prev]");
    const nextBtn = document.querySelector("[data-calendar-next]");
    
    if (prevBtn && !prevBtn.dataset.calendarNavSetup) {
      prevBtn.dataset.calendarNavSetup = "true";
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendarWidget(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
      });
    }

    if (nextBtn && !nextBtn.dataset.calendarNavSetup) {
      nextBtn.dataset.calendarNavSetup = "true";
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendarWidget(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
      });
    }

    // Clear existing calendar cells
    calendarRoot.innerHTML = '';

    // Get calendar data
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

    // Add days from previous month (grayed out)
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const div = document.createElement("div");
      div.className = "text-center text-sm text-slate-300 dark:text-slate-600 py-2";
      div.textContent = day;
      calendarRoot.appendChild(div);
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      dateObj.setHours(0, 0, 0, 0);
      const iso = formatDateForInput(dateObj);
      const isToday = isCurrentMonth && day === today.getDate();
      const isPast = dateObj < today;
      const savedDate = selectedDate || localStorage.getItem("selectedBookingDate");
      const isSelected = savedDate && formatDateForInput(new Date(savedDate)) === iso;

      const button = document.createElement("button");
      button.type = "button";
      button.className = `w-8 h-8 rounded-full text-sm font-medium transition-all flex items-center justify-center mx-auto ${
        isSelected
          ? "bg-primary text-white font-bold ring-2 ring-primary"
          : isToday
          ? "bg-primary/10 text-primary font-bold"
          : isPast
          ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
          : "hover:bg-primary/10 dark:hover:bg-primary/20 text-slate-900 dark:text-slate-200 cursor-pointer"
      }`;
      button.textContent = day;
      button.dataset.date = iso;
      button.disabled = isPast;

      if (!isPast) {
        button.addEventListener("click", () => {
          // Update date input
          const dateInput = document.getElementById("booking-date");
          if (dateInput) {
            dateInput.value = iso;
          }
          
          selectedDate = iso;
          calendarSelectedDate = dateObj;
          localStorage.setItem("selectedBookingDate", selectedDate);
          
          // Clear time when date changes
          selectedTime = null;
          localStorage.removeItem("selectedBookingTime");
          
          // Reload calendar to show selection
          renderCalendarWidget(year, month);
          
          // Reload time slots
          if (selectedWorker) {
            loadTimeSlotsForWorker(selectedWorker.id, selectedDate);
          } else {
            initTimeSlots();
          }
          
          // Update summary
          updateBookingSummary();
          updateCart();
          updateCompletionStatus();
        });
      }

      calendarRoot.appendChild(button);
    }

    // Add days from next month to fill the grid
    const totalCells = calendarRoot.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells && day <= 14; day++) {
      const div = document.createElement("div");
      div.className = "text-center text-sm text-slate-300 dark:text-slate-600 py-2";
      div.textContent = day;
      calendarRoot.appendChild(div);
    }
  }

  function initDynamicCalendar() {
    const dateInput = document.getElementById("booking-date");
    if (!dateInput) {
      console.warn("Date input not found");
      return;
    }

    // Set minimum date to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateInput.min = today.toISOString().split('T')[0];

    // Try to load saved date from localStorage
    const savedDate = localStorage.getItem("selectedBookingDate");
    const savedTime = localStorage.getItem("selectedBookingTime");
    
    if (savedDate) {
      // Validate saved date is not in the past
      const savedDateObj = new Date(savedDate);
      if (savedDateObj >= today) {
        dateInput.value = savedDate;
        selectedDate = savedDate;
        calendarSelectedDate = savedDateObj;
        currentCalendarDate = new Date(savedDateObj);
      } else {
        // If saved date is in past, use tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
        selectedDate = tomorrow.toISOString().split('T')[0];
        calendarSelectedDate = tomorrow;
        currentCalendarDate = new Date(tomorrow);
        localStorage.setItem("selectedBookingDate", selectedDate);
      }
    } else {
      // Set default to tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
      selectedDate = tomorrow.toISOString().split('T')[0];
      calendarSelectedDate = tomorrow;
      currentCalendarDate = new Date(tomorrow);
      localStorage.setItem("selectedBookingDate", selectedDate);
    }

    // Restore saved time if available
    if (savedTime) {
      selectedTime = savedTime;
    }

    // Initialize calendar widget
    if (document.querySelector("[data-booking-calendar]")) {
      renderCalendarWidget(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
    }

    // Update summary when date changes
    dateInput.addEventListener('change', (e) => {
      if (!e.target.value) return;
      
      selectedDate = e.target.value;
      calendarSelectedDate = new Date(e.target.value);
      currentCalendarDate = new Date(e.target.value);
      
      // Store date in localStorage
      localStorage.setItem("selectedBookingDate", selectedDate);
      console.log("📅 Date changed and stored:", selectedDate);
      
      // Update calendar widget to show selected date
      if (document.querySelector("[data-booking-calendar]")) {
        renderCalendarWidget(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
      }
      
      // Clear time selection when date changes
      selectedTime = null;
      localStorage.removeItem("selectedBookingTime");

      // Reload time slots
      if (selectedWorker) {
        loadTimeSlotsForWorker(selectedWorker.id, selectedDate);
      } else {
        // If no worker selected, still show time slots
        initTimeSlots();
      }
      
      updateBookingSummary();
      updateCart();
      updateCompletionStatus(); // Explicitly update button state
    });

    // Also listen to input event for real-time updates
    dateInput.addEventListener('input', () => {
      if (dateInput.value) {
        selectedDate = dateInput.value;
        calendarSelectedDate = new Date(dateInput.value);
        currentCalendarDate = new Date(dateInput.value);
        localStorage.setItem("selectedBookingDate", selectedDate);
        console.log("✅ Date input changed:", selectedDate);
        
        // Update calendar widget to show selected date
        if (document.querySelector("[data-booking-calendar]")) {
          renderCalendarWidget(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
        }
        
        // Clear time when date changes
        selectedTime = null;
        localStorage.removeItem("selectedBookingTime");
        
        // Reload time slots
        if (selectedWorker) {
          loadTimeSlotsForWorker(selectedWorker.id, selectedDate);
        } else {
          initTimeSlots();
        }
        
        updateBookingSummary();
        updateCompletionStatus(); // Explicitly update button state
      }
    });

    // Initial date update
    updateBookingSummary();
  }

  async function loadTimeSlotsForWorker(workerId, date) {
    const timeContainer = document.querySelector("[data-time-slots]");
    if (!timeContainer) return;

    // Show loading state
    timeContainer.innerHTML = '<div class="col-span-full text-center py-4"><span class="material-symbols-outlined animate-spin text-primary">refresh</span></div>';

    try {
      // Try to fetch worker availability from backend
      // Use API_BASE (port 3000) instead of API_BASE_ALT (port 5500)
      const res = await fetch(`${API_BASE}/workers/${workerId}/availability?date=${date}`, {
        method: "GET",
        mode: "cors",
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.slots && Array.isArray(data.slots)) {
          renderTimeSlots(data.slots.map(slot => ({ value: slot, display: slot, available: true })));
          return;
        }
      } else {
        // Endpoint doesn't exist or returned error - silently fall back to default slots
        // Don't log 404 errors as they're expected if the endpoint isn't implemented
        if (res.status !== 404) {
          console.log(`Availability API returned ${res.status}, using default slots`);
        }
      }
    } catch (e) {
      // Network errors are expected if endpoint doesn't exist - silently fall back
      // Only log if it's not a network/CORS error
      if (!e.message.includes("Failed to fetch") && !e.message.includes("CORS")) {
        console.log("Availability API error, using default slots:", e.message);
      }
    }

    // Fallback to default time slots
    initTimeSlots();
  }

  function initTimeSlots() {
    const timeContainer = document.querySelector("[data-time-slots]");
    if (!timeContainer) {
      console.warn("Time slots container not found");
      // Retry after a short delay
      setTimeout(() => {
        const retryContainer = document.querySelector("[data-time-slots]");
        if (retryContainer) {
          initTimeSlots();
        }
      }, 200);
      return;
    }

    // Check if slots are already rendered
    if (timeContainer.querySelector('.time-slot-btn')) {
      console.log("Time slots already rendered, skipping...");
      return;
    }

    // Clear any loading or placeholder content
    if (timeContainer.children.length > 0) {
      timeContainer.innerHTML = '';
    }

    console.log("Generating time slots (9 AM - 6 PM)...");
    
    // Generate time slots (9 AM to 6 PM)
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      const time12 = hour > 12 ? `${hour - 12}:00 PM` : `${hour === 12 ? 12 : hour}:00 AM`;
      slots.push({ value: `${hour.toString().padStart(2, '0')}:00`, display: time12, available: true });
    }

    renderTimeSlots(slots);
  }

  function renderTimeSlots(slots) {
    const timeContainer = document.querySelector("[data-time-slots]");
    if (!timeContainer) {
      console.error("❌ Time slots container not found for rendering");
      return;
    }

    // Get saved time to restore selection
    const savedTime = localStorage.getItem("selectedBookingTime");
    console.log("🕐 Rendering time slots, saved time:", savedTime);

    if (!slots || slots.length === 0) {
      console.warn("⚠️ No time slots to render");
      timeContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400">No time slots available</p>';
      return;
    }

    timeContainer.innerHTML = slots.map((slot, index) => {
      const isAvailable = slot.available !== false;
      const isSelected = savedTime && savedTime === slot.value;
      return `
        <button type="button" data-time="${slot.value}" ${!isAvailable ? 'disabled' : ''} class="rounded-lg border-2 p-3 text-center text-sm font-medium transition-all hover:scale-105 active:scale-95 focus:outline-none time-slot-btn ${
          isAvailable
            ? isSelected
              ? 'bg-primary text-white border-primary'
              : 'border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-primary/5 dark:border-slate-800 dark:text-slate-300 dark:hover:border-primary/50 dark:hover:bg-primary/10 cursor-pointer'
            : 'border-slate-300 text-slate-400 line-through opacity-50 cursor-not-allowed dark:border-slate-700 dark:text-slate-500'
        }">
          ${slot.display}
        </button>
      `;
    }).join("");
    
    console.log(`✅ Rendered ${slots.length} time slot buttons`);

    // Add click handlers
    timeContainer.querySelectorAll('.time-slot-btn:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', function() {
        // Remove previous selection
        timeContainer.querySelectorAll('.time-slot-btn').forEach(b => {
          b.classList.remove('bg-primary', 'text-white', 'border-primary');
        });
        
        // Add selection
        this.classList.add('bg-primary', 'text-white', 'border-primary');
        
        selectedTime = this.dataset.time || this.textContent.trim();
        
        // Store time in localStorage
        localStorage.setItem("selectedBookingTime", selectedTime);
        console.log("✅ Selected time:", selectedTime);
        
        // Update summary and cart immediately
        updateBookingSummary();
        updateCart();
      });
    });

    // Restore saved time selection or select first available slot
    setTimeout(() => {
      if (savedTime) {
        const savedSlot = timeContainer.querySelector(`[data-time="${savedTime}"]`);
        if (savedSlot && !savedSlot.disabled) {
          savedSlot.click();
          selectedTime = savedTime;
          console.log(`Restored saved time: ${savedTime}`);
        } else {
          // If saved time is not available, select first slot
          const firstSlot = timeContainer.querySelector('.time-slot-btn:not(:disabled)');
          if (firstSlot) {
            firstSlot.click();
          }
        }
      } else {
        // Select first available slot if no saved time
        const firstSlot = timeContainer.querySelector('.time-slot-btn:not(:disabled)');
        if (firstSlot) {
          firstSlot.click();
        }
      }
    }, 50);

    console.log(`✅ Rendered ${slots.length} time slots successfully`);
  }

  function initAddressFields() {
    const savedLocation = localStorage.getItem("userLocation");
    
    // Try to populate address field
    const addressInput = document.getElementById("address") || document.getElementById("booking-location");
    if (addressInput && savedLocation && !addressInput.value) {
      addressInput.value = savedLocation;
    }

    // Try to populate city if we can extract it
    const cityInput = document.getElementById("city");
    if (cityInput) {
      // First try to get city from saved location
      if (savedLocation) {
        const extractedCity = getUserCity();
        if (extractedCity && !cityInput.value) {
          cityInput.value = extractedCity;
          userCity = extractedCity;
        } else if (savedLocation.includes(',')) {
          const parts = savedLocation.split(',');
          if (parts.length > 1 && !cityInput.value) {
            cityInput.value = parts[parts.length - 2]?.trim() || "";
            userCity = cityInput.value;
          }
        }
      }
      
      // Watch for city changes to reload workers
      cityInput.addEventListener('change', () => {
        const newCity = cityInput.value.trim();
        if (newCity && newCity !== userCity) {
          userCity = newCity;
          console.log("City changed to:", userCity);
          // Reload workers with new city filter
          if (currentServiceSlug) {
            loadAndRenderWorkers(currentServiceSlug);
          }
        }
      });
    }
  }

  function initBookingSummary(serviceSlug, config) {
    // Load saved selections from localStorage
    const savedDate = localStorage.getItem("selectedBookingDate");
    const savedTime = localStorage.getItem("selectedBookingTime");
    const savedServiceType = localStorage.getItem("selectedServiceType");
    
    // Restore date
    if (savedDate) {
      selectedDate = savedDate;
      const dateInput = document.getElementById("booking-date");
      if (dateInput && !dateInput.value) {
        dateInput.value = savedDate;
      }
    }
    
    // Restore time
    if (savedTime) {
      selectedTime = savedTime;
    }
    
    // Restore service type
    if (savedServiceType && currentConfig && currentConfig.types && currentConfig.types.includes(savedServiceType)) {
      selectedServiceType = savedServiceType;
    }
    
    // Update service name
    const serviceNameEl = document.querySelector("[data-booking-service-name]");
    if (serviceNameEl) {
      serviceNameEl.textContent = selectedServiceType || config.name;
    }

    // Update package if available
    const packageData = localStorage.getItem("selectedPackage");
    if (packageData) {
      try {
        const pkg = JSON.parse(packageData);
        const packageNameEl = document.querySelector("[data-booking-package-name]");
        if (packageNameEl) {
          packageNameEl.textContent = pkg.name || "Selected package";
        }
        updatePrice(pkg.price, pkg.unit);
      } catch (e) {
        console.error("Error parsing package data:", e);
        updatePrice(config.basePrice);
      }
    } else {
      updatePrice(config.basePrice);
    }
    
    // Initial summary update
    updateBookingSummary();
  }

  function updatePrice(price, unit = null) {
    const priceEl = document.querySelector("[data-booking-price]");
    if (priceEl && price) {
      const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      });
      priceEl.textContent = unit ? `${formatter.format(price)}/${unit}` : formatter.format(price);
    }
  }

  function updateBookingSummary() {
    // Update service type/name
    const summaryService = document.querySelector("[data-booking-service-name]");
    if (summaryService) {
      if (selectedServiceType) {
        summaryService.textContent = selectedServiceType;
        summaryService.classList.remove("text-slate-400", "italic");
        summaryService.classList.add("text-slate-800", "dark:text-slate-200");
      } else if (currentConfig) {
        summaryService.textContent = currentConfig.name;
        summaryService.classList.remove("text-slate-400", "italic");
        summaryService.classList.add("text-slate-800", "dark:text-slate-200");
      } else {
        summaryService.textContent = "Select service type";
        summaryService.classList.add("text-slate-400", "italic");
        summaryService.classList.remove("text-slate-800", "dark:text-slate-200");
      }
    }

    // Update worker name with status indicator
    const summaryWorker = document.querySelector("[data-booking-worker-name]");
    if (summaryWorker) {
      if (selectedWorker) {
        summaryWorker.textContent = selectedWorker.name;
        summaryWorker.classList.remove("text-slate-400", "italic");
        summaryWorker.classList.add("text-slate-800", "dark:text-slate-200");
        
        // Add worker type if available
        const workerTypeEl = document.querySelector("[data-booking-worker-type]");
        if (workerTypeEl && selectedWorker.workerType) {
          workerTypeEl.textContent = selectedWorker.workerType;
          workerTypeEl.style.display = "block";
        }
      } else {
        summaryWorker.textContent = "Select a worker";
        summaryWorker.classList.add("text-slate-400", "italic");
        summaryWorker.classList.remove("text-slate-800", "dark:text-slate-200");
        
        const workerTypeEl = document.querySelector("[data-booking-worker-type]");
        if (workerTypeEl) {
          workerTypeEl.style.display = "none";
        }
      }
    }

    // Update date with formatted display
    const summaryDate = document.querySelector("[data-booking-date]");
    if (summaryDate) {
      // Try to get date from selectedDate or localStorage
      let dateToDisplay = selectedDate || localStorage.getItem("selectedBookingDate");
      
      if (dateToDisplay) {
        const date = new Date(dateToDisplay);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateObj = new Date(dateToDisplay);
        selectedDateObj.setHours(0, 0, 0, 0);
        
        let dateText = "";
        if (selectedDateObj.getTime() === today.getTime()) {
          dateText = "Today, " + date.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        } else if (selectedDateObj.getTime() === today.getTime() + 86400000) {
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
        
        summaryDate.textContent = dateText;
        summaryDate.classList.remove("text-slate-400", "italic");
        summaryDate.classList.add("text-slate-800", "dark:text-slate-200");
        
        // Update selectedDate if it was loaded from localStorage
        if (!selectedDate && dateToDisplay) {
          selectedDate = dateToDisplay;
        }
      } else {
        summaryDate.textContent = "Select date";
        summaryDate.classList.add("text-slate-400", "italic");
        summaryDate.classList.remove("text-slate-800", "dark:text-slate-200");
      }
    }

    // Update time with formatted display
    const summaryTime = document.querySelector("[data-booking-time]");
    if (summaryTime) {
      // Try to get time from selectedTime or localStorage
      let timeToDisplay = selectedTime || localStorage.getItem("selectedBookingTime");
      
      if (timeToDisplay) {
        // Convert 24h to 12h format for display
        const [hours, minutes] = timeToDisplay.split(':');
        const hour = parseInt(hours);
        const time12 = hour > 12 
          ? `${hour - 12}:${minutes || '00'} PM` 
          : `${hour === 12 ? 12 : hour}:${minutes || '00'} AM`;
        summaryTime.textContent = time12;
        summaryTime.classList.remove("text-slate-400", "italic");
        summaryTime.classList.add("text-slate-800", "dark:text-slate-200");
        
        // Update selectedTime if it was loaded from localStorage
        if (!selectedTime && timeToDisplay) {
          selectedTime = timeToDisplay;
        }
      } else {
        summaryTime.textContent = "Select time";
        summaryTime.classList.add("text-slate-400", "italic");
        summaryTime.classList.remove("text-slate-800", "dark:text-slate-200");
      }
    }

    // Update location/address
    const summaryLocation = document.querySelector("[data-booking-location]");
    if (summaryLocation) {
      const addressInput = document.getElementById("address") || document.getElementById("booking-location");
      const cityInput = document.getElementById("city");
      
      if (addressInput && addressInput.value.trim()) {
        let locationText = addressInput.value.trim();
        if (cityInput && cityInput.value.trim()) {
          locationText += `, ${cityInput.value.trim()}`;
        }
        summaryLocation.textContent = locationText.length > 40 ? locationText.substring(0, 40) + "..." : locationText;
        summaryLocation.classList.remove("text-slate-400", "italic");
        summaryLocation.classList.add("text-slate-800", "dark:text-slate-200");
      } else {
        summaryLocation.textContent = "Enter address";
        summaryLocation.classList.add("text-slate-400", "italic");
        summaryLocation.classList.remove("text-slate-800", "dark:text-slate-200");
      }
    }

    // Update price dynamically
    updatePrice();

    // Update completion status
    updateCompletionStatus();
  }

  function updatePrice() {
    const priceEl = document.querySelector("[data-booking-price]");
    if (!priceEl) return;

    let price = 0;
    let unit = null;

    // Get price from package if available
    const packageData = localStorage.getItem("selectedPackage");
    if (packageData) {
      try {
        const pkg = JSON.parse(packageData);
        price = pkg.price || 0;
        unit = pkg.unit || null;
      } catch (e) {
        console.error("Error parsing package data:", e);
      }
    }

    // If no package price, use base price from config
    if (price === 0 && currentConfig) {
      price = currentConfig.basePrice || 0;
    }

    // Format and display price
    if (price > 0) {
      const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      });
      priceEl.textContent = unit ? `${formatter.format(price)}/${unit}` : formatter.format(price);
      priceEl.classList.remove("text-slate-400");
      priceEl.classList.add("text-primary");
    } else {
      priceEl.textContent = "Calculating...";
      priceEl.classList.add("text-slate-400");
      priceEl.classList.remove("text-primary");
    }
  }

  function updateCompletionStatus() {
    const statusEl = document.querySelector("[data-booking-status]");
    const buttonEl = document.querySelector("[data-booking-primary]");
    
    if (!statusEl && !buttonEl) return;

    // Load values from localStorage if not set in variables
    const serviceType = selectedServiceType || localStorage.getItem("selectedServiceType");
    const worker = selectedWorker || (localStorage.getItem("selectedWorkerId") ? { id: localStorage.getItem("selectedWorkerId"), name: localStorage.getItem("selectedWorkerName") } : null);
    const date = selectedDate || localStorage.getItem("selectedBookingDate");
    const time = selectedTime || localStorage.getItem("selectedBookingTime");
    
    // Also check date input directly
    const dateInput = document.getElementById("booking-date");
    const finalDate = date || (dateInput ? dateInput.value : null);
    
    // Check if time slot is selected visually
    const selectedTimeBtn = document.querySelector(".time-slot-btn.bg-primary");
    const finalTime = time || (selectedTimeBtn ? (selectedTimeBtn.dataset.time || selectedTimeBtn.textContent.trim()) : null);
    
    const isComplete = serviceType && worker && finalDate && finalTime;
    const addressInput = document.getElementById("address") || document.getElementById("booking-location");
    const cityInput = document.getElementById("city");
    const hasAddress = addressInput && addressInput.value.trim() && cityInput && cityInput.value.trim();
    
    console.log("🔍 Completion check:", {
      serviceType: !!serviceType,
      worker: !!worker,
      date: !!finalDate,
      time: !!finalTime,
      address: !!hasAddress,
      isComplete: isComplete && hasAddress
    });

    if (statusEl) {
      if (isComplete && hasAddress) {
        statusEl.textContent = "✓ Ready to book";
        statusEl.className = "text-xs font-medium text-emerald-600 dark:text-emerald-400";
      } else {
        const missing = [];
        if (!serviceType) missing.push("service type");
        if (!worker) missing.push("worker");
        if (!finalDate) missing.push("date");
        if (!finalTime) missing.push("time");
        if (!hasAddress) missing.push("address & city");
        
        statusEl.textContent = `Missing: ${missing.join(", ")}`;
        statusEl.className = "text-xs font-medium text-amber-600 dark:text-amber-400";
      }
    }

    if (buttonEl) {
      if (isComplete && hasAddress) {
        buttonEl.disabled = false;
        buttonEl.classList.remove("opacity-50", "cursor-not-allowed");
        buttonEl.classList.add("hover:bg-primary/90");
        console.log("✅ Button enabled - all fields complete");
      } else {
        buttonEl.disabled = true;
        buttonEl.classList.add("opacity-50", "cursor-not-allowed");
        buttonEl.classList.remove("hover:bg-primary/90");
        console.log("❌ Button disabled - missing fields");
      }
    }
  }

  // Update cart with current booking details
  function updateCart() {
    if (!currentServiceSlug || !currentConfig) return;

    // Get current selections (check localStorage as fallback)
    const serviceType = selectedServiceType || localStorage.getItem("selectedServiceType") || currentConfig.name;
    const workerName = selectedWorker?.name || localStorage.getItem("selectedWorkerName") || "Not selected";
    const date = selectedDate || localStorage.getItem("selectedBookingDate") || null;
    const time = selectedTime || localStorage.getItem("selectedBookingTime") || null;
    
    // Format date for display
    let dateDisplay = "Not selected";
    if (date) {
      const dateObj = new Date(date);
      dateDisplay = dateObj.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
    
    // Format time for display
    let timeDisplay = "Not selected";
    if (time) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      timeDisplay = hour > 12 
        ? `${hour - 12}:${minutes || '00'} PM` 
        : `${hour === 12 ? 12 : hour}:${minutes || '00'} AM`;
    }
    
    // Update cart data in localStorage for cart.js to pick up
    const cartData = {
      serviceSlug: currentServiceSlug,
      serviceName: serviceType,
      workerName: workerName,
      date: dateDisplay,
      time: timeDisplay,
      dateRaw: date, // Store raw date for processing
      timeRaw: time, // Store raw time for processing
      price: currentConfig.basePrice
    };
    
    localStorage.setItem("currentBookingData", JSON.stringify(cartData));
    
    // Trigger cart update if cart.js is loaded
    if (typeof window.updateCartDisplay === "function") {
      window.updateCartDisplay(cartData);
    }
  }

  function setupRealTimeUpdates() {
    // Update summary when address changes
    const addressInput = document.getElementById("address") || document.getElementById("booking-location");
    if (addressInput) {
      addressInput.addEventListener('input', () => {
        updateBookingSummary();
        updateCart();
        updateCompletionStatus(); // Explicitly update button state
      });
      addressInput.addEventListener('change', () => {
        updateBookingSummary();
        updateCart();
        updateCompletionStatus(); // Explicitly update button state
      });
    }

    // Update summary when city changes
    const cityInput = document.getElementById("city");
    if (cityInput) {
      cityInput.addEventListener('input', () => {
        updateBookingSummary();
        updateCompletionStatus(); // Explicitly update button state
      });
      cityInput.addEventListener('change', () => {
        updateBookingSummary();
        updateCompletionStatus(); // Explicitly update button state
      });
    }

    // Update summary when notes change
    const notesInput = document.getElementById("booking-notes");
    if (notesInput) {
      notesInput.addEventListener('input', () => {
        // Could add character count or validation here
      });
    }

    // Watch for service type changes
    const serviceTypeInputs = document.querySelectorAll('input[name="service_type"]');
    serviceTypeInputs.forEach(input => {
      input.addEventListener('change', () => {
        selectedServiceType = input.value;
        // Store in localStorage
        localStorage.setItem("selectedServiceType", selectedServiceType);
        console.log("✅ Service type selected:", selectedServiceType);
        updateBookingSummary();
        updateCart();
        updateCompletionStatus(); // Explicitly update button state
      });
    });

    // Watch for worker selection changes (already handled in loadAndRenderWorkers)
    // But ensure summary updates when worker is selected
    document.addEventListener('click', (e) => {
      if (e.target.closest('.worker-card')) {
        setTimeout(() => {
          updateBookingSummary();
          updateCart();
          updateCompletionStatus(); // Explicitly update button state
        }, 100);
      }
    });

    // Watch for time slot changes
    document.addEventListener('click', (e) => {
      if (e.target.closest('.time-slot-btn')) {
        setTimeout(() => {
          updateBookingSummary();
          updateCart();
          updateCompletionStatus(); // Explicitly update button state
        }, 50);
      }
    });

    // Watch for date input changes in real-time
    const dateInput = document.getElementById("booking-date");
    if (dateInput) {
      dateInput.addEventListener('input', () => {
        if (dateInput.value) {
          selectedDate = dateInput.value;
          localStorage.setItem("selectedBookingDate", selectedDate);
          console.log("✅ Date selected:", selectedDate);
          updateBookingSummary();
          updateCompletionStatus(); // Explicitly update button state
        }
      });
      dateInput.addEventListener('change', () => {
        if (dateInput.value) {
          selectedDate = dateInput.value;
          localStorage.setItem("selectedBookingDate", selectedDate);
          console.log("✅ Date changed:", selectedDate);
          updateBookingSummary();
          updateCompletionStatus(); // Explicitly update button state
        }
      });
    }

    // Periodic update to catch any missed changes and sync with localStorage
    setInterval(() => {
      // Sync date from localStorage if changed elsewhere
      const savedDate = localStorage.getItem("selectedBookingDate");
      if (savedDate && savedDate !== selectedDate) {
        selectedDate = savedDate;
      }
      
      // Sync time from localStorage if changed elsewhere
      const savedTime = localStorage.getItem("selectedBookingTime");
      if (savedTime && savedTime !== selectedTime) {
        selectedTime = savedTime;
      }
      
      // Sync service type from localStorage
      const savedServiceType = localStorage.getItem("selectedServiceType");
      if (savedServiceType && savedServiceType !== selectedServiceType) {
        selectedServiceType = savedServiceType;
      }
      
      // Sync worker from localStorage
      const savedWorkerId = localStorage.getItem("selectedWorkerId");
      const savedWorkerName = localStorage.getItem("selectedWorkerName");
      if (savedWorkerId && (!selectedWorker || selectedWorker.id !== savedWorkerId)) {
        selectedWorker = {
          id: savedWorkerId,
          name: savedWorkerName || "Worker",
          workerType: localStorage.getItem("selectedWorkerType") || null
        };
      }
      
      updateBookingSummary();
      updateCompletionStatus(); // Always check button state
    }, 1000); // Update every 1 second for real-time feel
  }

  // Test backend connection before booking
  async function testBackendConnection() {
    try {
      // Health endpoint is at /api/health, and API_BASE already includes /api
      const healthUrl = `${API_BASE}/health`;
      console.log("🔍 Testing backend connection at:", healthUrl);
      console.log("🔍 Testing backend connection at:", healthUrl);
      const res = await fetch(healthUrl, {
        method: "GET",
        mode: "cors",
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        console.log("✅ Backend is reachable:", data);
        return true;
      } else {
        console.warn("⚠️ Backend health check returned:", res.status, res.statusText);
        return false;
      }
    } catch (error) {
      console.error("❌ Backend connection test failed:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return false;
    }
  }

  function setupBookingButton(serviceSlug) {
    const bookingBtn = document.querySelector("[data-booking-primary]");
    if (!bookingBtn) return;

    // Prevent duplicate event listeners by removing existing ones first
    if (bookingBtn.dataset.listenerAttached === "true") {
      console.warn("⚠️ Booking button listener already attached, skipping duplicate setup");
      return;
    }
    
    // Mark that listener is attached
    bookingBtn.dataset.listenerAttached = "true";

    bookingBtn.addEventListener("click", async function(e) {
      // Prevent double submission
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent multiple simultaneous submissions
      if (this.disabled || this.dataset.submitting === "true") {
        console.warn("⚠️ Booking already being submitted, ignoring duplicate click");
        return;
      }
      
      // Mark as submitting
      this.dataset.submitting = "true";
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user) {
        alert("❌ Please login to book a service.");
        window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.pathname);
        return;
      }

      // Test backend connection first
      console.log("🔍 Testing backend connection...");
      const backendAvailable = await testBackendConnection();
      if (!backendAvailable) {
        alert("❌ Cannot connect to backend server. Please ensure the backend is running on http://localhost:3000\n\nCheck:\n1. Backend server is started\n2. Server is running on port 3000\n3. No firewall blocking the connection");
        return;
      }

      // Get form values
      const employerId = user._id || user.id;
      const workerId = selectedWorker?.id || localStorage.getItem("selectedWorkerId");
      const serviceType = selectedServiceType || localStorage.getItem("selectedServiceType") || currentConfig?.name || serviceSlug;
      const serviceSlugValue = currentServiceSlug || serviceSlug;

      const dateInput = document.getElementById("booking-date");
      const date = dateInput?.value || selectedDate;

      // Get selected time - try multiple methods
      let time = selectedTime || localStorage.getItem("selectedBookingTime") || "";
      
      // Check visually selected button
      const selectedTimeBtn = document.querySelector(".time-slot-btn.bg-primary");
      if (selectedTimeBtn) {
        time = selectedTimeBtn.dataset.time || selectedTimeBtn.textContent.trim();
        // Convert 12h to 24h format if needed
        if (time && !time.includes(':')) {
          // Try to parse time from text like "9:00 AM"
          const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] || "00";
            const period = timeMatch[3].toUpperCase();
            if (period === "PM" && hours !== 12) hours += 12;
            if (period === "AM" && hours === 12) hours = 0;
            time = `${String(hours).padStart(2, '0')}:${minutes}`;
          }
        }
      }
      
      // Fallback to time input if available
      if (!time) {
        const timeInput = document.getElementById("booking-time");
        if (timeInput && timeInput.value) {
          time = timeInput.value;
        }
      }
      
      // Ensure time is in 24h format (HH:MM)
      if (time && !time.match(/^\d{2}:\d{2}$/)) {
        // Try to normalize time format
        const timeParts = time.split(':');
        if (timeParts.length === 2) {
          const hours = parseInt(timeParts[0]);
          const minutes = timeParts[1].replace(/\D/g, '').padStart(2, '0');
          time = `${String(hours).padStart(2, '0')}:${minutes}`;
        }
      }
      
      console.log("🕐 Final time value:", time);

      // Get address details
      const address = document.getElementById("address")?.value.trim() || "";
      const city = document.getElementById("city")?.value.trim() || "";
      const postalCode = document.getElementById("postal-code")?.value.trim() || "";
      const phone = document.getElementById("phone")?.value.trim() || "";
      const email = document.getElementById("email")?.value.trim() || user.email || "";
      const notes = document.getElementById("booking-notes")?.value.trim() || "";

      // Validation
      if (!date) {
        alert("❌ Please select a date.");
        dateInput?.focus();
        return;
      }

      if (!time) {
        alert("❌ Please select a time slot.");
        return;
      }

      if (!address || !city) {
        alert("❌ Please fill in address and city.");
        return;
      }

      if (!workerId) {
        alert("❌ Please select a worker.");
        return;
      }

      if (!serviceType) {
        alert("❌ Please select a service type.");
        return;
      }

        // Disable button during submission (already marked as submitting above)
      const originalText = this.innerHTML;
      this.disabled = true;
      this.innerHTML = '<span class="flex items-center justify-center gap-2"><span class="material-symbols-outlined animate-spin text-lg">refresh</span><span>Processing...</span></span>';
      this.classList.add("opacity-50", "cursor-not-allowed");

      try {

        // Get package info if available
        const packageData = localStorage.getItem("selectedPackage");
        let packageName = "";
        let price = currentConfig?.basePrice || 0;
        if (packageData) {
          try {
            const pkg = JSON.parse(packageData);
            packageName = pkg.name || "";
            price = pkg.price || price;
          } catch (e) {
            console.error("Error parsing package:", e);
          }
        }

        // Prepare booking payload
        const bookingData = {
          workerId: workerId,
          serviceType: serviceType,
          serviceSlug: serviceSlugValue,
          bookingDate: date,
          bookingTime: time,
          address: address,
          city: city,
          postalCode: postalCode,
          phone: phone,
          email: email,
          notes: notes,
          price: price,
          packageName: packageName,
        };

        console.log("📤 Submitting booking to database:", bookingData);
        
        // Get token first
        const token = localStorage.getItem("token");
        
        if (!token) {
          throw new Error("Authentication token not found. Please login again.");
        }

        // Ensure we use absolute URL - construct it explicitly
        // API_BASE already includes /api, so just append /bookings
        let apiUrl = `${API_BASE}/bookings`;
        
        // Validate the URL is correct
        try {
          const urlObj = new URL(apiUrl);
          apiUrl = urlObj.href; // Normalize the URL
        } catch (urlError) {
          console.warn("URL validation failed, using constructed URL:", apiUrl);
        }
        console.log("📡 API URL:", apiUrl);
        console.log("📡 API_BASE:", API_BASE);
        console.log("📡 Full request details:", {
          url: apiUrl,
          method: "POST",
          hasToken: !!token,
          bookingDataKeys: Object.keys(bookingData)
        });
        console.log("🔑 Token present:", !!token);

        // Make the API call with proper error handling
        let res;
        try {
          res = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(bookingData),
            mode: "cors", // Explicitly set CORS mode
            credentials: "include" // Include credentials for CORS
          });
        } catch (fetchError) {
          console.error("❌ Fetch error:", fetchError);
          // Check if it's a network error
          if (fetchError.message.includes("Failed to fetch") || fetchError.name === "TypeError") {
            throw new Error(`Cannot connect to backend server at ${apiUrl}. Please ensure the backend is running on port 3000. Error: ${fetchError.message}`);
          }
          throw fetchError;
        }

        // Check if response is ok before parsing JSON
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = "Booking failed";
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = errorText || `HTTP ${res.status}: ${res.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();

        console.log("✅ Booking created in database:", data);
        
        // Handle duplicate booking response
        if (data.isDuplicate) {
          console.warn("⚠️ Booking already exists, using existing booking");
          // Still redirect to confirmation page with existing booking
        }

        // Save booking to localStorage for my-bookings page
        const workerName = selectedWorker?.name || localStorage.getItem("selectedWorkerName") || "Worker";
        if (typeof window.saveBookingToLocalStorage === "function") {
          window.saveBookingToLocalStorage({
            id: data.booking?._id || data.booking?.id,
            employerId: employerId,
            workerId: workerId,
            workerName: workerName,
            serviceType: serviceType,
            serviceSlug: serviceSlugValue,
            date: date,
            time: time,
            address: address,
            city: city,
            postalCode: postalCode,
            phone: phone,
            email: email,
            notes: notes,
            price: price,
            packageName: packageName,
            status: data.booking?.status || "pending",
            createdAt: data.booking?.createdAt || new Date().toISOString(),
          });
        }

        // Clear booking selections from localStorage
        localStorage.removeItem("selectedWorkerId");
        localStorage.removeItem("selectedWorkerName");
        localStorage.removeItem("selectedBookingDate");
        localStorage.removeItem("selectedBookingTime");
        localStorage.removeItem("selectedServiceType");

        // Redirect to confirmation page with booking ID
        const bookingId = data.booking?._id || data.booking?.id;
        if (bookingId) {
          window.location.href = `booking-confirmation.html?id=${bookingId}`;
        } else {
          alert("✅ Booking confirmed and saved to database!");
          window.location.href = "my-bookings.html";
        }
      } catch (err) {
        console.error("❌ Booking error:", err);
        // Get token and apiUrl from the scope - they should be defined, but handle case where they might not be
        const errorToken = typeof token !== 'undefined' ? token : localStorage.getItem("token");
        let errorApiUrl;
        try {
          errorApiUrl = typeof apiUrl !== 'undefined' ? apiUrl : `${API_BASE}/bookings`;
        } catch (e) {
          errorApiUrl = "unknown";
        }
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          apiUrl: errorApiUrl,
          hasToken: !!errorToken
        });
        
        let errorMessage = err.message || "Failed to create booking. Please try again.";
        
        // Provide more helpful error messages
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          errorMessage = "Cannot connect to server. Please ensure the backend server is running on http://localhost:3000";
        } else if (err.message.includes("401") || err.message.includes("Unauthorized")) {
          errorMessage = "Session expired. Please login again.";
          setTimeout(() => {
            window.location.href = "login.html";
          }, 2000);
        } else if (err.message.includes("404") || err.message.includes("Not Found")) {
          errorMessage = "Booking endpoint not found. Please check if the backend server is running on port 3000.";
        }
        
        alert("❌ " + errorMessage);
        this.disabled = false;
        this.innerHTML = originalText;
        this.classList.remove("opacity-50", "cursor-not-allowed");
        this.dataset.submitting = "false"; // Reset submitting flag
      } finally {
        // Always reset submitting flag when done
        this.dataset.submitting = "false";
      }
    }, { once: false }); // Allow multiple submissions after completion

    // Store original button text
    bookingBtn.dataset.originalText = bookingBtn.textContent.trim();
  }

  // Track if initialization has already happened
  let isInitialized = false;
  
  // Initialize when DOM is ready
  function startInit() {
    // Prevent duplicate initialization
    if (isInitialized) {
      console.warn("⚠️ Booking initialization already completed, skipping duplicate init");
      return;
    }
    
    console.log("🚀 Starting booking initialization...");
    
    // Wait a bit to ensure all scripts are loaded and DOM is fully ready
    setTimeout(() => {
      try {
        const serviceSlug = getServiceSlug();
        console.log("📋 Detected service slug:", serviceSlug);
        
        if (!serviceSlug) {
          console.error("❌ Service slug not found!");
          return;
        }
        
        // Mark as initialized before calling initDynamicBooking
        if (isInitialized) {
          console.warn("⚠️ Already initialized, skipping duplicate call");
          return;
        }
        isInitialized = true;
        
        console.log("✅ Initializing dynamic booking for:", serviceSlug);
        initDynamicBooking();
      } catch (error) {
        console.error("❌ Error initializing booking:", error);
        console.error("Error stack:", error.stack);
        isInitialized = false; // Reset on error so it can retry
        
        // Show error message to user
        const workerContainer = document.querySelector("[data-booking-workers]");
        if (workerContainer) {
          workerContainer.innerHTML = `
            <div class="rounded-xl border-2 border-dashed border-red-300 dark:border-red-700 p-8 text-center">
              <span class="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
              <p class="text-sm text-red-500">Error loading booking page. Please refresh.</p>
              <p class="text-xs text-slate-500 mt-2">${error.message}</p>
              <button onclick="location.reload()" class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Refresh Page</button>
            </div>
          `;
        }
      }
    }, 200); // Increased delay to ensure DOM is ready
  }

  // Single initialization strategy - only use one method
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    // DOM is already loaded
    startInit();
  }

})();

