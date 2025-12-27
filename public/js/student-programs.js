// Student Programs Management - Vanilla JavaScript

const API_BASE = "/api/student-programs";

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

  loadStudents();
  loadPrograms();
  loadStudentPrograms();
  setupModal();
  setupForm();
});

// Load students for dropdown
async function loadStudents() {
  try {
    const res = await fetch("/api/users", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("Failed to load students");
      return;
    }

    const users = await res.json();
    const students = users.filter(u => u.role === "STUDENT");
    const select = document.getElementById("studentId");
    if (!select) return;

    select.innerHTML = '<option value="">Select Student</option>';
    students.forEach((student) => {
      const option = document.createElement("option");
      option.value = student.user_id || student.id;
      option.textContent = `${student.name || ""} ${student.surname || ""}`.trim();
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading students:", error);
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

// Load student programs
async function loadStudentPrograms() {
  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load student programs" }));
      throw new Error(errorData.message || errorData.error || `HTTP ${res.status}: Failed to load student programs`);
    }

    const data = await res.json();
    const studentPrograms = Array.isArray(data) ? data : [];
    displayStudentPrograms(studentPrograms);
    
    // Clear any previous error messages on success
    const messageEl = document.getElementById("studentProgramMessage");
    if (messageEl && studentPrograms.length > 0) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading student programs:", error);
    showMessage(
      document.getElementById("studentProgramMessage"),
      "Error loading student programs: " + error.message,
      "error"
    );
  }
}

// Display student programs in table
function displayStudentPrograms(studentPrograms) {
  const tbody = document.getElementById("studentProgramTableBody");
  if (!tbody) return;

  if (studentPrograms.length === 0) {
    tbody.innerHTML = "<tr><td colspan='9'>No student programs found</td></tr>";
    return;
  }

  tbody.innerHTML = studentPrograms
    .map(
      (sp) => {
        const coursesList = sp.courses && sp.courses.length > 0 
          ? sp.courses.map(c => c.course_name || c.title || "N/A").join(", ")
          : "No courses assigned";
        
        return `
    <tr>
      <td>${sp.student_id}</td>
      <td>${sp.student_full_name || (sp.student_name || "") + " " + (sp.student_surname || "")}</td>
      <td>${sp.student_email || ""}</td>
      <td>${sp.lesson_program_id}</td>
      <td>${sp.day_of_week || ""}</td>
      <td>${formatTime(sp.start_time)} - ${formatTime(sp.stop_time)}</td>
      <td>${sp.term_name || ""}</td>
      <td>${coursesList}</td>
      <td>
        <button class="btn-small btn-delete" onclick="deleteStudentProgram(${sp.student_id}, ${sp.lesson_program_id})">Delete</button>
      </td>
    </tr>
  `;
      }
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("studentProgramModal");
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
      document.getElementById("studentProgramForm").reset();
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
  const addBtn = document.getElementById("addStudentProgramBtn");
  const form = document.getElementById("studentProgramForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Student Program";
      document.getElementById("studentProgramForm").reset();
      document.getElementById("studentProgramModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("studentProgramMessage");

  const formData = {
    student_id: parseInt(document.getElementById("studentId").value),
    lesson_program_id: parseInt(document.getElementById("lessonProgramId").value),
  };

  if (!formData.student_id || !formData.lesson_program_id) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  try {
    showMessage(messageEl, "Creating student program...", "success");

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

    showMessage(messageEl, "Student program created successfully", "success");
    document.getElementById("studentProgramModal").style.display = "none";
    document.getElementById("studentProgramForm").reset();
    loadStudentPrograms();
  } catch (error) {
    console.error("Error saving student program:", error);
    showMessage(messageEl, "Error saving student program: " + error.message, "error");
  }
}

// Delete student program
window.deleteStudentProgram = async function deleteStudentProgram(studentId, lessonProgramId) {
  if (!confirm("Are you sure you want to delete this student program enrollment?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${studentId}/${lessonProgramId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("studentProgramMessage"), "Student program deleted successfully", "success");
      loadStudentPrograms();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("studentProgramMessage"), data.message || "Failed to delete student program", "error");
    }
  } catch (error) {
    console.error("Error deleting student program:", error);
    showMessage(document.getElementById("studentProgramMessage"), "Error deleting student program: " + error.message, "error");
  }
}

