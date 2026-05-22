// // Use existing API_BASE if defined, otherwise create it (avoiding redeclaration error)
// var API_BASE = window.API_BASE || "http://localhost:3000/api/auth";
// if (!window.API_BASE) {
//   window.API_BASE = API_BASE; // Make it globally available
// }
// // your backend base URL

// // ---------- REGISTER ----------
// async function handleRegister(e) {
//   e.preventDefault();

//   const firstName = document.getElementById("first-name")?.value.trim();
//   const lastName = document.getElementById("last-name")?.value.trim();
//   const userName = document.getElementById("username")?.value.trim();
//   const email = document.getElementById("email-address")?.value.trim();
//   const password = document.getElementById("password")?.value.trim();
//   const roleInput = document.querySelector("input[name='user-role']:checked")?.value;
//   const role = roleInput ? roleInput.toLowerCase() : null;

//   // Basic validation
//   if (!firstName || !lastName || !userName || !email || !password || !role) {
//     alert("❌ Please fill in all fields before submitting.");
//     return;
//   }

//   // Role-specific fields
//   let workerType = null;
//   let city = null;
//   let phoneNumber = null;

//   if (role === "worker") {
//     // Collect all checked values
//     const checkedSkills = Array.from(document.querySelectorAll('.worker-skill-checkbox:checked')).map(cb => cb.value);
//     workerType = checkedSkills.join(", ");
//     city = document.getElementById("worker-city")?.value.trim();
//     phoneNumber = document.getElementById("phone-number")?.value.trim();

//     // Validate worker fields
//     if (!workerType || !city || !phoneNumber) {
//       alert("❌ Please fill in all worker-specific fields (Worker Type, City, Phone Number).");
//       return;
//     }

//     // Basic phone validation
//     if (phoneNumber.length < 10) {
//       alert("❌ Please enter a valid phone number (at least 10 digits).");
//       return;
//     }
//   } else if (role === "employer") {
//     city = document.getElementById("employer-city")?.value.trim();

//     // Validate employer city
//     if (!city) {
//       alert("❌ Please fill in your city.");
//       return;
//     }
//   }

//   try {
//     const requestBody = {
//       firstName,
//       lastName,
//       userName: userName,
//       email,
//       password: password,
//       role
//     };

//     // Add worker-specific fields if role is worker
//     if (role === "worker") {
//       requestBody.workerType = workerType;
//       requestBody.city = city;
//       requestBody.phoneNumber = phoneNumber;
//     } else if (role === "employer") {
//       // Add city for employers
//       requestBody.city = city;
//     }

//     const res = await fetch(`${API_BASE}/signup`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(requestBody)
//     });

//     if (!res.ok) {
//       const data = await res.json().catch(() => ({ message: "Registration failed" }));
//       throw new Error(data.message || `Registration failed: ${res.status} ${res.statusText}`);
//     }

//     const data = await res.json();
//     alert("✅ Registered successfully! Please login.");
//     window.location.href = "login.html";
//   } catch (err) {
//     if (err.message.includes("fetch")) {
//       alert("❌ Cannot connect to server. Please make sure the backend server is running on port 3000.");
//       console.error("Network error:", err);
//     } else {
//       alert("❌ " + err.message);
//     }
//   }
// }
// // ---------- LOGIN ----------

// async function handleLogin(e) {
//   e.preventDefault();
//   console.log("handleLogin called!");

//   const email = document.getElementById("email-address")?.value;
//   const password = document.getElementById("password")?.value;
//   const roleInput = document.querySelector("input[name='user-role']:checked")?.value;
//   const role = roleInput ? roleInput.toLowerCase() : null;

//   try {
//     const res = await fetch(`${API_BASE}/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password, role })
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       throw new Error(data.message || `Login failed: ${res.status} ${res.statusText}`);
//     }

//     console.log("Login response:", data); // ✅ Check this in dev tools

//     // ✅ Store token and user
//     localStorage.setItem("token", data.token);
//     localStorage.setItem("user", JSON.stringify(data.user));

//     alert("✅ Login successful!");

//     const userRole = (data.user.role || "").toLowerCase();

//     if (userRole === "worker") {
//       window.location.href = "worker-dashboard.html";
//     } else if (userRole === "employer") {
//       window.location.href = "employer-dashboard.html"; // Fixed to employer dashboard
//     } else {
//       window.location.href = "index.html"; // fallback for other roles
//     }
//   } catch (err) {
//     if (err.message.includes("fetch") || err.name === "TypeError") {
//       alert("❌ Cannot connect to server. Please make sure the backend server is running on port 3000.");
//       console.error("Network error:", err);
//     } else {
//       alert("❌ " + err.message);
//     }
//   }
// }

// // ---------- AUTH UTILS ----------
// function getToken() {
//   return localStorage.getItem("token");
// }

// function getUser() {
//   return JSON.parse(localStorage.getItem("user"));
// }

// function logout() {
//   localStorage.removeItem("token");
//   localStorage.removeItem("user");
//   window.location.href = "login.html";
// }

// // ---------- INIT ----------
// function initApp() {
//   console.log("initApp app.js. Path:", window.location.pathname);

//   const regForm = document.getElementById("registerForm") || document.querySelector("form[action='#'][method='POST']");
//   const logForm = document.getElementById("loginForm") || document.querySelector("form[action='#'][method='POST']");

//   console.log("regForm:", regForm, "logForm:", logForm);

//   if (window.location.pathname.includes("register") && regForm) {
//     regForm.addEventListener("submit", handleRegister);
//     console.log("Attached register listener");
//     setupMultiSelectDropdown();
//   }

//   if (window.location.pathname.includes("login") && logForm) {
//     logForm.addEventListener("submit", handleLogin);
//     console.log("Attached login listener");
//   }
// }

// function setupMultiSelectDropdown() {
//   const optionsContainer = document.getElementById("workerTypeOptions");
//   const pillsContainer = document.getElementById("selectedSkillsPills");

//   if (!optionsContainer) return;

//   const SKILLS = window.SKILLBRIDGE_SKILLS || [];

//   // Group by category
//   const groups = {};
//   SKILLS.forEach(s => {
//     if (!groups[s.category]) groups[s.category] = [];
//     groups[s.category].push(s);
//   });

//   optionsContainer.innerHTML = Object.entries(groups).map(([cat, skills]) => `
//     <div class="col-span-2 pt-1">
//       <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">${cat}</p>
//       <div class="grid grid-cols-2 gap-1.5">
//         ${skills.map(skill => `
//           <label class="flex items-center gap-2 p-2 rounded-lg border-2 border-transparent bg-white hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition has-[:checked]:border-primary has-[:checked]:bg-primary/10 dark:bg-slate-900 dark:hover:bg-primary/10">
//             <input type="checkbox" value="${skill.value}" class="worker-skill-checkbox w-4 h-4 accent-primary rounded border-gray-300">
//             <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">${skill.label}</span>
//           </label>
//         `).join('')}
//       </div>
//     </div>
//   `).join('');

//   function updatePills() {
//     if (!pillsContainer) return;
//     const checked = Array.from(document.querySelectorAll('.worker-skill-checkbox:checked')).map(cb => cb.value);
//     pillsContainer.innerHTML = checked.map(v => `
//       <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
//         ${v}
//         <button type="button" onclick="document.querySelector('.worker-skill-checkbox[value=\'${v}\']').click()" class="ml-0.5 hover:text-primary/60">&times;</button>
//       </span>
//     `).join('');
//   }

//   optionsContainer.addEventListener('change', updatePills);
// }

// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", initApp);
// } else {
//   initApp();
// }





async function handleLogin(e) {
  e.preventDefault();
  console.log("handleLogin called!");

  const email = document.getElementById("email-address")?.value;
  const password = document.getElementById("password")?.value;
  const roleInput = document.querySelector("input[name='user-role']:checked")?.value;
  const role = roleInput ? roleInput.toLowerCase() : null;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Login failed: ${res.status} ${res.statusText}`);
    }

    console.log("Login response:", data);

    // ✅ Store token and user
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // ❌ removed alert for better UX

    const userRole = (data.user.role || "").toLowerCase();

    // 🚀 Redirect immediately
    if (userRole === "worker") {
      window.location.href = "worker-dashboard.html";
    } else if (userRole === "employer") {
      window.location.href = "employer-dashboard.html";
    } else {
      window.location.href = "index.html";
    }

  } catch (err) {
    if (err.message.includes("fetch") || err.name === "TypeError") {
      alert("❌ Cannot connect to server. Please make sure backend is running.");
    } else {
      alert("❌ " + err.message);
    }
  }
}