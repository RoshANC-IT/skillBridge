document.addEventListener("DOMContentLoaded", async () => {
  const usersTableBody = document.getElementById("usersTableBody");
  const refreshUsersBtn = document.getElementById("refreshUsers");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchInput = document.getElementById("searchInput");
  const filterSkill = document.getElementById("filterSkill");
  const filterArea = document.getElementById("filterArea");
  
  let allUsers = [];
  
  const statTotalUsers = document.getElementById("statTotalUsers");
  const statWorkers = document.getElementById("statWorkers");
  const statEmployers = document.getElementById("statEmployers");

  // Auth & Roles
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isMainAdmin = currentUser && currentUser.email === 'admin@sb.com';

  // UI Setup based on roles
  const navDirectory = document.getElementById("navDirectory");
  const navAdminAccess = document.getElementById("navAdminAccess");
  const viewDirectory = document.getElementById("viewDirectory");
  const viewAdminAccess = document.getElementById("viewAdminAccess");
  
  if (isMainAdmin) {
    navAdminAccess.classList.remove("hidden");
  }

  // --- TAB LOGIC ---
  navDirectory.addEventListener("click", () => {
    navDirectory.classList.add("bg-primary/10", "text-primary");
    navDirectory.classList.remove("text-ink-muted");
    navAdminAccess.classList.remove("bg-primary/10", "text-primary");
    navAdminAccess.classList.add("text-ink-muted");
    viewDirectory.classList.remove("hidden");
    viewAdminAccess.classList.add("hidden");
    fetchUsers();
  });

  navAdminAccess.addEventListener("click", () => {
    navAdminAccess.classList.add("bg-primary/10", "text-primary");
    navAdminAccess.classList.remove("text-ink-muted");
    navDirectory.classList.remove("bg-primary/10", "text-primary");
    navDirectory.classList.add("text-ink-muted");
    viewAdminAccess.classList.remove("hidden");
    viewDirectory.classList.add("hidden");
    fetchAdmins();
  });

  // --- LOGOUT LOGIC ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }

  // --- DIRECTORY LOGIC ---
  async function fetchUsers() {
    try {
      usersTableBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-ink-muted">Loading users...</td></tr>`;
      
      const res = await fetch("http://localhost:3000/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert("Access Denied: Admin authorization required");
          localStorage.removeItem("token");
          window.location.href = "login.html";
          return;
        }
        throw new Error("Failed to fetch users");
      }

      allUsers = await res.json();
      populateFilters(allUsers);
      applyFilters(); // Renders users and updates stats
    } catch (err) {
      console.error(err);
      if(usersTableBody) usersTableBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-rose-500">Error loading users.</td></tr>`;
    }
  }

  function populateFilters(users) {
    if (!filterSkill || !filterArea) return;
    
    const skills = new Set();
    const areas = new Set();
    
    users.forEach(u => {
      if (u.role === 'worker' && u.workerType) {
        u.workerType.split(',').forEach(skill => {
          if (skill.trim()) skills.add(skill.trim());
        });
      }
      if (u.city) areas.add(u.city.trim());
    });
    
    const currSkill = filterSkill.value;
    const currArea = filterArea.value;

    filterSkill.innerHTML = `<option value="">All Skills</option>` + 
      Array.from(skills).sort().map(s => `<option value="${s}" ${currSkill === s ? 'selected' : ''}>${s}</option>`).join('');
      
    filterArea.innerHTML = `<option value="">All Areas</option>` + 
      Array.from(areas).sort().map(a => `<option value="${a}" ${currArea === a ? 'selected' : ''}>${a}</option>`).join('');
  }

  function updateStats(users) {
    let workers = 0; let employers = 0;
    users.forEach(u => {
      if (u.role === "worker") workers++;
      if (u.role === "employer") employers++;
    });
    if(statTotalUsers) statTotalUsers.textContent = users.length;
    if(statWorkers) statWorkers.textContent = workers;
    if(statEmployers) statEmployers.textContent = employers;
  }

  function renderUsers(users) {
    if (!usersTableBody) return;
    if (!users || users.length === 0) {
      usersTableBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-ink-muted">No users found.</td></tr>`;
      return;
    }

    usersTableBody.innerHTML = users.map(user => {
      const isBanned = user.status === "banned";
      const statusBadgeClass = isBanned 
        ? "bg-rose-100 text-rose-700 border-rose-200" 
        : "bg-emerald-100 text-emerald-700 border-emerald-200";
      const statusText = isBanned ? "Banned" : "Active";
      
      const roleBadge = `<span class="px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-red-100 text-red-700' : (user.role === 'worker' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')} capitalize">${user.role}</span>`;

      return `
        <tr class="hover:bg-gray-50 transition">
          <td class="py-4 px-6 border-b border-gray-100">
            <div class="font-semibold text-ink">${user.firstName} ${user.lastName}</div>
            <div class="text-xs text-ink-muted">@${user.userName}</div>
          </td>
          <td class="py-4 px-6 border-b border-gray-100">${roleBadge}</td>
          <td class="py-4 px-6 border-b border-gray-100 text-sm">${user.email}</td>
          <td class="py-4 px-6 border-b border-gray-100">
            <span class="px-2 py-1 border rounded bg-opacity-50 text-xs font-semibold ${statusBadgeClass}">${statusText}</span>
          </td>
          <td class="py-4 px-6 border-b border-gray-100 text-right space-x-2">
            <button data-id="${user._id}" class="view-btn px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-semibold transition">Details</button>
            ${isBanned 
              ? `<button data-id="${user._id}" class="unban-btn px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded text-sm font-semibold transition">Unban</button>`
              : `<button data-id="${user._id}" class="ban-btn px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded text-sm font-semibold transition">Ban</button>`
            }
            <button data-id="${user._id}" class="delete-btn px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-sm font-semibold transition">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    attachUserEvents();
  }

  function attachUserEvents() {
    document.querySelectorAll('.ban-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAction(btn.dataset.id, 'ban'));
    });
    document.querySelectorAll('.unban-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAction(btn.dataset.id, 'unban'));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if(confirm("Are you sure you want to permanently delete this user?")) {
          handleAction(btn.dataset.id, 'cancel', 'DELETE');
        }
      });
    });
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => openUserDetailsModal(btn.dataset.id));
    });
  }

  async function handleAction(userId, action, method = 'PUT') {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/${action}`, {
        method: method,
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.message || `Failed to ${action} user`);
        return;
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(`Error trying to ${action} user`);
    }
  }

  refreshUsersBtn?.addEventListener("click", () => {
    if(searchInput) searchInput.value = '';
    if(filterSkill) filterSkill.value = '';
    if(filterArea) filterArea.value = '';
    fetchUsers();
  });

  function applyFilters() {
    const term = searchInput?.value.toLowerCase().trim() || '';
    const selectedSkill = filterSkill?.value || '';
    const selectedArea = filterArea?.value || '';

    const filtered = allUsers.filter(u => {
      // 1. Text Search Match
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const userName = (u.userName || "").toLowerCase();
      const matchesSearch = !term || fullName.includes(term) || email.includes(term) || userName.includes(term);

      // 2. Skill Match (Check if the selected skill is inside the comma-separated string)
      const matchesSkill = !selectedSkill || (
        u.role === 'worker' && 
        u.workerType && 
        u.workerType.split(',').map(s => s.trim()).includes(selectedSkill)
      );

      // 3. Area Match
      const matchesArea = !selectedArea || (u.city === selectedArea);

      return matchesSearch && matchesSkill && matchesArea;
    });

    renderUsers(filtered);
    updateStats(filtered);
  }

  searchInput?.addEventListener("input", applyFilters);
  filterSkill?.addEventListener("change", applyFilters);
  filterArea?.addEventListener("change", applyFilters);

  // --- modal logic ---
  const modal = document.getElementById("userDetailsModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  closeModalBtn?.addEventListener("click", () => modal.classList.add("hidden"));
  modal?.addEventListener("click", (e) => {
    if(e.target === modal) modal.classList.add("hidden");
  });

  async function openUserDetailsModal(userId) {
    if(!modal) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/details`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if(!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      
      const u = data.user;
      document.getElementById("modalUserName").textContent = `${u.firstName} ${u.lastName} (${u.role})`;
      document.getElementById("modalEmail").textContent = u.email || 'N/A';
      document.getElementById("modalPhone").textContent = u.phoneNumber || 'N/A';
      document.getElementById("modalLocation").textContent = u.city || u.address || 'N/A';
      
      const skillRow = document.getElementById("modalSkillRow");
      if(u.role === 'worker') {
        skillRow.classList.remove("hidden");
        document.getElementById("modalSkill").textContent = u.workerType || 'N/A';
        document.getElementById("modalFinanceLabel").textContent = "Total Earnings:";
      } else {
        skillRow.classList.add("hidden");
        document.getElementById("modalFinanceLabel").textContent = "Total Spent:";
      }
      
      document.getElementById("modalFinanceAmount").textContent = data.financialTotal ? `₹${data.financialTotal}` : '₹0';

      const buildItemHtml = (item) => `
        <div class="border border-gray-100 rounded-xl p-3 bg-white shadow-sm flex flex-col gap-1 text-sm">
          <div class="flex justify-between items-center"><span class="font-bold">${item.title || item.serviceType || 'Job'}</span><span class="text-xs uppercase bg-gray-100 px-2 rounded">${item.status}</span></div>
          <div class="text-ink-muted max-w-full truncate">${item.description || item.notes || 'No description listed'}</div>
          ${item.price || item.pay ? `<div class="text-primary font-semibold mt-1">₹${item.price || item.pay}</div>` : ''}
        </div>
      `;

      document.getElementById("modalCurrentCount").textContent = data.currentWork.length;
      document.getElementById("modalCurrentWork").innerHTML = data.currentWork.length > 0 
        ? data.currentWork.map(buildItemHtml).join('') 
        : '<p class="text-ink-muted text-sm italic">No current work.</p>';
        
      document.getElementById("modalHistoryCount").textContent = data.history.length;
      document.getElementById("modalHistoryWork").innerHTML = data.history.length > 0 
        ? data.history.map(buildItemHtml).join('') 
        : '<p class="text-ink-muted text-sm italic">No historical work.</p>';

      modal.classList.remove("hidden");
    } catch(err) {
      console.error(err);
      alert("Error fetching details");
    }
  }

  // --- ADMIN ACCESS LOGIC ---
  const adminsTableBody = document.getElementById("adminsTableBody");
  const grantAdminForm = document.getElementById("grantAdminForm");
  
  async function fetchAdmins() {
    try {
      adminsTableBody.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-ink-muted">Loading administrators...</td></tr>`;
      const res = await fetch("http://localhost:3000/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const list = await res.json();
      const adminsOnly = list.filter(u => u.role === 'admin');
      
      if(adminsOnly.length === 0) {
        adminsTableBody.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-ink-muted">No other administrators found.</td></tr>`;
        return;
      }
      
      adminsTableBody.innerHTML = adminsOnly.map(a => `
        <tr class="hover:bg-gray-50 transition">
          <td class="py-4 px-6 border-b border-gray-100 font-semibold">${a.firstName} ${a.lastName}</td>
          <td class="py-4 px-6 border-b border-gray-100">${a.email}</td>
          <td class="py-4 px-6 border-b border-gray-100 text-right">
            ${a.email !== 'admin@sb.com' ? `<button data-id="${a._id}" class="revoke-btn px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-sm font-semibold transition">Revoke Access</button>` : `<span class="text-xs text-ink-muted italic border py-1 px-2 rounded bg-gray-50">Main Admin</span>`}
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.revoke-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if(!confirm("Revoke admin access?")) return;
          try {
            const r = await fetch(`http://localhost:3000/api/admin/revoke-access`, {
              method: 'POST',
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({ userId: btn.dataset.id })
            });
            if(!r.ok) throw new Error();
            fetchAdmins();
          } catch(e) {
            alert("Error revoking access");
          }
        });
      });
    } catch(err) {
      adminsTableBody.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-rose-500">Error loading.</td></tr>`;
    }
  }

  grantAdminForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const em = document.getElementById("grantEmail").value.trim();
    if(!em) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/grant-access`, {
        method: 'POST',
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email: em })
      });
      if(!res.ok) {
        const bd = await res.json();
        alert(bd.message || "Failed to grant access");
        return;
      }
      document.getElementById("grantEmail").value = '';
      fetchAdmins();
    } catch(e) {
      alert("Error submitting request");
    }
  });

  // Execute initial
  fetchUsers();
});
