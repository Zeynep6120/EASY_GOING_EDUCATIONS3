// Courses page functionality - Vanilla JavaScript

document.addEventListener("DOMContentLoaded", function() {
  // Initialize header
  if (typeof initHeader === "function") {
    initHeader();
  }

  // Load courses
  loadCourses();
});

async function loadCourses() {
  try {
    const res = await fetch("/api/content/courses");
    const courses = await res.json();
    const container = document.getElementById("coursesGrid");
    if (!container) return;

    if (courses.length === 0) {
      container.innerHTML = "<p>No courses available.</p>";
      return;
    }

    container.innerHTML = courses
      .map(
        (course) => `
      <div class="course-card" data-course-id="${course.course_id || course.id || ''}" style="cursor: pointer;">
        <div class="course-image">
          <img src="/img/courses/${course.image || "course-01.jpg"}" alt="${course.title}" />
        </div>
        <div class="course-content">
          <h3>${course.title}</h3>
          <p>${course.description || ""}</p>
          <div class="course-meta">
            <span>⏱ ${course.duration || ""}</span>
            <span>📊 ${course.level || ""}</span>
            ${course.price && course.price > 0 ? `<span>💰 $${course.price}</span>` : '<span>🆓 Free</span>'}
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // Add click event listeners to course cards
    const courseCards = container.querySelectorAll(".course-card");
    courseCards.forEach((card) => {
      card.addEventListener("click", function() {
        const courseId = this.getAttribute("data-course-id");
        handleCourseClick(courseId, courses);
      });
    });
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

// Handle course card click
function handleCourseClick(courseId, allCourses) {
  const course = allCourses.find(c => (c.course_id || c.id) == courseId);
  if (!course) {
    console.error("Course not found");
    return;
  }

  // Show course details in a modal or alert
  // You can customize this to show a modal with more details
  showCourseDetails(course);
}

// Show course details
function showCourseDetails(course) {
  // Create modal HTML
  const modal = document.createElement("div");
  modal.className = "course-modal";
  modal.innerHTML = `
    <div class="course-modal-overlay"></div>
    <div class="course-modal-content">
      <span class="course-modal-close">&times;</span>
      <div class="course-modal-image">
        <img src="/img/courses/${course.image || "course-01.jpg"}" alt="${course.title}" />
      </div>
      <div class="course-modal-body">
        <h2>${course.title}</h2>
        <p class="course-modal-description">${course.description || ""}</p>
        <div class="course-modal-details">
          <div class="course-detail-item">
            <strong>Duration:</strong> ${course.duration || "N/A"}
          </div>
          <div class="course-detail-item">
            <strong>Level:</strong> ${course.level || "N/A"}
          </div>
          <div class="course-detail-item">
            <strong>Price:</strong> ${course.price && course.price > 0 ? `$${course.price}` : 'Free'}
          </div>
        </div>
        <div class="course-modal-actions">
          <button class="btn btn-primary" onclick="closeCourseModal()">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close button
  const closeBtn = modal.querySelector(".course-modal-close");
  const overlay = modal.querySelector(".course-modal-overlay");
  
  closeBtn.addEventListener("click", closeCourseModal);
  overlay.addEventListener("click", closeCourseModal);
  
  // Close on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      closeCourseModal();
    }
  });
}

// Close course modal
function closeCourseModal() {
  const modal = document.querySelector(".course-modal");
  if (modal) {
    modal.remove();
  }
}

// Make closeCourseModal available globally
window.closeCourseModal = closeCourseModal;

