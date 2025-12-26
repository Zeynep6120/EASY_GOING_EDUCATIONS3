// About page functionality - Vanilla JavaScript

document.addEventListener("DOMContentLoaded", function() {
  // Initialize header
  if (typeof initHeader === "function") {
    initHeader();
  }

  // Load instructors
  loadInstructors();
});

async function loadInstructors() {
  const container = document.getElementById("instructorsGrid");
  if (!container) {
    console.error("Instructors grid container not found");
    return;
  }

  try {
    const res = await fetch("/api/content/instructors");
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      console.error("Failed to load instructors:", res.status, errorData);
      container.innerHTML = `<p style="text-align: center; color: #dc3545;">Error loading instructors. Please try again later.</p>`;
      return;
    }

    const instructors = await res.json();
    console.log("Loaded instructors:", instructors);

    if (!Array.isArray(instructors)) {
      console.error("Invalid response format:", instructors);
      container.innerHTML = `<p style="text-align: center; color: #dc3545;">Invalid data format received.</p>`;
      return;
    }

    if (instructors.length === 0) {
      container.innerHTML = "<p style='text-align: center; color: #666;'>No instructors available.</p>";
      return;
    }

    container.innerHTML = instructors
      .map(
        (instructor) => {
          const imageUrl = instructor.image 
            ? `/img/instructors/${instructor.image}` 
            : `/img/instructors/instructor-01.jpg`;
          
          return `
      <div class="instructor-card">
        <div class="instructor-image">
          <img src="${imageUrl}" alt="${instructor.name || 'Instructor'}" 
               onerror="this.src='/img/instructors/instructor-01.jpg';" />
        </div>
        <div class="instructor-content">
          <h3>${instructor.name || "Instructor"}</h3>
          <p class="instructor-title">${instructor.title || "Instructor"}</p>
          <p class="instructor-bio">${instructor.bio || ""}</p>
        </div>
      </div>
    `;
        }
      )
      .join("");
  } catch (error) {
    console.error("Error loading instructors:", error);
    container.innerHTML = `<p style="text-align: center; color: #dc3545;">Error loading instructors: ${error.message}</p>`;
  }
}

