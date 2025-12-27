// Login/Register functionality - Vanilla JavaScript

const API_BASE = "/api/auth";

// Tab switching
function switchToLogin() {
  document.getElementById("loginTab").classList.add("active");
  document.getElementById("registerTab").classList.remove("active");
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
}

function switchToRegister() {
  document.getElementById("registerTab").classList.add("active");
  document.getElementById("loginTab").classList.remove("active");
  document.getElementById("registerForm").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
}

document.getElementById("loginTab").addEventListener("click", switchToLogin);
document.getElementById("registerTab").addEventListener("click", switchToRegister);

// Check hash on page load
if (window.location.hash === "#register") {
  switchToRegister();
}

// Role selection handler for register form
document.getElementById("regRole").addEventListener("change", (e) => {
  const role = e.target.value;
  const studentFields = document.getElementById("studentFields");
  const instructorFields = document.getElementById("instructorFields");

  if (studentFields) studentFields.classList.add("hidden");
  if (instructorFields) instructorFields.classList.add("hidden");

  if (role === "STUDENT") {
    if (studentFields) studentFields.classList.remove("hidden");
    loadAdvisorInstructors();
  } else if (role === "INSTRUCTOR") {
    if (instructorFields) instructorFields.classList.remove("hidden");
  }
});

// Load advisor instructors for student registration
async function loadAdvisorInstructors() {
  try {
    const res = await fetch(`${API_BASE}/instructors`);
    const instructors = await res.json();
    const select = document.getElementById("regAdvisorInstructor");
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Advisor Instructor</option>';
    instructors.forEach((instructor) => {
      const option = document.createElement("option");
      option.value = instructor.instructor_id || instructor.user_id;
      option.textContent = `${instructor.name} ${instructor.surname}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading instructors:", error);
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
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      showMessage(messageEl, "Invalid response from server", "error");
      return;
    }
    
    if (res.ok && data.token && data.user) {
      // Store token and user data
      try {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("Token and user data stored successfully");
        console.log("User role:", data.user.role);
        console.log("User ID:", data.user.id);
      } catch (storageError) {
        console.error("Failed to store in localStorage:", storageError);
        showMessage(messageEl, "Failed to save login information", "error");
        return;
      }

      // Redirect immediately without showing success message
      window.location.href = "/dashboard.html";
    } else {
      const errorMsg = data.message || data.error || "Login failed";
      console.error("Login failed:", errorMsg, data);
      showMessage(messageEl, errorMsg, "error");
    }
  } catch (error) {
    console.error("Login error:", error);
    showMessage(messageEl, "Connection error. Please try again.", "error");
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
    const advisorInstructorId = getValueOrNull("regAdvisorInstructor");
    registerData.advisor_instructor_id = advisorInstructorId
      ? parseInt(advisorInstructorId)
      : null;
  } else if (registerData.role === "INSTRUCTOR") {
    const isAdvisorCheckbox = document.getElementById("regIsAdvisorInstructor");
    registerData.is_advisor_instructor = isAdvisorCheckbox ? isAdvisorCheckbox.checked : false;
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
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });
    
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorData = { message: `HTTP ${res.status}: Registration failed` };
      }
      
      const errorMessage = errorData.error || errorData.message || errorData.detail || `HTTP ${res.status}: Registration failed`;
      console.error("Registration error response:", {
        status: res.status,
        statusText: res.statusText,
        error: errorData,
      });
      showMessage(messageEl, `Registration failed: ${errorMessage}`, "error");
      return;
    }
    
    const data = await res.json();
    console.log("Registration success response:", data);
    
    if (data.token && data.user) {
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
      showMessage(messageEl, data.message || "Registration failed - missing token or user data", "error");
      console.error("Registration error - missing data:", data);
    }
  } catch (error) {
    console.error("Register error:", error);
    const errorMessage = error.message || "Connection error. Please try again.";
    showMessage(messageEl, `Registration error: ${errorMessage}`, "error");
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

