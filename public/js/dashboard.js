// Dashboard functionality - Vanilla JavaScript

const dashboardRoutes = {
  ADMIN: [
    { name: "Users", url: "/dashboard/users.html" },
    { name: "Admins", url: "/dashboard/admin.html" },
    { name: "Managers", url: "/dashboard/manager.html" },
    { name: "Assistant Managers", url: "/dashboard/assistant-manager.html" },
    { name: "Instructors", url: "/dashboard/instructor.html" },
    { name: "Students", url: "/dashboard/student.html" },
    { name: "Courses", url: "/dashboard/course.html" },
    { name: "Events", url: "/dashboard/events.html" },
    { name: "Slides", url: "/dashboard/slides.html" },
    { name: "Education Terms", url: "/dashboard/education-term.html" },
    { name: "Programs", url: "/dashboard/program.html" },
    { name: "Instructor Programs", url: "/dashboard/instructor-programs.html" },
    { name: "Student Programs", url: "/dashboard/student-programs.html" },
    { name: "Meets", url: "/dashboard/meet.html" },
    { name: "Contact Messages", url: "/dashboard/contact-message.html" },
  ],
  MANAGER: [
    { name: "Managers", url: "/dashboard/manager.html" },
    { name: "Assistant Managers", url: "/dashboard/assistant-manager.html" },
    { name: "Instructors", url: "/dashboard/instructor.html" },
    { name: "Students", url: "/dashboard/student.html" },
    { name: "Courses", url: "/dashboard/course.html" },
    { name: "Events", url: "/dashboard/events.html" },
    { name: "Slides", url: "/dashboard/slides.html" },
    { name: "Education Terms", url: "/dashboard/education-term.html" },
    { name: "Programs", url: "/dashboard/program.html" },
    { name: "Instructor Programs", url: "/dashboard/instructor-programs.html" },
    { name: "Student Programs", url: "/dashboard/student-programs.html" },
    { name: "Meets", url: "/dashboard/meet.html" },
    { name: "Contact Messages", url: "/dashboard/contact-message.html" },
  ],
  ASSISTANT_MANAGER: [
    { name: "Assistant Manager", url: "/dashboard/assistant-manager.html" },
    { name: "Instructor", url: "/dashboard/instructor.html" },
    { name: "Student", url: "/dashboard/student.html" },
    { name: "Course", url: "/dashboard/course.html" },
    { name: "Education Term", url: "/dashboard/education-term.html" },
    { name: "Program", url: "/dashboard/program.html" },
    { name: "Contact Messages", url: "/dashboard/contact-message.html" },
  ],
  INSTRUCTOR: [
    { name: "Student", url: "/dashboard/student.html" },
    { name: "Meet Management", url: "/dashboard/meet.html" },
  ],
  STUDENT: [
    { name: "My Programs", url: "/dashboard/my-programs.html" },
    { name: "Choose Course", url: "/dashboard/choose-course.html" },
    { name: "Grades & Meets", url: "/dashboard/grades-meets.html" },
  ],
};

function initDashboard() {
  // Check authentication
  if (!requireAuth()) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  // Display user info
  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");
  if (userNameEl) {
    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();
    userNameEl.textContent = fullName || user.username || "User";
    userNameEl.style.fontWeight = "bold";
    userNameEl.style.color = "#007bff";
  }
  if (userRoleEl) {
    userRoleEl.textContent = user.role || "Unknown";
    userRoleEl.style.fontWeight = "bold";
    userRoleEl.style.color = "#007bff";
  }

  // Load navigation based on role
  const nav = document.getElementById("dashboardNav");
  const routes = dashboardRoutes[user.role] || [];

  if (routes.length === 0) {
    if (nav) nav.innerHTML = "<p>No dashboard options available for your role.</p>";
    return;
  }

  if (nav) {
    nav.innerHTML = `
      <div class="dashboard-nav-grid">
        ${routes
          .map(
            (route) => `
          <a href="${route.url}" class="dashboard-nav-item">
            <h3>${route.name}</h3>
          </a>
        `
          )
          .join("")}
      </div>
    `;
  }
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", function() {
  // Initialize header
  if (typeof initHeader === "function") {
    initHeader();
  }

  // Initialize dashboard
  initDashboard();
});

