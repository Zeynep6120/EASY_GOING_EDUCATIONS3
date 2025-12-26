// Header functionality
import { isLoggedIn, getCurrentUser, logout } from "../../../helpers/utils.js";

export function initHeader() {
  const user = getCurrentUser();
  const header = document.getElementById("main-header");
  if (!header) return;

  // Update navigation based on login status
  const loginLink = header.querySelector(".nav-login");
  const logoutLink = header.querySelector(".nav-logout");
  const dashboardLink = header.querySelector(".nav-dashboard");

  if (isLoggedIn() && user) {
    if (loginLink) loginLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "block";
    if (dashboardLink) {
      dashboardLink.style.display = "block";
      dashboardLink.href = "/dashboard.html";
    }
  } else {
    if (loginLink) loginLink.style.display = "block";
    if (logoutLink) logoutLink.style.display = "none";
    if (dashboardLink) dashboardLink.style.display = "none";
  }

  // Logout handler
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Mobile menu toggle
  const navToggle = header.querySelector(".nav-toggle");
  const navMenu = header.querySelector(".nav-menu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }
}

// Initialize header when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeader);
} else {
  initHeader();
}

