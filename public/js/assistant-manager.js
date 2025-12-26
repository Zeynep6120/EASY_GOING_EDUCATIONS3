// Assistant Manager Management - Vanilla JavaScript

const API_BASE = "/api/vicedean";

let currentPage = 0;
const pageSize = 10;

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  // ADMIN, MANAGER, and ASSISTANT_MANAGER can access
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

  // Hide "Add New Assistant Manager" button if user is not ADMIN
  const currentUser = getCurrentUser();
  const addAssistantManagerBtn = document.getElementById("addAssistantManagerBtn");
  if (addAssistantManagerBtn && currentUser && currentUser.role !== "ADMIN") {
    addAssistantManagerBtn.style.display = "none";
  }

  loadAssistantManagers();
  setupModal();
  setupForm();
});

// Load assistant managers
async function loadAssistantManagers() {
  try {
    const res = await fetch(
      `${API_BASE}/search?page=${currentPage}&size=${pageSize}&sort=name&type=asc`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load assistant managers" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Failed to load assistant managers`);
    }

    const data = await res.json();
    console.log("Assistant Manager data received:", data); // Debug log
    const assistantManagers = data.content || data || [];
    console.log("Assistant Managers array:", assistantManagers); // Debug log
    displayAssistantManagers(assistantManagers);
  } catch (error) {
    console.error("Error loading assistant managers:", error);
    showMessage(
      document.getElementById("assistantManagerMessage"),
      "Error loading assistant managers: " + error.message,
      "error"
    );
  }
}

// Display assistant managers in table
function displayAssistantManagers(assistantManagers) {
  const tbody = document.getElementById("assistantManagerTableBody");
  if (!tbody) return;

  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.role === "ADMIN";

  if (assistantManagers.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No assistant managers found</td></tr>";
    return;
  }

  tbody.innerHTML = assistantManagers
    .map(
      (assistantManager) => {
        const isOwnData = currentUser && (currentUser.id === assistantManager.user_id || currentUser.user_id === assistantManager.user_id);
        // Only show edit/delete buttons if it's own data or user is ADMIN
        const showActions = isOwnData || isAdmin;
        
        return `
    <tr>
      <td>${assistantManager.user_id || assistantManager.id}</td>
      <td>${assistantManager.username}</td>
      <td>${assistantManager.name}</td>
      <td>${assistantManager.surname || ""}</td>
      <td>${assistantManager.email}</td>
      <td>
        ${showActions ? `
        <button class="btn-small btn-edit" onclick="editAssistantManager(${assistantManager.user_id || assistantManager.id})">Edit</button>
        ${isAdmin ? `<button class="btn-small btn-delete" onclick="deleteAssistantManager(${assistantManager.user_id || assistantManager.id})">Delete</button>` : ''}
        ` : '<span style="color: #999;">No actions available</span>'}
      </td>
    </tr>
  `;
      }
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("assistantManagerModal");
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
      document.getElementById("assistantManagerForm").reset();
      document.getElementById("assistantManagerId").value = "";
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
  const addBtn = document.getElementById("addAssistantManagerBtn");
  const form = document.getElementById("assistantManagerForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Assistant Manager";
      document.getElementById("assistantManagerForm").reset();
      document.getElementById("assistantManagerId").value = "";
      document.getElementById("assistantManagerPassword").required = true;
      document.getElementById("assistantManagerModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("assistantManagerMessage");
  const assistantManagerId = document.getElementById("assistantManagerId").value;

  const formData = {
    username: document.getElementById("assistantManagerUsername").value.trim(),
    name: document.getElementById("assistantManagerName").value.trim(),
    surname: document.getElementById("assistantManagerSurname").value.trim(),
    email: document.getElementById("assistantManagerEmail").value.trim(),
    gender: document.getElementById("assistantManagerGender").value || null,
    birth_date: document.getElementById("assistantManagerBirthDate").value || null,
    birth_place: document.getElementById("assistantManagerBirthPlace").value.trim() || null,
    phone_number: document.getElementById("assistantManagerPhone").value.trim() || null,
    ssn: document.getElementById("assistantManagerSSN").value.trim() || null,
    role: "ASSISTANT_MANAGER",
  };

  const password = document.getElementById("assistantManagerPassword").value.trim();
  if (password) {
    formData.password = password;
  }

  // Validation
  if (!formData.username || !formData.name || !formData.surname || !formData.email) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  if (!assistantManagerId && !formData.password) {
    showMessage(messageEl, "Password is required for new assistant manager", "error");
    return;
  }

  try {
    showMessage(messageEl, assistantManagerId ? "Updating assistant manager..." : "Creating assistant manager...", "success");

    let res;
    if (assistantManagerId) {
      // Update
      res = await fetch(`${API_BASE}/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, id: parseInt(assistantManagerId) }),
      });
    } else {
      // Create
      res = await fetch(`${API_BASE}/save`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
    }

    const data = await res.json();

    if (res.ok) {
      showMessage(messageEl, assistantManagerId ? "Assistant manager updated successfully" : "Assistant manager created successfully", "success");
      document.getElementById("assistantManagerModal").style.display = "none";
      document.getElementById("assistantManagerForm").reset();
      document.getElementById("assistantManagerId").value = "";
      loadAssistantManagers();
    } else {
      showMessage(messageEl, data.message || "Operation failed", "error");
    }
  } catch (error) {
    console.error("Error saving assistant manager:", error);
    showMessage(messageEl, "Error saving assistant manager: " + error.message, "error");
  }
}

// Edit assistant manager
async function editAssistantManager(id) {
  try {
    const res = await fetch(`${API_BASE}/getViceDeanById/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load assistant manager");

    const assistantManager = await res.json();

    if (!assistantManager) {
      showMessage(document.getElementById("assistantManagerMessage"), "Assistant manager not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Assistant Manager";
    document.getElementById("assistantManagerId").value = assistantManager.user_id || assistantManager.id;
    document.getElementById("assistantManagerUsername").value = assistantManager.username || "";
    document.getElementById("assistantManagerName").value = assistantManager.name || "";
    document.getElementById("assistantManagerSurname").value = assistantManager.surname || "";
    document.getElementById("assistantManagerEmail").value = assistantManager.email || "";
    document.getElementById("assistantManagerGender").value = assistantManager.gender || "";
    document.getElementById("assistantManagerBirthDate").value = assistantManager.birth_date || "";
    document.getElementById("assistantManagerBirthPlace").value = assistantManager.birth_place || "";
    document.getElementById("assistantManagerPhone").value = assistantManager.phone_number || "";
    document.getElementById("assistantManagerSSN").value = assistantManager.ssn || "";
    document.getElementById("assistantManagerPassword").required = false;

    document.getElementById("assistantManagerModal").style.display = "block";
  } catch (error) {
    console.error("Error loading assistant manager:", error);
    showMessage(document.getElementById("assistantManagerMessage"), "Error loading assistant manager", "error");
  }
}

// Delete assistant manager
async function deleteAssistantManager(id) {
  if (!confirm("Are you sure you want to delete this assistant manager?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/delete/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("assistantManagerMessage"), "Assistant manager deleted successfully", "success");
      loadAssistantManagers();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("assistantManagerMessage"), data.message || "Failed to delete assistant manager", "error");
    }
  } catch (error) {
    console.error("Error deleting assistant manager:", error);
    showMessage(document.getElementById("assistantManagerMessage"), "Error deleting assistant manager: " + error.message, "error");
  }
}

