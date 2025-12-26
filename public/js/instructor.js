// Instructor Management - Vanilla JavaScript

const API_BASE = "/api/instructors";

let currentPage = 0;
const pageSize = 10;

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER" && user.role !== "ASSISTANT_MANAGER")) {
    window.location.href = "/unauthorized.html";
    return false;
  }
  return true;
}

// Initialize page
document.addEventListener("DOMContentLoaded", function() {
  if (!checkAuth()) return;
  
  if (typeof initHeader === "function") {
    initHeader();
  }

  loadInstructors();
  setupModal();
  setupForm();
});

// Load instructors
async function loadInstructors() {
  try {
    const res = await fetch(
      `${API_BASE}/search?page=${currentPage}&size=${pageSize}&sort=name&type=asc`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load instructors" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Failed to load instructors`);
    }

    const data = await res.json();
    console.log("Instructor data received:", data); // Debug log
    const instructors = data.content || data || [];
    console.log("Instructors array:", instructors); // Debug log
    displayInstructors(instructors);
  } catch (error) {
    console.error("Error loading instructors:", error);
    showMessage(
      document.getElementById("instructorMessage"),
      "Error loading instructors: " + error.message,
      "error"
    );
  }
}

// Display instructors in table
function displayInstructors(instructors) {
  const tbody = document.getElementById("instructorTableBody");
  if (!tbody) return;

  if (instructors.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7'>No instructors found</td></tr>";
    return;
  }

  tbody.innerHTML = instructors
    .map(
      (instructor) => `
    <tr>
      <td>${instructor.user_id || instructor.id || instructor.instructor_id}</td>
      <td>${instructor.username}</td>
      <td>${instructor.name}</td>
      <td>${instructor.surname || ""}</td>
      <td>${instructor.email}</td>
      <td>${instructor.is_advisor_instructor ? "Yes" : "No"}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editInstructor(${instructor.user_id || instructor.id || instructor.instructor_id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteInstructor(${instructor.user_id || instructor.id || instructor.instructor_id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("instructorModal");
  const closeBtn = document.querySelector(".close");
  const cancelBtn = document.getElementById("cancelBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
      document.getElementById("instructorForm").reset();
      document.getElementById("instructorId").value = "";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Setup form
function setupForm() {
  const addBtn = document.getElementById("addInstructorBtn");
  const form = document.getElementById("instructorForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Instructor";
      document.getElementById("instructorForm").reset();
      document.getElementById("instructorId").value = "";
      document.getElementById("instructorPassword").required = true;
      document.getElementById("instructorModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("instructorMessage");
  const instructorId = document.getElementById("instructorId").value;

  const formData = {
    username: document.getElementById("instructorUsername").value.trim(),
    name: document.getElementById("instructorName").value.trim(),
    surname: document.getElementById("instructorSurname").value.trim(),
    email: document.getElementById("instructorEmail").value.trim(),
    gender: document.getElementById("instructorGender").value || null,
    birth_date: document.getElementById("instructorBirthDate").value || null,
    birth_place: document.getElementById("instructorBirthPlace").value.trim() || null,
    phone_number: document.getElementById("instructorPhone").value.trim() || null,
    ssn: document.getElementById("instructorSSN").value.trim() || null,
    role: "INSTRUCTOR",
    is_advisor_instructor: document.getElementById("instructorIsAdvisor").checked,
  };

  const password = document.getElementById("instructorPassword").value.trim();
  if (password) {
    formData.password = password;
  }

  // Validation
  if (!formData.username || !formData.name || !formData.surname || !formData.email) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  if (!instructorId && !formData.password) {
    showMessage(messageEl, "Password is required for new instructor", "error");
    return;
  }

  try {
    showMessage(messageEl, instructorId ? "Updating instructor..." : "Creating instructor...", "success");

    let res;
    if (instructorId) {
      // Update
      res = await fetch(`${API_BASE}/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, id: parseInt(instructorId) }),
      });
    } else {
      // Create
      res = await fetch(`${API_BASE}/save`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Unknown error occurred" }));
      const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: Operation failed`;
      console.error("Error response:", errorData);
      showMessage(messageEl, errorMessage, "error");
      return;
    }

    const data = await res.json();
    console.log("Success response:", data);

    showMessage(messageEl, instructorId ? "Instructor updated successfully" : "Instructor created successfully", "success");
    document.getElementById("instructorModal").style.display = "none";
    document.getElementById("instructorForm").reset();
    document.getElementById("instructorId").value = "";
    
    // Reload instructors after a short delay to ensure database is updated
    setTimeout(() => {
      loadInstructors();
    }, 500);
  } catch (error) {
    console.error("Error saving instructor:", error);
    showMessage(messageEl, "Error saving instructor: " + error.message, "error");
  }
}

// Edit instructor
async function editInstructor(id) {
  try {
    const res = await fetch(`${API_BASE}/getSavedInstructorById/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load instructor");

    const instructor = await res.json();

    if (!instructor) {
      showMessage(document.getElementById("instructorMessage"), "Instructor not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Instructor";
    document.getElementById("instructorId").value = instructor.user_id || instructor.id || instructor.instructor_id;
    document.getElementById("instructorUsername").value = instructor.username || "";
    document.getElementById("instructorName").value = instructor.name || "";
    document.getElementById("instructorSurname").value = instructor.surname || "";
    document.getElementById("instructorEmail").value = instructor.email || "";
    document.getElementById("instructorGender").value = instructor.gender || "";
    document.getElementById("instructorBirthDate").value = instructor.birth_date || "";
    document.getElementById("instructorBirthPlace").value = instructor.birth_place || "";
    document.getElementById("instructorPhone").value = instructor.phone_number || "";
    document.getElementById("instructorSSN").value = instructor.ssn || "";
    document.getElementById("instructorIsAdvisor").checked = instructor.is_advisor_instructor || false;
    document.getElementById("instructorPassword").required = false;

    document.getElementById("instructorModal").style.display = "block";
  } catch (error) {
    console.error("Error loading instructor:", error);
    showMessage(document.getElementById("instructorMessage"), "Error loading instructor", "error");
  }
}

// Delete instructor
async function deleteInstructor(id) {
  if (!confirm("Are you sure you want to delete this instructor?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/delete/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("instructorMessage"), "Instructor deleted successfully", "success");
      loadInstructors();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("instructorMessage"), data.message || "Failed to delete instructor", "error");
    }
  } catch (error) {
    console.error("Error deleting instructor:", error);
    showMessage(document.getElementById("instructorMessage"), "Error deleting instructor: " + error.message, "error");
  }
}

