const SkillLinkHome = (() => {
  const isHomePage = document.body?.dataset?.page === "home";
  if (!isHomePage) return null;

  const API_BASE = "http://localhost:3000/api"; // Backend runs on port 3000 by default
  
  // Socket.IO connection for real-time stats updates
  let socket = null;
  
  function initSocketIO() {
    // Check if Socket.IO is available
    if (typeof io === 'undefined') {
      console.warn("Socket.IO not available, stats will update via polling only");
      return;
    }
    
    try {
      socket = io("http://localhost:3000", {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      
      socket.on("connect", () => {
        console.log("✅ Home page connected to Socket.IO for stats updates");
      });
      
      // Listen for stats update events when booking is accepted
      socket.on("stats_updated", (data) => {
        console.log("📊 Stats update received:", data);
        if (data.type === "booking_accepted") {
          console.log("🔄 Worker accepted booking - refreshing stats immediately...");
          // Refresh stats immediately when booking is accepted (with small delay to ensure backend updated)
          setTimeout(() => {
            loadLiveStats();
          }, 500);
        }
      });
      
      // Also listen for booking status updates
      socket.on("booking_status_updated", (data) => {
        console.log("📊 Booking status updated:", data);
        if (data.booking?.status === "confirmed") {
          console.log("🔄 Booking confirmed - refreshing stats...");
          setTimeout(() => {
            loadLiveStats();
          }, 500);
        }
      });
      
      socket.on("disconnect", () => {
        console.log("❌ Disconnected from Socket.IO");
      });
      
      socket.on("connect_error", (error) => {
        console.warn("Socket.IO connection error:", error);
      });
      
      socket.on("reconnect", () => {
        console.log("✅ Reconnected to Socket.IO");
      });
    } catch (error) {
      console.error("Error initializing Socket.IO:", error);
    }
  }

  const state = {
    services: [
      { title: "Deep Home Cleaning", subtitle: "Sanitization + appliances", icon: "cleaning_services", price: "From ₹1,299", rating: 4.9, reviews: 182, slug: "home-cleaning" },
      { title: "Appliance Repair", subtitle: "AC · Fridge · Washing machine", icon: "construction", price: "From ₹499", rating: 4.8, reviews: 143, slug: "appliance-repair" },
      { title: "Electrical Fixes", subtitle: "Fans, wiring, new installs", icon: "electrical_services", price: "From ₹249", rating: 4.7, reviews: 201, slug: "electrical-work" },
      { title: "Plumbing Rescue", subtitle: "Leaks, blockages, fittings", icon: "plumbing", price: "From ₹349", rating: 4.9, reviews: 168, slug: "plumbing" },
      { title: "Premium Painting", subtitle: "3D previews + color testing", icon: "format_paint", price: "From ₹15/sq.ft", rating: 4.8, reviews: 96, slug: "painting" },
      { title: "Pest Control", subtitle: "Herbal · Odorless · Safe", icon: "pest_control", price: "From ₹799", rating: 4.9, reviews: 122, slug: "pest-control" },
      { title: "Carpentry & Modular", subtitle: "Repairs, shelves, cabinets", icon: "chair", price: "From ₹499", rating: 4.6, reviews: 88, slug: "carpentry" },
      { title: "Home Security Setup", subtitle: "CCTV, alarms, smart locks", icon: "shield", price: "From ₹1,999", rating: 4.7, reviews: 57, slug: "home-security" }
    ],
    featuredServices: [
      { title: "Kitchen Deep Clean", location: "Kothrud · Pune", eta: "Available today", priceRange: "₹1,499", rating: 4.95, slug: "kitchen-deep-clean", icon: "cleaning_services" },
      { title: "Bathroom Waterproofing", location: "Andheri · Mumbai", eta: "Slots tomorrow", priceRange: "₹6,299", rating: 4.87, slug: "bathroom-waterproofing", icon: "water_drop" },
      { title: "AC Gas Refill + Service", location: "HSR Layout · Bengaluru", eta: "Within 2 hrs", priceRange: "₹2,099", rating: 4.92, slug: "ac-gas-refill-service", icon: "ac_unit" },
      { title: "Modular Wardrobe Fix", location: "Sec 62 · Noida", eta: "3 slots open", priceRange: "₹899", rating: 4.75, slug: "modular-wardrobe-fix", icon: "chair" },
      { title: "Full Home Painting", location: "Jubilee Hills · Hyderabad", eta: "Free visit", priceRange: "₹19,499", rating: 4.9, slug: "full-home-painting", icon: "format_paint" },
      { title: "Smart Door Lock Install", location: "Salt Lake · Kolkata", eta: "Same day", priceRange: "₹2,499", rating: 4.81, slug: "smart-door-lock-install", icon: "lock" },
      { title: "Mason for Wall Construction", location: "Baner · Pune", eta: "Available now", priceRange: "₹1,200/day", rating: 4.88, slug: "mason-wall-construction", icon: "handyman" },
      { title: "Carpenter for Custom Furniture", location: "Koramangala · Bengaluru", eta: "2 slots today", priceRange: "₹1,800/day", rating: 4.82, slug: "carpenter-custom-furniture", icon: "chair" },
      { title: "Electrician for New Wiring", location: "Gurgaon Sector 15", eta: "Same day", priceRange: "₹1,500/day", rating: 4.91, slug: "electrician-new-wiring", icon: "electrical_services" },
      { title: "Plumber for Pipeline Work", location: "Andheri West · Mumbai", eta: "Within 3 hrs", priceRange: "₹1,350/day", rating: 4.85, slug: "plumber-pipeline-work", icon: "plumbing" },
      { title: "Welder for Gate Installation", location: "HSR Layout · Bengaluru", eta: "Tomorrow", priceRange: "₹1,600/day", rating: 4.79, slug: "welder-gate-installation", icon: "hardware" }
    ],
    testimonials: [
      { name: "Shraddha Kapoor", location: "Baner, Pune", date: "2 months ago", quote: "Their deep cleaning crew transformed my apartment before a big family visit. Loved the live tracking & status updates.", rating: 5 },
      { name: "Raj Babbar", location: "Powai, Mumbai", date: "3 months ago", quote: "Booked an urgent fridge repair at midnight. Technician arrived by 8AM with the exact spare part. Priceless.", rating: 4.5 },
      { name: "Samira Pandit", location: "Indiranagar, Bengaluru", date: "4 months ago", quote: "Booked painting with virtual color preview. Team protected every corner and finished a day early.", rating: 5 },
      { name: "Priyank Shah", location: "Gurgaon", date: "5 weeks ago", quote: "They found the leak inside the wall without breaking tiles. Diagnostic report was super detailed.", rating: 4.8 },
      { name: "Rucha Nair", location: "Borivali, Mumbai", date: "Last week", quote: "Used Skill Bridge for parents while abroad. Coordinators sent photos, bills, and status updates in-app.", rating: 5 },
      { name: "Farhan Qureshi", location: "Kochi", date: "10 days ago", quote: "Pest control team used pet-safe solutions and gave 6-month warranty. Zero upsell pressure.", rating: 4.7 }
    ],
    constructionWorkers: [
      { title: "Professional Masons", subtitle: "Brickwork · Tiles · Flooring", icon: "handyman", price: "From ₹350/day", rating: 4.8, reviews: 156, slug: "mason", badge: "Certified" },
      { title: "Expert Carpenters", subtitle: "Furniture · Doors · Windows", icon: "chair", price: "From ₹600/day", rating: 4.7, reviews: 134, slug: "carpenter", badge: "Verified" },
      { title: "Certified Electricians", subtitle: "Wiring · Panels · Installations", icon: "electrical_services", price: "From ₹400/day", rating: 4.9, reviews: 198, slug: "electrician", badge: "Licensed" },
      { title: "Skilled Plumbers", subtitle: "Pipes · Fixtures · Repairs", icon: "plumbing", price: "From ₹450/day", rating: 4.8, reviews: 172, slug: "plumber", badge: "Expert" },
      { title: "Welding Specialists", subtitle: "Metal work · Gates · Fabrication", icon: "hardware", price: "From ₹500/day", rating: 4.7, reviews: 109, slug: "welder", badge: "Pro" }
    ]
  };

  let mapInstance;
  let mapMarker;

  const selectors = {
    serviceGrid: document.getElementById("service-grid"),
    constructionGrid: document.getElementById("construction-grid"),
    featuredServiceGrid: document.getElementById("featured-service-grid"),
    testimonialGrid: document.getElementById("testimonial-grid"),
    jobsGrid: document.getElementById("jobs-grid"),
    mobileToggle: document.querySelector("[data-mobile-toggle]"),
    mobileNav: document.querySelector("[data-mobile-nav]"),
    locationForm: document.getElementById("location-form"),
    locationInput: document.getElementById("selected-address"),
    locationStatus: document.getElementById("location-status"),
    locateMeBtn: document.getElementById("locate-me"),
    statsContainer: document.querySelector("[data-live-stats]")
  };

  function createCard(tagName = "article", className = "") {
    const el = document.createElement(tagName);
    el.className = className;
    return el;
  }

  function renderConstructionWorkers(workers = state.constructionWorkers) {
    if (!selectors.constructionGrid) return;
    selectors.constructionGrid.innerHTML = "";
    workers.forEach(worker => {
      const card = createCard(
        "article",
        "group relative flex flex-col gap-4 rounded-3xl border-2 border-white/30 bg-white/10 p-6 backdrop-blur-md shadow-2xl transition-all hover:-translate-y-2 hover:border-white/60 hover:bg-white/20 hover:shadow-white/20"
      );
      card.innerHTML = `
        <div class="absolute -top-3 right-4">
          <span class="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 shadow-lg">
            <span class="material-symbols-outlined text-sm">verified</span>
            ${worker.badge}
          </span>
        </div>
        <div class="flex items-center justify-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/40">
            <span class="material-symbols-outlined text-4xl text-white">${worker.icon}</span>
          </div>
        </div>
        <div class="text-center">
          <h3 class="text-xl font-bold text-white">${worker.title}</h3>
          <p class="mt-2 text-sm text-white/80">${worker.subtitle}</p>
        </div>
        <div class="flex items-center justify-center gap-2 text-sm text-white/90">
          <span class="material-symbols-outlined text-amber-300 text-lg">star</span>
          <span class="font-semibold">${worker.rating.toFixed(1)}</span>
          <span class="text-white/70">(${worker.reviews}+ reviews)</span>
        </div>
        <div class="text-center">
          <p class="text-lg font-bold text-white">${worker.price}</p>
        </div>
        <button class="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-primary shadow-xl transition hover:scale-105 hover:shadow-white/40">
          Book Now
        </button>
      `;
      card.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") {
          window.location.href = `service-page.html?slug=${worker.slug}`;
        }
      });
      const button = card.querySelector("button");
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `service-page.html?slug=${worker.slug}`;
      });
      selectors.constructionGrid.appendChild(card);
    });
  }

  function renderServices(services = state.services) {
    if (!selectors.serviceGrid) return;
    selectors.serviceGrid.innerHTML = "";
    services.forEach(service => {
      const card = createCard(
        "article",
        "group flex h-full flex-col rounded-3xl border-2 border-slate-200/60 bg-white p-6 shadow-md transition-all hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/50"
      );
      card.innerHTML = `
        <div class="mb-4 flex items-start justify-between">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary ring-2 ring-primary/10 dark:from-primary/20 dark:to-primary/10">
            <span class="material-symbols-outlined text-3xl">${service.icon}</span>
          </div>
          <span class="ml-3 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:bg-primary/20">${service.price}</span>
        </div>
        <div class="mb-4 flex-1">
          <h3 class="mb-2 text-lg font-bold leading-tight text-slate-900 dark:text-white">${service.title}</h3>
          <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-400">${service.subtitle}</p>
        </div>
        <div class="mb-4 flex items-center gap-2 border-t border-slate-200/60 pt-4 dark:border-slate-700">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-amber-400 text-lg">star</span>
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">${service.rating.toFixed(1)}</span>
          </div>
          <span class="text-xs text-slate-500 dark:text-slate-400">·</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">${service.reviews}+ reviews</span>
        </div>
        <button class="w-full rounded-xl bg-gradient-to-r from-primary to-primary/90 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:from-primary/90 hover:to-primary/80 hover:shadow-primary/30">
          View Details
        </button>
      `;
      card.addEventListener("click", () => {
        window.location.href = `service-page.html?slug=${service.slug}`;
      });
      const button = card.querySelector("button");
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `service-page.html?slug=${service.slug}`;
      });
      selectors.serviceGrid.appendChild(card);
    });
  }

  function renderFeaturedServices(services = state.featuredServices) {
    if (!selectors.featuredServiceGrid) return;
    selectors.featuredServiceGrid.innerHTML = "";
    
    // Sort services by location relevance
    const sortedServices = sortByLocationRelevance([...services], "location");
    const userCity = getUserCity();
    
    sortedServices.forEach(service => {
      const isLocal = userCity && service.location.toLowerCase().includes(userCity.toLowerCase());
      const card = createCard(
        "article",
        `group relative flex h-full flex-col rounded-3xl border-2 ${isLocal ? 'border-primary/50 bg-primary/5' : 'border-slate-200/60 bg-white'} p-6 shadow-md transition-all hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/50`
      );
      
      let locationBadge = '';
      if (isLocal) {
        locationBadge = `
          <div class="absolute -top-2 right-4">
            <span class="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              <span class="material-symbols-outlined text-xs">near_me</span>
              Near You
            </span>
          </div>
        `;
      }
      
      card.innerHTML = `
        ${locationBadge}
        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 flex-1">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary text-2xl">${service.icon || 'star'}</span>
            </div>
            <h4 class="flex-1 text-xl font-bold leading-tight text-slate-900 dark:text-white">${service.title}</h4>
          </div>
          <span class="shrink-0 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-400/30 dark:text-amber-300">Top Rated</span>
        </div>
        <div class="mb-4 flex items-center gap-2 text-sm ${isLocal ? 'text-primary font-semibold' : 'text-slate-600 dark:text-slate-400'}">
          <span class="material-symbols-outlined text-base ${isLocal ? 'text-primary' : ''}">location_on</span>
          <span>${service.location}</span>
        </div>
        <div class="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span class="material-symbols-outlined text-base">schedule</span>
          <span class="font-medium">${service.eta}</span>
        </div>
        <div class="mb-4 flex items-center justify-between border-t border-slate-200/60 pt-4 dark:border-slate-700">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Starting at</p>
            <p class="mt-1 text-2xl font-black text-slate-900 dark:text-white">${service.priceRange}</p>
          </div>
          <div class="flex flex-col items-end">
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-amber-400 text-lg">star</span>
              <span class="text-lg font-bold text-slate-900 dark:text-white">${service.rating.toFixed(2)}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">Rating</p>
          </div>
        </div>
        <button class="w-full rounded-xl bg-gradient-to-r from-primary to-primary/90 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:from-primary/90 hover:to-primary/80 hover:shadow-primary/30">
          Book Service
        </button>
      `;

      const button = card.querySelector("button");
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `featured-job-service.html?slug=${service.slug}`;
      });
      
      // Make entire card clickable
      card.style.cursor = "pointer";
      card.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") {
          window.location.href = `featured-job-service.html?slug=${service.slug}`;
        }
      });
      selectors.featuredServiceGrid.appendChild(card);
    });
  }

  async function renderJobs() {
    if (!selectors.jobsGrid) return;
    
    try {
      const res = await fetch(`${API_BASE}/services`);
      if (!res.ok) {
        selectors.jobsGrid.innerHTML = '<p class="text-slate-500 text-center col-span-full">Unable to load jobs at this time.</p>';
        return;
      }
      
      const data = await res.json();
      const jobs = data.services || [];
      
      if (jobs.length === 0) {
        selectors.jobsGrid.innerHTML = '<p class="text-slate-500 text-center col-span-full">No jobs available at this time.</p>';
        return;
      }
      
      // Sort by location relevance
      const sortedJobs = sortByLocationRelevance(jobs, "location");
      const userCity = getUserCity();
      
      selectors.jobsGrid.innerHTML = sortedJobs.slice(0, 6).map(job => {
        const isLocal = userCity && job.location && job.location.toLowerCase().includes(userCity.toLowerCase());
        
        return `
          <article class="group flex h-full flex-col rounded-3xl border-2 border-slate-200/60 bg-white p-6 shadow-md transition-all hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/50">
            <div class="mb-4 flex items-start justify-between">
              <div class="flex-1">
                <h3 class="mb-2 text-lg font-bold leading-tight text-slate-900 dark:text-white">${job.title || "Job Opportunity"}</h3>
                <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">${job.description || ""}</p>
              </div>
              ${isLocal ? `
                <span class="ml-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                  <span class="material-symbols-outlined text-xs">near_me</span>
                </span>
              ` : ""}
            </div>
            <div class="mb-4 flex items-center gap-2 text-sm">
              <span class="material-symbols-outlined text-base text-slate-500 dark:text-slate-400">location_on</span>
              <span class="text-slate-600 dark:text-slate-400">${job.location || "Location not specified"}</span>
            </div>
            <div class="mb-4 flex items-center justify-between border-t border-slate-200/60 pt-4 dark:border-slate-700">
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Pay</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">${job.pay ? `₹${job.pay.toLocaleString("en-IN")}` : "Negotiable"}</p>
              </div>
              ${job.employer ? `
                <div class="text-right">
                  <p class="text-xs text-slate-500 dark:text-slate-400">Posted by</p>
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">${job.employer.name || "Employer"}</p>
                </div>
              ` : ""}
            </div>
            <button onclick="window.location.href='jobs.html'" class="w-full rounded-xl bg-gradient-to-r from-primary to-primary/90 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:from-primary/90 hover:to-primary/80 hover:shadow-primary/30">
              View All Jobs
            </button>
          </article>
        `;
      }).join("");
    } catch (error) {
      console.error("Error loading jobs:", error);
      selectors.jobsGrid.innerHTML = '<p class="text-slate-500 text-center col-span-full">Unable to load jobs. Please try again later.</p>';
    }
  }

  function renderTestimonials(list = state.testimonials) {
    if (!selectors.testimonialGrid) return;
    selectors.testimonialGrid.innerHTML = "";
    
    // Sort testimonials by location relevance
    const sortedList = sortByLocationRelevance([...list], "location");
    const userCity = getUserCity();
    
    sortedList.forEach(item => {
      const isLocal = userCity && item.location.toLowerCase().includes(userCity.toLowerCase());
      
      let locationBadge = '';
      if (isLocal) {
        locationBadge = `
          <div class="absolute -top-2 right-4">
            <span class="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              <span class="material-symbols-outlined text-xs">near_me</span>
              Local
            </span>
          </div>
        `;
      }
      
      const card = createCard(
        "article",
        `group relative flex h-full flex-col rounded-3xl border-2 ${isLocal ? 'border-primary/50 bg-primary/5' : 'border-slate-200/60 bg-white'} p-6 shadow-md transition-all hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/50`
      );
      
      // Generate star rating display
      const fullStars = Math.floor(item.rating);
      const hasHalfStar = item.rating % 1 !== 0;
      let starsHTML = '';
      for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span class="material-symbols-outlined text-amber-400 text-lg">star</span>';
      }
      if (hasHalfStar) {
        starsHTML += '<span class="material-symbols-outlined text-amber-400 text-lg">star_half</span>';
      }
      const emptyStars = 5 - Math.ceil(item.rating);
      for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span class="material-symbols-outlined text-slate-300 text-lg dark:text-slate-600">star</span>';
      }
      
      card.innerHTML = `
        ${locationBadge}
        <div class="mb-4 flex items-start justify-between">
          <div class="flex-1">
            <div class="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-lg font-bold text-primary ring-2 ring-primary/10 dark:from-primary/20 dark:to-primary/10">
              ${item.name.charAt(0)}
            </div>
            <h4 class="mt-2 text-lg font-bold text-slate-900 dark:text-white">${item.name}</h4>
            <p class="mt-1 flex items-center gap-1 text-xs ${isLocal ? 'text-primary font-semibold' : 'text-slate-500 dark:text-slate-400'}">
              <span class="material-symbols-outlined text-xs ${isLocal ? 'text-primary' : ''}">location_on</span>
              ${item.location}
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">${item.date}</p>
          </div>
        </div>
        <div class="mb-4 flex items-center gap-1">
          ${starsHTML}
          <span class="ml-2 text-sm font-bold text-slate-700 dark:text-slate-300">${item.rating.toFixed(1)}</span>
        </div>
        <div class="flex-1">
          <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">"${item.quote}"</p>
        </div>
      `;
      selectors.testimonialGrid.appendChild(card);
    });
  }

  function getUserCity() {
    const savedLocation = localStorage.getItem("userLocation") || "";
    if (!savedLocation) return null;
    
    // Common Indian cities to match
    const cities = [
      "Mumbai", "Pune", "Bengaluru", "Bangalore", "Delhi", "Noida", "Gurgaon",
      "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi",
      "Indore", "Nagpur", "Lucknow", "Chandigarh", "Bhopal", "Visakhapatnam"
    ];
    
    const locationLower = savedLocation.toLowerCase();
    for (const city of cities) {
      if (locationLower.includes(city.toLowerCase())) {
        return city;
      }
    }
    
    // Try to extract city from common patterns
    const patterns = [
      /(?:^|,|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:,|$)/g,
      /([A-Z][a-z]+)\s+(?:Mumbai|Pune|Bengaluru|Delhi|Hyderabad|Chennai|Kolkata)/i
    ];
    
    for (const pattern of patterns) {
      const match = savedLocation.match(pattern);
      if (match) {
        const city = match[1] || match[0];
        if (city && city.length > 2) {
          return city.trim();
        }
      }
    }
    
    return null;
  }

  function sortByLocationRelevance(items, locationKey = "location") {
    const userCity = getUserCity();
    if (!userCity) return items;
    
    const userCityLower = userCity.toLowerCase();
    
    return items.sort((a, b) => {
      const aLocation = (a[locationKey] || "").toLowerCase();
      const bLocation = (b[locationKey] || "").toLowerCase();
      
      const aMatches = aLocation.includes(userCityLower);
      const bMatches = bLocation.includes(userCityLower);
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }

  function handleSearch(term) {
    const query = term.trim().toLowerCase();
    if (!query) {
      renderServices(state.services);
      const sortedServices = sortByLocationRelevance([...state.featuredServices], "location");
      renderFeaturedServices(sortedServices);
      return;
    }
    const filteredServices = state.services.filter(service =>
      service.title.toLowerCase().includes(query) ||
      service.subtitle.toLowerCase().includes(query) ||
      (service.title + " " + service.subtitle).toLowerCase().includes(query)
    );
    const filteredFeaturedServices = state.featuredServices.filter(service =>
      service.title.toLowerCase().includes(query) ||
      service.location.toLowerCase().includes(query) ||
      service.eta.toLowerCase().includes(query)
    );
    renderServices(filteredServices);
    const sortedFilteredServices = sortByLocationRelevance(filteredFeaturedServices, "location");
    renderFeaturedServices(sortedFilteredServices);
  }

  function toggleMobileNav() {
    if (!selectors.mobileNav) return;
    selectors.mobileNav.classList.toggle("hidden");
  }

  function updateLocationUI(message, tone = "info") {
    if (!selectors.locationStatus) return;
    const toneClass = tone === "success" ? "text-emerald-500" : tone === "error" ? "text-rose-500" : "text-slate-500";
    selectors.locationStatus.className = `text-sm ${toneClass}`;
    selectors.locationStatus.textContent = message;
  }

  function isValidCoordinate(lat, lng) {
    // Validate coordinates are within valid ranges
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      !isNaN(lat) && 
      !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  function saveLocation(address, lat, lng) {
    localStorage.setItem("userLocation", address);
    localStorage.setItem("userLocationCoords", JSON.stringify({ lat, lng }));
    // Re-render location-based content
    setTimeout(() => {
      renderJobs();
      renderTestimonials();
    }, 100);
  }

  function setMapMarker(lat, lng, label) {
    if (!mapInstance || typeof L === "undefined") {
      console.warn("Map not initialized, cannot set marker");
      return;
    }
    try {
      if (mapMarker) {
        mapInstance.removeLayer(mapMarker);
      }
      mapMarker = L.marker([lat, lng]).addTo(mapInstance);
      if (label) {
        mapMarker.bindPopup(`<strong>${label}</strong>`).openPopup();
      }
    } catch (error) {
      console.error("Failed to set map marker:", error);
    }
  }

  async function reverseGeocode(lat, lng) {
    try {
      // Validate coordinates first
      if (!isValidCoordinate(lat, lng)) {
        updateLocationUI("Invalid coordinates. Please try again.", "error");
        return;
      }

      updateLocationUI("Fetching address…");
      
      // Add delay to respect Nominatim rate limits (1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try primary geocoding service
      let data = null;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
          {
            headers: {
              'User-Agent': 'SkillLink/1.0 (https://skilllink.com)',
              'Accept': 'application/json'
            }
          }
        );
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        data = await res.json();
      } catch (primaryError) {
        console.warn("Primary geocoding failed, trying alternative...", primaryError);
        // Fallback to alternative method - use coordinates directly
        const address = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (selectors.locationInput) {
          selectors.locationInput.value = address;
        }
        saveLocation(address, lat, lng);
        setMapMarker(lat, lng, address);
        updateLocationUI("Location saved. Please verify and edit address if needed.", "success");
        return;
      }
      
      if (data?.display_name) {
        // Try to extract a cleaner address
        const address = data.address || {};
        let cleanAddress = data.display_name;
        
        // Build cleaner address from components (prioritize local info)
        const addressParts = [];
        if (address.road) addressParts.push(address.road);
        if (address.suburb || address.neighbourhood) addressParts.push(address.suburb || address.neighbourhood);
        if (address.city || address.town || address.village) {
          addressParts.push(address.city || address.town || address.village);
        }
        if (address.state) addressParts.push(address.state);
        if (address.country && address.country !== "India") addressParts.push(address.country);
        
        if (addressParts.length > 0) {
          cleanAddress = addressParts.join(", ");
        }
        
        // For Indian addresses, prefer local format
        if (address.country === "India" || address.country_code === "in") {
          const localParts = [];
          if (address.road) localParts.push(address.road);
          if (address.suburb || address.neighbourhood) localParts.push(address.suburb || address.neighbourhood);
          if (address.city || address.town || address.village) {
            localParts.push(address.city || address.town || address.village);
          }
          if (address.state) localParts.push(address.state);
          if (localParts.length > 0) {
            cleanAddress = localParts.join(", ");
          }
        }
        
        if (selectors.locationInput) {
          selectors.locationInput.value = cleanAddress || data.display_name;
        }
        saveLocation(cleanAddress || data.display_name, lat, lng);
        setMapMarker(lat, lng, cleanAddress || data.display_name);
        updateLocationUI("Location saved! Verify address and edit if needed.", "success");
      } else {
        // Fallback: use coordinates
        const address = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (selectors.locationInput) {
          selectors.locationInput.value = address;
        }
        saveLocation(address, lat, lng);
        setMapMarker(lat, lng, address);
        updateLocationUI("Location saved. Please enter address manually for better accuracy.", "success");
      }
    } catch (error) {
      console.error("Reverse geocode failed", error);
      // Fallback: save coordinates
      const address = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      if (selectors.locationInput) {
        selectors.locationInput.value = address;
      }
      saveLocation(address, lat, lng);
      setMapMarker(lat, lng, address);
      
      // Provide more specific error messages
      if (error.message.includes("HTTP")) {
        updateLocationUI("Service temporarily unavailable. Coordinates saved. Please edit address manually.", "error");
      } else if (error.name === "TypeError" && error.message.includes("fetch")) {
        updateLocationUI("Network error. Coordinates saved. Please edit address manually.", "error");
      } else {
        updateLocationUI("Unable to fetch address. Coordinates saved. Please edit address manually.", "error");
      }
    }
  }

  function initMap() {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      console.warn("Map container not found");
      return;
    }

    // Wait for Leaflet to load
    function tryInitMap() {
      if (typeof L === "undefined") {
        console.warn("Leaflet not loaded yet, retrying...");
        setTimeout(tryInitMap, 100);
        return;
      }

      try {
        // Ensure container is visible
        if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
          console.warn("Map container not visible, waiting...");
          setTimeout(tryInitMap, 200);
          return;
        }

        const savedCoords = JSON.parse(localStorage.getItem("userLocationCoords") || "null");
        const defaultPosition = savedCoords ? [savedCoords.lat, savedCoords.lng] : [18.5204, 73.8567];
        const defaultZoom = savedCoords ? 14 : 12;

        // Initialize map
        mapInstance = L.map(mapContainer, {
          zoomControl: true,
          attributionControl: true
        }).setView(defaultPosition, defaultZoom);
        
        // Add tile layer with multiple fallbacks
        const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          errorTileUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        });

        tileLayer.addTo(mapInstance);

        // Fallback tile layer if primary fails
        tileLayer.on('tileerror', () => {
          console.warn("Primary tile layer failed, using backup");
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(mapInstance);
        });

        if (savedCoords && selectors.locationInput) {
          const savedAddress = localStorage.getItem("userLocation") || "Saved location";
          selectors.locationInput.value = savedAddress;
          setMapMarker(savedCoords.lat, savedCoords.lng, savedAddress);
          updateLocationUI("Using your saved address.", "success");
        }

        mapInstance.on("click", (event) => {
          const { lat, lng } = event.latlng;
          updateLocationUI("Fetching address for selected location…");
          reverseGeocode(lat, lng);
        });

        // Handle map load success
        mapInstance.whenReady(() => {
          console.log("Map loaded successfully");
          updateLocationUI("Map ready. Click to set location or use GPS.", "success");
        });

        window.skillLinkMap = mapInstance;
      } catch (error) {
        console.error("Map initialization failed:", error);
        updateLocationUI("Map failed to load. You can still enter address manually.", "error");
        // Show fallback message
        mapContainer.innerHTML = `
          <div class="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <div class="text-center p-6">
              <span class="material-symbols-outlined text-4xl text-gray-400 mb-2">map</span>
              <p class="text-sm text-gray-600">Map unavailable. Please enter your address manually.</p>
            </div>
          </div>
        `;
      }
    }

    // Start initialization
    tryInitMap();
  }

  function initLocationForm() {
    selectors.locationForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const address = selectors.locationInput?.value.trim();
      if (!address) {
        updateLocationUI("Please enter an address first.", "error");
        return;
      }
      saveLocation(address, null, null);
      updateLocationUI("Address saved. Drop a pin for precise ETA.", "success");
    });

    selectors.locateMeBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      
      if (!navigator.geolocation) {
        updateLocationUI("GPS not supported in this browser. Please enter address manually.", "error");
        return;
      }
      
      updateLocationUI("Locating you… Please allow location access and wait for accurate position.");
      
      // Initialize map if not already done
      if (!mapInstance && document.getElementById("map")) {
        initMap();
        // Wait a bit for map to initialize
        setTimeout(() => {
          requestGPSLocation();
        }, 500);
      } else {
        requestGPSLocation();
      }
    });

    function requestGPSLocation() {
      let watchId = null;
      let attempts = 0;
      const maxAttempts = 3;

      // Use watchPosition for better accuracy, then clear after getting good position
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          attempts++;
          const { latitude, longitude, accuracy } = position.coords;
          
          // Validate coordinates
          if (!isValidCoordinate(latitude, longitude)) {
            updateLocationUI("Invalid GPS coordinates received. Please try again.", "error");
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            return;
          }

          // Check accuracy - if accuracy is poor, wait for better reading
          if (accuracy > 100 && attempts < maxAttempts) {
            updateLocationUI(`Getting more accurate location… (Accuracy: ${Math.round(accuracy)}m)`, "info");
            return;
          }

          // Clear watch once we have a good position
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
          }

          updateLocationUI(`Location found! (Accuracy: ${Math.round(accuracy)}m) Fetching address…`);
          
          // Center map on location
          if (mapInstance) {
            mapInstance.setView([latitude, longitude], Math.max(15, Math.min(18, Math.round(15 - Math.log10(accuracy)))));
            setMapMarker(latitude, longitude, "Your location");
          }
          
          // Reverse geocode with better error handling
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
          }
          
          let errorMessage = "Could not access GPS location.";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location permissions in your browser settings or enter address manually.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable. Please check your GPS settings or enter address manually.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again or enter address manually.";
              break;
          }
          updateLocationUI(errorMessage, "error");
        },
        { 
          enableHighAccuracy: true, 
          timeout: 20000,
          maximumAge: 0 // Don't use cached position, get fresh one
        }
      );

      // Fallback timeout
      setTimeout(() => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          if (attempts === 0) {
            updateLocationUI("GPS timeout. Please try again or enter address manually.", "error");
          }
        }
      }, 25000);
    }
  }

  function initCtaButtons() {
    document.querySelectorAll('[data-action="primary-cta"]').forEach(btn => {
      btn.addEventListener("click", () => {
        if (typeof getToken === "function" && getToken()) {
          window.location.href = "jobs.html";
        } else {
          window.location.href = "login.html";
        }
      });
    });
  }

  function initProfileMenu() {
    const profileMenu = document.getElementById("profile-menu");
    const profileButton = document.getElementById("profile-button");
    const profileDropdown = document.getElementById("profile-dropdown");
    const loginLink = document.getElementById("login-link");
    
    if (!profileMenu || !profileButton || !profileDropdown) return;
    
    // Check if user is logged in
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const token = localStorage.getItem("token");
      
      if (user && token) {
        // User is logged in - show profile menu
        profileMenu.classList.remove("hidden");
        if (loginLink) loginLink.classList.add("hidden");
        
        // Set user info
        const firstName = user.firstName || "";
        const lastName = user.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim() || user.userName || "User";
        const email = user.email || "";
        const role = user.role || "";
        const avatarUrl = user.avatarUrl || "";
        
        // Set profile name
        const profileName = document.getElementById("profile-name");
        if (profileName) {
          profileName.textContent = fullName;
        }
        
        // Set dropdown info
        const dropdownName = document.getElementById("dropdown-name");
        const dropdownEmail = document.getElementById("dropdown-email");
        const dropdownRole = document.getElementById("dropdown-role");
        
        if (dropdownName) dropdownName.textContent = fullName;
        if (dropdownEmail) dropdownEmail.textContent = email;
        if (dropdownRole) {
          dropdownRole.textContent = role === "worker" ? "Worker" : role === "employer" ? "Employer" : "User";
        }
        
        // Set avatar/initials
        const profileAvatar = document.getElementById("profile-avatar");
        const profileInitials = document.getElementById("profile-initials");
        
        if (avatarUrl) {
          profileAvatar.style.backgroundImage = `url(${avatarUrl})`;
          profileAvatar.style.backgroundSize = "cover";
          profileAvatar.style.backgroundPosition = "center";
          if (profileInitials) profileInitials.textContent = "";
        } else {
          const initials = fullName
            .split(" ")
            .map(n => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "U";
          if (profileInitials) profileInitials.textContent = initials;
          profileAvatar.style.backgroundImage = "";
        }
        
        // Set dashboard link based on role
        const dashboardLink = document.getElementById("profile-dashboard-link");
        if (dashboardLink) {
          if (role === "worker") {
            dashboardLink.href = "worker-dashboard.html";
          } else if (role === "employer") {
            dashboardLink.href = "employer-dashboard.html";
          } else {
            dashboardLink.href = "dashboard.html";
          }
        }
        
        // Toggle dropdown on click
        profileButton.addEventListener("click", (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle("hidden");
        });
        
        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
          if (!profileMenu.contains(e.target)) {
            profileDropdown.classList.add("hidden");
          }
        });
      } else {
        // User not logged in - hide profile menu, show login link
        profileMenu.classList.add("hidden");
        if (loginLink) loginLink.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error initializing profile menu:", error);
      profileMenu.classList.add("hidden");
      if (loginLink) loginLink.classList.remove("hidden");
    }
  }

  async function loadLiveStats() {
    // Get elements directly instead of relying on selectors object
    const statsHomesServiced = document.getElementById("stats-homes-serviced");
    const statsPlumbing = document.getElementById("stats-plumbing");
    const statsCleaning = document.getElementById("stats-cleaning");
    const statsElectrician = document.getElementById("stats-electrician");
    
    if (!statsHomesServiced || !statsPlumbing || !statsCleaning || !statsElectrician) {
      console.warn("⚠️ Stats elements not found. Retrying in 1 second...");
      console.log("Looking for elements:", {
        homes: !!statsHomesServiced,
        plumbing: !!statsPlumbing,
        cleaning: !!statsCleaning,
        electrician: !!statsElectrician
      });
      setTimeout(loadLiveStats, 1000);
      return;
    }
    
    console.log("🔄 Loading live stats from backend...");
    
    // Show loading state
    if (statsHomesServiced && statsHomesServiced.innerHTML.includes("animate-pulse")) {
      // Already showing loading, continue
    }
    
    try {
      // Try multiple API base URLs
      const apiBases = [
        "http://localhost:3000/api",
        "http://localhost:3000/api",
        "http://127.0.0.1:3000/api",
        "http://127.0.0.1:3000/api"
      ];
      
      let stats = null;
      let lastError = null;
      let successfulUrl = null;
      
      // Try each API base URL until one works
      for (const apiBase of apiBases) {
        try {
          console.log(`🔍 Trying ${apiBase}/stats...`);
          const response = await fetch(`${apiBase}/stats`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-cache",
            mode: "cors",
          });
          
          console.log(`📡 Response from ${apiBase}:`, response.status, response.statusText);
          
          if (response.ok) {
            const data = await response.json();
            console.log("📊 Stats data received:", data);
            
            if (data.success && data.stats) {
              stats = data.stats;
              successfulUrl = apiBase;
              console.log("✅ Stats loaded successfully from", apiBase);
              break; // Success, exit loop
            } else {
              console.warn("⚠️ Invalid stats data format:", data);
            }
          } else {
            console.warn(`⚠️ HTTP ${response.status} from ${apiBase}/stats`);
          }
        } catch (error) {
          lastError = error;
          console.warn(`❌ Failed to fetch stats from ${apiBase}:`, error.message);
          continue; // Try next URL
        }
      }
      
      if (!stats) {
        throw lastError || new Error("Failed to fetch stats from all endpoints. Make sure the backend server is running.");
      }
      
      // Update homes serviced with fade-in animation
      const formatted = stats.homesServicedThisMonth.toLocaleString("en-IN");
      statsHomesServiced.innerHTML = `${formatted}+`; // Replace loading placeholder
      statsHomesServiced.style.opacity = "0";
      setTimeout(() => {
        statsHomesServiced.style.transition = "opacity 0.5s ease-in-out";
        statsHomesServiced.style.opacity = "1";
      }, 10);
      
      // Update plumbing ETA with fade-in animation
      statsPlumbing.innerHTML = ""; // Clear loading placeholder
      statsPlumbing.textContent = stats.plumbingAvgETA;
      statsPlumbing.style.opacity = "0";
      setTimeout(() => {
        statsPlumbing.style.transition = "opacity 0.5s ease-in-out";
        statsPlumbing.style.opacity = "1";
      }, 10);
      
      // Update cleaning slots with fade-in animation
      statsCleaning.innerHTML = ""; // Clear loading placeholder
      statsCleaning.textContent = stats.cleaningSlotsToday;
      statsCleaning.style.opacity = "0";
      setTimeout(() => {
        statsCleaning.style.transition = "opacity 0.5s ease-in-out";
        statsCleaning.style.opacity = "1";
      }, 10);
      
      // Update electrician dispatch with fade-in animation
      statsElectrician.innerHTML = ""; // Clear loading placeholder
      statsElectrician.textContent = stats.electricianDispatchTime;
      statsElectrician.style.opacity = "0";
      setTimeout(() => {
        statsElectrician.style.transition = "opacity 0.5s ease-in-out";
        statsElectrician.style.opacity = "1";
      }, 10);
      
      console.log("✅ Stats updated successfully!");
      console.log("📊 Current stats:", stats);
      
      // Auto-refresh stats every 30 seconds
      setTimeout(loadLiveStats, 30000);
      
    } catch (error) {
      console.error("❌ Error loading live stats:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Show fallback/default values on error ONLY if still showing loading state
      console.warn("⚠️ Using fallback/default stats values after API failure");
      
      // Only set defaults if elements are still showing loading placeholders
      if (statsHomesServiced) {
        const currentContent = statsHomesServiced.innerHTML || statsHomesServiced.textContent || "";
        if (currentContent.includes("animate-pulse") || currentContent.trim() === "" || currentContent === "2,870+") {
          console.log("Setting default homes serviced: 2,870+");
          statsHomesServiced.innerHTML = "2,870+";
          statsHomesServiced.style.opacity = "1";
        }
      }
      
      if (statsPlumbing) {
        const currentContent = statsPlumbing.innerHTML || statsPlumbing.textContent || "";
        if (currentContent.includes("animate-pulse") || currentContent.trim() === "" || currentContent === "38 min avg ETA") {
          console.log("Setting default plumbing: 38 min avg ETA");
          statsPlumbing.textContent = "38 min avg ETA";
          statsPlumbing.style.opacity = "1";
        }
      }
      
      if (statsCleaning) {
        const currentContent = statsCleaning.innerHTML || statsCleaning.textContent || "";
        if (currentContent.includes("animate-pulse") || currentContent.trim() === "" || currentContent === "6 open today") {
          console.log("Setting default cleaning: 6 open today");
          statsCleaning.textContent = "6 open today";
          statsCleaning.style.opacity = "1";
        }
      }
      
      if (statsElectrician) {
        const currentContent = statsElectrician.innerHTML || statsElectrician.textContent || "";
        if (currentContent.includes("animate-pulse") || currentContent.trim() === "" || currentContent === "Under 60 min") {
          console.log("Setting default electrician: Under 60 min");
          statsElectrician.textContent = "Under 60 min";
          statsElectrician.style.opacity = "1";
        }
      }
      
      console.log("ℹ️ Retrying stats fetch in 10 seconds...");
      console.log("💡 Make sure backend is running: cd Final/backend && npm start");
      // Retry after 10 seconds on error
      setTimeout(loadLiveStats, 10000);
    }
  }
  
  // Test function to check backend connectivity
  window.testStatsEndpoint = async function() {
    console.log("🧪 Testing stats endpoint...");
    const apiBases = [
      "http://localhost:3000/api",
      "http://localhost:3000/api",
      "http://127.0.0.1:3000/api",
      "http://127.0.0.1:3000/api"
    ];
    
    for (const apiBase of apiBases) {
      try {
        console.log(`Testing ${apiBase}/stats...`);
        const response = await fetch(`${apiBase}/stats`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-cache"
        });
        const data = await response.json();
        console.log(`✅ Success! Response from ${apiBase}:`, data);
        return data;
      } catch (error) {
        console.error(`❌ Failed ${apiBase}:`, error.message);
      }
    }
    console.error("❌ All endpoints failed. Is the backend server running?");
    return null;
  };

  function init() {
    renderConstructionWorkers();
    renderServices();
    // Featured services and testimonials will be sorted by location in their render functions
    renderFeaturedServices();
    renderTestimonials();
    renderJobs();
    initMap();
    initLocationForm();
    initCtaButtons();
    initProfileMenu(); // Initialize profile menu
    
    // Initialize Socket.IO for real-time stats updates
    initSocketIO();
    
    // Load live stats after a short delay to ensure DOM is ready
    setTimeout(() => {
      console.log("🚀 Initializing live stats...");
      loadLiveStats(); // Load live stats immediately - don't set defaults first
    }, 500);
    
    // Re-render location-based content when location is saved
    const locationForm = document.getElementById("location-form");
    if (locationForm) {
      const originalSubmit = locationForm.onsubmit;
      locationForm.addEventListener("submit", (e) => {
        setTimeout(() => {
          renderFeaturedServices();
          renderTestimonials();
        }, 500);
      });
    }


    selectors.mobileToggle?.addEventListener("click", toggleMobileNav);
  }

  document.addEventListener("DOMContentLoaded", init);
  
  // Expose loadLiveStats globally for manual refresh/testing
  window.loadLiveStats = loadLiveStats;
  
  // Expose initProfileMenu globally
  window.initProfileMenu = initProfileMenu;
  
  return { state, loadLiveStats, initProfileMenu };
})();

window.SkillLinkHome = SkillLinkHome;

