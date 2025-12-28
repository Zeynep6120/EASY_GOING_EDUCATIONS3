// Public Events Page - Vanilla JavaScript

const API_BASE = "/api/content/events";

// Initialize page
document.addEventListener("DOMContentLoaded", function() {
  if (typeof initHeader === "function") {
    initHeader();
  }

  loadEvents();
});

// Load events
async function loadEvents() {
  try {
    const res = await fetch(API_BASE);

    if (!res.ok) {
      throw new Error("Failed to load events");
    }

    const events = await res.json();
    const container = document.getElementById("eventsGrid");
    if (!container) return;

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
        hour: "2-digit",
        minute: "2-digit",
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
      });

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
            ${event.location ? `<span>📍 ${event.location}</span>` : ""}
          </div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading events:", error);
    const container = document.getElementById("eventsGrid");
    if (container) {
      container.innerHTML = "<p class='error-message'>Error loading events. Please try again later.</p>";
    }
  }
}

