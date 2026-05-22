

// const API_BASE = "http://localhost:3000/api/auth";
//  // your backend base URL

// // ---------- REGISTER ----------
// async function handleRegister(e) {
//   e.preventDefault();

//   const firstName = document.getElementById("firstName")?.value;
//   const lastName = document.getElementById("lastName")?.value;
//   const userName = document.getElementById("userName")?.value;
//   const email = document.getElementById("email")?.value;
//   const password = document.getElementById("password")?.value;
//   const role = document.querySelector("input[name='user-role']:checked")?.value;

//   try {
//     const res = await fetch(`${API_BASE}/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//   firstName,
//   lastName,
//   userName,   // not userName
//   email,
//   passWord:password,   // not passWord
//   role
// })

//     });

//     const data = await res.json();
//     if (!res.ok) throw new Error(data.message || "Registration failed");

//     alert("✅ Registered successfully! Please login.");
//     window.location.href = "login.html";
//   } catch (err) {
//     alert("❌ " + err.message);
//   }
// }

// // ---------- LOGIN ----------
// async function handleLogin(e) {
//   e.preventDefault();

//   const email = document.getElementById("email")?.value;
//   const password = document.getElementById("password")?.value;

//   try {
//     const res = await fetch(`${API_BASE}/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, passWord: password })
//     });

//     const data = await res.json();
//     if (!res.ok) throw new Error(data.message || "Login failed");

//     // Save token
//     localStorage.setItem("token", data.token);
//     localStorage.setItem("user", JSON.stringify(data.user));

//     alert("✅ Login successful!");
//     window.location.href = "index.html";
//   } catch (err) {
//     alert("❌ " + err.message);
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
// document.addEventListener("DOMContentLoaded", () => {
//   const regForm = document.querySelector("form[action='#'][method='POST']");
//   const logForm = document.querySelector("form[action='#'][method='POST']");
  
//   if (window.location.pathname.includes("register.html") && regForm) {
//     regForm.addEventListener("submit", handleRegister);
//   }

//   if (window.location.pathname.includes("login.html") && logForm) {
//     logForm.addEventListener("submit", handleLogin);
//   }

//   // Example: add logout button dynamically later
// });




// ---------- TOAST (ONLY ADDITION) ----------
function showToast(message, type = "success") {
  const toast = document.createElement("div");

  toast.textContent = message;

  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.right = "20px";
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "8px";
  toast.style.color = "#fff";
  toast.style.zIndex = "9999";
  toast.style.fontSize = "14px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  toast.style.transition = "0.3s ease";

  toast.style.background =
    type === "success" ? "#22c55e" : "#ef4444";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
  }, 2000);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// ---------- API ----------
const API_BASE = "http://localhost:3000/api/auth";

// ---------- REGISTER ----------
async function handleRegister(e) {
  e.preventDefault();

  const firstName = document.getElementById("firstName")?.value;
  const lastName = document.getElementById("lastName")?.value;
  const userName = document.getElementById("userName")?.value;
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  const role = document.querySelector("input[name='user-role']:checked")?.value;

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        userName,
        email,
        password: password, // FIXED (was passWord)
        role
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    // ❌ alert removed
    showToast("Registered successfully! Redirecting to login...", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (err) {
    showToast(err.message, "error");
  }
}

// ---------- LOGIN ----------
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }) // FIXED (was passWord)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // ❌ alert removed
    showToast("Login successful! Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (err) {
    showToast(err.message, "error");
  }
}

// ---------- AUTH UTILS ----------
function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  const regForm = document.querySelector("form[action='#'][method='POST']");
  const logForm = document.querySelector("form[action='#'][method='POST']");

  if (window.location.pathname.includes("register.html") && regForm) {
    regForm.addEventListener("submit", handleRegister);
  }

  if (window.location.pathname.includes("login.html") && logForm) {
    logForm.addEventListener("submit", handleLogin);
  }
});