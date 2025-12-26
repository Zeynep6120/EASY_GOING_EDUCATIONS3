// Login/Register functionality
import { api } from "./api.js";
import { showMessage } from "../helpers/utils.js";

const API_BASE = "/api/auth";

// Tab switching
document.getElementById("loginTab").addEventListener("click", () => {
  document.getElementById("loginTab").classList.add("active");
  document.getElementById("registerTab").classList.remove("active");
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
});

document.getElementById("registerTab").addEventListener("click", () => {
  document.getElementById("registerTab").classList.add("active");
  document.getElementById("loginTab").classList.remove("active");
  document.getElementById("registerForm").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
});

// Role selection handler for register form
document.getElementById("regRole").addEventListener("change", (e) => {
  const role = e.target.value;
  const studentFields = document.getElementById("studentFields");
  const teacherFields = document.getElementById("teacherFields");

  studentFields.classList.add("hidden");
  teacherFields.classList.add("hidden");

  if (role === "STUDENT") {
    studentFields.classList.remove("hidden");
    loadAdvisorTeachers();
  } else if (role === "TEACHER") {
    teacherFields.classList.remove("hidden");
  }
});

// Load advisor teachers for student registration
async function loadAdvisorTeachers() {
  try {
    const res = await fetch(`${API_BASE}/teachers`);
    const teachers = await res.json();
    const select = document.getElementById("regAdvisorTeacher");
    select.innerHTML = '<option value="">Select Advisor Teacher</option>';
    teachers.forEach((teacher) => {
      const option = document.createElement("option");
      option.value = teacher.teacher_id || teacher.user_id;
      option.textContent = `${teacher.name} ${teacher.surname}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading teachers:", error);
  }
}

// Login functionality
document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const messageEl = document.getElementById("loginMessage");

  if (!username || !password) {
    showMessage(messageEl, "Please enter username and password", "error");
    return;
  }

  try {
    const data = await api.login(username, password);
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Display user information
      const userInfo = `
        Login successful!
        Name: ${data.user.name} ${data.user.surname}
        Role: ${data.user.role}
        Email: ${data.user.email}
        ${data.user.gender ? `Gender: ${data.user.gender}` : ""}
        ${data.user.phone_number ? `Phone: ${data.user.phone_number}` : ""}
        ${data.user.birth_date ? `Birth Date: ${data.user.birth_date}` : ""}
        ${
          data.user.is_advisor_teacher !== undefined
            ? `Advisor Teacher: ${data.user.is_advisor_teacher ? "Yes" : "No"}`
            : ""
        }
        ${data.user.father_name ? `Father: ${data.user.father_name}` : ""}
        ${data.user.mother_name ? `Mother: ${data.user.mother_name}` : ""}
        Redirecting...
      `;
      showMessage(messageEl, userInfo, "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 2000);
    } else {
      showMessage(messageEl, data.message || "Login failed", "error");
    }
  } catch (error) {
    showMessage(messageEl, "Connection error. Please try again.", "error");
    console.error("Login error:", error);
  }
});

// Helper function to get value or null (for empty strings)
function getValueOrNull(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return null;
  const value = element.value.trim();
  return value === "" ? null : value;
}

// Register functionality
document.getElementById("registerBtn").addEventListener("click", async () => {
  const messageEl = document.getElementById("registerMessage");

  // Get all form values - convert empty strings to null
  const registerData = {
    username: getValueOrNull("regUsername"),
    password: getValueOrNull("regPassword"),
    name: getValueOrNull("regName"),
    surname: getValueOrNull("regSurname"),
    email: getValueOrNull("regEmail"),
    role: getValueOrNull("regRole"),
    gender: getValueOrNull("regGender"),
    birth_date: getValueOrNull("regBirthDate"),
    birth_place: getValueOrNull("regBirthPlace"),
    phone_number: getValueOrNull("regPhone"),
    ssn: getValueOrNull("regSSN"),
  };

  // Add role-specific fields
  if (registerData.role === "STUDENT") {
    registerData.father_name = getValueOrNull("regFatherName");
    registerData.mother_name = getValueOrNull("regMotherName");
    const advisorTeacherId = getValueOrNull("regAdvisorTeacher");
    registerData.advisor_teacher_id = advisorTeacherId
      ? parseInt(advisorTeacherId)
      : null;
  } else if (registerData.role === "TEACHER") {
    registerData.is_advisor_teacher = document.getElementById(
      "regIsAdvisorTeacher"
    ).checked;
  }

  // Validation
  if (
    !registerData.username ||
    !registerData.password ||
    !registerData.name ||
    !registerData.surname ||
    !registerData.email ||
    !registerData.role
  ) {
    showMessage(messageEl, "Please fill all required fields (*)", "error");
    return;
  }

  // Show loading message
  showMessage(messageEl, "Registering user...", "success");

  try {
    console.log("Sending registration data:", registerData);
    const data = await api.register(registerData);
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Show success message with user info
      const userInfo = `
        Registration successful!
        Name: ${data.user.name} ${data.user.surname}
        Role: ${data.user.role}
        Email: ${data.user.email}
        ${data.user.gender ? `Gender: ${data.user.gender}` : ""}
        ${data.user.phone_number ? `Phone: ${data.user.phone_number}` : ""}
        Redirecting...
      `;
      showMessage(messageEl, userInfo, "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 2000);
    } else {
      showMessage(messageEl, data.message || "Registration failed", "error");
      console.error("Registration error:", data);
    }
  } catch (error) {
    showMessage(messageEl, "Connection error. Please try again.", "error");
    console.error("Register error:", error);
  }
});

// Seed Users functionality
document.getElementById("seedUsersBtn").addEventListener("click", async () => {
  const messageEl = document.getElementById("loginMessage");
  showMessage(messageEl, "Creating seed users...", "success");

  try {
    const res = await fetch(`${API_BASE}/seed-users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (res.ok) {
      const created = data.users.filter((u) => u.status === "created").length;
      const existing = data.users.filter(
        (u) => u.status === "already exists"
      ).length;
      showMessage(
        messageEl,
        `Seed users completed: ${created} created, ${existing} already exist`,
        "success"
      );
    } else {
      showMessage(messageEl, data.message || "Failed to seed users", "error");
    }
  } catch (error) {
    showMessage(messageEl, "Connection error. Please try again.", "error");
    console.error("Seed users error:", error);
  }
});

// API Health Check functionality
document.getElementById("apiHealthBtn").addEventListener("click", async () => {
  const messageEl = document.getElementById("loginMessage");
  showMessage(messageEl, "Checking API health...", "success");

  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (res.ok && data.status === "healthy") {
      showMessage(
        messageEl,
        `API is healthy! Database: ${data.database}`,
        "success"
      );
    } else {
      showMessage(
        messageEl,
        `API is unhealthy. Database: ${data.database}`,
        "error"
      );
    }
  } catch (error) {
    showMessage(messageEl, "API is not reachable", "error");
    console.error("Health check error:", error);
  }
});

// Admin Status Check functionality
document
  .getElementById("adminStatusBtn")
  .addEventListener("click", async () => {
    const messageEl = document.getElementById("loginMessage");
    showMessage(messageEl, "Checking admin status...", "success");

    try {
      const res = await fetch(`${API_BASE}/admin-status`);
      const data = await res.json();
      if (res.ok) {
        if (data.exists) {
          const adminInfo = data.admins
            .map(
              (admin) =>
                `Username: ${admin.username}, Email: ${admin.email}, Name: ${admin.name}`
            )
            .join("\n");
          showMessage(
            messageEl,
            `Admin found!\n${adminInfo}\n\nLogin: admin / 12345`,
            "success"
          );
        } else {
          showMessage(
            messageEl,
            `No admin found. Run 'npm run db:admin' to create admin user.\nOr admin will be created automatically on server start.`,
            "error"
          );
        }
      } else {
        showMessage(
          messageEl,
          data.message || "Error checking admin status",
          "error"
        );
      }
    } catch (error) {
      showMessage(messageEl, "Connection error. Please try again.", "error");
      console.error("Admin status check error:", error);
    }
  });

// Allow Enter key to submit login
document.getElementById("password").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("loginBtn").click();
  }
});

document.getElementById("username").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("loginBtn").click();
  }
});

// Allow Enter key to submit register form
document.getElementById("registerForm").addEventListener("keypress", (e) => {
  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
    e.preventDefault();
    document.getElementById("registerBtn").click();
  }
});
