// Events page functionality
import { api } from "./api.js";
import { formatDate } from "../helpers/utils.js";

export async function loadEvents() {
  try {
    const events = await api.getEvents();
    const container = document.getElementById("eventsGrid");
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = "<p>No events available.</p>";
      return;
    }

    // Sort by date
    const sortedEvents = events.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return new Date(a.time) - new Date(b.time);
    });

    container.innerHTML = sortedEvents
      .map(
        (event) => `
      <div class="event-card">
        <div class="event-image">
          <img src="/img/events/${event.image || "events-01.jpg"}" alt="${event.title}" />
        </div>
        <div class="event-content">
          <h3>${event.title}</h3>
          <div class="event-meta">
            ${event.time ? `<span>📅 ${formatDate(event.time)}</span>` : ""}
            ${event.location ? `<span>📍 ${event.location}</span>` : ""}
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
  loadEvents();
});
