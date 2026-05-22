// Handle Login
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      if (email && password) {
        alert(`Logged in successfully!\nEmail: ${email}`);
        // Later: send API request to backend
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("regName").value;
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;
      const role = document.getElementById("regRole").value;

      if (name && email && password && role) {
        alert(`Account created for ${name} as ${role}`);
        // Later: send API request to backend
      }
    });
  }
});

// Dummy Jobs Data
const jobs = [
  { title: "Farm Worker", category: "agriculture", location: "Nashik", salary: "₹12,000/month" },
  { title: "Construction Helper", category: "construction", location: "Pune", salary: "₹15,000/month" },
  { title: "Electrician", category: "electrician", location: "Mumbai", salary: "₹18,000/month" },
  { title: "Carpenter", category: "carpenter", location: "Nagpur", salary: "₹16,000/month" },
  { title: "Harvesting Worker", category: "agriculture", location: "Kolhapur", salary: "₹13,000/month" },
  { title: "Mason", category: "construction", location: "Aurangabad", salary: "₹17,000/month" },
];

// Render Jobs
function renderJobs(filterText = "", category = "all") {
  const jobList = document.getElementById("jobList");
  if (!jobList) return;

  jobList.innerHTML = "";

  const filteredJobs = jobs.filter(job => {
    return (
      (category === "all" || job.category === category) &&
      (job.title.toLowerCase().includes(filterText.toLowerCase()) ||
       job.location.toLowerCase().includes(filterText.toLowerCase()))
    );
  });

  if (filteredJobs.length === 0) {
    jobList.innerHTML = "<p>No jobs found.</p>";
    return;
  }

  filteredJobs.forEach(job => {
    const jobCard = document.createElement("div");
    jobCard.className = "job-card";
    jobCard.innerHTML = `
      <h3>${job.title}</h3>
      <p><b>Category:</b> ${job.category}</p>
      <p><b>Location:</b> ${job.location}</p>
      <p><b>Salary:</b> ${job.salary}</p>
      <button>Apply</button>
    `;
    jobList.appendChild(jobCard);
  });
}

// Handle Search + Filter
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("jobSearch");
  const categorySelect = document.getElementById("jobCategory");

  if (searchInput && categorySelect) {
    renderJobs();

    searchInput.addEventListener("input", () => {
      renderJobs(searchInput.value, categorySelect.value);
    });

    categorySelect.addEventListener("change", () => {
      renderJobs(searchInput.value, categorySelect.value);
    });
  }
});

// Handle Profile Update
document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profileForm");

  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("profileName").value;
      const email = document.getElementById("profileEmail").value;
      const skills = document.getElementById("profileSkills").value;
      const location = document.getElementById("profileLocation").value;
      const experience = document.getElementById("profileExperience").value;

      alert(`Profile Updated!\nName: ${name}\nEmail: ${email}\nSkills: ${skills}\nLocation: ${location}\nExperience: ${experience} years`);

      // Later: Send this data to backend via API call
    });
  }
});

// Handle Employer Profile
document.addEventListener("DOMContentLoaded", () => {
  const employerForm = document.getElementById("employerForm");
  const jobPostForm = document.getElementById("jobPostForm");
  const myJobPosts = document.getElementById("myJobPosts");

  if (employerForm) {
    employerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("employerName").value;
      const email = document.getElementById("employerEmail").value;
      const location = document.getElementById("employerLocation").value;
      const industry = document.getElementById("employerIndustry").value;

      alert(`Employer Profile Updated!\nCompany: ${name}\nEmail: ${email}\nIndustry: ${industry}\nLocation: ${location}`);
      // Later: Send data to backend
    });
  }

  // Handle Job Posting
  if (jobPostForm) {
    jobPostForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const title = document.getElementById("jobTitle").value;
      const category = document.getElementById("jobCategoryPost").value;
      const location = document.getElementById("jobLocation").value;
      const salary = document.getElementById("jobSalary").value;

      const jobCard = document.createElement("div");
      jobCard.className = "job-card";
      jobCard.innerHTML = `
        <h3>${title}</h3>
        <p><b>Category:</b> ${category}</p>
        <p><b>Location:</b> ${location}</p>
        <p><b>Salary:</b> ${salary}</p>
        <button disabled>Posted</button>
      `;

      myJobPosts.appendChild(jobCard);

      alert(`Job Posted: ${title} (${category})`);
      jobPostForm.reset();

      // Later: Send job data to backend API
    });
  }
});

// ================= JOB APPLICATION FLOW =================

// Save Application (Worker applies)
function applyToJob(job) {
  let applications = JSON.parse(localStorage.getItem("applications")) || [];
  const applicant = {
    jobTitle: job.title,
    jobCategory: job.category,
    jobLocation: job.location,
    jobSalary: job.salary,
    applicantName: "Demo Worker",  // Later: take from logged-in worker profile
    applicantEmail: "worker@example.com"
  };

  applications.push(applicant);
  localStorage.setItem("applications", JSON.stringify(applications));
  alert(`Applied successfully to ${job.title}`);
}

// Modify renderJobs to include Apply button
function renderJobs(filterText = "", category = "all") {
  const jobList = document.getElementById("jobList");
  if (!jobList) return;

  jobList.innerHTML = "";

  const filteredJobs = jobs.filter(job => {
    return (
      (category === "all" || job.category === category) &&
      (job.title.toLowerCase().includes(filterText.toLowerCase()) ||
       job.location.toLowerCase().includes(filterText.toLowerCase()))
    );
  });

  if (filteredJobs.length === 0) {
    jobList.innerHTML = "<p>No jobs found.</p>";
    return;
  }

  filteredJobs.forEach(job => {
    const jobCard = document.createElement("div");
    jobCard.className = "job-card";
    jobCard.innerHTML = `
      <h3>${job.title}</h3>
      <p><b>Category:</b> ${job.category}</p>
      <p><b>Location:</b> ${job.location}</p>
      <p><b>Salary:</b> ${job.salary}</p>
      <button class="applyBtn">Apply</button>
    `;

    const applyBtn = jobCard.querySelector(".applyBtn");
    applyBtn.addEventListener("click", () => applyToJob(job));

    jobList.appendChild(jobCard);
  });
}

// ================= EMPLOYER SIDE (View Applicants) =================
document.addEventListener("DOMContentLoaded", () => {
  const applicantsList = document.getElementById("applicantsList");

  if (applicantsList) {
    const applications = JSON.parse(localStorage.getItem("applications")) || [];

    applicantsList.innerHTML = "";

    if (applications.length === 0) {
      applicantsList.innerHTML = "<p>No applicants yet.</p>";
    } else {
      applications.forEach(app => {
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML = `
          <h3>${app.applicantName}</h3>
          <p><b>Email:</b> ${app.applicantEmail}</p>
          <p><b>Applied For:</b> ${app.jobTitle} (${app.jobCategory})</p>
          <p><b>Location:</b> ${app.jobLocation}</p>
          <p><b>Salary:</b> ${app.jobSalary}</p>
        `;
        applicantsList.appendChild(card);
      });
    }
  }
});
n



