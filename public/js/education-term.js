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
  try {
    const res = await fetch(
      `${API_BASE}?page=${currentPage}&size=${pageSize}&sort=startDate&type=desc`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load education terms");
    }

    const data = await res.json();
    const terms = Array.isArray(data) ? data : (data.content || []);
    displayTerms(terms);
  } catch (error) {
    console.error("Error loading education terms:", error);
    showMessage(
      document.getElementById("termMessage"),
      "Error loading education terms: " + error.message,
      "error"
    );
  }
}

// Display education terms in table
function displayTerms(terms) {
  const tbody = document.getElementById("termTableBody");
  if (!tbody) return;

  if (terms.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No education terms found</td></tr>";
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
      <td>${term.last_registration_date ? formatDate(term.last_registration_date) : ""}</td>
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
    last_registration_date: document.getElementById("termLastRegistrationDate").value || null,
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

    const data = await res.json();

    if (res.ok) {
      showMessage(messageEl, termId ? "Education term updated successfully" : "Education term created successfully", "success");
      document.getElementById("termModal").style.display = "none";
      document.getElementById("termForm").reset();
      document.getElementById("termId").value = "";
      loadTerms();
    } else {
      showMessage(messageEl, data.message || "Operation failed", "error");
    }
  } catch (error) {
    console.error("Error saving education term:", error);
    showMessage(messageEl, "Error saving education term: " + error.message, "error");
  }
}

// Edit education term
async function editTerm(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load education term");

    const term = await res.json();

    if (!term) {
      showMessage(document.getElementById("termMessage"), "Education term not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Education Term";
    document.getElementById("termId").value = term.term_id || term.id;
    document.getElementById("termName").value = term.term_name || term.termName || "";
    
    // Format dates for input fields (YYYY-MM-DD)
    if (term.start_date) {
      const startDate = new Date(term.start_date);
      document.getElementById("termStartDate").value = startDate.toISOString().split('T')[0];
    }
    if (term.end_date) {
      const endDate = new Date(term.end_date);
      document.getElementById("termEndDate").value = endDate.toISOString().split('T')[0];
    }
    if (term.last_registration_date) {
      const lastRegDate = new Date(term.last_registration_date);
      document.getElementById("termLastRegistrationDate").value = lastRegDate.toISOString().split('T')[0];
    }

    document.getElementById("termModal").style.display = "block";
  } catch (error) {
    console.error("Error loading education term:", error);
    showMessage(document.getElementById("termMessage"), "Error loading education term", "error");
  }
}

// Delete education term
async function deleteTerm(id) {
  if (!confirm("Are you sure you want to delete this education term?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("termMessage"), "Education term deleted successfully", "success");
      loadTerms();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("termMessage"), data.message || "Failed to delete education term", "error");
    }
  } catch (error) {
    console.error("Error deleting education term:", error);
    showMessage(document.getElementById("termMessage"), "Error deleting education term: " + error.message, "error");
  }
}

