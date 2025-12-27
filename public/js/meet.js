// Meet Management - Instructor functionality

const API_BASE = "/api/meets";
const STUDENTS_API = "/api/students";

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  // ADMIN, MANAGER and INSTRUCTOR can access
  if (!user || !["ADMIN", "MANAGER", "INSTRUCTOR"].includes(user.role)) {
    window.location.href = "/unauthorized.html";
    return false;
  }
  return true;
}

let currentMeetId = null;

// Initialize page
document.addEventListener("DOMContentLoaded", function() {
  if (!checkAuth()) return;
  
  if (typeof initHeader === "function") {
    initHeader();
  }

  loadMeets();
  loadStudents();
  setupModal();
  setupForm();
  setupStudentsModal();
});

// Load meets
async function loadMeets() {
  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to load meets");
    }

    const meets = await res.json();
    const meetsList = Array.isArray(meets) ? meets : [];
    
    // Sort by date (newest first)
    meetsList.sort((a, b) => {
      const dateA = new Date(a.date + " " + a.start_time);
      const dateB = new Date(b.date + " " + b.start_time);
      return dateB - dateA;
    });
    
    displayMeets(meetsList);
  } catch (error) {
    console.error("Error loading meets:", error);
    showMessage(
      document.getElementById("meetMessage"),
      "Error loading meets: " + error.message,
      "error"
    );
  }
}

// Display meets in table
async function displayMeets(meets) {
  const tbody = document.getElementById("meetsTableBody");
  if (!tbody) return;

  if (meets.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7' style='padding: 1rem; text-align: center;'>No meets found</td></tr>";
    return;
  }

  // Load student counts for each meet
  const meetsWithCounts = await Promise.all(
    meets.map(async (meet) => {
      try {
        const res = await fetch(`${API_BASE}/${meet.meet_id}/students`, {
          headers: getAuthHeaders(),
        });
        const students = res.ok ? await res.json() : [];
        return {
          ...meet,
          studentCount: students.length,
        };
      } catch (error) {
        console.error(`Error loading students for meet ${meet.meet_id}:`, error);
        return {
          ...meet,
          studentCount: 0,
        };
      }
    })
  );

  tbody.innerHTML = meetsWithCounts
    .map(
      (meet, index) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 0.75rem;">${index + 1}</td>
      <td style="padding: 0.75rem;">${meet.meet_id}</td>
      <td style="padding: 0.75rem;">${formatDate(meet.date)}</td>
      <td style="padding: 0.75rem;">${formatTime(meet.start_time)} - ${formatTime(meet.stop_time)}</td>
      <td style="padding: 0.75rem;">${meet.description || "-"}</td>
      <td style="padding: 0.75rem; text-align: center;">
        <span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem;">
          ${meet.studentCount} student(s)
        </span>
      </td>
      <td style="padding: 0.75rem; text-align: center;">
        <button class="btn-small btn-edit" onclick="editMeet(${meet.meet_id})">Edit</button>
        <button class="btn-small btn-primary" onclick="manageStudents(${meet.meet_id})" style="margin-left: 0.5rem;">Manage Students</button>
        ${getCurrentUser()?.role === "ADMIN" ? `<button class="btn-small btn-delete" onclick="deleteMeet(${meet.meet_id})" style="margin-left: 0.5rem;">Delete</button>` : ""}
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("meetModal");
  const closeBtn = document.querySelector(".close");
  const cancelBtn = document.getElementById("cancelMeetBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
      document.getElementById("meetForm").reset();
      document.getElementById("meetId").value = "";
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
  const addBtn = document.getElementById("addMeetBtn");
  const form = document.getElementById("meetForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("meetModalTitle").textContent = "Add Meet";
      document.getElementById("meetForm").reset();
      document.getElementById("meetId").value = "";
      document.getElementById("meetModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("meetMessage");
  const meetId = document.getElementById("meetId").value;

  const formData = {
    date: document.getElementById("meetDate").value,
    start_time: document.getElementById("meetStartTime").value,
    stop_time: document.getElementById("meetStopTime").value,
    description: document.getElementById("meetDescription").value.trim() || null,
  };

  // Validation
  if (!formData.date || !formData.start_time || !formData.stop_time) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  // Validate time
  if (formData.start_time >= formData.stop_time) {
    showMessage(messageEl, "Stop time must be after start time", "error");
    return;
  }

  try {
    showMessage(messageEl, meetId ? "Updating meet..." : "Creating meet...", "success");

    let res;
    if (meetId) {
      // Update
      res = await fetch(`${API_BASE}/${meetId}`, {
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
      showMessage(messageEl, meetId ? "Meet updated successfully" : "Meet created successfully", "success");
      document.getElementById("meetModal").style.display = "none";
      document.getElementById("meetForm").reset();
      document.getElementById("meetId").value = "";
      loadMeets();
    } else {
      showMessage(messageEl, data.message || "Operation failed", "error");
    }
  } catch (error) {
    console.error("Error saving meet:", error);
    showMessage(messageEl, "Error saving meet: " + error.message, "error");
  }
}

// Edit meet
async function editMeet(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load meet");

    const meet = await res.json();

    if (!meet) {
      showMessage(document.getElementById("meetMessage"), "Meet not found", "error");
      return;
    }

    // Fill form
    document.getElementById("meetModalTitle").textContent = "Edit Meet";
    document.getElementById("meetId").value = meet.meet_id;
    document.getElementById("meetDate").value = meet.date || "";
    document.getElementById("meetStartTime").value = meet.start_time || "";
    document.getElementById("meetStopTime").value = meet.stop_time || "";
    document.getElementById("meetDescription").value = meet.description || "";

    document.getElementById("meetModal").style.display = "block";
  } catch (error) {
    console.error("Error loading meet:", error);
    showMessage(document.getElementById("meetMessage"), "Error loading meet", "error");
  }
}

// Delete meet
async function deleteMeet(id) {
  if (!confirm("Are you sure you want to delete this meet?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("meetMessage"), "Meet deleted successfully", "success");
      loadMeets();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("meetMessage"), data.message || "Failed to delete meet", "error");
    }
  } catch (error) {
    console.error("Error deleting meet:", error);
    showMessage(document.getElementById("meetMessage"), "Error deleting meet: " + error.message, "error");
  }
}

// Load students for dropdown
async function loadStudents() {
  try {
    // Try to get all students (for teachers to add to meets)
    // Use search endpoint with large page size
    const res = await fetch(`${STUDENTS_API}/search?page=0&size=1000&sort=name&type=asc`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      // Fallback: try /getAll endpoint
      const res2 = await fetch(`${STUDENTS_API}/getAll`, {
        headers: getAuthHeaders(),
      });
      
      if (!res2.ok) {
        console.error("Failed to load students");
        return;
      }
      
      const students = await res2.json();
      const studentsList = Array.isArray(students) ? students : [];
      populateStudentSelect(studentsList);
      return;
    }

    const data = await res.json();
    const students = data.content || data || [];
    populateStudentSelect(students);
  } catch (error) {
    console.error("Error loading students:", error);
  }
}

// Populate student select dropdown
function populateStudentSelect(students) {
  const select = document.getElementById("studentSelect");
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = '<option value="">Select Student</option>';
  students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.user_id || student.id || student.student_id;
    option.textContent = `${student.name || ""} ${student.surname || ""} (${student.username || ""})`;
    select.appendChild(option);
  });
  
  if (currentValue) {
    select.value = currentValue;
  }
}

// Setup students modal
function setupStudentsModal() {
  const modal = document.getElementById("studentsModal");
  const closeBtn = document.querySelector(".close-students");
  const closeBtn2 = document.getElementById("closeStudentsBtn");
  const addBtn = document.getElementById("addStudentBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      currentMeetId = null;
    });
  }

  if (closeBtn2) {
    closeBtn2.addEventListener("click", () => {
      modal.style.display = "none";
      currentMeetId = null;
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      if (!currentMeetId) return;
      
      const studentId = document.getElementById("studentSelect").value;
      if (!studentId) {
        showMessage(document.getElementById("studentsMessage"), "Please select a student", "error");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/${currentMeetId}/students`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ student_id: parseInt(studentId) }),
        });

        const data = await res.json();

        if (res.ok) {
          showMessage(document.getElementById("studentsMessage"), "Student added successfully", "success");
          document.getElementById("studentSelect").value = "";
          loadEnrolledStudents(currentMeetId);
          loadMeets(); // Refresh meet list to update student counts
        } else {
          showMessage(document.getElementById("studentsMessage"), data.message || "Failed to add student", "error");
        }
      } catch (error) {
        console.error("Error adding student:", error);
        showMessage(document.getElementById("studentsMessage"), "Error adding student: " + error.message, "error");
      }
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      currentMeetId = null;
    }
  });
}

// Manage students
async function manageStudents(meetId) {
  currentMeetId = meetId;
  document.getElementById("studentsModalTitle").textContent = `Manage Students - Meet #${meetId}`;
  document.getElementById("studentsMessage").textContent = "";
  document.getElementById("studentSelect").value = "";
  loadEnrolledStudents(meetId);
  loadStudents();
  document.getElementById("studentsModal").style.display = "block";
}

// Load enrolled students
async function loadEnrolledStudents(meetId) {
  try {
    const res = await fetch(`${API_BASE}/${meetId}/students`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to load enrolled students");
    }

    const students = await res.json();
    const studentsList = Array.isArray(students) ? students : [];
    
    displayEnrolledStudents(studentsList, meetId);
  } catch (error) {
    console.error("Error loading enrolled students:", error);
    showMessage(
      document.getElementById("studentsMessage"),
      "Error loading enrolled students: " + error.message,
      "error"
    );
  }
}

// Display enrolled students
function displayEnrolledStudents(students, meetId) {
  const container = document.getElementById("enrolledStudents");
  if (!container) return;

  if (students.length === 0) {
    container.innerHTML = "<p>No students enrolled in this meet.</p>";
    return;
  }

  container.innerHTML = students
    .map(
      (student) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f5f5f5; border-radius: 4px; margin-bottom: 0.5rem;">
      <span>${student.name || ""} ${student.surname || ""} (${student.username || ""})</span>
      <button class="btn-small btn-delete" onclick="removeStudentFromMeet(${meetId}, ${student.user_id || student.id || student.student_id})">Remove</button>
    </div>
  `
    )
    .join("");
}

// Remove student from meet
async function removeStudentFromMeet(meetId, studentId) {
  if (!confirm("Are you sure you want to remove this student from the meet?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${meetId}/students/${studentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("studentsMessage"), "Student removed successfully", "success");
      loadEnrolledStudents(meetId);
      loadMeets(); // Refresh meet list to update student counts
    } else {
      const data = await res.json();
      showMessage(document.getElementById("studentsMessage"), data.message || "Failed to remove student", "error");
    }
  } catch (error) {
    console.error("Error removing student:", error);
    showMessage(document.getElementById("studentsMessage"), "Error removing student: " + error.message, "error");
  }
}

// Make functions global for onclick
window.editMeet = editMeet;
window.deleteMeet = deleteMeet;
window.manageStudents = manageStudents;
window.removeStudentFromMeet = removeStudentFromMeet;

