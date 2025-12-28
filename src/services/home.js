// Home page functionality
import { api } from "./api.js";
import { formatDate } from "../helpers/utils.js";

export async function loadSlider() {
  try {
    const slides = await api.getSlides();
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
        <img src="/img/slider/${slide.image || "slider-01.jpg"}" alt="${slide.title}" />
        <div class="slide-content">
          <h3>${slide.title || ""}</h3>
          <p>${slide.description || ""}</p>
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

export async function loadFeaturedCourses() {
  try {
    const courses = await api.getCourses(true);
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
      <div class="course-card">
        <div class="course-image">
          <img src="/img/courses/${course.image || "course-01.jpg"}" alt="${course.title}" />
        </div>
        <div class="course-content">
          <h3>${course.title}</h3>
          <p>${course.description || ""}</p>
          <div class="course-meta">
            <span>${course.duration || ""}</span>
            <span>${course.level || ""}</span>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading featured courses:", error);
  }
}

export async function loadUpcomingEvents() {
  try {
    const events = await api.getEvents();
    const container = document.getElementById("upcomingEvents");
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = "<p>No upcoming events.</p>";
      return;
    }

    // Sort by date and get upcoming events
    const upcoming = events
      .filter((event) => {
        if (!event.time) return false;
        return new Date(event.time) >= new Date();
      })
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .slice(0, 6);

    if (upcoming.length === 0) {
      container.innerHTML = "<p>No upcoming events.</p>";
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
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadSlider();
  loadFeaturedCourses();
  loadUpcomingEvents();
});
