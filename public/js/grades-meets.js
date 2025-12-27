// My Meets - Student functionality

const MEETS_API = "/api/meets";

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

  loadMeets();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  const refreshMeetsBtn = document.getElementById("refreshMeetsBtn");

  if (refreshMeetsBtn) {
    refreshMeetsBtn.addEventListener("click", () => {
      loadMeets();
    });
  }
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
