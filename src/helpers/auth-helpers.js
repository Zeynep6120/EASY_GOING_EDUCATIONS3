// Authentication helper functions
import { isLoggedIn, getCurrentUser } from "./utils.js";
import { config } from "./config.js";

// Get auth token from localStorage
export function getAuthToken() {
  return localStorage.getItem("token");
}

// Get auth headers for API calls
export function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = token;
  }
  return headers;
}

// Parse JWT token
function parseJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    return null;
  }
}

// Check if token is valid
export function getIsTokenValid(token) {
  if (!token) return false;

  try {
    const decoded = parseJWT(token);
    if (!decoded || !decoded.exp) return false;

    const jwtExpireTimeStamp = decoded.exp;
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);

    return jwtExpireTimeStamp >= currentTimestamp;
  } catch (error) {
    return false;
  }
}

// Check if user is authorized for a route
export function getIsUserAuthorized(role, path) {
  const userRight = config.userRightsOnRoutes.find((item) =>
    item.urlRegex.test(path)
  );

  if (!userRight) return false;
  return userRight.roles.includes(role);
}

// Check authentication and authorization
export function requireAuthAndRole(allowedRoles, path) {
  if (!isLoggedIn()) {
    window.location.href = "/index.html";
    return false;
  }

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/index.html";
    return false;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    window.location.href = "/unauthorized.html";
    return false;
  }

  if (path && !getIsUserAuthorized(user.role, path)) {
    window.location.href = "/unauthorized.html";
    return false;
  }

  return true;
}

