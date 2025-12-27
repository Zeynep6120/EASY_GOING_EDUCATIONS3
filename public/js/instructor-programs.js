// Instructor Programs Management - Vanilla JavaScript

const API_BASE = "/api/instructor-programs";

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
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
  loadPrograms();
  loadInstructorPrograms();
  setupModal();
  setupForm();
});

// Load instructors for dropdown
async function loadInstructors() {
  try {
    // Get all users with role INSTRUCTOR
    const res = await fetch("/api/users", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("Failed to load instructors");
      return;
    }

    const users = await res.json();
    const instructors = users.filter(u => u.role === "INSTRUCTOR" || u.role === "TEACHER");
    const select = document.getElementById("instructorId");
    if (!select) return;

    select.innerHTML = '<option value="">Select Instructor</option>';
    instructors.forEach((instructor) => {
      const option = document.createElement("option");
      option.value = instructor.user_id || instructor.id;
      option.textContent = `${instructor.name || ""} ${instructor.surname || ""}`.trim();
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading instructors:", error);
  }
}

// Load programs for dropdown
async function loadPrograms() {
  try {
    const res = await fetch("/api/lesson-programs", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("Failed to load programs");
      return;
    }

    const programs = await res.json();
    const select = document.getElementById("lessonProgramId");
    if (!select) return;

    select.innerHTML = '<option value="">Select Program</option>';
    programs.forEach((program) => {
      const option = document.createElement("option");
      option.value = program.lesson_program_id || program.id;
      option.textContent = `${program.day_of_week || ""} ${formatTime(program.start_time)} - ${formatTime(program.stop_time)} (${program.term_name || ""})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading programs:", error);
  }
}

// Load instructor programs
async function loadInstructorPrograms() {
  const messageEl = document.getElementById("instructorProgramMessage");
  try {
    // Check if user is logged in
    if (!isLoggedIn()) {
      showMessage(messageEl, "Please login to view instructor programs", "error");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 2000);
      return;
    }

    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      // Handle 401 Unauthorized (invalid token)
      if (res.status === 401) {
        showMessage(messageEl, "Session expired. Please login again.", "error");
        setTimeout(() => {
          logout();
        }, 2000);
        return;
      }

      const errorData = await res.json().catch(() => ({ message: "Failed to load instructor programs" }));
      const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: Failed to load instructor programs`;
      throw new Error(errorMessage);
    }

    const data = await res.json();
    const instructorPrograms = Array.isArray(data) ? data : [];
    
    console.log("Loaded instructor programs:", instructorPrograms); // Debug log
    console.log("First instructor program sample:", instructorPrograms[0]); // Debug log - check first item
    
    // Verify data structure
    if (instructorPrograms.length > 0) {
      const first = instructorPrograms[0];
      console.log("Sample data structure:", {
        instructor_id: first.instructor_id,
        instructor_name: first.instructor_name,
        instructor_surname: first.instructor_surname,
        instructor_email: first.instructor_email,
        instructor_username: first.instructor_username,
        lesson_program_id: first.lesson_program_id,
        day_of_week: first.day_of_week,
        term_name: first.term_name,
        courses: first.courses
      });
    }
    
    displayInstructorPrograms(instructorPrograms);
    
    // Clear any previous error messages on success
    if (messageEl) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading instructor programs:", error);
    const errorMessage = error.message || "Failed to load instructor programs. Please check your permissions and try again.";
    
    // Check if it's a token-related error
    if (errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("unauthorized")) {
      showMessage(messageEl, "Session expired. Please login again.", "error");
      setTimeout(() => {
        logout();
      }, 2000);
    } else {
      showMessage(messageEl, errorMessage, "error");
    }
  }
}

// Display instructor programs in table
function displayInstructorPrograms(instructorPrograms) {
  const tbody = document.getElementById("instructorProgramTableBody");
  if (!tbody) return;

  if (instructorPrograms.length === 0) {
    tbody.innerHTML = "<tr><td colspan='13'>No instructor programs found</td></tr>";
    return;
  }

  // Build rows - each course should be on a separate row
  let rows = [];
  
  instructorPrograms.forEach((ip) => {
    // Debug: Log each instructor program to see what data we have
    console.log("Processing instructor program:", {
      instructor_id: ip.instructor_id,
      instructor_name: ip.instructor_name,
      instructor_surname: ip.instructor_surname,
      instructor_email: ip.instructor_email,
      instructor_username: ip.instructor_username,
      lesson_program_id: ip.lesson_program_id,
      day_of_week: ip.day_of_week,
      term_name: ip.term_name,
      courses_count: ip.courses ? ip.courses.length : 0
    });
    
    // If no program assigned, show instructor info but indicate no program
    if (!ip.lesson_program_id) {
      rows.push(`
    <tr>
      <td>${ip.instructor_id || ""}</td>
      <td>${ip.instructor_name || ip.instructor_full_name?.split(' ')[0] || ""}</td>
      <td>${ip.instructor_surname || ip.instructor_full_name?.split(' ').slice(1).join(' ') || ""}</td>
      <td>${ip.instructor_email || ""}</td>
      <td>${ip.instructor_username || ""}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>No program assigned</td>
      <td>-</td>
    </tr>
  `);
      return;
    }
    
    // If there are courses, create a row for each course
    if (ip.courses && ip.courses.length > 0) {
      ip.courses.forEach((course, index) => {
        const isFirstCourse = index === 0;
        rows.push(`
    <tr>
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">${ip.instructor_id || ""}</td>` : ''}
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">${ip.instructor_name || ip.instructor_full_name?.split(' ')[0] || ""}</td>` : ''}
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">${ip.instructor_surname || ip.instructor_full_name?.split(' ').slice(1).join(' ') || ""}</td>` : ''}
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">${ip.instructor_email || ""}</td>` : ''}
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">${ip.instructor_username || ""}</td>` : ''}
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">${ip.lesson_program_id || ""}</td>` : ''}
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">${ip.day_of_week || ""}</td>` : ''}
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">${ip.start_time && ip.stop_time ? formatTime(ip.start_time) + " - " + formatTime(ip.stop_time) : ""}</td>` : ''}
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">${ip.term_name || ""}</td>` : ''}
      <td>${course.course_id || ""}</td>
      <td>${course.course_name || course.title || "N/A"}</td>
      ${isFirstCourse ? `<td rowspan="${ip.courses.length}">
        <button class="btn-small btn-edit" onclick="editInstructorProgram(${ip.instructor_id}, ${ip.lesson_program_id})" style="margin-right: 5px;">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteInstructorProgram(${ip.instructor_id}, ${ip.lesson_program_id})">Delete</button>
      </td>` : ''}
    </tr>
  `);
      });
    } else {
      // No courses assigned
      rows.push(`
    <tr>
      <td>${ip.instructor_id || ""}</td>
      <td>${ip.instructor_name || ip.instructor_full_name?.split(' ')[0] || ""}</td>
      <td>${ip.instructor_surname || ip.instructor_full_name?.split(' ').slice(1).join(' ') || ""}</td>
      <td>${ip.instructor_email || ""}</td>
      <td>${ip.instructor_username || ""}</td>
      <td>${ip.lesson_program_id || ""}</td>
      <td>${ip.day_of_week || ""}</td>
      <td>${ip.start_time && ip.stop_time ? formatTime(ip.start_time) + " - " + formatTime(ip.stop_time) : ""}</td>
      <td>${ip.term_name || ""}</td>
      <td>-</td>
      <td>-</td>
      <td>
        <button class="btn-small btn-edit" onclick="editInstructorProgram(${ip.instructor_id}, ${ip.lesson_program_id})" style="margin-right: 5px;">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteInstructorProgram(${ip.instructor_id}, ${ip.lesson_program_id})">Delete</button>
      </td>
    </tr>
  `);
    }
  });
  
  tbody.innerHTML = rows.join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("instructorProgramModal");
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
      document.getElementById("instructorProgramForm").reset();
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Global variables for edit mode
let editingInstructorId = null;
let editingLessonProgramId = null;

// Setup form
function setupForm() {
  const addBtn = document.getElementById("addInstructorProgramBtn");
  const form = document.getElementById("instructorProgramForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      editingInstructorId = null;
      editingLessonProgramId = null;
      document.getElementById("modalTitle").textContent = "Add Instructor Program";
      document.getElementById("instructorProgramForm").reset();
      document.getElementById("instructorProgramModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("instructorProgramMessage");

  const formData = {
    instructor_id: parseInt(document.getElementById("instructorId").value),
    lesson_program_id: parseInt(document.getElementById("lessonProgramId").value),
  };

  if (!formData.instructor_id || !formData.lesson_program_id) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  try {
    if (editingInstructorId && editingLessonProgramId) {
      // Update mode
      showMessage(messageEl, "Updating instructor program...", "success");

      const res = await fetch(`${API_BASE}/${editingInstructorId}/${editingLessonProgramId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(messageEl, data.message || data.error || "Operation failed", "error");
        return;
      }

      showMessage(messageEl, "Instructor program updated successfully", "success");
    } else {
      // Create mode
      showMessage(messageEl, "Creating instructor program...", "success");

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(messageEl, data.message || data.error || "Operation failed", "error");
        return;
      }

      showMessage(messageEl, "Instructor program created successfully", "success");
    }

    document.getElementById("instructorProgramModal").style.display = "none";
    document.getElementById("instructorProgramForm").reset();
    editingInstructorId = null;
    editingLessonProgramId = null;
    loadInstructorPrograms();
  } catch (error) {
    console.error("Error saving instructor program:", error);
    showMessage(messageEl, "Error saving instructor program: " + error.message, "error");
  }
}

// Edit instructor program
window.editInstructorProgram = async function editInstructorProgram(instructorId, lessonProgramId) {
  editingInstructorId = instructorId;
  editingLessonProgramId = lessonProgramId;

  document.getElementById("modalTitle").textContent = "Edit Instructor Program";
  document.getElementById("instructorId").value = instructorId;
  document.getElementById("lessonProgramId").value = lessonProgramId;
  document.getElementById("instructorProgramModal").style.display = "block";
}

// Delete instructor program
window.deleteInstructorProgram = async function deleteInstructorProgram(instructorId, lessonProgramId) {
  if (!confirm("Are you sure you want to delete this instructor program assignment?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${instructorId}/${lessonProgramId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("instructorProgramMessage"), "Instructor program deleted successfully", "success");
      loadInstructorPrograms();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("instructorProgramMessage"), data.message || "Failed to delete instructor program", "error");
    }
  } catch (error) {
    console.error("Error deleting instructor program:", error);
    showMessage(document.getElementById("instructorProgramMessage"), "Error deleting instructor program: " + error.message, "error");
  }
}

