// Grades & Meets - Student functionality

// const STUDENT_INFO_API = "/api/student-info"; // Removed: student_info table merged into students
const MEETS_API = "/api/meets";

let currentTab = "grades";

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

// Tab switching
window.showTab = function(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
    if ((tabName === "grades" && btn.textContent.includes("Grades")) || 
        (tabName === "meets" && btn.textContent.includes("Meets"))) {
      btn.classList.add("active");
    }
  });
  
  // Show/hide tab content
  const gradesTab = document.getElementById("gradesTab");
  const meetsTab = document.getElementById("meetsTab");
  
  if (gradesTab && meetsTab) {
    if (tabName === "grades") {
      gradesTab.style.display = "block";
      gradesTab.classList.add("active");
      meetsTab.style.display = "none";
      meetsTab.classList.remove("active");
    } else {
      gradesTab.style.display = "none";
      gradesTab.classList.remove("active");
      meetsTab.style.display = "block";
      meetsTab.classList.add("active");
    }
  }
  
  // Load data for active tab
  if (tabName === "meets") {
    loadMeets();
  } else {
    loadGrades();
  }
};

// Initialize page
document.addEventListener("DOMContentLoaded", function() {
  if (!checkAuth()) return;
  
  if (typeof initHeader === "function") {
    initHeader();
  }

  // Load terms first, then grades
  loadTerms().then(() => {
    loadGrades();
  }).catch((error) => {
    console.error("Error initializing page:", error);
    loadGrades(); // Still try to load grades even if terms fail
  });
  
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  const refreshGradesBtn = document.getElementById("refreshGradesBtn");
  const refreshMeetsBtn = document.getElementById("refreshMeetsBtn");
  const termFilterGrades = document.getElementById("termFilterGrades");

  if (refreshGradesBtn) {
    refreshGradesBtn.addEventListener("click", () => {
      loadGrades();
    });
  }

  if (refreshMeetsBtn) {
    refreshMeetsBtn.addEventListener("click", () => {
      loadMeets();
    });
  }

  if (termFilterGrades) {
    termFilterGrades.addEventListener("change", () => {
      loadGrades();
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
      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      console.error("Failed to load terms:", res.status, errorData);
      showMessage(
        document.getElementById("gradesMessage"),
        "Failed to load terms. Please refresh the page.",
        "error"
      );
      return;
    }

    const terms = await res.json();
    const select = document.getElementById("termFilterGrades");
    if (!select) {
      console.error("Term filter select element not found");
      return;
    }

    if (!Array.isArray(terms) || terms.length === 0) {
      console.warn("No terms found in database");
      select.innerHTML = '<option value="">No Terms Available</option>';
      showMessage(
        document.getElementById("gradesMessage"),
        "No education terms found. Please contact administrator.",
        "error"
      );
      return;
    }

    const currentValue = select.value;
    select.innerHTML = '<option value="">All Terms</option>';
    
    // Sort terms by start_date (newest first)
    const sortedTerms = [...terms].sort((a, b) => {
      const dateA = new Date(a.start_date || 0);
      const dateB = new Date(b.start_date || 0);
      return dateB - dateA;
    });
    
    sortedTerms.forEach((term) => {
      const option = document.createElement("option");
      option.value = term.term_id;
      option.textContent = term.term_name || `Term ${term.term_id}`;
      select.appendChild(option);
    });
    
    if (currentValue) {
      select.value = currentValue;
    }
    
    console.log(`Loaded ${sortedTerms.length} education terms`);
  } catch (error) {
    console.error("Error loading terms:", error);
    showMessage(
      document.getElementById("gradesMessage"),
      "Error loading terms: " + error.message,
      "error"
    );
  }
}

// Load grades (student info)
// NOTE: student_info table has been removed, grades functionality is disabled
async function loadGrades() {
  try {
    // student_info table has been merged into students table
    // Grades functionality is currently disabled
    const tbody = document.getElementById("gradesTableBody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="no-data-cell">
            <div class="no-data-message">
              <span class="no-data-icon">📊</span>
              <p>Grades functionality is currently unavailable</p>
              <small>The student_info table has been removed. Grades are now stored in the students table.</small>
            </div>
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error("Error loading grades:", error);
    showMessage(
      document.getElementById("gradesMessage"),
      "Error loading grades: " + error.message,
      "error"
    );
  }
}

// Display grades in table
function displayGrades(grades) {
  const tbody = document.getElementById("gradesTableBody");
  const messageEl = document.getElementById("gradesMessage");
  if (!tbody) return;

  if (grades.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="no-data-cell">
          <div class="no-data-message">
            <span class="no-data-icon">📊</span>
            <p>No grades found</p>
            <small>Your grades will appear here once they are entered by your instructors.</small>
          </div>
        </td>
      </tr>
    `;
    if (messageEl) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
    return;
  }

  // Clear any previous messages
  if (messageEl) {
    messageEl.textContent = "";
    messageEl.className = "message";
  }

  tbody.innerHTML = grades
    .map(
      (grade) => {
        const average = grade.average !== null && grade.average !== undefined ? parseFloat(grade.average).toFixed(2) : "-";
        const midterm = grade.midterm_exam !== null && grade.midterm_exam !== undefined ? grade.midterm_exam : "-";
        const final = grade.final_exam !== null && grade.final_exam !== undefined ? grade.final_exam : "-";
        const note = grade.note || "-";
        const averageColor = getAverageColor(grade.average);
        const noteColor = getNoteColor(grade.note);
        
        return `
    <tr class="grade-row">
      <td class="grade-cell lesson-cell">
        <div class="lesson-info">
          <span class="lesson-icon">📚</span>
          <span class="lesson-name">${grade.lesson_name || "N/A"}</span>
        </div>
      </td>
      <td class="grade-cell term-cell">${grade.term_name || "N/A"}</td>
      <td class="grade-cell number-cell">
        <span class="number-badge ${grade.absentee > 5 ? 'warning' : ''}">${grade.absentee || 0}</span>
      </td>
      <td class="grade-cell number-cell">${midterm}</td>
      <td class="grade-cell number-cell">${final}</td>
      <td class="grade-cell number-cell">
        <span class="average-badge" style="background: ${averageColor}20; color: ${averageColor}; border-color: ${averageColor};">
          ${average}
        </span>
      </td>
      <td class="grade-cell note-cell">
        <span class="note-badge" style="background: ${noteColor}20; color: ${noteColor}; border-color: ${noteColor};">
          ${note}
        </span>
      </td>
    </tr>
  `;
      }
    )
    .join("");
}

// Get color for average
function getAverageColor(average) {
  if (average === null || average === undefined) return "#666";
  if (average >= 90) return "#28a745";
  if (average >= 80) return "#17a2b8";
  if (average >= 70) return "#ffc107";
  if (average >= 60) return "#fd7e14";
  return "#dc3545";
}

// Get color for note
function getNoteColor(note) {
  if (!note) return "#666";
  const noteUpper = note.toUpperCase();
  if (noteUpper === "AA" || noteUpper === "BA" || noteUpper === "BB") return "#28a745";
  if (noteUpper === "CB" || noteUpper === "CC") return "#ffc107";
  if (noteUpper === "DC" || noteUpper === "DD") return "#fd7e14";
  return "#dc3545";
}

// Load meets
async function loadMeets() {
  try {
    const res = await fetch(MEETS_API, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to load meets");
    }

    const meets = await res.json();
    const meetsList = Array.isArray(meets) ? meets : [];
    
    displayMeets(meetsList);
  } catch (error) {
    console.error("Error loading meets:", error);
    showMessage(
      document.getElementById("meetsMessage"),
      "Error loading meets: " + error.message,
      "error"
    );
  }
}

// Display meets
function displayMeets(meets) {
  const container = document.getElementById("meetsList");
  const messageEl = document.getElementById("meetsMessage");
  if (!container) return;

  if (meets.length === 0) {
    container.innerHTML = `
      <div class="no-meets-message">
        <span class="no-data-icon">📅</span>
        <p>No meets found</p>
        <small>Your scheduled meets with instructors will appear here.</small>
      </div>
    `;
    if (messageEl) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
    return;
  }

  // Clear any previous messages
  if (messageEl) {
    messageEl.textContent = "";
    messageEl.className = "message";
  }

  // Sort meets by date (newest first)
  const sortedMeets = meets.sort((a, b) => {
    const dateA = new Date(a.date + " " + a.start_time);
    const dateB = new Date(b.date + " " + b.start_time);
    return dateB - dateA;
  });

  container.innerHTML = sortedMeets
    .map(
      (meet) => {
        const meetDate = new Date(meet.date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        meetDate.setHours(0, 0, 0, 0);
        const isPast = meetDate < now;
        const isToday = meetDate.getTime() === now.getTime();
        
        return `
    <div class="meet-card ${isPast ? 'past-meet' : 'upcoming-meet'} ${isToday ? 'today-meet' : ''}">
      <div class="meet-header">
        <div class="meet-instructor">
          <span class="instructor-icon">👨‍🏫</span>
          <div class="instructor-info">
            <h3>${meet.instructor_name || meet.teacher_name || ""} ${meet.instructor_surname || meet.teacher_surname || ""}</h3>
            <span class="meet-status ${isPast ? 'status-past' : 'status-upcoming'}">
              ${isToday ? 'Today' : (isPast ? 'Past' : 'Upcoming')}
            </span>
          </div>
        </div>
      </div>
      <div class="meet-details">
        <div class="meet-detail-item">
          <span class="detail-icon">📅</span>
          <span><strong>Date:</strong> ${formatDate(meet.date)}</span>
        </div>
        <div class="meet-detail-item">
          <span class="detail-icon">⏰</span>
          <span><strong>Time:</strong> ${formatTime(meet.start_time)} - ${formatTime(meet.stop_time)}</span>
        </div>
        ${meet.description ? `
        <div class="meet-detail-item">
          <span class="detail-icon">📝</span>
          <span><strong>Description:</strong> ${meet.description}</span>
        </div>
        ` : ""}
      </div>
    </div>
  `;
      }
    )
    .join("");
}

