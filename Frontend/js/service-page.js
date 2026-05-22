const API_BASE = "http://localhost:3000/api";

// Get service slug from URL
const serviceSlug = new URLSearchParams(window.location.search).get("slug") || 
                     window.location.pathname.split("/").pop().replace(".html", "").replace("service-page", "");

// Service configuration data
const serviceConfig = {
  "home-cleaning": {
    title: "Deep Home Cleaning",
    subtitle: "Professional cleaning services for your home. Sanitization, deep cleaning, and regular maintenance.",
    icon: "cleaning_services",
    category: "Home Services",
    rating: 4.9,
    reviews: 182,
    imageIcon: "cleaning_services",
    packages: [
      {
        name: "Basic Cleaning",
        price: 1299,
        originalPrice: 1699,
        duration: "2-3 hours",
        features: ["Dusting & vacuuming", "Mopping floors", "Bathroom cleaning", "Kitchen cleaning", "Trash removal"],
        popular: false
      },
      {
        name: "Deep Cleaning",
        price: 2499,
        originalPrice: 3299,
        duration: "4-5 hours",
        features: ["Everything in Basic", "Inside appliances", "Window cleaning", "Baseboard cleaning", "Deep sanitization"],
        popular: true
      },
      {
        name: "Move-In/Out",
        price: 3999,
        originalPrice: 4999,
        duration: "6-8 hours",
        features: ["Everything in Deep", "Inside cabinets", "Wall cleaning", "Light fixtures", "Complete sanitization"],
        popular: false
      }
    ]
  },
  "appliance-repair": {
    title: "Appliance Repair",
    subtitle: "Expert repair services for AC, fridge, washing machine, and all home appliances.",
    icon: "construction",
    category: "Repairs",
    rating: 4.8,
    reviews: 143,
    imageIcon: "build",
    packages: [
      {
        name: "AC Service",
        price: 499,
        originalPrice: 699,
        duration: "1-2 hours",
        features: ["Gas refill", "Filter cleaning", "Coil cleaning", "General maintenance", "3-month warranty"],
        popular: true
      },
      {
        name: "Fridge Repair",
        price: 599,
        originalPrice: 799,
        duration: "1-2 hours",
        features: ["Diagnosis", "Part replacement", "Gas refill", "Cleaning", "1-month warranty"],
        popular: false
      },
      {
        name: "Washing Machine",
        price: 549,
        originalPrice: 749,
        duration: "1-2 hours",
        features: ["Full service", "Drum cleaning", "Motor check", "Drain cleaning", "1-month warranty"],
        popular: false
      }
    ]
  },
  "electrical-work": {
    title: "Electrical Fixes",
    subtitle: "Licensed electricians for wiring, installations, and electrical repairs.",
    icon: "electrical_services",
    category: "Electrical",
    rating: 4.7,
    reviews: 201,
    imageIcon: "bolt",
    packages: [
      {
        name: "Basic Electrical",
        price: 249,
        originalPrice: 349,
        duration: "1 hour",
        features: ["Fan repair", "Switch fixing", "Bulb installation", "Basic wiring", "Safety check"],
        popular: true
      },
      {
        name: "Wiring & Installation",
        price: 1999,
        originalPrice: 2499,
        duration: "3-4 hours",
        features: ["New wiring", "Panel installation", "Safety compliance", "Testing", "1-year warranty"],
        popular: false
      },
      {
        name: "Smart Home Setup",
        price: 2999,
        originalPrice: 3999,
        duration: "4-6 hours",
        features: ["Smart switches", "Home automation", "App setup", "Training", "1-year warranty"],
        popular: false
      }
    ]
  },
  "plumbing": {
    title: "Plumbing Rescue",
    subtitle: "Expert plumbers for leaks, blockages, and all plumbing needs.",
    icon: "plumbing",
    category: "Plumbing",
    rating: 4.9,
    reviews: 168,
    imageIcon: "plumbing",
    packages: [
      {
        name: "Leak Repair",
        price: 349,
        originalPrice: 499,
        duration: "1-2 hours",
        features: ["Leak detection", "Pipe repair", "Fixture fixing", "Water testing", "1-month warranty"],
        popular: true
      },
      {
        name: "Blockage Removal",
        price: 449,
        originalPrice: 599,
        duration: "1-2 hours",
        features: ["Drain cleaning", "Pipe unclogging", "Jetting", "Sanitization", "1-month warranty"],
        popular: false
      },
      {
        name: "Full Plumbing",
        price: 1999,
        originalPrice: 2499,
        duration: "4-6 hours",
        features: ["Complete check", "All repairs", "Fixture installation", "Water pressure check", "3-month warranty"],
        popular: false
      }
    ]
  },
  "painting": {
    title: "Premium Painting",
    subtitle: "Professional painting services with 3D previews and color testing.",
    icon: "format_paint",
    category: "Painting",
    rating: 4.8,
    reviews: 96,
    imageIcon: "format_paint",
    packages: [
      {
        name: "Single Room",
        price: 15,
        unit: "per sq.ft",
        originalPrice: 20,
        duration: "1-2 days",
        features: ["Wall preparation", "Primer coat", "2 paint coats", "Cleanup", "1-year warranty"],
        popular: true
      },
      {
        name: "Full Home",
        price: 12,
        unit: "per sq.ft",
        originalPrice: 18,
        duration: "3-5 days",
        features: ["All rooms", "Ceiling painting", "Trim work", "Color consultation", "2-year warranty"],
        popular: false
      },
      {
        name: "Exterior Painting",
        price: 18,
        unit: "per sq.ft",
        originalPrice: 25,
        duration: "4-6 days",
        features: ["Weatherproof paint", "Surface prep", "Scaffolding", "Protection", "3-year warranty"],
        popular: false
      }
    ]
  },
  "pest-control": {
    title: "Pest Control",
    subtitle: "Herbal, odorless, and safe pest control solutions for your home.",
    icon: "pest_control",
    category: "Pest Control",
    rating: 4.9,
    reviews: 122,
    imageIcon: "pest_control",
    packages: [
      {
        name: "Basic Treatment",
        price: 799,
        originalPrice: 999,
        duration: "1-2 hours",
        features: ["Spray treatment", "Herbal solution", "Odorless", "Safe for pets", "3-month warranty"],
        popular: true
      },
      {
        name: "Deep Treatment",
        price: 1499,
        originalPrice: 1999,
        duration: "2-3 hours",
        features: ["Complete treatment", "Nest removal", "Prevention", "Follow-up visit", "6-month warranty"],
        popular: false
      },
      {
        name: "Annual Package",
        price: 4999,
        originalPrice: 6999,
        duration: "4 visits/year",
        features: ["Quarterly visits", "Complete protection", "Priority service", "Free consultation", "1-year warranty"],
        popular: false
      }
    ]
  },
  "mason": {
    title: "Professional Masons",
    subtitle: "Certified masons for brickwork, tiles, and flooring.",
    icon: "handyman",
    category: "Construction",
    rating: 4.8,
    reviews: 156,
    imageIcon: "handyman",
    packages: [
      {
        name: "Daily Rate",
        price: 350,
        unit: "per day",
        originalPrice: 450,
        duration: "Full day",
        features: ["Skilled mason", "All tools", "Material guidance", "Quality work", "Verified"],
        popular: true
      }
    ]
  },
  "carpenter": {
    title: "Expert Carpenters",
    subtitle: "Professional carpenters for furniture, doors, and windows.",
    icon: "chair",
    category: "Construction",
    rating: 4.7,
    reviews: 134,
    imageIcon: "chair",
    packages: [
      {
        name: "Daily Rate",
        price: 600,
        unit: "per day",
        originalPrice: 750,
        duration: "Full day",
        features: ["Expert carpenter", "All tools", "Custom work", "Quality finish", "Verified"],
        popular: true
      }
    ]
  },
  "electrician": {
    title: "Certified Electricians",
    subtitle: "Licensed electricians for wiring, panels, and installations.",
    icon: "electrical_services",
    category: "Construction",
    rating: 4.9,
    reviews: 198,
    imageIcon: "bolt",
    packages: [
      {
        name: "Daily Rate",
        price: 400,
        unit: "per day",
        originalPrice: 500,
        duration: "Full day",
        features: ["Licensed electrician", "Safety certified", "All tools", "Quality work", "Verified"],
        popular: true
      }
    ]
  },
  "plumber": {
    title: "Skilled Plumbers",
    subtitle: "Expert plumbers for pipes, fixtures, and repairs.",
    icon: "plumbing",
    category: "Construction",
    rating: 4.8,
    reviews: 172,
    imageIcon: "plumbing",
    packages: [
      {
        name: "Daily Rate",
        price: 450,
        unit: "per day",
        originalPrice: 550,
        duration: "Full day",
        features: ["Expert plumber", "All tools", "Quality work", "Warranty", "Verified"],
        popular: true
      }
    ]
  },
  "welder": {
    title: "Welding Specialists",
    subtitle: "Professional welders for metal work, gates, and fabrication.",
    icon: "hardware",
    category: "Construction",
    rating: 4.7,
    reviews: 109,
    imageIcon: "hardware",
    packages: [
      {
        name: "Daily Rate",
        price: 500,
        unit: "per day",
        originalPrice: 650,
        duration: "Full day",
        features: ["Expert welder", "All equipment", "Metal fabrication", "Quality work", "Verified"],
        popular: true
      }
    ]
  },
  "carpentry": {
    title: "Carpentry & Modular",
    subtitle: "Expert carpenters for furniture, repairs, shelves, and modular work.",
    icon: "chair",
    category: "Home Services",
    rating: 4.6,
    reviews: 88,
    imageIcon: "chair",
    packages: [
      {
        name: "Furniture Repair",
        price: 499,
        originalPrice: 699,
        duration: "2-4 hours",
        features: ["Expert repair", "Quality materials", "Color matching", "Finish restoration", "1-month warranty"],
        popular: true
      },
      {
        name: "Custom Furniture",
        price: 2999,
        originalPrice: 3999,
        duration: "5-7 days",
        features: ["Design consultation", "Custom build", "Quality wood", "Professional finish", "1-year warranty"],
        popular: false
      },
      {
        name: "Modular Wardrobe",
        price: 4999,
        originalPrice: 6999,
        duration: "7-10 days",
        features: ["Space planning", "Custom design", "Premium materials", "Installation", "2-year warranty"],
        popular: false
      }
    ]
  },
  "home-security": {
    title: "Home Security Setup",
    subtitle: "Professional security systems including CCTV, alarms, and smart locks.",
    icon: "shield",
    category: "Security",
    rating: 4.7,
    reviews: 57,
    imageIcon: "shield",
    packages: [
      {
        name: "CCTV Installation",
        price: 1999,
        originalPrice: 2999,
        duration: "3-4 hours",
        features: ["2 cameras", "DVR setup", "Mobile app", "Remote viewing", "1-year warranty"],
        popular: true
      },
      {
        name: "Alarm System",
        price: 2999,
        originalPrice: 3999,
        duration: "2-3 hours",
        features: ["Door sensors", "Motion detectors", "Siren", "Mobile alerts", "1-year warranty"],
        popular: false
      },
      {
        name: "Smart Lock Install",
        price: 2499,
        originalPrice: 3299,
        duration: "1-2 hours",
        features: ["Smart lock", "App setup", "Keyless entry", "User management", "2-year warranty"],
        popular: false
      }
    ]
  }
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

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
  document.getElementById("serviceCategory").textContent = config.category;
  document.getElementById("serviceTitle").textContent = config.title;
  document.getElementById("serviceSubtitle").textContent = config.subtitle;
  document.getElementById("serviceRating").textContent = config.rating;
  document.getElementById("serviceReviews").textContent = config.reviews;
  document.getElementById("serviceImageIcon").textContent = config.imageIcon;

  // Render packages
  renderPackages(config.packages);
  
  // Load professionals
  loadProfessionals();
  
  // Load reviews
  renderReviews();

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
          class="w-full py-3 rounded-xl font-bold transition-all ${
            pkg.popular 
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
    const res = await fetch(`${API_BASE}/services/${serviceSlug}`);
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
    <div class="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition text-center">
      <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
        ${worker.name.charAt(0)}
      </div>
      <h3 class="font-semibold mb-1">${worker.name}</h3>
      <p class="text-xs text-ink-muted mb-3">@${worker.userName}</p>
      <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold ${
        worker.availability === 'available' 
          ? 'bg-emerald-50 text-emerald-600' 
          : 'bg-amber-50 text-amber-600'
      }">
        ${worker.availability}
      </span>
    </div>
  `).join('');
}

function renderReviews() {
  const reviews = [
    { name: "Priya Sharma", location: "Mumbai", rating: 5, text: "Excellent service! The team was professional and thorough. Highly recommended!" },
    { name: "Rajesh Kumar", location: "Delhi", rating: 5, text: "Great experience from booking to completion. Will definitely use again." },
    { name: "Anita Patel", location: "Bangalore", rating: 4, text: "Good service, timely arrival, and quality work. Very satisfied!" }
  ];

  const container = document.getElementById("reviewsContainer");
  container.innerHTML = reviews.map(review => `
    <div class="bg-white rounded-xl p-6 border border-gray-100">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          ${review.name.charAt(0)}
        </div>
        <div>
          <h4 class="font-semibold">${review.name}</h4>
          <p class="text-xs text-ink-muted">${review.location}</p>
        </div>
      </div>
      <div class="flex gap-1 mb-3">
        ${Array(5).fill(0).map((_, i) => `
          <span class="material-symbols-outlined text-sm ${i < review.rating ? 'text-amber-400' : 'text-gray-300'}">star</span>
        `).join('')}
      </div>
      <p class="text-sm text-ink-muted">"${review.text}"</p>
    </div>
  `).join('');
}

function setupBookingButtons() {
  document.getElementById("bookNowBtn")?.addEventListener("click", () => {
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = `${serviceSlug}-booking.html`;
    } else {
      window.location.href = `login.html?redirect=${encodeURIComponent(`${serviceSlug}-booking.html`)}`;
    }
  });

  document.getElementById("ctaBookBtn")?.addEventListener("click", () => {
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = `${serviceSlug}-booking.html`;
    } else {
      window.location.href = `login.html?redirect=${encodeURIComponent(`${serviceSlug}-booking.html`)}`;
    }
  });
}

window.bookPackage = function(serviceSlug, packageIndex) {
  const token = localStorage.getItem("token");
  const config = serviceConfig[serviceSlug];
  const selectedPackage = config.packages[packageIndex];
  
  localStorage.setItem("selectedService", serviceSlug);
  localStorage.setItem("selectedPackage", JSON.stringify(selectedPackage));
  
  if (token) {
    window.location.href = `${serviceSlug}-booking.html`;
  } else {
    window.location.href = `login.html?redirect=${encodeURIComponent(`${serviceSlug}-booking.html`)}`;
  }
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", renderService);

