// Program Management - Vanilla JavaScript

const API_BASE = "/api/lesson-programs";

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

  loadEducationTerms();
  loadLessons();
  loadPrograms();
  setupModal();
  setupForm();
});

// Load education terms for dropdown
async function loadEducationTerms() {
  try {
    const res = await fetch("/api/terms", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("Failed to load education terms");
      return;
    }

    const terms = await res.json();
    const select = document.getElementById("programEducationTerm");
    if (!select) return;

    select.innerHTML = '<option value="">Select Education Term</option>';
    
    // Sort terms by start_date (newest first - most recent terms at top)
    const sortedTerms = [...terms].sort((a, b) => {
      const dateA = new Date(a.start_date || 0);
      const dateB = new Date(b.start_date || 0);
      return dateB - dateA; // Descending order (newest first)
    });
    
    sortedTerms.forEach((term) => {
      const option = document.createElement("option");
      option.value = term.term_id || term.id;
      option.textContent = term.term_name || term.termName;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading education terms:", error);
  }
}

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
    const select = document.getElementById("programLesson");
    if (!select) return;

    select.innerHTML = '<option value="">Select Lesson</option>';
    lessons.forEach((lesson) => {
      const option = document.createElement("option");
      option.value = lesson.lesson_id || lesson.id;
      option.textContent = lesson.lesson_name || lesson.lessonName;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading lessons:", error);
  }
}

// Load programs
async function loadPrograms() {
  try {
    const res = await fetch(
      `${API_BASE}?page=${currentPage}&size=${pageSize}&sort=id&type=asc`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load programs");
    }

    const data = await res.json();
    const programs = Array.isArray(data) ? data : (data.content || []);
    displayPrograms(programs);
  } catch (error) {
    console.error("Error loading programs:", error);
    showMessage(
      document.getElementById("programMessage"),
      "Error loading programs: " + error.message,
      "error"
    );
  }
}

// Display programs in table
async function displayPrograms(programs) {
  const tbody = document.getElementById("programTableBody");
  if (!tbody) return;

  if (programs.length === 0) {
    tbody.innerHTML = "<tr><td colspan='8'>No programs found</td></tr>";
    return;
  }

  // Course information is already in the program data from backend (lesson_programs table)
  // PostgreSQL returns snake_case, so we need to check both snake_case and camelCase
  const programsWithCourses = programs.map((program) => {
    // Handle both snake_case (from DB) and camelCase (if transformed)
    const courseId = program.course_id !== null && program.course_id !== undefined 
      ? program.course_id 
      : (program.courseId !== null && program.courseId !== undefined ? program.courseId : null);
    const courseName = program.course_name || program.courseName || null;
    
    return {
      ...program,
      course_id: courseId,
      course_name: courseName,
    };
  });

  tbody.innerHTML = programsWithCourses
    .map(
      (program) => `
    <tr>
      <td>${program.id || program.lesson_program_id}</td>
      <td>${program.day || program.day_of_week || ""}</td>
      <td>${program.start_time || ""}</td>
      <td>${program.stop_time || ""}</td>
      <td>${program.term_name || program.education_term_name || ""}</td>
      <td>${program.course_id !== null && program.course_id !== undefined ? program.course_id : "-"}</td>
      <td>${program.course_name ? program.course_name : "-"}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editProgram(${program.id || program.lesson_program_id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteProgram(${program.id || program.lesson_program_id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("programModal");
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
      document.getElementById("programForm").reset();
      document.getElementById("programId").value = "";
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
  const addBtn = document.getElementById("addProgramBtn");
  const form = document.getElementById("programForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Program";
      document.getElementById("programForm").reset();
      document.getElementById("programId").value = "";
      loadEducationTerms();
      loadLessons();
      document.getElementById("programModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("programMessage");
  const programId = document.getElementById("programId").value;
  const lessonId = parseInt(document.getElementById("programLesson").value);

  const formData = {
    day: document.getElementById("programDay").value,
    start_time: document.getElementById("programStartTime").value,
    stop_time: document.getElementById("programStopTime").value,
    education_term_id: parseInt(document.getElementById("programEducationTerm").value),
  };

  // Validation
  if (!formData.day || !formData.start_time || !formData.stop_time || 
      !formData.education_term_id) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  if (!programId && !lessonId) {
    showMessage(messageEl, "Please select a lesson", "error");
    return;
  }

  // Validate time
  if (formData.start_time >= formData.stop_time) {
    showMessage(messageEl, "Stop time must be after start time", "error");
    return;
  }

  try {
    showMessage(messageEl, programId ? "Updating program..." : "Creating program...", "success");

    let res;
    let createdProgramId = programId;

    if (programId) {
      // Update
      res = await fetch(`${API_BASE}/${programId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        showMessage(messageEl, data.message || "Operation failed", "error");
        return;
      }

      // If lesson is selected and changed, update lesson
      if (lessonId) {
        // First, get current lessons
        const lessonsRes = await fetch(`${API_BASE}/${programId}/lessons`, {
          headers: getAuthHeaders(),
        });
        const currentLessons = await lessonsRes.ok ? await lessonsRes.json() : [];
        
        // Remove all current lessons
        for (const lesson of currentLessons) {
          await fetch(`${API_BASE}/${programId}/lessons/${lesson.lesson_id || lesson.id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
        }

        // Add new lesson
        await fetch(`${API_BASE}/${programId}/lessons`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ lesson_id: lessonId }),
        });
      }
    } else {
      // Create
      res = await fetch(API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        showMessage(messageEl, data.message || "Operation failed", "error");
        return;
      }

      const created = await res.json();
      createdProgramId = created.id || created.lesson_program_id;

      // Add lesson to program
      if (lessonId && createdProgramId) {
        await fetch(`${API_BASE}/${createdProgramId}/lessons`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ lesson_id: lessonId }),
        });
      }
    }

    showMessage(messageEl, programId ? "Program updated successfully" : "Program created successfully", "success");
    document.getElementById("programModal").style.display = "none";
    document.getElementById("programForm").reset();
    document.getElementById("programId").value = "";
    loadPrograms();
  } catch (error) {
    console.error("Error saving program:", error);
    showMessage(messageEl, "Error saving program: " + error.message, "error");
  }
}

// Edit program
async function editProgram(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load program");

    const program = await res.json();

    if (!program) {
      showMessage(document.getElementById("programMessage"), "Program not found", "error");
      return;
    }

    // Load lessons for this program
    const lessonsRes = await fetch(`${API_BASE}/${id}/lessons`, {
      headers: getAuthHeaders(),
    });
    const lessons = lessonsRes.ok ? await lessonsRes.json() : [];
    const firstLesson = lessons.length > 0 ? lessons[0] : null;

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Program";
    document.getElementById("programId").value = program.id || program.lesson_program_id;
    document.getElementById("programDay").value = program.day || program.day_of_week || "";
    document.getElementById("programStartTime").value = program.start_time || "";
    document.getElementById("programStopTime").value = program.stop_time || "";

    loadEducationTerms();
    loadLessons();
    
    // Set selected values after loading
    setTimeout(() => {
      document.getElementById("programEducationTerm").value = program.education_term_id || program.term_id || "";
      if (firstLesson) {
        document.getElementById("programLesson").value = firstLesson.lesson_id || firstLesson.id || "";
      }
    }, 500);

    document.getElementById("programModal").style.display = "block";
  } catch (error) {
    console.error("Error loading program:", error);
    showMessage(document.getElementById("programMessage"), "Error loading program", "error");
  }
}

// Delete program
async function deleteProgram(id) {
  if (!confirm("Are you sure you want to delete this program?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("programMessage"), "Program deleted successfully", "success");
      loadPrograms();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("programMessage"), data.message || "Failed to delete program", "error");
    }
  } catch (error) {
    console.error("Error deleting program:", error);
    showMessage(document.getElementById("programMessage"), "Error deleting program: " + error.message, "error");
  }
}

