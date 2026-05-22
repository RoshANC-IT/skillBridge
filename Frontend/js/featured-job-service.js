const API_BASE = "http://localhost:3000/api";

// Get service slug from URL (featured job slug)
const serviceSlug = new URLSearchParams(window.location.search).get("slug") ||
  window.location.pathname.split("/").pop().replace(/\.html$/, "").replace(/^featured-job-service$/, "");

// Map featured job slugs to base service slugs used by APIs, booking pages and `service-page.js`
// This fixes mismatches where featured cards were pointing to non‑existing or wrong service pages
const slugMapping = {
  "kitchen-deep-clean": "home-cleaning",
  "bathroom-waterproofing": "plumbing",
  "ac-gas-refill-service": "appliance-repair",
  "modular-wardrobe-fix": "carpenter",
  "full-home-painting": "painting",
  "smart-door-lock-install": "electrical-work",
  "mason-wall-construction": "mason",
  "carpenter-custom-furniture": "carpenter",
  "electrician-new-wiring": "electrician",
  "plumber-pipeline-work": "plumber",
  "welder-gate-installation": "welder"
};

// This is the slug that actually has a config in `service-page.js` and booking HTML files
const baseServiceSlug = slugMapping[serviceSlug] || serviceSlug;

// Service configuration with packages and metadata
const serviceConfig = {
  "kitchen-deep-clean": {
    title: "Kitchen Deep Clean",
    subtitle: "Professional deep cleaning service for your kitchen. Sanitization, appliance cleaning, and thorough maintenance.",
    icon: "cleaning_services",
    imageIcon: "cleaning_services",
    rating: 4.95,
    reviews: 182,
    eta: "Available today",
    packages: [
      {
        name: "Standard Clean",
        price: 1499,
        originalPrice: 1999,
        duration: "2-3 hours",
        features: ["Deep cleaning", "Appliance cleaning", "Sanitization", "Trash removal", "1-month warranty"],
        popular: true
      },
      {
        name: "Premium Clean",
        price: 2499,
        originalPrice: 3299,
        duration: "4-5 hours",
        features: ["Everything in Standard", "Inside cabinets", "Oven deep clean", "Refrigerator cleaning", "3-month warranty"],
        popular: false
      }
    ]
  },
  "bathroom-waterproofing": {
    title: "Bathroom Waterproofing",
    subtitle: "Expert waterproofing solutions to protect your bathroom from leaks and water damage.",
    icon: "water_drop",
    imageIcon: "plumbing",
    rating: 4.87,
    reviews: 143,
    eta: "Slots tomorrow",
    packages: [
      {
        name: "Basic Waterproofing",
        price: 6299,
        originalPrice: 7999,
        duration: "1-2 days",
        features: ["Waterproof coating", "Leak sealing", "Tile protection", "5-year warranty", "Free inspection"],
        popular: true
      },
      {
        name: "Complete Waterproofing",
        price: 9999,
        originalPrice: 12999,
        duration: "2-3 days",
        features: ["Everything in Basic", "Wall waterproofing", "Floor treatment", "10-year warranty", "Free maintenance"],
        popular: false
      }
    ]
  },
  "ac-gas-refill-service": {
    title: "AC Gas Refill + Service",
    subtitle: "Complete AC service including gas refill, cleaning, and maintenance for optimal performance.",
    icon: "ac_unit",
    imageIcon: "build",
    rating: 4.92,
    reviews: 201,
    eta: "Within 2 hrs",
    packages: [
      {
        name: "AC Service",
        price: 2099,
        originalPrice: 2799,
        duration: "1-2 hours",
        features: ["Gas refill", "Filter cleaning", "Coil cleaning", "General maintenance", "3-month warranty"],
        popular: true
      },
      {
        name: "AC Service + Repair",
        price: 3499,
        originalPrice: 4499,
        duration: "2-3 hours",
        features: ["Everything in Service", "Part replacement", "Full diagnosis", "6-month warranty", "Free follow-up"],
        popular: false
      }
    ]
  },
  "modular-wardrobe-fix": {
    title: "Modular Wardrobe Fix",
    subtitle: "Expert repair and fixing services for modular wardrobes and furniture.",
    icon: "chair",
    imageIcon: "chair",
    rating: 4.75,
    reviews: 88,
    eta: "3 slots open",
    packages: [
      {
        name: "Basic Repair",
        price: 899,
        originalPrice: 1299,
        duration: "1-2 hours",
        features: ["Hinge fixing", "Door alignment", "Drawer repair", "1-month warranty", "Free consultation"],
        popular: true
      },
      {
        name: "Complete Fix",
        price: 1999,
        originalPrice: 2799,
        duration: "3-4 hours",
        features: ["Everything in Basic", "Full refurbishment", "Hardware replacement", "3-month warranty", "Free maintenance"],
        popular: false
      }
    ]
  },
  "full-home-painting": {
    title: "Full Home Painting",
    subtitle: "Complete home painting service with premium paints and professional finish.",
    icon: "format_paint",
    imageIcon: "format_paint",
    rating: 4.9,
    reviews: 96,
    eta: "Free visit",
    packages: [
      {
        name: "Standard Painting",
        price: 15,
        unit: "per sq.ft",
        originalPrice: 20,
        duration: "3-5 days",
        features: ["Wall preparation", "Primer coat", "2 paint coats", "Cleanup", "1-year warranty"],
        popular: true
      },
      {
        name: "Premium Painting",
        price: 22,
        unit: "per sq.ft",
        originalPrice: 30,
        duration: "5-7 days",
        features: ["Everything in Standard", "Premium paint", "Texture finish", "2-year warranty", "Free touch-up"],
        popular: false
      }
    ]
  },
  "smart-door-lock-install": {
    title: "Smart Door Lock Install",
    subtitle: "Professional installation of smart door locks with app setup and training.",
    icon: "lock",
    imageIcon: "lock",
    rating: 4.81,
    reviews: 57,
    eta: "Same day",
    packages: [
      {
        name: "Installation Only",
        price: 2499,
        originalPrice: 3299,
        duration: "1-2 hours",
        features: ["Lock installation", "App setup", "User training", "1-year warranty", "Free support"],
        popular: true
      },
      {
        name: "Installation + Lock",
        price: 8999,
        originalPrice: 11999,
        duration: "2-3 hours",
        features: ["Premium smart lock", "Installation", "App setup", "2-year warranty", "Free maintenance"],
        popular: false
      }
    ]
  },
  "mason-wall-construction": {
    title: "Mason for Wall Construction",
    subtitle: "Certified masons for brickwork, wall construction, and masonry services.",
    icon: "handyman",
    imageIcon: "handyman",
    rating: 4.88,
    reviews: 156,
    eta: "Available now",
    packages: [
      {
        name: "Daily Rate",
        price: 1200,
        unit: "per day",
        originalPrice: 1500,
        duration: "Full day",
        features: ["Skilled mason", "All tools", "Material guidance", "Quality work", "Verified"],
        popular: true
      }
    ]
  },
  "carpenter-custom-furniture": {
    title: "Carpenter for Custom Furniture",
    subtitle: "Expert carpenters for custom furniture, repairs, and woodwork.",
    icon: "chair",
    imageIcon: "chair",
    rating: 4.82,
    reviews: 134,
    eta: "2 slots today",
    packages: [
      {
        name: "Daily Rate",
        price: 1800,
        unit: "per day",
        originalPrice: 2200,
        duration: "Full day",
        features: ["Expert carpenter", "All tools", "Custom work", "Quality finish", "Verified"],
        popular: true
      }
    ]
  },
  "electrician-new-wiring": {
    title: "Electrician for New Wiring",
    subtitle: "Licensed electricians for new wiring, installations, and electrical work.",
    icon: "electrical_services",
    imageIcon: "bolt",
    rating: 4.91,
    reviews: 198,
    eta: "Same day",
    packages: [
      {
        name: "Daily Rate",
        price: 1500,
        unit: "per day",
        originalPrice: 1800,
        duration: "Full day",
        features: ["Licensed electrician", "Safety certified", "All tools", "Quality work", "Verified"],
        popular: true
      }
    ]
  },
  "plumber-pipeline-work": {
    title: "Plumber for Pipeline Work",
    subtitle: "Expert plumbers for pipeline installation, repair, and maintenance.",
    icon: "plumbing",
    imageIcon: "plumbing",
    rating: 4.85,
    reviews: 172,
    eta: "Within 3 hrs",
    packages: [
      {
        name: "Daily Rate",
        price: 1350,
        unit: "per day",
        originalPrice: 1650,
        duration: "Full day",
        features: ["Expert plumber", "All tools", "Quality work", "Warranty", "Verified"],
        popular: true
      }
    ]
  },
  "welder-gate-installation": {
    title: "Welder for Gate Installation",
    subtitle: "Professional welders for gate installation, metal work, and fabrication.",
    icon: "hardware",
    imageIcon: "hardware",
    rating: 4.79,
    reviews: 109,
    eta: "Tomorrow",
    packages: [
      {
        name: "Daily Rate",
        price: 1600,
        unit: "per day",
        originalPrice: 2000,
        duration: "Full day",
        features: ["Expert welder", "All equipment", "Metal fabrication", "Quality work", "Verified"],
        popular: true
      }
    ]
  }
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getToken() {
  return localStorage.getItem("token");
}

function renderService() {
  const config = serviceConfig[serviceSlug];
  if (!config) {
    document.body.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-page">
        <div class="text-center">
          <h1 class="text-3xl font-bold mb-4">Service Not Found</h1>
          <a href="index.html" class="text-primary font-semibold">Back to Home</a>
        </div>
      </div>
    `;
    return;
  }

  // Update page title
  document.getElementById("pageTitle").textContent = `${config.title} · Skill Bridge`;

  // Update hero section
  document.getElementById("serviceIcon").textContent = config.icon;
  document.getElementById("serviceTitle").textContent = config.title;
  document.getElementById("serviceSubtitle").textContent = config.subtitle;
  document.getElementById("serviceRating").textContent = config.rating;
  document.getElementById("serviceReviews").textContent = config.reviews;
  document.getElementById("serviceEta").textContent = config.eta;
  document.getElementById("serviceImageIcon").textContent = config.imageIcon;

  // Render packages
  renderPackages(config.packages);

  // Load professionals (use base service slug for backend API)
  loadProfessionals();

  // Setup booking buttons
  setupBookingButtons();
}

function renderPackages(packages) {
  const container = document.getElementById("packagesContainer");
  container.innerHTML = packages.map((pkg, index) => {
    const discount = pkg.originalPrice ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100) : 0;
    const priceDisplay = pkg.unit
      ? `${currencyFormatter.format(pkg.price)}/${pkg.unit}`
      : currencyFormatter.format(pkg.price);

    return `
      <div class="bg-white rounded-2xl border-2 ${pkg.popular ? 'border-primary shadow-xl' : 'border-gray-100'} p-6 hover:shadow-lg transition-all relative ${pkg.popular ? 'lg:scale-105' : ''}">
        ${pkg.popular ? `
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
            MOST POPULAR
          </div>
        ` : ''}
        <div class="mb-4">
          <h3 class="text-2xl font-bold mb-2">${pkg.name}</h3>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-primary">${priceDisplay}</span>
            ${pkg.originalPrice ? `
              <span class="text-lg text-ink-muted line-through">${currencyFormatter.format(pkg.originalPrice)}</span>
              <span class="text-sm font-semibold text-emerald-600">${discount}% OFF</span>
            ` : ''}
          </div>
          <p class="text-sm text-ink-muted mt-1">Duration: ${pkg.duration}</p>
        </div>
        <ul class="space-y-3 mb-6">
          ${pkg.features.map(feature => `
            <li class="flex items-start gap-2">
              <span class="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
              <span class="text-sm text-ink-muted">${feature}</span>
            </li>
          `).join('')}
        </ul>
        <button 
          onclick="bookPackage('${serviceSlug}', ${index})"
          class="w-full py-3 rounded-xl font-bold transition-all ${pkg.popular
        ? 'bg-primary text-white hover:bg-primary-dark shadow-lg'
        : 'bg-gray-100 text-primary hover:bg-gray-200'
      }"
        >
          ${pkg.popular ? 'Book Now' : 'Select Package'}
        </button>
      </div>
    `;
  }).join('');
}

async function loadProfessionals() {
  try {
    // API is keyed by base service slug (e.g. home-cleaning, plumbing, electrician)
    const res = await fetch(`${API_BASE}/services/job/${baseServiceSlug}`);
    if (res.ok) {
      const data = await res.json();
      renderProfessionals(data.workers || []);
    } else {
      renderProfessionals([]);
    }
  } catch (error) {
    console.error("Error loading professionals:", error);
    renderProfessionals([]);
  }
}

function renderProfessionals(workers) {
  const container = document.getElementById("professionalsContainer");
  if (!workers.length) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-ink-muted">No professionals available at the moment. Check back soon!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = workers.slice(0, 4).map(worker => `
    <div class="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition text-center">
      <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
        ${worker.name.charAt(0)}
      </div>
      <h3 class="font-semibold mb-1">${worker.name}</h3>
      <p class="text-xs text-ink-muted mb-3">@${worker.userName}</p>
      <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold ${worker.availability === 'available'
      ? 'bg-emerald-50 text-emerald-600'
      : 'bg-amber-50 text-amber-600'
    }">
        ${worker.availability}
      </span>
    </div>
  `).join('');
}

function setupBookingButtons() {
  document.getElementById("bookNowBtn")?.addEventListener("click", () => {
    const token = getToken();
    if (token) {
      // Send user to the dynamic service page using the base service slug
      window.location.href = `service-page.html?slug=${baseServiceSlug}`;
    } else {
      window.location.href = `login.html?redirect=${encodeURIComponent(`service-page.html?slug=${baseServiceSlug}`)}`;
    }
  });

  document.getElementById("ctaBookBtn")?.addEventListener("click", () => {
    const token = getToken();
    if (token) {
      window.location.href = `service-page.html?slug=${baseServiceSlug}`;
    } else {
      window.location.href = `login.html?redirect=${encodeURIComponent(`service-page.html?slug=${baseServiceSlug}`)}`;
    }
  });
}

window.bookPackage = function (serviceSlug, packageIndex) {
  const token = getToken();
  const config = serviceConfig[serviceSlug];
  const selectedPackage = config.packages[packageIndex];

  // Persist the base service slug so the booking page knows which core service to use
  localStorage.setItem("selectedService", baseServiceSlug);
  localStorage.setItem("selectedPackage", JSON.stringify(selectedPackage));

  if (token) {
    // Booking HTML files follow the base service slug naming convention
    window.location.href = `${baseServiceSlug}-booking.html`;
  } else {
    window.location.href = `login.html?redirect=${encodeURIComponent(`${baseServiceSlug}-booking.html`)}`;
  }
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", renderService);
