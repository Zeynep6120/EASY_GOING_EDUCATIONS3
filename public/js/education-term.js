// Education Term Management - Vanilla JavaScript

const API_BASE = "/api/terms";

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

  loadTerms();
  setupModal();
  setupForm();
});

// Load education terms
async function loadTerms() {
  const messageEl = document.getElementById("termMessage");
  try {
    // Check if user is logged in
    if (!isLoggedIn()) {
      showMessage(messageEl, "Please login to view education terms", "error");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 2000);
      return;
    }

    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      // Handle 401 Unauthorized (invalid token)
      if (res.status === 401) {
        showMessage(messageEl, "Session expired. Please login again.", "error");
        setTimeout(() => {
          logout();
        }, 2000);
        return;
      }

      const errorData = await res.json().catch(() => ({ message: "Failed to load education terms" }));
      const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: Failed to load education terms`;
      throw new Error(errorMessage);
    }

    const data = await res.json();
    const terms = Array.isArray(data) ? data : [];
    
    // Sort terms by start_date (newest first)
    const sortedTerms = [...terms].sort((a, b) => {
      const dateA = new Date(a.start_date || 0);
      const dateB = new Date(b.start_date || 0);
      return dateB - dateA; // Descending order (newest first)
    });
    
    displayTerms(sortedTerms);
    
    // Clear any previous error messages on success
    if (messageEl) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading education terms:", error);
    const errorMessage = error.message || "Failed to load education terms. Please check your permissions and try again.";
    
    // Check if it's a token-related error
    if (errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("unauthorized")) {
      showMessage(messageEl, "Session expired. Please login again.", "error");
      setTimeout(() => {
        logout();
      }, 2000);
    } else {
      showMessage(messageEl, errorMessage, "error");
    }
  }
}

// Display education terms in table
function displayTerms(terms) {
  const tbody = document.getElementById("termTableBody");
  if (!tbody) return;

  if (terms.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>No education terms found</td></tr>";
    return;
  }

  tbody.innerHTML = terms
    .map(
      (term) => `
    <tr>
      <td>${term.term_id || term.id}</td>
      <td>${term.term_name || term.termName}</td>
      <td>${term.start_date ? formatDate(term.start_date) : ""}</td>
      <td>${term.end_date ? formatDate(term.end_date) : ""}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editTerm(${term.term_id || term.id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteTerm(${term.term_id || term.id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("termModal");
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
      document.getElementById("termForm").reset();
      document.getElementById("termId").value = "";
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
  const addBtn = document.getElementById("addTermBtn");
  const form = document.getElementById("termForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Education Term";
      document.getElementById("termForm").reset();
      document.getElementById("termId").value = "";
      document.getElementById("termModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("termMessage");
  const termId = document.getElementById("termId").value;

  const formData = {
    term_name: document.getElementById("termName").value.trim(),
    start_date: document.getElementById("termStartDate").value,
    end_date: document.getElementById("termEndDate").value,
  };

  // Validation
  if (!formData.term_name || !formData.start_date || !formData.end_date) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  // Validate dates
  const startDate = new Date(formData.start_date);
  const endDate = new Date(formData.end_date);
  if (endDate < startDate) {
    showMessage(messageEl, "End date must be after start date", "error");
    return;
  }

  try {
    showMessage(messageEl, termId ? "Updating education term..." : "Creating education term...", "success");

    let res;
    if (termId) {
      // Update
      res = await fetch(`${API_BASE}/${termId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    } else {
      // Create
      res = await fetch(API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    }

    // Handle 401 Unauthorized (invalid token)
    if (res.status === 401) {
      showMessage(messageEl, "Session expired. Please login again.", "error");
      setTimeout(() => {
        logout();
      }, 2000);
      return;
    }

    const data = await res.json().catch(() => ({ message: "Unknown error occurred" }));

    if (res.ok) {
      showMessage(messageEl, termId ? "Education term updated successfully" : "Education term created successfully", "success");
      document.getElementById("termModal").style.display = "none";
      document.getElementById("termForm").reset();
      document.getElementById("termId").value = "";
      // Reload terms after a short delay
      setTimeout(() => {
        loadTerms();
      }, 500);
    } else {
      const errorMessage = data.message || data.error || `HTTP ${res.status}: Operation failed`;
      console.error("Error response:", { status: res.status, data });
      showMessage(messageEl, errorMessage, "error");
    }
  } catch (error) {
    console.error("Error saving education term:", error);
    showMessage(messageEl, "Error saving education term: " + error.message, "error");
  }
}

// Edit education term
async function editTerm(id) {
  const messageEl = document.getElementById("termMessage");
  try {
    showMessage(messageEl, "Loading education term...", "success");
    
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      // Handle 401 Unauthorized (invalid token)
      if (res.status === 401) {
        showMessage(messageEl, "Session expired. Please login again.", "error");
        setTimeout(() => {
          logout();
        }, 2000);
        return;
      }

      const errorData = await res.json().catch(() => ({ message: "Failed to load education term" }));
      throw new Error(errorData.message || errorData.error || `HTTP ${res.status}: Failed to load education term`);
    }

    const term = await res.json();

    if (!term) {
      showMessage(messageEl, "Education term not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Education Term";
    document.getElementById("termId").value = term.term_id || term.id;
    document.getElementById("termName").value = term.term_name || term.termName || "";
    
    // Format dates for input fields (YYYY-MM-DD)
    if (term.start_date) {
      const startDate = new Date(term.start_date);
      if (!isNaN(startDate.getTime())) {
        document.getElementById("termStartDate").value = startDate.toISOString().split('T')[0];
      } else {
        document.getElementById("termStartDate").value = "";
      }
    } else {
      document.getElementById("termStartDate").value = "";
    }
    
    if (term.end_date) {
      const endDate = new Date(term.end_date);
      if (!isNaN(endDate.getTime())) {
        document.getElementById("termEndDate").value = endDate.toISOString().split('T')[0];
      } else {
        document.getElementById("termEndDate").value = "";
      }
    } else {
      document.getElementById("termEndDate").value = "";
    }

    document.getElementById("termModal").style.display = "block";
    
    // Clear loading message
    if (messageEl) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading education term:", error);
    showMessage(messageEl, "Error loading education term: " + error.message, "error");
  }
}

// Delete education term (make it globally accessible)
window.deleteTerm = async function deleteTerm(id) {
  if (!confirm("Are you sure you want to delete this education term?")) {
    return;
  }

  const messageEl = document.getElementById("termMessage");
  try {
    showMessage(messageEl, "Deleting education term...", "success");
    
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    // Handle 401 Unauthorized (invalid token)
    if (res.status === 401) {
      showMessage(messageEl, "Session expired. Please login again.", "error");
      setTimeout(() => {
        logout();
      }, 2000);
      return;
    }

    const data = await res.json().catch(() => ({ message: "Unknown error occurred" }));

    if (res.ok) {
      showMessage(messageEl, "Education term deleted successfully", "success");
      // Reload terms after a short delay
      setTimeout(() => {
        loadTerms();
      }, 500);
    } else {
      const errorMessage = data.message || data.error || `HTTP ${res.status}: Failed to delete education term`;
      console.error("Delete error response:", { status: res.status, data });
      showMessage(messageEl, errorMessage, "error");
    }
  } catch (error) {
    console.error("Error deleting education term:", error);
    showMessage(messageEl, "Error deleting education term: " + error.message, "error");
  }
}

// Make editTerm globally accessible
window.editTerm = editTerm;

