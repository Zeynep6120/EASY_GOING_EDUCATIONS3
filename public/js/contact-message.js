// Contact Message Management - Vanilla JavaScript

const API_BASE = "/api/contactMessages";

let currentPage = 0;
const pageSize = 10;

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER" && user.role !== "ASSISTANT_MANAGER")) {
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

  loadContactMessages();
  setupModal();
  setupDeleteModal();
});

// Load contact messages
async function loadContactMessages() {
  try {
    console.log("Loading contact messages...");
    console.log("API_BASE:", API_BASE);
    console.log("Full URL:", `${API_BASE}/getAll?page=${currentPage}&size=${pageSize}&sort=date&type=desc`);
    
    const res = await fetch(
      `${API_BASE}/getAll?page=${currentPage}&size=${pageSize}&sort=date&type=desc`,
      {
        headers: getAuthHeaders(),
      }
    );

    console.log("Response status:", res.status);
    console.log("Response ok:", res.ok);

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorData = { message: `HTTP ${res.status}: Failed to load contact messages` };
      }
      
      const errorMessage = errorData.error || errorData.message || errorData.detail || `HTTP ${res.status}: Failed to load contact messages`;
      console.error("Error response:", {
        status: res.status,
        statusText: res.statusText,
        error: errorData,
      });
      
      const messageEl = document.getElementById("contactMessageMessage");
      if (messageEl) {
        showMessage(messageEl, `Error loading contact messages: ${errorMessage}`, "error");
      }
      return;
    }

    const data = await res.json();
    console.log("Contact messages data received:", data);
    const messages = data.content || data || [];
    console.log("Contact messages array:", messages);
    console.log("Number of messages:", messages.length);
    
    displayContactMessages(messages);
    
    // Clear any previous error messages on success
    const messageEl = document.getElementById("contactMessageMessage");
    if (messageEl && messages.length > 0) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading contact messages:", error);
    console.error("Error stack:", error.stack);
    const messageEl = document.getElementById("contactMessageMessage");
    if (messageEl) {
      showMessage(messageEl, "Error loading contact messages: " + error.message, "error");
    }
  }
}

// Display contact messages in table
function displayContactMessages(messages) {
  const tbody = document.getElementById("contactMessageTableBody");
  if (!tbody) return;

  if (messages.length === 0) {
    tbody.innerHTML = "<tr><td colspan='8'>No contact messages found</td></tr>";
    return;
  }

  tbody.innerHTML = messages
    .map(
      (message, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${message.id || message.message_id}</td>
      <td>${message.name || ""}</td>
      <td>${message.email || ""}</td>
      <td>${message.subject || ""}</td>
      <td>${(message.message || "").substring(0, 50)}${(message.message || "").length > 50 ? "..." : ""}</td>
      <td>${message.date ? formatDate(message.date) : ""}</td>
      <td>
        <button class="btn-small btn-view" onclick="viewMessage(${message.id || message.message_id})">View</button>
        <button class="btn-small btn-delete" onclick="deleteMessage(${message.id || message.message_id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("messageModal");
  const closeBtn = document.querySelector(".close");
  const closeMessageBtn = document.getElementById("closeMessageBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (closeMessageBtn) {
    closeMessageBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// View message details (make it globally accessible)
window.viewMessage = async function viewMessage(id) {
  try {
    console.log("Loading message with ID:", id);
    // Since we don't have a getById endpoint, we'll load from the list
    const res = await fetch(
      `${API_BASE}/getAll?page=0&size=1000`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load contact messages" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Failed to load contact messages`);
    }

    const data = await res.json();
    const messages = data.content || data || [];
    const message = messages.find((m) => (m.id || m.message_id || m.msg_id) === id);

    if (!message) {
      showMessage(document.getElementById("contactMessageMessage"), "Message not found", "error");
      return;
    }

    // Display message details
    const detailsEl = document.getElementById("messageDetails");
    detailsEl.innerHTML = `
      <div class="message-detail">
        <p><strong>Name:</strong> ${message.name || ""}</p>
        <p><strong>Email:</strong> ${message.email || ""}</p>
        <p><strong>Subject:</strong> ${message.subject || ""}</p>
        <p><strong>Date:</strong> ${message.date ? formatDate(message.date) : ""}</p>
        <p><strong>Message:</strong></p>
        <div class="message-content">${(message.message || "").replace(/\n/g, "<br>")}</div>
      </div>
    `;

    document.getElementById("messageModal").style.display = "block";
  } catch (error) {
    console.error("Error loading message:", error);
    showMessage(document.getElementById("contactMessageMessage"), "Error loading message", "error");
  }
}

// Store the message ID to delete
let messageIdToDelete = null;

// Setup delete confirmation modal
function setupDeleteModal() {
  const modal = document.getElementById("deleteConfirmModal");
  if (!modal) return;
  
  const cancelBtn = document.getElementById("cancelDeleteBtn");
  const confirmBtn = document.getElementById("confirmDeleteBtn");
  
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
      messageIdToDelete = null;
    });
  }
  
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (messageIdToDelete) {
        modal.style.display = "none";
        const id = messageIdToDelete;
        messageIdToDelete = null;
        performDelete(id);
      }
    });
  }
  
  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      messageIdToDelete = null;
    }
  });
}

// Delete message (make it globally accessible)
window.deleteMessage = function deleteMessage(id) {
  const modal = document.getElementById("deleteConfirmModal");
  
  if (!modal) {
    // Fallback to confirm if modal doesn't exist
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }
    performDelete(id);
    return;
  }
  
  // Store the ID and show modal
  messageIdToDelete = id;
  modal.style.display = "flex";
}

// Perform the actual delete operation
async function performDelete(id) {
  try {
    console.log("Deleting message with ID:", id);
    const res = await fetch(`${API_BASE}/delete/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Delete response:", data);
      showMessage(document.getElementById("contactMessageMessage"), "Message deleted successfully", "success");
      
      // Reload messages after a short delay
      setTimeout(() => {
        loadContactMessages();
      }, 500);
    } else {
      const errorData = await res.json().catch(() => ({ message: "Failed to delete message" }));
      const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: Failed to delete message`;
      console.error("Delete error response:", errorData);
      showMessage(document.getElementById("contactMessageMessage"), errorMessage, "error");
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    showMessage(document.getElementById("contactMessageMessage"), "Error deleting message: " + error.message, "error");
  }
}

