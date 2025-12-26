// Manager Management - Vanilla JavaScript

const API_BASE = "/api/dean";

let currentPage = 0;
const pageSize = 10;

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

  // Hide "Add New Manager" button if user is not ADMIN
  const currentUser = getCurrentUser();
  const addManagerBtn = document.getElementById("addManagerBtn");
  if (addManagerBtn && currentUser && currentUser.role !== "ADMIN") {
    addManagerBtn.style.display = "none";
  }

  loadManagers();
  setupModal();
  setupForm();
});

// Load managers
async function loadManagers() {
  try {
    const res = await fetch(
      `${API_BASE}/search?page=${currentPage}&size=${pageSize}&sort=name&type=asc`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load managers" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Failed to load managers`);
    }

    const data = await res.json();
    console.log("Manager data received:", data); // Debug log
    const managers = data.content || data || [];
    console.log("Managers array:", managers); // Debug log
    displayManagers(managers);
  } catch (error) {
    console.error("Error loading managers:", error);
    showMessage(
      document.getElementById("managerMessage"),
      "Error loading managers: " + error.message,
      "error"
    );
  }
}

// Display managers in table
function displayManagers(managers) {
  const tbody = document.getElementById("managerTableBody");
  if (!tbody) return;

  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.role === "ADMIN";

  if (managers.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No managers found</td></tr>";
    return;
  }

  tbody.innerHTML = managers
    .map(
      (manager) => {
        const isOwnData = currentUser && (currentUser.id === manager.user_id || currentUser.user_id === manager.user_id);
        // Only show edit/delete buttons if it's own data or user is ADMIN
        const showActions = isOwnData || isAdmin;
        
        return `
    <tr>
      <td>${manager.user_id || manager.id}</td>
      <td>${manager.username}</td>
      <td>${manager.name}</td>
      <td>${manager.surname || ""}</td>
      <td>${manager.email}</td>
      <td>
        ${showActions ? `
        <button class="btn-small btn-edit" onclick="editManager(${manager.user_id || manager.id})">Edit</button>
        ${isAdmin ? `<button class="btn-small btn-delete" onclick="deleteManager(${manager.user_id || manager.id})">Delete</button>` : ''}
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
  const modal = document.getElementById("managerModal");
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
      document.getElementById("managerForm").reset();
      document.getElementById("managerId").value = "";
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
  const addBtn = document.getElementById("addManagerBtn");
  const form = document.getElementById("managerForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Manager";
      document.getElementById("managerForm").reset();
      document.getElementById("managerId").value = "";
      document.getElementById("managerPassword").required = true;
      document.getElementById("managerModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("managerMessage");
  const managerId = document.getElementById("managerId").value;

  const formData = {
    username: document.getElementById("managerUsername").value.trim(),
    name: document.getElementById("managerName").value.trim(),
    surname: document.getElementById("managerSurname").value.trim(),
    email: document.getElementById("managerEmail").value.trim(),
    gender: document.getElementById("managerGender").value || null,
    birth_date: document.getElementById("managerBirthDate").value || null,
    birth_place: document.getElementById("managerBirthPlace").value.trim() || null,
    phone_number: document.getElementById("managerPhone").value.trim() || null,
    ssn: document.getElementById("managerSSN").value.trim() || null,
    role: "MANAGER",
  };

  const password = document.getElementById("managerPassword").value.trim();
  if (password) {
    formData.password = password;
  }

  // Validation
  if (!formData.username || !formData.name || !formData.surname || !formData.email) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  if (!managerId && !formData.password) {
    showMessage(messageEl, "Password is required for new manager", "error");
    return;
  }

  try {
    showMessage(messageEl, managerId ? "Updating manager..." : "Creating manager...", "success");

    let res;
    if (managerId) {
      // Update
      res = await fetch(`${API_BASE}/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, id: parseInt(managerId) }),
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
      showMessage(messageEl, managerId ? "Manager updated successfully" : "Manager created successfully", "success");
      document.getElementById("managerModal").style.display = "none";
      document.getElementById("managerForm").reset();
      document.getElementById("managerId").value = "";
      loadManagers();
    } else {
      showMessage(messageEl, data.message || "Operation failed", "error");
    }
  } catch (error) {
    console.error("Error saving manager:", error);
    showMessage(messageEl, "Error saving manager: " + error.message, "error");
  }
}

// Edit manager
async function editManager(id) {
  try {
    const res = await fetch(`${API_BASE}/getManagerById/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load manager");

    const manager = await res.json();

    if (!manager) {
      showMessage(document.getElementById("managerMessage"), "Manager not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Manager";
    document.getElementById("managerId").value = manager.user_id || manager.id;
    document.getElementById("managerUsername").value = manager.username || "";
    document.getElementById("managerName").value = manager.name || "";
    document.getElementById("managerSurname").value = manager.surname || "";
    document.getElementById("managerEmail").value = manager.email || "";
    document.getElementById("managerGender").value = manager.gender || "";
    document.getElementById("managerBirthDate").value = manager.birth_date || "";
    document.getElementById("managerBirthPlace").value = manager.birth_place || "";
    document.getElementById("managerPhone").value = manager.phone_number || "";
    document.getElementById("managerSSN").value = manager.ssn || "";
    document.getElementById("managerPassword").required = false;

    document.getElementById("managerModal").style.display = "block";
  } catch (error) {
    console.error("Error loading manager:", error);
    showMessage(document.getElementById("managerMessage"), "Error loading manager", "error");
  }
}

// Delete manager
async function deleteManager(id) {
  if (!confirm("Are you sure you want to delete this manager?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/delete/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("managerMessage"), "Manager deleted successfully", "success");
      loadManagers();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("managerMessage"), data.message || "Failed to delete manager", "error");
    }
  } catch (error) {
    console.error("Error deleting manager:", error);
    showMessage(document.getElementById("managerMessage"), "Error deleting manager: " + error.message, "error");
  }
}

