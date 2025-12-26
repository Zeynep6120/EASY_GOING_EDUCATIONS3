// Course Management - Vanilla JavaScript

const API_BASE = "/api/lessons"; // Backward compatibility - uses courses under the hood

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

  loadCourses();
  setupModal();
  setupForm();
});

// Load courses
async function loadCourses() {
  try {
    console.log("Loading courses...");
    const res = await fetch(
      `${API_BASE}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load courses" }));
      const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: Failed to load courses`;
      console.error("Error response:", errorData);
      throw new Error(errorMessage);
    }

    const data = await res.json();
    console.log("Courses data received:", data);
    const courses = Array.isArray(data) ? data : (data.content || []);
    console.log("Courses array:", courses);
    displayCourses(courses);
    
    // Clear any previous error messages on success
    const messageEl = document.getElementById("courseMessage");
    if (messageEl && courses.length > 0) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading courses:", error);
    showMessage(
      document.getElementById("courseMessage"),
      "Error loading courses: " + error.message,
      "error"
    );
  }
}

// Display courses in table
function displayCourses(courses) {
  const tbody = document.getElementById("courseTableBody");
  if (!tbody) return;

  if (courses.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>No courses found</td></tr>";
    return;
  }

  tbody.innerHTML = courses
    .map(
      (course) => {
        // Support both lesson format (from /api/lessons) and course format
        const courseId = course.lesson_id || course.course_id || course.id;
        const courseName = course.lesson_name || course.title || course.course_name || "";
        const creditScore = course.credit_score || course.creditScore || 0;
        const compulsory = course.compulsory || false;
        
        return `
    <tr>
      <td>${courseId}</td>
      <td>${courseName}</td>
      <td>${creditScore}</td>
      <td>${compulsory ? "Yes" : "No"}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editCourse(${courseId})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteCourse(${courseId})">Delete</button>
      </td>
    </tr>
  `;
      }
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("courseModal");
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
      document.getElementById("courseForm").reset();
      document.getElementById("courseId").value = "";
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
  const addBtn = document.getElementById("addCourseBtn");
  const form = document.getElementById("courseForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Course";
      document.getElementById("courseForm").reset();
      document.getElementById("courseId").value = "";
      document.getElementById("courseModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("courseMessage");
  const courseId = document.getElementById("courseId").value;

  const formData = {
    lesson_name: document.getElementById("courseName").value.trim(),
    credit_score: parseFloat(document.getElementById("courseCreditScore").value),
    compulsory: document.getElementById("courseCompulsory").checked,
  };

  // Validation
  if (!formData.lesson_name || formData.credit_score === undefined || formData.credit_score < 0) {
    showMessage(messageEl, "Please fill all required fields correctly", "error");
    return;
  }

  try {
    showMessage(messageEl, courseId ? "Updating course..." : "Creating course...", "success");

    let res;
    if (courseId) {
      // Update
      res = await fetch(`${API_BASE}/${courseId}`, {
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

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Operation failed" }));
      const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: Operation failed`;
      console.error("Error response:", errorData);
      showMessage(messageEl, errorMessage, "error");
      return;
    }

    const data = await res.json();
    console.log("Success response:", data);

    showMessage(messageEl, courseId ? "Course updated successfully" : "Course created successfully", "success");
    document.getElementById("courseModal").style.display = "none";
    document.getElementById("courseForm").reset();
    document.getElementById("courseId").value = "";
    
    // Reload courses after a short delay
    setTimeout(() => {
      loadCourses();
    }, 500);
  } catch (error) {
    console.error("Error saving course:", error);
    showMessage(messageEl, "Error saving course: " + error.message, "error");
  }
}

// Edit course (make it globally accessible)
window.editCourse = async function editCourse(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load course" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Failed to load course`);
    }

    const course = await res.json();

    if (!course) {
      showMessage(document.getElementById("courseMessage"), "Course not found", "error");
      return;
    }

    // Fill form - support both lesson and course formats
    document.getElementById("modalTitle").textContent = "Edit Course";
    document.getElementById("courseId").value = course.lesson_id || course.course_id || course.id;
    document.getElementById("courseName").value = course.lesson_name || course.title || course.course_name || "";
    document.getElementById("courseCreditScore").value = course.credit_score || course.creditScore || 0;
    document.getElementById("courseCompulsory").checked = course.compulsory || false;

    document.getElementById("courseModal").style.display = "block";
  } catch (error) {
    console.error("Error loading course:", error);
    showMessage(document.getElementById("courseMessage"), "Error loading course: " + error.message, "error");
  }
}

// Delete course (make it globally accessible)
window.deleteCourse = async function deleteCourse(id) {
  if (!confirm("Are you sure you want to delete this course?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await res.json(); // Read response once

    if (!res.ok) {
      const errorMessage = data.message || data.error || `HTTP ${res.status}: Failed to delete course`;
      console.error("Error response:", data);
      throw new Error(errorMessage);
    }

    console.log("Delete success response:", data);
    showMessage(document.getElementById("courseMessage"), "Course deleted successfully", "success");
    
    // Reload courses after a short delay
    setTimeout(() => {
      loadCourses();
    }, 500);
  } catch (error) {
    console.error("Error deleting course:", error);
    showMessage(document.getElementById("courseMessage"), "Error deleting course: " + error.message, "error");
  }
}

