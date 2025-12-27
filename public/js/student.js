// Student Management - Vanilla JavaScript

const API_BASE = "/api/students";
// const STUDENT_INFO_API = "/api/student-info"; // Removed: student_info table merged into students

let currentPage = 0;
const pageSize = 10;
let currentTab = "students";

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  // ADMIN, MANAGER, ASSISTANT_MANAGER, INSTRUCTOR can access
  if (!user || !["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "INSTRUCTOR"].includes(user.role)) {
    window.location.href = "/unauthorized.html";
    return false;
  }
  return true;
}

// Tab switching (global function for onclick)
window.showTab = function(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn, index) => {
    btn.classList.remove("active");
    if ((tabName === "students" && index === 0) || (tabName === "studentInfo" && index === 1)) {
      btn.classList.add("active");
    }
  });
  
  // Show/hide tab content
  document.getElementById("studentsTab").style.display = tabName === "students" ? "block" : "none";
  document.getElementById("studentInfoTab").style.display = tabName === "studentInfo" ? "block" : "none";
  
  // Load data for active tab
  // if (tabName === "studentInfo") {
  //   loadStudentInfo(); // Removed: student_info table merged into students
  // } else {
    loadStudents();
  // }
}

// Initialize page
document.addEventListener("DOMContentLoaded", function() {
  if (!checkAuth()) return;
  
  if (typeof initHeader === "function") {
    initHeader();
  }

  loadAdvisorInstructors();
  loadStudents();
  loadLessons();
  loadTerms();
  setupModal();
  setupForm();
  // setupStudentInfoModal(); // Removed: student_info table merged into students
  // setupStudentInfoForm(); // Removed: student_info table merged into students
});

// Load advisor instructors for dropdown
async function loadAdvisorInstructors() {
  try {
    // Check if user is logged in
    if (!isLoggedIn()) {
      return;
    }

    const res = await fetch("/api/advisor-instructor/getAll", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      // Handle 401 Unauthorized (invalid token)
      if (res.status === 401) {
        console.error("Invalid token when loading advisor instructors");
        return;
      }
      console.error("Failed to load advisor instructors");
      return;
    }

    const instructors = await res.json();
    const select = document.getElementById("studentAdvisorInstructor");
    if (!select) return;

    select.innerHTML = '<option value="">Select Advisor Instructor</option>';
    if (Array.isArray(instructors)) {
      instructors.forEach((instructor) => {
        const option = document.createElement("option");
        option.value = instructor.user_id || instructor.instructor_id;
        option.textContent = `${instructor.name || ""} ${instructor.surname || ""}`.trim();
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading advisor instructors:", error);
  }
}

// Load students
async function loadStudents() {
  const messageEl = document.getElementById("studentMessage");
  try {
    // Check if user is logged in
    if (!isLoggedIn()) {
      showMessage(messageEl, "Please login to view students", "error");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 2000);
      return;
    }

    // Load all students without pagination
    const res = await fetch(
      `${API_BASE}/getAll`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      // Handle 401 Unauthorized (invalid token)
      if (res.status === 401) {
        showMessage(messageEl, "Session expired. Please login again.", "error");
        setTimeout(() => {
          logout();
        }, 2000);
        return;
      }

      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await res.json();
    const students = Array.isArray(data) ? data : [];
    
    // Sort students by name
    const sortedStudents = [...students].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    displayStudents(sortedStudents);
    
    // Clear any previous error messages on success
    if (messageEl) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading students:", error);
    const errorMessage = error.message || "Failed to load students. Please check your permissions and try again.";
    
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

// Display students in table
function displayStudents(students) {
  const tbody = document.getElementById("studentTableBody");
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = "<tr><td colspan='9'>No students found</td></tr>";
    return;
  }

  tbody.innerHTML = students
    .map(
      (student) => `
    <tr>
      <td>${student.user_id || student.id || student.student_id}</td>
      <td>${student.username}</td>
      <td>${student.name}</td>
      <td>${student.surname || ""}</td>
      <td>${student.email}</td>
      <td>${student.father_name || ""}</td>
      <td>${student.mother_name || ""}</td>
      <td>${student.advisor_name ? `${student.advisor_name} ${student.advisor_surname || ""}` : ""}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editStudent(${student.user_id || student.id || student.student_id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteStudent(${student.user_id || student.id || student.student_id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("studentModal");
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
      document.getElementById("studentForm").reset();
      document.getElementById("studentId").value = "";
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
  const addBtn = document.getElementById("addStudentBtn");
  const form = document.getElementById("studentForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Student";
      document.getElementById("studentForm").reset();
      document.getElementById("studentId").value = "";
      document.getElementById("studentPassword").required = true;
      loadAdvisorInstructors();
      document.getElementById("studentModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("studentMessage");
  const studentId = document.getElementById("studentId").value;

  const formData = {
    username: document.getElementById("studentUsername").value.trim(),
    name: document.getElementById("studentName").value.trim(),
    surname: document.getElementById("studentSurname").value.trim(),
    email: document.getElementById("studentEmail").value.trim(),
    gender: document.getElementById("studentGender").value || null,
    birth_date: document.getElementById("studentBirthDate").value || null,
    birth_place: document.getElementById("studentBirthPlace").value.trim() || null,
    phone_number: document.getElementById("studentPhone").value.trim() || null,
    ssn: document.getElementById("studentSSN").value.trim() || null,
    role: "STUDENT",
    father_name: document.getElementById("studentFatherName").value.trim(),
    mother_name: document.getElementById("studentMotherName").value.trim(),
    advisor_instructor_id: document.getElementById("studentAdvisorInstructor").value 
      ? parseInt(document.getElementById("studentAdvisorInstructor").value) 
      : null,
  };

  const password = document.getElementById("studentPassword").value.trim();
  if (password) {
    formData.password = password;
  }

  // Validation
  if (!formData.username || !formData.name || !formData.surname || !formData.email || 
      !formData.father_name || !formData.mother_name) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  // Advisor instructor is optional for update, required for create
  if (!studentId && !formData.advisor_instructor_id) {
    showMessage(messageEl, "Advisor Instructor is required for new students", "error");
    return;
  }

  if (!studentId && !formData.password) {
    showMessage(messageEl, "Password is required for new student", "error");
    return;
  }

  try {
    showMessage(messageEl, studentId ? "Updating student..." : "Creating student...", "success");

    let res;
    if (studentId) {
      // Update
      res = await fetch(`${API_BASE}/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, id: parseInt(studentId) }),
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
      let errorData;
      try {
        errorData = await res.json();
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorData = { message: `HTTP ${res.status}: Operation failed` };
      }
      
      const errorMessage = errorData.error || errorData.message || errorData.detail || `HTTP ${res.status}: Operation failed`;
      console.error("Error response:", {
        status: res.status,
        statusText: res.statusText,
        error: errorData,
      });
      showMessage(messageEl, `Operation failed: ${errorMessage}`, "error");
      return;
    }

    const data = await res.json();
    console.log("Success response:", data);

    showMessage(messageEl, studentId ? "Student updated successfully" : "Student created successfully", "success");
    document.getElementById("studentModal").style.display = "none";
    document.getElementById("studentForm").reset();
    document.getElementById("studentId").value = "";
    
    // Reload students after a short delay to ensure database is updated
    setTimeout(() => {
      loadStudents();
    }, 500);
  } catch (error) {
    console.error("Error saving student:", error);
    showMessage(messageEl, "Error saving student: " + error.message, "error");
  }
}

// Edit student (make it globally accessible)
window.editStudent = async function editStudent(id) {
  const messageEl = document.getElementById("studentMessage");
  try {
    console.log("Loading student with ID:", id);
    
    if (!id) {
      showMessage(messageEl, "Invalid student ID", "error");
      return;
    }

    const res = await fetch(`${API_BASE}/getStudentById?id=${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (parseError) {
        errorData = { message: `HTTP ${res.status}: Failed to load student` };
      }
      const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: Failed to load student`;
      showMessage(messageEl, errorMessage, "error");
      return;
    }

    const student = await res.json();
    console.log("Student data loaded:", student);

    if (!student || (!student.user_id && !student.id && !student.student_id)) {
      showMessage(messageEl, "Student not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Student";
    const studentId = student.user_id || student.id || student.student_id;
    document.getElementById("studentId").value = studentId;
    document.getElementById("studentUsername").value = student.username || "";
    document.getElementById("studentName").value = student.name || "";
    document.getElementById("studentSurname").value = student.surname || "";
    document.getElementById("studentEmail").value = student.email || "";
    document.getElementById("studentGender").value = student.gender || "";
    document.getElementById("studentBirthDate").value = student.birth_date ? student.birth_date.split('T')[0] : "";
    document.getElementById("studentBirthPlace").value = student.birth_place || "";
    document.getElementById("studentPhone").value = student.phone_number || "";
    document.getElementById("studentSSN").value = student.ssn || "";
    document.getElementById("studentFatherName").value = student.father_name || "";
    document.getElementById("studentMotherName").value = student.mother_name || "";
    
    // Load advisor instructors first, then set the value
    await loadAdvisorInstructors();
    document.getElementById("studentAdvisorInstructor").value = student.advisor_instructor_id || "";
    document.getElementById("studentPassword").required = false;

    document.getElementById("studentModal").style.display = "block";
  } catch (error) {
    console.error("Error loading student:", error);
    showMessage(messageEl, "Error loading student: " + (error.message || "Unknown error"), "error");
  }
}

// Delete student (make it globally accessible)
window.deleteStudent = async function deleteStudent(id) {
  const messageEl = document.getElementById("studentMessage");
  
  // Validate ID
  const studentId = id ? parseInt(id) : null;
  if (!studentId || isNaN(studentId)) {
    showMessage(messageEl, "Invalid student ID", "error");
    return;
  }

  if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
    return;
  }

  try {
    console.log("Deleting student with ID:", studentId);
    showMessage(messageEl, "Deleting student...", "success");
    
    const res = await fetch(`${API_BASE}/delete/${studentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Delete response:", data);
      showMessage(messageEl, data.message || "Student deleted successfully", "success");
      
      // Reload students after a short delay
      setTimeout(() => {
        loadStudents();
      }, 500);
    } else {
      let errorData;
      try {
        errorData = await res.json();
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorData = { 
          message: `HTTP ${res.status}: Failed to delete student`,
          error: res.statusText 
        };
      }
      
      const errorMessage = errorData.error || errorData.message || `HTTP ${res.status}: Failed to delete student`;
      console.error("Delete error response:", {
        status: res.status,
        statusText: res.statusText,
        error: errorData,
      });
      
      showMessage(messageEl, errorMessage, "error");
    }
  } catch (error) {
    console.error("Error deleting student:", error);
    showMessage(messageEl, "Error deleting student: " + (error.message || "Unknown error"), "error");
  }
}

// ========== Student Info Functions ==========

// Load lessons for dropdown
async function loadLessons() {
  try {
    const res = await fetch("/api/lessons", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("Failed to load lessons");
      return;
    }

    const lessons = await res.json();
    const select = document.getElementById("infoLessonId");
    if (!select) return;

    select.innerHTML = '<option value="">Select Lesson</option>';
    lessons.forEach((lesson) => {
      const option = document.createElement("option");
      option.value = lesson.lesson_id;
      option.textContent = lesson.lesson_name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading lessons:", error);
  }
}

// Load terms for dropdown
async function loadTerms() {
  try {
    const res = await fetch("/api/terms", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("Failed to load terms");
      return;
    }

    const terms = await res.json();
    const select = document.getElementById("infoTermId");
    if (!select) return;

    select.innerHTML = '<option value="">Select Term</option>';
    terms.forEach((term) => {
      const option = document.createElement("option");
      option.value = term.term_id;
      option.textContent = term.term_name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading terms:", error);
  }
}

// Load students for student info dropdown
async function loadStudentsForInfo() {
  try {
    const res = await fetch(`${API_BASE}/getAll`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("Failed to load students");
      return;
    }

    const students = await res.json();
    const select = document.getElementById("infoStudentId");
    if (!select) return;

    select.innerHTML = '<option value="">Select Student</option>';
    students.forEach((student) => {
      const option = document.createElement("option");
      option.value = student.user_id || student.id || student.student_id;
      option.textContent = `${student.name} ${student.surname || ""} (${student.username})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading students for info:", error);
  }
}

// Load student info
async function loadStudentInfo() {
  try {
    const res = await fetch(STUDENT_INFO_API, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to load student info");
    }

    const data = await res.json();
    const studentInfo = Array.isArray(data) ? data : [];
    displayStudentInfo(studentInfo);
  } catch (error) {
    console.error("Error loading student info:", error);
    showMessage(
      document.getElementById("studentMessage"),
      "Error loading student info: " + error.message,
      "error"
    );
  }
}

// Display student info in table
function displayStudentInfo(studentInfo) {
  const tbody = document.getElementById("studentInfoTableBody");
  if (!tbody) return;

  if (studentInfo.length === 0) {
    tbody.innerHTML = "<tr><td colspan='10'>No student info found</td></tr>";
    return;
  }

  tbody.innerHTML = studentInfo
    .map(
      (info) => `
    <tr>
      <td>${info.student_info_id || info.info_id || info.id}</td>
      <td>${info.student_name || ""} ${info.student_surname || ""}</td>
      <td>${info.lesson_name || ""}</td>
      <td>${info.term_name || ""}</td>
      <td>${info.absentee || 0}</td>
      <td>${info.midterm_exam !== null && info.midterm_exam !== undefined ? info.midterm_exam : "-"}</td>
      <td>${info.final_exam !== null && info.final_exam !== undefined ? info.final_exam : "-"}</td>
      <td>${info.average !== null && info.average !== undefined ? info.average : "-"}</td>
      <td>${info.note || "-"}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editStudentInfo(${info.student_info_id || info.info_id || info.id})">Edit</button>
        ${getCurrentUser()?.role === "ADMIN" ? `<button class="btn-small btn-delete" onclick="deleteStudentInfo(${info.student_info_id || info.info_id || info.id})">Delete</button>` : ""}
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup student info modal
function setupStudentInfoModal() {
  const modal = document.getElementById("studentInfoModal");
  const closeBtn = document.querySelector(".close-info");
  const cancelBtn = document.getElementById("cancelInfoBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
      document.getElementById("studentInfoForm").reset();
      document.getElementById("studentInfoId").value = "";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Setup student info form
function setupStudentInfoForm() {
  const addBtn = document.getElementById("addStudentInfoBtn");
  const form = document.getElementById("studentInfoForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const user = getCurrentUser();
      // Only ADMIN, MANAGER, INSTRUCTOR can create student info
      if (!user || !["ADMIN", "MANAGER", "INSTRUCTOR"].includes(user.role)) {
        showMessage(document.getElementById("studentMessage"), "You don't have permission to create student info", "error");
        return;
      }
      
      document.getElementById("studentInfoModalTitle").textContent = "Add Student Info";
      document.getElementById("studentInfoForm").reset();
      document.getElementById("studentInfoId").value = "";
      loadStudentsForInfo();
      loadLessons();
      loadTerms();
      document.getElementById("studentInfoModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleStudentInfoSubmit);
  }
}

// Handle student info form submit
async function handleStudentInfoSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("studentMessage");
  const infoId = document.getElementById("studentInfoId").value;

  const formData = {
    student_id: parseInt(document.getElementById("infoStudentId").value),
    lesson_id: parseInt(document.getElementById("infoLessonId").value),
    term_id: parseInt(document.getElementById("infoTermId").value),
    absentee: parseInt(document.getElementById("infoAbsentee").value) || 0,
    midterm_exam: document.getElementById("infoMidterm").value ? parseFloat(document.getElementById("infoMidterm").value) : null,
    final_exam: document.getElementById("infoFinal").value ? parseFloat(document.getElementById("infoFinal").value) : null,
    average: document.getElementById("infoAverage").value ? parseFloat(document.getElementById("infoAverage").value) : null,
    note: document.getElementById("infoNote").value || null,
    info_note: document.getElementById("infoNoteText").value.trim() || null,
  };

  // Validation
  if (!formData.student_id || !formData.lesson_id || !formData.term_id) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  try {
    showMessage(messageEl, infoId ? "Updating student info..." : "Creating student info...", "success");

    let res;
    if (infoId) {
      // Update
      res = await fetch(`${STUDENT_INFO_API}/${infoId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    } else {
      // Create
      res = await fetch(STUDENT_INFO_API, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    }

    const data = await res.json();

    if (res.ok) {
      showMessage(messageEl, infoId ? "Student info updated successfully" : "Student info created successfully", "success");
      document.getElementById("studentInfoModal").style.display = "none";
      document.getElementById("studentInfoForm").reset();
      document.getElementById("studentInfoId").value = "";
      loadStudentInfo();
    } else {
      showMessage(messageEl, data.message || "Operation failed", "error");
    }
  } catch (error) {
    console.error("Error saving student info:", error);
    showMessage(messageEl, "Error saving student info: " + error.message, "error");
  }
}

// Edit student info
async function editStudentInfo(id) {
  try {
    const res = await fetch(`${STUDENT_INFO_API}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load student info");

    const info = await res.json();

    if (!info) {
      showMessage(document.getElementById("studentMessage"), "Student info not found", "error");
      return;
    }

    // Fill form
    document.getElementById("studentInfoModalTitle").textContent = "Edit Student Info";
    document.getElementById("studentInfoId").value = info.student_info_id || info.info_id || info.id;
    document.getElementById("infoStudentId").value = info.student_id || "";
    document.getElementById("infoLessonId").value = info.lesson_id || "";
    document.getElementById("infoTermId").value = info.term_id || "";
    document.getElementById("infoAbsentee").value = info.absentee || 0;
    document.getElementById("infoMidterm").value = info.midterm_exam || "";
    document.getElementById("infoFinal").value = info.final_exam || "";
    document.getElementById("infoAverage").value = info.average || "";
    document.getElementById("infoNote").value = info.note || "";
    document.getElementById("infoNoteText").value = info.info_note || "";

    loadStudentsForInfo();
    loadLessons();
    loadTerms();
    document.getElementById("studentInfoModal").style.display = "block";
  } catch (error) {
    console.error("Error loading student info:", error);
    showMessage(document.getElementById("studentMessage"), "Error loading student info", "error");
  }
}

// Delete student info
async function deleteStudentInfo(id) {
  if (!confirm("Are you sure you want to delete this student info?")) {
    return;
  }

  try {
    const res = await fetch(`${STUDENT_INFO_API}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("studentMessage"), "Student info deleted successfully", "success");
      loadStudentInfo();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("studentMessage"), data.message || "Failed to delete student info", "error");
    }
  } catch (error) {
    console.error("Error deleting student info:", error);
    showMessage(document.getElementById("studentMessage"), "Error deleting student info: " + error.message, "error");
  }
}

