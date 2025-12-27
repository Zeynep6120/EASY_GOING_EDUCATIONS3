// My Programs - Student View - Vanilla JavaScript

const API_BASE = "/api/lesson-programs";

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  if (!user || user.role !== "STUDENT") {
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
  loadPrograms();
  
  // Filter change event
  const termFilter = document.getElementById("termFilter");
  if (termFilter) {
    termFilter.addEventListener("change", loadPrograms);
  }
});

// Load education terms for filter
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
    const termFilter = document.getElementById("termFilter");
    if (!termFilter) return;

    // Clear existing options except "All Terms"
    termFilter.innerHTML = '<option value="">All Terms</option>';

    // Sort terms by start_date (newest first)
    const sortedTerms = [...terms].sort((a, b) => {
      const dateA = new Date(a.start_date || 0);
      const dateB = new Date(b.start_date || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    sortedTerms.forEach((term) => {
      const option = document.createElement("option");
      option.value = term.term_id || term.id;
      option.textContent = term.term_name || term.termName;
      termFilter.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading education terms:", error);
  }
}

// Load programs
async function loadPrograms() {
  try {
    const termFilter = document.getElementById("termFilter");
    const selectedTermId = termFilter ? termFilter.value : "";
    
    let url = API_BASE;
    if (selectedTermId) {
      url += `?term_id=${selectedTermId}`;
    }

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load programs" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Failed to load programs`);
    }

    const data = await res.json();
    const programs = Array.isArray(data) ? data : [];
    
    displayPrograms(programs);
    
    // Clear any previous error messages on success
    const messageEl = document.getElementById("programMessage");
    if (messageEl && programs.length > 0) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
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
    tbody.innerHTML = "<tr><td colspan='6'>No programs found. You are not enrolled in any programs yet.</td></tr>";
    return;
  }

  // Load courses/lessons and instructors for each program
  const programsWithDetails = await Promise.all(
    programs.map(async (program) => {
      const programId = program.id || program.course_program_id || program.lesson_program_id;
      let courses = [];
      let instructors = [];

      try {
        // Get courses/lessons - try /courses first, then /lessons as fallback
        let coursesRes = await fetch(`${API_BASE}/${programId}/courses`, {
          headers: getAuthHeaders(),
        });
        if (!coursesRes.ok) {
          // Fallback to /lessons endpoint
          coursesRes = await fetch(`${API_BASE}/${programId}/lessons`, {
            headers: getAuthHeaders(),
          });
        }
        if (coursesRes.ok) {
          courses = await coursesRes.json();
        }
      } catch (error) {
        console.error(`Error loading courses for program ${programId}:`, error);
      }

      try {
        // Get instructors
        const instructorsRes = await fetch(`${API_BASE}/${programId}/instructors`, {
          headers: getAuthHeaders(),
        });
        if (instructorsRes.ok) {
          instructors = await instructorsRes.json();
        }
      } catch (error) {
        console.error(`Error loading instructors for program ${programId}:`, error);
      }

      return {
        ...program,
        courses: courses,
        instructors: instructors,
      };
    })
  );

  // Sort programs by day of week and start time
  const dayOrder = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
  };

  programsWithDetails.sort((a, b) => {
    const dayA = dayOrder[(a.day_of_week || a.day || "").toUpperCase()] || 8;
    const dayB = dayOrder[(b.day_of_week || b.day || "").toUpperCase()] || 8;
    if (dayA !== dayB) return dayA - dayB;
    
    const timeA = a.start_time || "";
    const timeB = b.start_time || "";
    return timeA.localeCompare(timeB);
  });

  tbody.innerHTML = programsWithDetails
    .map(
      (program) => {
        const day = program.day || program.day_of_week || "";
        const startTime = formatTime(program.start_time) || "";
        const stopTime = formatTime(program.stop_time) || "";
        const timeRange = startTime && stopTime ? `${startTime} - ${stopTime}` : startTime || stopTime || "";
        const termName = program.term_name || program.education_term_name || "";
        
        // Format courses/lessons
        let coursesText = "No courses assigned";
        if (program.courses && program.courses.length > 0) {
          coursesText = program.courses
            .map(c => c.course_name || c.title || c.lesson_name || c.lessonName || "Unknown")
            .join(", ");
        }
        
        // Format instructors
        let instructorsText = "No instructors assigned";
        if (program.instructors && program.instructors.length > 0) {
          instructorsText = program.instructors
            .map(i => {
              const name = i.name || i.instructor_name || "";
              const surname = i.surname || i.instructor_surname || "";
              return name && surname ? `${name} ${surname}` : (name || surname || "Unknown");
            })
            .join(", ");
        }

        const programId = program.id || program.course_program_id || program.lesson_program_id;
        const currentUser = getCurrentUser();
        const studentId = currentUser?.id || currentUser?.user_id;

        return `
    <tr>
      <td>${day}</td>
      <td>${timeRange}</td>
      <td>${termName}</td>
      <td>${coursesText}</td>
      <td>${instructorsText}</td>
      <td>
        <button class="btn-small btn-delete" onclick="unenrollFromProgram(${studentId}, ${programId})" title="Unenroll from this program">Unenroll</button>
      </td>
    </tr>
  `;
      }
    )
    .join("");
}

// Unenroll from a program
async function unenrollFromProgram(studentId, courseProgramId) {
  if (!confirm("Are you sure you want to unenroll from this program?")) {
    return;
  }

  const messageEl = document.getElementById("programMessage");
  try {
    showMessage(messageEl, "Unenrolling from program...", "success");

    const res = await fetch(`/api/student-programs/${studentId}/${courseProgramId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to unenroll" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Failed to unenroll`);
    }

    showMessage(messageEl, "Successfully unenrolled from program", "success");
    
    // Reload programs after a short delay
    setTimeout(() => {
      loadPrograms();
    }, 1000);
  } catch (error) {
    console.error("Error unenrolling from program:", error);
    showMessage(messageEl, "Error: " + error.message, "error");
  }
}

