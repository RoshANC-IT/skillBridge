<<<<<<< HEAD
// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.getElementById("loginForm");

//   if (!form) {
//     console.error("❌ Login form not found");
//     return;
//   }

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     // Get form values - using correct element IDs from HTML
//     const email = document.getElementById("email-address").value.trim();
//     const password = document.getElementById("password").value.trim();
//     if (!email || !password) {
//       alert("Please enter both email and password");
//       return;
//     }

//     // Disable submit button and show loading
//     const submitBtn = form.querySelector('button[type="submit"]');
//     const originalText = submitBtn.textContent;
//     submitBtn.disabled = true;
//     submitBtn.textContent = "Logging in...";

//     try {
//       const res = await fetch("http://localhost:3000/api/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//         credentials: "include"
//       });

//       const data = await res.json();

//       if (res.ok && data.token && data.user) {
//         // ✅ Save token and user to localStorage
//         localStorage.setItem("token", data.token);
//         localStorage.setItem("user", JSON.stringify(data.user));

//         alert("✅ Login successful!");

//         // Check for redirect URL in query params
//         const params = new URLSearchParams(window.location.search);
//         const redirect = params.get("redirect");

//         if (redirect) {
//           window.location.href = redirect;
//         } else if (data.user.role === "admin") {
//           window.location.href = "admin-dashboard.html";
//         } else if (data.user.role === "worker") {
//           window.location.href = "worker-dashboard.html";
//         } else if (data.user.role === "employer") {
//           window.location.href = "employer-dashboard.html";
//         } else {
//           window.location.href = "index.html";
//         }
//       } else {
//         alert(data.message || "Login failed. Please check your credentials.");
//       }
//     } catch (err) {
//       console.error("Login error:", err);
//       alert("Something went wrong. Please try again.");
//     } finally {
//       submitBtn.disabled = false;
//       submitBtn.textContent = originalText;
//     }
//   });
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

// ---------- LOGIN ----------
=======
>>>>>>> a4cea9b (real code)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (!form) {
    console.error("❌ Login form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

<<<<<<< HEAD
    const email = document.getElementById("email-address").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      showToast("Please enter both email and password", "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

=======
    // Get form values - using correct element IDs from HTML
    const email = document.getElementById("email-address").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    // Disable submit button and show loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
>>>>>>> a4cea9b (real code)
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      const data = await res.json();

      if (res.ok && data.token && data.user) {
<<<<<<< HEAD
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ REPLACED ALERT
        showToast("Login successful! Redirecting...", "success");

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");

        setTimeout(() => {
          if (redirect) {
            window.location.href = redirect;
          } else if (data.user.role === "admin") {
            window.location.href = "admin-dashboard.html";
          } else if (data.user.role === "worker") {
            window.location.href = "worker-dashboard.html";
          } else if (data.user.role === "employer") {
            window.location.href = "employer-dashboard.html";
          } else {
            window.location.href = "index.html";
          }
        }, 1200);

      } else {
        showToast(data.message || "Login failed", "error");
      }

    } catch (err) {
      console.error("Login error:", err);
      showToast("Something went wrong. Please try again.", "error");
=======
        // ✅ Save token and user to localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("✅ Login successful!");

        // Check for redirect URL in query params
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");

        if (redirect) {
          window.location.href = redirect;
        } else if (data.user.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else if (data.user.role === "worker") {
          window.location.href = "worker-dashboard.html";
        } else if (data.user.role === "employer") {
          window.location.href = "employer-dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      } else {
        alert(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong. Please try again.");
>>>>>>> a4cea9b (real code)
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> a4cea9b (real code)
