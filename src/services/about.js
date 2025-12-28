// About page functionality
import { api } from "./api.js";

export async function loadInstructors() {
  try {
    const instructors = await api.getInstructors();
    const container = document.getElementById("instructorsGrid");
    if (!container) return;

    if (instructors.length === 0) {
      container.innerHTML = "<p>No instructors available.</p>";
      return;
    }

    container.innerHTML = instructors
      .map(
        (instructor) => `
      <div class="instructor-card">
        <div class="instructor-image">
          <img src="/img/instructors/${instructor.image || "instructor-01.jpg"}" alt="${instructor.name}" />
        </div>
        <div class="instructor-content">
          <h3>${instructor.name}</h3>
          <p class="instructor-title">${instructor.title || ""}</p>
          <p class="instructor-bio">${instructor.bio || ""}</p>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading instructors:", error);
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadInstructors();
});
