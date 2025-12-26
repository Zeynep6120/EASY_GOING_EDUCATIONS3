// API Service - Centralized API calls
import { API_BASE } from "../helpers/api-routes.js";

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem("token");
}

// Helper function to get auth headers
function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = token;
  }
  return headers;
}

// API Functions
export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  register: async (data) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Content
  getCourses: async (featured = false) => {
    const endpoint = featured ? "/featured" : "";
    const res = await fetch(`${API_BASE}/content/courses${endpoint}`);
    return res.json();
  },

  getCourse: async (id) => {
    const res = await fetch(`${API_BASE}/content/courses/${id}`);
    return res.json();
  },

  getInstructors: async () => {
    const res = await fetch(`${API_BASE}/content/instructors`);
    return res.json();
  },

  getInstructor: async (id) => {
    const res = await fetch(`${API_BASE}/content/instructors/${id}`);
    return res.json();
  },

  getEvents: async () => {
    const res = await fetch(`${API_BASE}/content/events`);
    return res.json();
  },

  getEvent: async (id) => {
    const res = await fetch(`${API_BASE}/content/events/${id}`);
    return res.json();
  },

  getSlides: async () => {
    const res = await fetch(`${API_BASE}/content/slides`);
    return res.json();
  },

  // Contact
  sendContactMessage: async (data) => {
    const res = await fetch(`${API_BASE}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Students
  getStudents: async () => {
    const res = await fetch(`${API_BASE}/auth/students`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};
