// Events page functionality - Vanilla JavaScript

document.addEventListener("DOMContentLoaded", function() {
  // Initialize header
  if (typeof initHeader === "function") {
    initHeader();
  }

  // Load events
  loadEvents();
});

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function loadEvents() {
  try {
    const res = await fetch("/api/content/events");
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const events = await res.json();
    const container = document.getElementById("eventsGrid");
    if (!container) return;

    if (!events || events.length === 0) {
      container.innerHTML = "<p class='no-events-message'>No events available at the moment. Please check back later.</p>";
      return;
    }

    // Filter and sort events - prioritize upcoming events
    const now = new Date();
    const upcomingEvents = events.filter(event => {
      if (!event.time) return false;
      return new Date(event.time) >= now;
    }).sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return new Date(a.time) - new Date(b.time);
    });

    const pastEvents = events.filter(event => {
      if (!event.time) return false;
      return new Date(event.time) < now;
    }).sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return new Date(b.time) - new Date(a.time); // Most recent first for past events
    });

    // Combine: upcoming first, then past
    const sortedEvents = [...upcomingEvents, ...pastEvents];

    // If no events at all, show message
    if (sortedEvents.length === 0) {
      container.innerHTML = "<p class='no-events-message'>No events available at the moment. Please check back later.</p>";
      return;
    }

    container.innerHTML = sortedEvents
      .map(
        (event) => `
      <div class="event-card" data-event-id="${event.event_id || event.id || ''}" style="cursor: pointer;">
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

    // Add click event listeners to event cards
    const eventCards = container.querySelectorAll(".event-card");
    eventCards.forEach((card) => {
      card.addEventListener("click", function() {
        const eventId = this.getAttribute("data-event-id");
        handleEventClick(eventId, sortedEvents);
      });
    });
  } catch (error) {
    console.error("Error loading events:", error);
    const container = document.getElementById("eventsGrid");
    if (container) {
      container.innerHTML = `<p class='error-message'>Error loading events. Please try again later.</p>`;
    }
  }
}

// Handle event card click
function handleEventClick(eventId, allEvents) {
  const event = allEvents.find(e => (e.event_id || e.id) == eventId);
  if (!event) {
    console.error("Event not found");
    return;
  }

  // Show event details in a modal
  showEventDetails(event);
}

// Show event details
function showEventDetails(event) {
  // Create modal HTML
  const modal = document.createElement("div");
  modal.className = "event-modal";
  modal.innerHTML = `
    <div class="event-modal-overlay"></div>
    <div class="event-modal-content">
      <span class="event-modal-close">&times;</span>
      <div class="event-modal-image">
        <img src="/img/events/${event.image || "events-01.jpg"}" alt="${event.title}" />
      </div>
      <div class="event-modal-body">
        <h2>${event.title}</h2>
        <div class="event-modal-details">
          ${event.time ? `
          <div class="event-detail-item">
            <strong>📅 Date & Time:</strong> ${formatDate(event.time)}
            ${event.time ? ` at ${new Date(event.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </div>
          ` : ""}
          ${event.location ? `
          <div class="event-detail-item">
            <strong>📍 Location:</strong> ${event.location}
          </div>
          ` : ""}
        </div>
        <div class="event-modal-actions">
          <button class="btn btn-primary" onclick="closeEventModal()">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close button
  const closeBtn = modal.querySelector(".event-modal-close");
  const overlay = modal.querySelector(".event-modal-overlay");
  
  closeBtn.addEventListener("click", closeEventModal);
  overlay.addEventListener("click", closeEventModal);
  
  // Close on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      closeEventModal();
    }
  });
}

// Close event modal
function closeEventModal() {
  const modal = document.querySelector(".event-modal");
  if (modal) {
    modal.remove();
  }
}

// Make closeEventModal available globally
window.closeEventModal = closeEventModal;

