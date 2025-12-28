// Home page functionality - Vanilla JavaScript
// All imports are resolved at build time or using global objects

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function() {
  // Initialize header
  if (typeof initHeader === "function") {
    initHeader();
  }

  // Load page content
  loadSlider();
  loadFeaturedCourses();
  loadUpcomingEvents();
});

// Load Slider
async function loadSlider() {
  try {
    const res = await fetch("/api/content/slides");
    const slides = await res.json();
    const container = document.getElementById("sliderContainer");
    if (!container) return;

    if (slides.length === 0) {
      container.innerHTML = '<div class="slide"><div class="slide-content"><h2>Welcome to EasyGoing Education</h2></div></div>';
      return;
    }

    container.innerHTML = slides
      .map(
        (slide, index) => `
      <div class="slide ${index === 0 ? "active" : ""}">
        <img src="/img/slider/${slide.image || "slider-01.jpg"}" alt="${slide.title || "Slide"}" />
        <div class="slide-content">
          <h3>${slide.title || slide.desc || ""}</h3>
          <p>${slide.description || slide.desc || ""}</p>
        </div>
      </div>
    `
      )
      .join("");

    // Auto-slide functionality
    let currentSlide = 0;
    const slideElements = container.querySelectorAll(".slide");
    if (slideElements.length > 1) {
      setInterval(() => {
        slideElements[currentSlide].classList.remove("active");
        currentSlide = (currentSlide + 1) % slideElements.length;
        slideElements[currentSlide].classList.add("active");
      }, 5000);
    }
  } catch (error) {
    console.error("Error loading slider:", error);
  }
}

// Load Featured Courses
async function loadFeaturedCourses() {
  try {
    const res = await fetch("/api/content/courses/featured");
    const courses = await res.json();
    const container = document.getElementById("featuredCourses");
    if (!container) return;

    if (courses.length === 0) {
      container.innerHTML = "<p>No featured courses available.</p>";
      return;
    }

    container.innerHTML = courses
      .slice(0, 4)
      .map(
        (course) => `
      <div class="course-card" data-course-id="${course.course_id || course.id || ''}" style="cursor: pointer;">
        <div class="course-image">
          <img src="/img/courses/${course.image || "course-01.jpg"}" alt="${course.title}" />
          ${course.is_featured ? '<div class="course-badge">⭐ Featured</div>' : ''}
        </div>
        <div class="course-content">
          <h3>${course.title}</h3>
          <p>${course.description || ""}</p>
          <div class="course-meta">
            <span class="course-duration">⏱ ${course.duration || ""}</span>
            <span class="course-level">📊 ${course.level || ""}</span>
            ${course.price && course.price > 0 ? `<span class="course-price">💰 $${course.price}</span>` : '<span class="course-price">🆓 Free</span>'}
          </div>
          <div class="course-footer">
            <button class="btn-course-details">View Details</button>
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
    console.error("Error loading featured courses:", error);
  }
}

// Handle course card click
function handleCourseClick(courseId, allCourses) {
  const course = allCourses.find(c => (c.course_id || c.id) == courseId);
  if (!course) {
    console.error("Course not found");
    return;
  }

  // Show course details in a modal
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
            <strong>⏱ Duration:</strong> ${course.duration || "N/A"}
          </div>
          <div class="course-detail-item">
            <strong>📊 Level:</strong> ${course.level || "N/A"}
          </div>
          <div class="course-detail-item">
            <strong>💰 Price:</strong> ${course.price && course.price > 0 ? `$${course.price}` : 'Free'}
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

// Load Upcoming Events
async function loadUpcomingEvents() {
  try {
    const res = await fetch("/api/content/events");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const events = await res.json();
    const container = document.getElementById("upcomingEvents");
    if (!container) {
      console.error("Upcoming events container not found");
      return;
    }

    if (!events || events.length === 0) {
      container.innerHTML = "<p class='no-events-message'>No upcoming events.</p>";
      return;
    }

    // Format date helper
    function formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Sort by date and get upcoming events
    const now = new Date();
    const upcoming = events
      .filter((event) => {
        if (!event.time) return false;
        const eventDate = new Date(event.time);
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);
        return dateA - dateB;
      })
      .slice(0, 6);

    if (upcoming.length === 0) {
      container.innerHTML = "<p class='no-events-message'>No upcoming events.</p>";
      return;
    }

    container.innerHTML = upcoming
      .map(
        (event) => `
      <div class="event-card">
        <div class="event-image">
          <img src="/img/events/${event.image || "events-01.jpg"}" alt="${event.title}" />
        </div>
        <div class="event-content">
          <h3>${event.title}</h3>
          <div class="event-meta">
            <span>📅 ${formatDate(event.time)}</span>
            <span>📍 ${event.location || ""}</span>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading events:", error);
    const container = document.getElementById("upcomingEvents");
    if (container) {
      container.innerHTML = "<p class='error-message'>Error loading events. Please try again later.</p>";
    }
  }
}

