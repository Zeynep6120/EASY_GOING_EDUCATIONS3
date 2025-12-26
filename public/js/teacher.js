// Teacher Management - Vanilla JavaScript

const API_BASE = "/api/teachers";

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

  loadTeachers();
  setupModal();
  setupForm();
});

// Load teachers
async function loadTeachers() {
  try {
    const res = await fetch(
      `${API_BASE}/search?page=${currentPage}&size=${pageSize}&sort=name&type=asc`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load teachers" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Failed to load teachers`);
    }

    const data = await res.json();
    console.log("Teacher data received:", data); // Debug log
    const teachers = data.content || data || [];
    console.log("Teachers array:", teachers); // Debug log
    displayTeachers(teachers);
  } catch (error) {
    console.error("Error loading teachers:", error);
    showMessage(
      document.getElementById("teacherMessage"),
      "Error loading teachers: " + error.message,
      "error"
    );
  }
}

// Display teachers in table
function displayTeachers(teachers) {
  const tbody = document.getElementById("teacherTableBody");
  if (!tbody) return;

  if (teachers.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7'>No teachers found</td></tr>";
    return;
  }

  tbody.innerHTML = teachers
    .map(
      (teacher) => `
    <tr>
      <td>${teacher.user_id || teacher.id || teacher.teacher_id}</td>
      <td>${teacher.username}</td>
      <td>${teacher.name}</td>
      <td>${teacher.surname || ""}</td>
      <td>${teacher.email}</td>
      <td>${teacher.is_advisor_teacher ? "Yes" : "No"}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editTeacher(${teacher.user_id || teacher.id || teacher.teacher_id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteTeacher(${teacher.user_id || teacher.id || teacher.teacher_id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("teacherModal");
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
      document.getElementById("teacherForm").reset();
      document.getElementById("teacherId").value = "";
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
  const addBtn = document.getElementById("addTeacherBtn");
  const form = document.getElementById("teacherForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Teacher";
      document.getElementById("teacherForm").reset();
      document.getElementById("teacherId").value = "";
      document.getElementById("teacherPassword").required = true;
      document.getElementById("teacherModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("teacherMessage");
  const teacherId = document.getElementById("teacherId").value;

  const formData = {
    username: document.getElementById("teacherUsername").value.trim(),
    name: document.getElementById("teacherName").value.trim(),
    surname: document.getElementById("teacherSurname").value.trim(),
    email: document.getElementById("teacherEmail").value.trim(),
    gender: document.getElementById("teacherGender").value || null,
    birth_date: document.getElementById("teacherBirthDate").value || null,
    birth_place: document.getElementById("teacherBirthPlace").value.trim() || null,
    phone_number: document.getElementById("teacherPhone").value.trim() || null,
    ssn: document.getElementById("teacherSSN").value.trim() || null,
    role: "TEACHER",
    is_advisor_teacher: document.getElementById("teacherIsAdvisor").checked,
  };

  const password = document.getElementById("teacherPassword").value.trim();
  if (password) {
    formData.password = password;
  }

  // Validation
  if (!formData.username || !formData.name || !formData.surname || !formData.email) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  if (!teacherId && !formData.password) {
    showMessage(messageEl, "Password is required for new teacher", "error");
    return;
  }

  try {
    showMessage(messageEl, teacherId ? "Updating teacher..." : "Creating teacher...", "success");

    let res;
    if (teacherId) {
      // Update
      res = await fetch(`${API_BASE}/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, id: parseInt(teacherId) }),
      });
    } else {
      // Create
      res = await fetch(`${API_BASE}/save`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    }

    const data = await res.json();

    if (res.ok) {
      showMessage(messageEl, teacherId ? "Teacher updated successfully" : "Teacher created successfully", "success");
      document.getElementById("teacherModal").style.display = "none";
      document.getElementById("teacherForm").reset();
      document.getElementById("teacherId").value = "";
      loadTeachers();
    } else {
      showMessage(messageEl, data.message || "Operation failed", "error");
    }
  } catch (error) {
    console.error("Error saving teacher:", error);
    showMessage(messageEl, "Error saving teacher: " + error.message, "error");
  }
}

// Edit teacher
async function editTeacher(id) {
  try {
    const res = await fetch(`${API_BASE}/getSavedTeacherById/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load teacher");

    const teacher = await res.json();

    if (!teacher) {
      showMessage(document.getElementById("teacherMessage"), "Teacher not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Teacher";
    document.getElementById("teacherId").value = teacher.user_id || teacher.id || teacher.teacher_id;
    document.getElementById("teacherUsername").value = teacher.username || "";
    document.getElementById("teacherName").value = teacher.name || "";
    document.getElementById("teacherSurname").value = teacher.surname || "";
    document.getElementById("teacherEmail").value = teacher.email || "";
    document.getElementById("teacherGender").value = teacher.gender || "";
    document.getElementById("teacherBirthDate").value = teacher.birth_date || "";
    document.getElementById("teacherBirthPlace").value = teacher.birth_place || "";
    document.getElementById("teacherPhone").value = teacher.phone_number || "";
    document.getElementById("teacherSSN").value = teacher.ssn || "";
    document.getElementById("teacherIsAdvisor").checked = teacher.is_advisor_teacher || false;
    document.getElementById("teacherPassword").required = false;

    document.getElementById("teacherModal").style.display = "block";
  } catch (error) {
    console.error("Error loading teacher:", error);
    showMessage(document.getElementById("teacherMessage"), "Error loading teacher", "error");
  }
}

// Delete teacher
async function deleteTeacher(id) {
  if (!confirm("Are you sure you want to delete this teacher?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/delete/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("teacherMessage"), "Teacher deleted successfully", "success");
      loadTeachers();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("teacherMessage"), data.message || "Failed to delete teacher", "error");
    }
  } catch (error) {
    console.error("Error deleting teacher:", error);
    showMessage(document.getElementById("teacherMessage"), "Error deleting teacher: " + error.message, "error");
  }
}

