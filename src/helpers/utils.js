// Utility Functions
import { config } from "./config.js";

// Check if user is logged in
export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// Get current user
export function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

// Logout
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
}

// Show message
export function showMessage(element, text, type = "success") {
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`;
  setTimeout(() => {
    element.textContent = "";
    element.className = "message";
  }, 5000);
}

// Format date
export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time
export function formatTime(timeString) {
  if (!timeString) return "";
  return timeString.substring(0, 5); // HH:MM
}

// Check authentication and redirect if needed
export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "/index.html";
    return false;
  }
  return true;
}

// Check role and redirect if needed
export function requireRole(allowedRoles) {
  if (!requireAuth()) return false;
  const user = getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    window.location.href = "/unauthorized.html";
    return false;
  }
  return true;
}

// Check if user has access to route
export function getIsUserAuthorized(role, path) {
  const userRight = config.userRightsOnRoutes.find((item) =>
    item.urlRegex.test(path)
  );

  if (!userRight) return false;
  return userRight.roles.includes(role);
}

