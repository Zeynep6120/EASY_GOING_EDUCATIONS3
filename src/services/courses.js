// Courses page functionality
import { api } from "./api.js";

export async function loadCourses() {
  try {
    const courses = await api.getCourses();
    const container = document.getElementById("coursesGrid");
    if (!container) return;

    if (courses.length === 0) {
      container.innerHTML = "<p>No courses available.</p>";
      return;
    }

    container.innerHTML = courses
      .map(
        (course) => `
      <div class="course-card">
        <div class="course-image">
          <img src="/img/courses/${course.image || "course-01.jpg"}" alt="${course.title}" />
        </div>
        <div class="course-content">
          <h3>${course.title}</h3>
          <p>${course.description || ""}</p>
          <div class="course-meta">
            <span>⏱ ${course.duration || ""}</span>
            <span>📊 ${course.level || ""}</span>
            ${course.price ? `<span>💰 $${course.price}</span>` : ""}
          </div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadCourses();
});
