// Utility Functions - Vanilla JavaScript (No imports)

// Check if user is logged in
function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

// Logout
function logout() {
  // Check if user is logged in before logging out
  if (!isLoggedIn()) {
    console.warn("Cannot logout: User is not logged in");
    return;
  }
  
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
}

// Make logout globally available
window.logout = logout;

// Show message
function showMessage(element, text, type = "success") {
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`;
  setTimeout(() => {
    element.textContent = "";
    element.className = "message";
  }, 5000);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time
function formatTime(timeString) {
  if (!timeString) return "";
  return timeString.substring(0, 5); // HH:MM
}

// Check authentication and redirect if needed
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "/index.html";
    return false;
  }
  return true;
}

// Check role and redirect if needed
function requireRole(allowedRoles) {
  if (!requireAuth()) return false;
  const user = getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    window.location.href = "/unauthorized.html";
    return false;
  }
  return true;
}

// Get auth token
function getAuthToken() {
  return localStorage.getItem("token");
}

// Get auth headers
function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

