// Internationalization (i18n) support for Marathi, Hindi, and English
const translations = {
  en: {
    nav: {
      postJob: "Post a job",
      multiWorker: "Multi-worker booking",
      language: "Language",
      logout: "Logout"
    },
    header: {
      subtitle: "Manage your workforce",
      newJob: "New job",
      multiWorker: "Hire Team"
    },
    project: {
      title: "Project Overview",
      subtitle: "Active jobs, budgets, and timelines"
    },
    stats: {
      jobsPosted: "Jobs Posted",
      openRoles: "Open Roles",
      paused: "Paused",
      applicants: "Applicants"
    },
    analytics: {
      costForecast: "Project Cost Forecast",
      costSubtitle: "Estimated project expenses",
      estimatedCost: "Estimated Cost",
      variance: "Variance",
      availabilityForecast: "Worker Availability Forecast",
      availabilitySubtitle: "Next 7 days prediction",
      peakAvailability: "Peak Availability",
      chartPlaceholder: "Cost trend chart will appear here"
    },
    jobs: {
      active: "Active jobs",
      subtitle: "Track performance across roles",
      loading: "Loading jobs..."
    },
    jobForm: {
      title: "Post a new job",
      subtitle: "Find skilled workers fast",
      roleTitle: "Role title",
      location: "City or remote",
      budget: "Budget (₹)",
      skills: "Skills (comma separated)",
      description: "Describe the work",
      publish: "Publish job"
    },
    applicants: {
      recent: "Recent applicants",
      waiting: "Waiting for new applications..."
    },
    multiWorker: {
      title: "Multi-Worker Booking",
      projectName: "Project Name",
      budget: "Total Budget (₹)",
      timeline: "Project Timeline",
      startDate: "Start Date",
      endDate: "End Date",
      selectWorkers: "Select Workers",
      addType: "Add Worker Type",
      totalWorkers: "Total Workers:",
      bookTeam: "Book Team"
    },
    worker: {
      reliabilityScore: "Reliability Score",
      overall: "Overall",
      acceptance: "Acceptance",
      punctuality: "Punctuality",
      payment: "Payment",
      amountDue: "Amount Due",
      payNow: "Pay Now",
      ratingsHistory: "Ratings & Feedback History"
    },
    common: {
      refresh: "Refresh"
    }
  },
  mr: {
    nav: {
      postJob: "नोकरी पोस्ट करा",
      multiWorker: "बहु-कामगार बुकिंग",
      language: "भाषा",
      logout: "लॉगआउट"
    },
    header: {
      subtitle: "आपल्या कामगारांचे व्यवस्थापन करा",
      newJob: "नवीन नोकरी",
      multiWorker: "टीम भाड्याने घ्या"
    },
    project: {
      title: "प्रकल्प आढावा",
      subtitle: "सक्रिय नोकऱ्या, अंदाजपत्रक आणि वेळापत्रक"
    },
    stats: {
      jobsPosted: "पोस्ट केलेल्या नोकऱ्या",
      openRoles: "खुल्या भूमिका",
      paused: "विराम दिले",
      applicants: "अर्जदार"
    },
    analytics: {
      costForecast: "प्रकल्प खर्च अंदाज",
      costSubtitle: "अंदाजित प्रकल्प खर्च",
      estimatedCost: "अंदाजित खर्च",
      variance: "फरक",
      availabilityForecast: "कामगार उपलब्धता अंदाज",
      availabilitySubtitle: "पुढील 7 दिवसांचा अंदाज",
      peakAvailability: "कमाल उपलब्धता",
      chartPlaceholder: "खर्च ट्रेंड चार्ट येथे दिसेल"
    },
    jobs: {
      active: "सक्रिय नोकऱ्या",
      subtitle: "भूमिकांमध्ये कामगिरी ट्रॅक करा",
      loading: "नोकऱ्या लोड होत आहेत..."
    },
    jobForm: {
      title: "नवीन नोकरी पोस्ट करा",
      subtitle: "कुशल कामगार त्वरित शोधा",
      roleTitle: "भूमिका शीर्षक",
      location: "शहर किंवा रिमोट",
      budget: "अंदाजपत्रक (₹)",
      skills: "कौशल्ये (स्वल्पविरामाने विभक्त)",
      description: "कामाचे वर्णन करा",
      publish: "नोकरी प्रकाशित करा"
    },
    applicants: {
      recent: "अलीकडील अर्जदार",
      waiting: "नवीन अर्जांची वाट पाहत आहे..."
    },
    multiWorker: {
      title: "बहु-कामगार बुकिंग",
      projectName: "प्रकल्प नाव",
      budget: "एकूण अंदाजपत्रक (₹)",
      timeline: "प्रकल्प वेळापत्रक",
      startDate: "प्रारंभ तारीख",
      endDate: "समाप्ती तारीख",
      selectWorkers: "कामगार निवडा",
      addType: "कामगार प्रकार जोडा",
      totalWorkers: "एकूण कामगार:",
      bookTeam: "टीम बुक करा"
    },
    worker: {
      reliabilityScore: "विश्वासार्हता स्कोअर",
      overall: "एकूण",
      acceptance: "स्वीकृती",
      punctuality: "वेळेचे पालन",
      payment: "पेमेंट",
      amountDue: "देय रक्कम",
      payNow: "आत्ता पैसे द्या",
      ratingsHistory: "रेटिंग आणि अभिप्राय इतिहास"
    },
    common: {
      refresh: "रिफ्रेश करा"
    }
  },
  hi: {
    nav: {
      postJob: "नौकरी पोस्ट करें",
      multiWorker: "मल्टी-वर्कर बुकिंग",
      language: "भाषा",
      logout: "लॉगआउट"
    },
    header: {
      subtitle: "अपने कार्यबल का प्रबंधन करें",
      newJob: "नई नौकरी",
      multiWorker: "टीम किराए पर लें"
    },
    project: {
      title: "प्रोजेक्ट अवलोकन",
      subtitle: "सक्रिय नौकरियां, बजट और समयसीमा"
    },
    stats: {
      jobsPosted: "पोस्ट की गई नौकरियां",
      openRoles: "खुली भूमिकाएं",
      paused: "रोक दी गई",
      applicants: "आवेदक"
    },
    analytics: {
      costForecast: "प्रोजेक्ट लागत पूर्वानुमान",
      costSubtitle: "अनुमानित प्रोजेक्ट खर्च",
      estimatedCost: "अनुमानित लागत",
      variance: "विचलन",
      availabilityForecast: "कर्मचारी उपलब्धता पूर्वानुमान",
      availabilitySubtitle: "अगले 7 दिनों का पूर्वानुमान",
      peakAvailability: "चरम उपलब्धता",
      chartPlaceholder: "लागत ट्रेंड चार्ट यहां दिखाई देगा"
    },
    jobs: {
      active: "सक्रिय नौकरियां",
      subtitle: "भूमिकाओं में प्रदर्शन ट्रैक करें",
      loading: "नौकरियां लोड हो रही हैं..."
    },
    jobForm: {
      title: "नई नौकरी पोस्ट करें",
      subtitle: "कुशल कर्मचारी तुरंत खोजें",
      roleTitle: "भूमिका शीर्षक",
      location: "शहर या रिमोट",
      budget: "बजट (₹)",
      skills: "कौशल (अल्पविराम से अलग)",
      description: "काम का वर्णन करें",
      publish: "नौकरी प्रकाशित करें"
    },
    applicants: {
      recent: "हाल के आवेदक",
      waiting: "नए आवेदनों की प्रतीक्षा कर रहे हैं..."
    },
    multiWorker: {
      title: "मल्टी-वर्कर बुकिंग",
      projectName: "प्रोजेक्ट नाम",
      budget: "कुल बजट (₹)",
      timeline: "प्रोजेक्ट समयसीमा",
      startDate: "प्रारंभ तिथि",
      endDate: "समाप्ति तिथि",
      selectWorkers: "कर्मचारी चुनें",
      addType: "कर्मचारी प्रकार जोड़ें",
      totalWorkers: "कुल कर्मचारी:",
      bookTeam: "टीम बुक करें"
    },
    worker: {
      reliabilityScore: "विश्वसनीयता स्कोर",
      overall: "कुल",
      acceptance: "स्वीकृति",
      punctuality: "समय की पाबंदी",
      payment: "भुगतान",
      amountDue: "देय राशि",
      payNow: "अभी भुगतान करें",
      ratingsHistory: "रेटिंग और फीडबैक इतिहास"
    },
    common: {
      refresh: "रिफ्रेश करें"
    }
  }
};

let currentLanguage = localStorage.getItem('preferredLanguage') || 'en';

function t(key) {
  const keys = key.split('.');
  let value = translations[currentLanguage];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLanguage = lang;
  localStorage.setItem('preferredLanguage', lang);
  updatePageLanguage();
}

function updatePageLanguage() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}

// Initialize language on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updatePageLanguage);
} else {
  updatePageLanguage();
}

// Export for use in other scripts
window.i18n = { t, setLanguage, currentLanguage };








