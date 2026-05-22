const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const role = user?.role;

if (!token || role !== 'worker') {
  window.location.href = 'login.html';
}

const container = document.getElementById('workerApplicationsContainer');

fetch('http://localhost:3000/api/dashboard', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(res => res.json())
  .then(applications => {
    applications.forEach(app => {
      const card = document.createElement('div');
      card.setAttribute('data-status', app.status);
      card.className = 'job-card';
      card.innerHTML = `
        <h3>${app.job.title}</h3>
        <p><strong>Location:</strong> ${app.job.location}</p>
        <p><strong>Pay:</strong> ₹${app.job.pay}</p>
        <p><strong>Status:</strong> ${app.status}</p>
      `;
      container.appendChild(card);
    });
  });
  

  container.innerHTML = "<p>Loading applications...</p>";

fetch('http://localhost:3000/api/dashboard', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(res => {
    if (!res.ok) throw new Error("Failed to load applications");
    return res.json();
  })
  .then(data => {
    container.innerHTML = ""; // Clear loading
    data.applications.forEach(app => {
      const card = document.createElement('div');
      card.setAttribute('data-status', app.myStatus);
      card.className = 'job-card';
      card.innerHTML = `
        <h3>${app.title}</h3>
        <p><strong>Status:</strong> ${app.myStatus}</p>
        <p><strong>Job Status:</strong> ${app.jobStatus}</p>
        <p><strong>Applied At:</strong> ${new Date(app.appliedAt).toLocaleString()}</p>
      `;
      container.appendChild(card);
    });
  })
  .catch(err => {
    container.innerHTML = `<p class="error">❌ ${err.message}</p>`;
  });

function logout() {
  const btn = document.getElementById("logout-btn");
  if (btn) btn.disabled = true;

  localStorage.clear();
  window.location.href = 'login.html';
}
