// Header functionality - Vanilla JavaScript

function initHeader() {
  const user = getCurrentUser();
  const header = document.getElementById("main-header");
  if (!header) return;

  // Update navigation based on login status
  const loginLink = header.querySelector(".nav-login");
  const registerLink = header.querySelector(".nav-register");
  const logoutLink = header.querySelector(".nav-logout");
  const dashboardLink = header.querySelector(".nav-dashboard");

  if (isLoggedIn() && user) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "block";
    if (dashboardLink) {
      dashboardLink.style.display = "block";
      dashboardLink.href = "/dashboard.html";
    }
  } else {
    if (loginLink) loginLink.style.display = "block";
    if (registerLink) registerLink.style.display = "block";
    if (logoutLink) logoutLink.style.display = "none";
    if (dashboardLink) dashboardLink.style.display = "none";
  }

  // Only initialize logout modal if user is logged in and not on login page
  const isLoginPage = window.location.pathname === "/index.html" || 
                       window.location.pathname === "/" || 
                       window.location.pathname.includes("index.html");
  
  // Remove logout modal from login page immediately and prevent initialization
  if (isLoginPage) {
    // Remove any existing logout modal
    const existingModal = document.querySelector(".logout-modal");
    if (existingModal) {
      existingModal.remove();
    }
    // Also remove any active class that might be showing the modal
    document.body.style.overflow = "";
    // Don't initialize logout modal on login page
    return;
  }
  
  // Logout handler with beautiful modal (only for non-login pages)
  if (logoutLink && !logoutLink.dataset.logoutInitialized && isLoggedIn()) {
    logoutLink.dataset.logoutInitialized = "true";
    
    // Create logout modal if it doesn't exist
    let logoutModal = document.querySelector(".logout-modal");
    if (!logoutModal) {
      const user = getCurrentUser();
      const userName = user ? `${user.name || ""} ${user.surname || ""}`.trim() || user.email || "User" : "User";
      
      logoutModal = document.createElement("div");
      logoutModal.className = "logout-modal";
      logoutModal.innerHTML = `
        <div class="logout-modal-overlay"></div>
        <div class="logout-modal-content">
          <div class="logout-modal-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 16L21 12M21 12L17 8M21 12H7M13 16C13 17.6569 11.6569 19 10 19H6C4.34315 19 3 17.6569 3 16V8C3 6.34315 4.34315 5 6 5H10C11.6569 5 13 6.34315 13 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="logout-modal-header">
            <h3>Logout</h3>
            <p>Do you want to log out?</p>
          </div>
          <div class="logout-modal-body">
            <div class="logout-user-info">
              <div class="logout-user-avatar">
                <span>${userName.charAt(0).toUpperCase()}</span>
              </div>
              <div class="logout-user-details">
                <p class="logout-user-name">${userName}</p>
                <p class="logout-user-role">${user ? (user.role || "User") : "User"}</p>
              </div>
            </div>
          </div>
          <div class="logout-modal-actions">
            <button class="logout-btn logout-btn-cancel">
              <span>Cancel</span>
            </button>
            <button class="logout-btn logout-btn-confirm">
              <span>Logout</span>
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(logoutModal);
      
      // CRITICAL: Ensure modal is not active by default
      // Remove any active class that might have been added
      logoutModal.classList.remove("active");
      // Force display to none via inline style as backup
      logoutModal.style.display = "none";
      document.body.style.overflow = "";
      
      // Cancel button handler
      const cancelBtn = logoutModal.querySelector(".logout-btn-cancel");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          closeLogoutModal();
        });
      }
      
      // Confirm button handler
      const confirmBtn = logoutModal.querySelector(".logout-btn-confirm");
      if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
          // Check if user is still logged in before logging out
          if (!isLoggedIn()) {
            console.warn("Cannot logout: User is not logged in");
            closeLogoutModal();
            return;
          }
          
          closeLogoutModal();
          // Use window.logout to ensure it's available
          if (typeof window.logout === "function") {
            window.logout();
          } else if (typeof logout === "function") {
            logout();
          } else {
            // Fallback logout - only if logged in
            if (isLoggedIn()) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/index.html";
            }
          }
        });
      }
      
      // Close on overlay click
      const overlay = logoutModal.querySelector(".logout-modal-overlay");
      if (overlay) {
        overlay.addEventListener("click", () => {
          closeLogoutModal();
        });
      }
      
      // Close on Escape key
      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && logoutModal.classList.contains("active")) {
          closeLogoutModal();
        }
      });
    }
    
    // Show modal on logout link click ONLY
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if user is logged in before showing logout modal
      if (!isLoggedIn()) {
        console.warn("Cannot logout: User is not logged in");
        return;
      }
      
      if (logoutModal) {
        // Remove inline style and add active class
        logoutModal.style.display = "";
        logoutModal.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    });
  }
  
  // CRITICAL: Ensure any existing logout modal is closed on page load
  // Run this after a small delay to ensure it runs after all initialization
  setTimeout(() => {
    const allModals = document.querySelectorAll(".logout-modal");
    allModals.forEach(modal => {
      modal.classList.remove("active");
    });
    document.body.style.overflow = "";
  }, 100);
  
  // Close logout modal function
  function closeLogoutModal() {
    const logoutModal = document.querySelector(".logout-modal");
    if (logoutModal) {
      logoutModal.classList.remove("active");
      logoutModal.style.display = "none"; // Force hide
      document.body.style.overflow = "";
    }
  }
  
  // Make closeLogoutModal globally available
  window.closeLogoutModal = closeLogoutModal;

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

