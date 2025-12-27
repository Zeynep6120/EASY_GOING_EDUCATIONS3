// Choose Course - Student functionality

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

  loadTerms();
  loadAvailablePrograms();
  loadEnrolledPrograms();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  const refreshBtn = document.getElementById("refreshBtn");
  const termFilter = document.getElementById("termFilter");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadAvailablePrograms();
      loadEnrolledPrograms();
    });
  }

  if (termFilter) {
    termFilter.addEventListener("change", () => {
      loadAvailablePrograms();
    });
  }
}

// Load education terms for filter
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
    const select = document.getElementById("termFilter");
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">All Terms</option>';
    
    // Sort terms by start_date (newest first - most recent terms at top)
    const sortedTerms = [...terms].sort((a, b) => {
      const dateA = new Date(a.start_date || 0);
      const dateB = new Date(b.start_date || 0);
      return dateB - dateA; // Descending order (newest first)
    });
    
    sortedTerms.forEach((term) => {
      const option = document.createElement("option");
      option.value = term.term_id;
      option.textContent = term.term_name;
      select.appendChild(option);
    });
    
    if (currentValue) {
      select.value = currentValue;
    }
  } catch (error) {
    console.error("Error loading terms:", error);
  }
}

// Load available programs
async function loadAvailablePrograms() {
  try {
    const termFilter = document.getElementById("termFilter");
    const termId = termFilter ? termFilter.value : "";
    
    // Get all available programs (for students to see what they can enroll in)
    let url = `${API_BASE}?available=true`;
    if (termId) {
      url += `&term_id=${termId}`;
    }

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to load programs");
    }

    const programs = await res.json();
    const allPrograms = Array.isArray(programs) ? programs : (programs.content || []);
    
    // Get enrolled program IDs
    const enrolledPrograms = await getEnrolledProgramIds();
    
    // Filter out already enrolled programs
    const availablePrograms = allPrograms.filter(p => {
      const programId = p.lesson_program_id || p.id;
      return !enrolledPrograms.includes(programId);
    });
    
    displayAvailablePrograms(availablePrograms);
  } catch (error) {
    console.error("Error loading available programs:", error);
    showMessage(
      document.getElementById("programsMessage"),
      "Error loading programs: " + error.message,
      "error"
    );
  }
}

// Get enrolled program IDs
async function getEnrolledProgramIds() {
  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) return [];

    const programs = await res.json();
    const content = Array.isArray(programs) ? programs : (programs.content || []);
    
    // Filter only enrolled programs (student can only see their own enrolled programs)
    return content.map(p => p.lesson_program_id);
  } catch (error) {
    console.error("Error getting enrolled programs:", error);
    return [];
  }
}

// Display available programs
async function displayAvailablePrograms(programs) {
  const container = document.getElementById("programsList");
  const messageEl = document.getElementById("programsMessage");
  if (!container) return;

  if (programs.length === 0) {
    container.innerHTML = '<div class="no-programs-message"><p>No available programs found.</p></div>';
    if (messageEl) {
      showMessage(messageEl, "No available programs found.", "error");
    }
    return;
  }

  // Clear any previous messages
  if (messageEl) {
    messageEl.textContent = "";
    messageEl.className = "message";
  }

  // Load details for each program
  const programsWithDetails = await Promise.all(
    programs.map(async (program) => {
      const programId = program.lesson_program_id || program.id;
      try {
        // Load courses (changed from lessons)
        const coursesRes = await fetch(`${API_BASE}/${programId}/courses`, {
          headers: getAuthHeaders(),
        });
        const courses = coursesRes.ok ? await coursesRes.json() : [];

        // Load instructors
        const instructorsRes = await fetch(`${API_BASE}/${programId}/instructors`, {
          headers: getAuthHeaders(),
        });
        const instructors = instructorsRes.ok ? await instructorsRes.json() : [];

        // Load students count
        const studentsRes = await fetch(`${API_BASE}/${programId}/students`, {
          headers: getAuthHeaders(),
        });
        const students = studentsRes.ok ? await studentsRes.json() : [];

        return {
          ...program,
          courses,
          instructors,
          students,
        };
      } catch (error) {
        console.error(`Error loading details for program ${programId}:`, error);
        return {
          ...program,
          courses: [],
          instructors: [],
          students: [],
        };
      }
    })
  );

  container.innerHTML = programsWithDetails
    .map(
      (program) => {
        const programId = program.lesson_program_id || program.id;
        const courseNames = program.courses?.map(c => c.title || c.course_name || c.lesson_name).filter(Boolean).join(", ") || "No Courses Assigned";
        const instructorNames = program.instructors?.map(t => `${t.name || ""} ${t.surname || ""}`).filter(Boolean).join(", ") || "No Instructors Assigned";
        const studentCount = program.students?.length || 0;
        
        return `
    <div class="program-card available-program">
      <div class="program-header">
        <h3>${courseNames}</h3>
        <span class="program-badge">Available</span>
      </div>
      <div class="program-details">
        <div class="program-detail-item">
          <span class="detail-icon">📅</span>
          <span><strong>Day:</strong> ${program.day_of_week || "N/A"}</span>
        </div>
        <div class="program-detail-item">
          <span class="detail-icon">⏰</span>
          <span><strong>Time:</strong> ${formatTime(program.start_time)} - ${formatTime(program.stop_time)}</span>
        </div>
        <div class="program-detail-item">
          <span class="detail-icon">📚</span>
          <span><strong>Term:</strong> ${program.term_name || "N/A"}</span>
        </div>
        ${instructorNames !== "No Instructors Assigned" ? `
        <div class="program-detail-item">
          <span class="detail-icon">👨‍🏫</span>
          <span><strong>Instructors:</strong> ${instructorNames}</span>
        </div>
        ` : ""}
        ${studentCount > 0 ? `
        <div class="program-detail-item">
          <span class="detail-icon">👥</span>
          <span><strong>Enrolled Students:</strong> ${studentCount}</span>
        </div>
        ` : ""}
      </div>
      <div class="program-actions">
        <button class="btn btn-primary enroll-btn" onclick="enrollInProgram(${programId})">
          Enroll Now
        </button>
      </div>
    </div>
  `;
      }
    )
    .join("");
}

// Load enrolled programs
async function loadEnrolledPrograms() {
  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to load enrolled programs");
    }

    const programs = await res.json();
    const content = Array.isArray(programs) ? programs : (programs.content || []);
    
    displayEnrolledPrograms(content);
  } catch (error) {
    console.error("Error loading enrolled programs:", error);
    showMessage(
      document.getElementById("enrolledMessage"),
      "Error loading enrolled programs: " + error.message,
      "error"
    );
  }
}

// Display enrolled programs
async function displayEnrolledPrograms(programs) {
  const container = document.getElementById("enrolledList");
  const messageEl = document.getElementById("enrolledMessage");
  if (!container) return;

  if (programs.length === 0) {
    container.innerHTML = '<div class="no-programs-message"><p>You are not enrolled in any programs yet.</p></div>';
    if (messageEl) {
      showMessage(messageEl, "You are not enrolled in any programs yet.", "error");
    }
    return;
  }

  // Clear any previous messages
  if (messageEl) {
    messageEl.textContent = "";
    messageEl.className = "message";
  }

  // Load details for each enrolled program
  const programsWithDetails = await Promise.all(
    programs.map(async (program) => {
      const programId = program.lesson_program_id || program.id;
      try {
        // Load courses (changed from lessons)
        const coursesRes = await fetch(`${API_BASE}/${programId}/courses`, {
          headers: getAuthHeaders(),
        });
        const courses = coursesRes.ok ? await coursesRes.json() : [];

        // Load instructors
        const instructorsRes = await fetch(`${API_BASE}/${programId}/instructors`, {
          headers: getAuthHeaders(),
        });
        const instructors = instructorsRes.ok ? await instructorsRes.json() : [];

        return {
          ...program,
          courses,
          instructors,
        };
      } catch (error) {
        console.error(`Error loading details for program ${programId}:`, error);
        return {
          ...program,
          courses: [],
          instructors: [],
        };
      }
    })
  );

  container.innerHTML = programsWithDetails
    .map(
      (program) => {
        const courseNames = program.courses?.map(c => c.title || c.course_name || c.lesson_name).filter(Boolean).join(", ") || "No Courses Assigned";
        const instructorNames = program.instructors?.map(t => `${t.name || ""} ${t.surname || ""}`).filter(Boolean).join(", ") || "No Instructors Assigned";
        
        return `
    <div class="program-card enrolled-program">
      <div class="program-header">
        <h3>${courseNames}</h3>
        <span class="program-badge enrolled-badge">✓ Enrolled</span>
      </div>
      <div class="program-details">
        <div class="program-detail-item">
          <span class="detail-icon">📅</span>
          <span><strong>Day:</strong> ${program.day_of_week || "N/A"}</span>
        </div>
        <div class="program-detail-item">
          <span class="detail-icon">⏰</span>
          <span><strong>Time:</strong> ${formatTime(program.start_time)} - ${formatTime(program.stop_time)}</span>
        </div>
        <div class="program-detail-item">
          <span class="detail-icon">📚</span>
          <span><strong>Term:</strong> ${program.term_name || "N/A"}</span>
        </div>
        ${instructorNames !== "No Instructors Assigned" ? `
        <div class="program-detail-item">
          <span class="detail-icon">👨‍🏫</span>
          <span><strong>Instructors:</strong> ${instructorNames}</span>
        </div>
        ` : ""}
      </div>
    </div>
  `;
      }
    )
    .join("");
}

// Enroll in program
async function enrollInProgram(programId) {
  const confirmed = confirm("Are you sure you want to enroll in this program?\n\nYou will be able to view this program in your enrolled programs list.");
  if (!confirmed) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${programId}/enroll`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (res.ok) {
      const messageEl = document.getElementById("programsMessage");
      showMessage(
        messageEl,
        "Successfully enrolled in program! Redirecting...",
        "success"
      );
      // Reload programs
      setTimeout(() => {
        loadAvailablePrograms();
        loadEnrolledPrograms();
        if (messageEl) {
          setTimeout(() => {
            messageEl.textContent = "";
            messageEl.className = "message";
          }, 3000);
        }
      }, 1000);
    } else {
      const errorMsg = data.message || data.error || "Failed to enroll in program";
      showMessage(
        document.getElementById("programsMessage"),
        errorMsg,
        "error"
      );
    }
  } catch (error) {
    console.error("Error enrolling in program:", error);
    showMessage(
      document.getElementById("programsMessage"),
      "Error enrolling in program: " + error.message,
      "error"
    );
  }
}

// Make enrollInProgram global for onclick
window.enrollInProgram = enrollInProgram;

