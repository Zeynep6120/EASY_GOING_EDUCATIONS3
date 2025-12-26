// Lesson Management - Vanilla JavaScript

const API_BASE = "/api/lessons";

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

  loadLessons();
  setupModal();
  setupForm();
});

// Load lessons
async function loadLessons() {
  try {
    const res = await fetch(
      `${API_BASE}?page=${currentPage}&size=${pageSize}&sort=lessonName&type=asc`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load lessons");
    }

    const data = await res.json();
    const lessons = Array.isArray(data) ? data : (data.content || []);
    displayLessons(lessons);
  } catch (error) {
    console.error("Error loading lessons:", error);
    showMessage(
      document.getElementById("lessonMessage"),
      "Error loading lessons: " + error.message,
      "error"
    );
  }
}

// Display lessons in table
function displayLessons(lessons) {
  const tbody = document.getElementById("lessonTableBody");
  if (!tbody) return;

  if (lessons.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>No lessons found</td></tr>";
    return;
  }

  tbody.innerHTML = lessons
    .map(
      (lesson) => `
    <tr>
      <td>${lesson.lesson_id || lesson.id}</td>
      <td>${lesson.lesson_name || lesson.lessonName}</td>
      <td>${lesson.credit_score || lesson.creditScore || 0}</td>
      <td>${lesson.compulsory ? "Yes" : "No"}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editLesson(${lesson.lesson_id || lesson.id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteLesson(${lesson.lesson_id || lesson.id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("lessonModal");
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
      document.getElementById("lessonForm").reset();
      document.getElementById("lessonId").value = "";
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
  const addBtn = document.getElementById("addLessonBtn");
  const form = document.getElementById("lessonForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Lesson";
      document.getElementById("lessonForm").reset();
      document.getElementById("lessonId").value = "";
      document.getElementById("lessonModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("lessonMessage");
  const lessonId = document.getElementById("lessonId").value;

  const formData = {
    lesson_name: document.getElementById("lessonName").value.trim(),
    credit_score: parseFloat(document.getElementById("lessonCreditScore").value),
    compulsory: document.getElementById("lessonCompulsory").checked,
  };

  // Validation
  if (!formData.lesson_name || formData.credit_score === undefined || formData.credit_score < 0) {
    showMessage(messageEl, "Please fill all required fields correctly", "error");
    return;
  }

  try {
    showMessage(messageEl, lessonId ? "Updating lesson..." : "Creating lesson...", "success");

    let res;
    if (lessonId) {
      // Update
      res = await fetch(`${API_BASE}/${lessonId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    } else {
      // Create
      res = await fetch(API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    }

    const data = await res.json();

    if (res.ok) {
      showMessage(messageEl, lessonId ? "Lesson updated successfully" : "Lesson created successfully", "success");
      document.getElementById("lessonModal").style.display = "none";
      document.getElementById("lessonForm").reset();
      document.getElementById("lessonId").value = "";
      loadLessons();
    } else {
      showMessage(messageEl, data.message || "Operation failed", "error");
    }
  } catch (error) {
    console.error("Error saving lesson:", error);
    showMessage(messageEl, "Error saving lesson: " + error.message, "error");
  }
}

// Edit lesson
async function editLesson(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load lesson");

    const lesson = await res.json();

    if (!lesson) {
      showMessage(document.getElementById("lessonMessage"), "Lesson not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Lesson";
    document.getElementById("lessonId").value = lesson.lesson_id || lesson.id;
    document.getElementById("lessonName").value = lesson.lesson_name || lesson.lessonName || "";
    document.getElementById("lessonCreditScore").value = lesson.credit_score || lesson.creditScore || 0;
    document.getElementById("lessonCompulsory").checked = lesson.compulsory || false;

    document.getElementById("lessonModal").style.display = "block";
  } catch (error) {
    console.error("Error loading lesson:", error);
    showMessage(document.getElementById("lessonMessage"), "Error loading lesson", "error");
  }
}

// Delete lesson
async function deleteLesson(id) {
  if (!confirm("Are you sure you want to delete this lesson?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("lessonMessage"), "Lesson deleted successfully", "success");
      loadLessons();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("lessonMessage"), data.message || "Failed to delete lesson", "error");
    }
  } catch (error) {
    console.error("Error deleting lesson:", error);
    showMessage(document.getElementById("lessonMessage"), "Error deleting lesson: " + error.message, "error");
  }
}

