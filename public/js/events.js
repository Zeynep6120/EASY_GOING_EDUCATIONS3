// Events Management - Vanilla JavaScript

const API_BASE = "/api/content/events";

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    window.location.href = "/unauthorized.html";
    return false;
  }
  return true;
}

// Initialize page
document.addEventListener("DOMContentLoaded", function() {
  if (!checkAuth()) return;
  
  if (typeof initHeader === "function") {
    initHeader();
  }

  loadEvents();
  setupModal();
  setupForm();
});

// Load events
async function loadEvents() {
  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to load events");
    }

    const data = await res.json();
    const events = Array.isArray(data) ? data : [];
    displayEvents(events);
  } catch (error) {
    console.error("Error loading events:", error);
    showMessage(
      document.getElementById("eventMessage"),
      "Error loading events: " + error.message,
      "error"
    );
  }
}

// Display events in table
function displayEvents(events) {
  const tbody = document.getElementById("eventTableBody");
  if (!tbody) return;

  if (events.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No events found</td></tr>";
    return;
  }

  tbody.innerHTML = events
    .map(
      (event) => `
    <tr>
      <td>${event.event_id || event.id}</td>
      <td>${event.title || ""}</td>
      <td>${event.time ? formatDate(event.time) : ""}</td>
      <td>${event.location || ""}</td>
      <td>${event.image || "-"}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editEvent(${event.event_id || event.id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteEvent(${event.event_id || event.id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("eventModal");
  const closeBtn = document.querySelector(".close");
  const cancelBtn = document.getElementById("cancelBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
      document.getElementById("eventForm").reset();
      document.getElementById("eventId").value = "";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Setup form
function setupForm() {
  const addBtn = document.getElementById("addEventBtn");
  const form = document.getElementById("eventForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Event";
      document.getElementById("eventForm").reset();
      document.getElementById("eventId").value = "";
      document.getElementById("eventModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("eventMessage");
  const eventId = document.getElementById("eventId").value;

  const formData = {
    title: document.getElementById("eventTitle").value.trim(),
    time: document.getElementById("eventTime").value || null,
    location: document.getElementById("eventLocation").value.trim(),
    image: document.getElementById("eventImage").value.trim() || null,
  };

  if (!formData.title || !formData.time || !formData.location) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  try {
    showMessage(messageEl, eventId ? "Updating event..." : "Creating event...", "success");

    let res;
    if (eventId) {
      res = await fetch(`${API_BASE}/${eventId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    } else {
      res = await fetch(API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      showMessage(messageEl, data.message || data.error || "Operation failed", "error");
      return;
    }

    showMessage(messageEl, eventId ? "Event updated successfully" : "Event created successfully", "success");
    document.getElementById("eventModal").style.display = "none";
    document.getElementById("eventForm").reset();
    document.getElementById("eventId").value = "";
    loadEvents();
  } catch (error) {
    console.error("Error saving event:", error);
    showMessage(messageEl, "Error saving event: " + error.message, "error");
  }
}

// Edit event
async function editEvent(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load event");

    const event = await res.json();

    if (!event) {
      showMessage(document.getElementById("eventMessage"), "Event not found", "error");
      return;
    }

    document.getElementById("modalTitle").textContent = "Edit Event";
    document.getElementById("eventId").value = event.event_id || event.id;
    document.getElementById("eventTitle").value = event.title || "";
    
    // Format datetime for datetime-local input
    if (event.time) {
      const date = new Date(event.time);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      document.getElementById("eventTime").value = localDateTime;
    }
    
    document.getElementById("eventLocation").value = event.location || "";
    document.getElementById("eventImage").value = event.image || "";

    document.getElementById("eventModal").style.display = "block";
  } catch (error) {
    console.error("Error loading event:", error);
    showMessage(document.getElementById("eventMessage"), "Error loading event", "error");
  }
}

// Delete event
window.deleteEvent = async function deleteEvent(id) {
  if (!confirm("Are you sure you want to delete this event?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("eventMessage"), "Event deleted successfully", "success");
      loadEvents();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("eventMessage"), data.message || "Failed to delete event", "error");
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    showMessage(document.getElementById("eventMessage"), "Error deleting event: " + error.message, "error");
  }
}

// Make editEvent globally accessible
window.editEvent = editEvent;
