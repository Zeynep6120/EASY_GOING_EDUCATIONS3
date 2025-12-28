// Dashboard functionality
import { requireAuth, getCurrentUser } from "../helpers/utils.js";

const dashboardRoutes = {
  ADMIN: [
    { name: "Admin", url: "/dashboard/admin.html" },
    { name: "Manager", url: "/dashboard/manager.html" },
    { name: "Assistant Manager", url: "/dashboard/assistant-manager.html" },
    { name: "Teacher", url: "/dashboard/teacher.html" },
    { name: "Student", url: "/dashboard/student.html" },
    { name: "Lesson", url: "/dashboard/lesson.html" },
    { name: "Education Term", url: "/dashboard/education-term.html" },
    { name: "Program", url: "/dashboard/program.html" },
    { name: "Contact Messages", url: "/dashboard/contact-message.html" },
  ],
  MANAGER: [
    { name: "Manager", url: "/dashboard/manager.html" },
    { name: "Assistant Manager", url: "/dashboard/assistant-manager.html" },
    { name: "Teacher", url: "/dashboard/teacher.html" },
    { name: "Student", url: "/dashboard/student.html" },
    { name: "Lesson", url: "/dashboard/lesson.html" },
    { name: "Education Term", url: "/dashboard/education-term.html" },
    { name: "Program", url: "/dashboard/program.html" },
    { name: "Contact Messages", url: "/dashboard/contact-message.html" },
  ],
  ASSISTANT_MANAGER: [
    { name: "Manager", url: "/dashboard/manager.html" },
    { name: "Assistant Manager", url: "/dashboard/assistant-manager.html" },
    { name: "Teacher", url: "/dashboard/teacher.html" },
    { name: "Student", url: "/dashboard/student.html" },
    { name: "Lesson", url: "/dashboard/lesson.html" },
    { name: "Education Term", url: "/dashboard/education-term.html" },
    { name: "Program", url: "/dashboard/program.html" },
    { name: "Contact Messages", url: "/dashboard/contact-message.html" },
  ],
  TEACHER: [
    { name: "Student", url: "/dashboard/student.html" },
    { name: "Meet Management", url: "/dashboard/meet.html" },
  ],
  STUDENT: [
    { name: "Choose Lesson", url: "/dashboard/choose-lesson.html" },
    { name: "Grades & Meets", url: "/dashboard/grades-meets.html" },
  ],
};

export function initDashboard() {
  // Check authentication
  if (!requireAuth()) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  // Display user info
  document.getElementById("userName").textContent = `${user.name} ${user.surname}`;
  document.getElementById("userRole").textContent = user.role;

  // Load navigation based on role
  const nav = document.getElementById("dashboardNav");
  const routes = dashboardRoutes[user.role] || [];

  if (routes.length === 0) {
    nav.innerHTML = "<p>No dashboard options available for your role.</p>";
    return;
  }

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

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});
