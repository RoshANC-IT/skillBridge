const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || !role) {
  window.location.href = 'login.html';
  
}
if (user.avatarUrl) {
  document.getElementById("userAvatar").style.backgroundImage = `url('${user.avatarUrl}')`;
}
document.getElementById("userName").textContent = `${user.firstName} ${user.lastName}`;
document.getElementById("userRole").textContent = user.role;
document.getElementById("userId").textContent = user._id;


// Optional: Availability toggle
var availabilityToggle = document.getElementById("availability-toggle");
if (availabilityToggle && user.availability) {
  availabilityToggle.checked = user.availability === "available";
}
let availabilityToggle = document.getElementById("availability-toggle");
if (availabilityToggle && user.availability) {
  availabilityToggle.checked = user.availability === "available";
}



document.getElementById('welcomeMsg').textContent = `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)}!`;

const dashboardContent = document.getElementById('dashboardContent');

if (role === 'worker') {
  dashboardContent.innerHTML = `
    <h3>Your Applications</h3>
    <ul id="applicationsList"></ul>
  `;
  fetchApplications();
} else if (role === 'employer') {
  dashboardContent.innerHTML = `
    <h3>Your Posted Jobs</h3>
    <ul id="jobsList"></ul>
  `;
  fetchPostedJobs();
}
const user = JSON.parse(localStorage.getItem("user"));


function fetchApplications() {
  fetch('http://localhost:3000/api/worker/applications', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('applicationsList');
      data.forEach(app => {
        const li = document.createElement('li');
        li.textContent = `${app.jobTitle} - ${app.status}`;
        list.appendChild(li);
      });
    });
}

function fetchPostedJobs() {
  fetch('http://localhost:3000/api/employer/jobs', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('jobsList');
      data.forEach(job => {
        const li = document.createElement('li');
        li.textContent = `${job.title} - ${job.location}`;
        list.appendChild(li);
      });
    });
}

let availabilityToggle = document.getElementById("availability-toggle");

availabilityToggle.checked = user.availability === "available";

availabilityToggle.addEventListener("change", async () => {
  const newStatus = availabilityToggle.checked ? "available" : "unavailable";

  try {
    const res = await fetch(`${API_BASE}/worker/update-availability`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ availability: newStatus })
    });

    if (res.ok) {
      alert(`✅ Availability updated to ${newStatus}`);
      user.availability = newStatus;
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      throw new Error("Failed to update");
    }
  } catch (err) {
    alert("❌ Could not update availability");
    availabilityToggle.checked = !availabilityToggle.checked; // revert
  }
});

document.getElementById("updateProfileBtn").addEventListener("click", () => {
  window.location.href = "edit-profile.html"; // or open a modal
});
document.getElementById("welcomeMsg").textContent = `Welcome, ${user.firstName}!`;

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}
