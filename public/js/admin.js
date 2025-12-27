// Admin Management - Vanilla JavaScript

const API_BASE = "/api/admin";

let currentPage = 0;
const pageSize = 10;

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  if (!user || user.role !== "ADMIN") {
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

  loadAdmins();
  setupModal();
  setupForm();
});

// Load admins
async function loadAdmins() {
  try {
    const res = await fetch(
      `${API_BASE}/getAll?page=${currentPage}&size=${pageSize}&sort=name&type=asc`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load admins");
    }

    const data = await res.json();
    const admins = data.content || data || [];
    displayAdmins(admins);
  } catch (error) {
    console.error("Error loading admins:", error);
    showMessage(
      document.getElementById("adminMessage"),
      "Error loading admins: " + error.message,
      "error"
    );
  }
}

// Display admins in table
function displayAdmins(admins) {
  const tbody = document.getElementById("adminTableBody");
  if (!tbody) return;

  if (admins.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7'>No admins found</td></tr>";
    return;
  }

  tbody.innerHTML = admins
    .map(
      (admin, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${admin.user_id || admin.id}</td>
      <td>${admin.username}</td>
      <td>${admin.name}</td>
      <td>${admin.surname || ""}</td>
      <td>${admin.email}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editAdmin(${admin.user_id || admin.id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteAdmin(${admin.user_id || admin.id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("adminModal");
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
      document.getElementById("adminForm").reset();
      document.getElementById("adminId").value = "";
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
  const addBtn = document.getElementById("addAdminBtn");
  const form = document.getElementById("adminForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Admin";
      document.getElementById("adminForm").reset();
      document.getElementById("adminId").value = "";
      document.getElementById("adminPassword").required = true;
      document.getElementById("adminModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("adminMessage");
  const adminId = document.getElementById("adminId").value;

  const formData = {
    username: document.getElementById("adminUsername").value.trim(),
    name: document.getElementById("adminName").value.trim(),
    surname: document.getElementById("adminSurname").value.trim(),
    email: document.getElementById("adminEmail").value.trim(),
    gender: document.getElementById("adminGender").value || null,
    birth_date: document.getElementById("adminBirthDate").value || null,
    birth_place: document.getElementById("adminBirthPlace").value.trim() || null,
    phone_number: document.getElementById("adminPhone").value.trim() || null,
    ssn: document.getElementById("adminSSN").value.trim() || null,
    role: "ADMIN",
  };

  const password = document.getElementById("adminPassword").value.trim();
  if (password) {
    formData.password = password;
  }

  // Validation
  if (!formData.username || !formData.name || !formData.surname || !formData.email) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  if (!adminId && !formData.password) {
    showMessage(messageEl, "Password is required for new admin", "error");
    return;
  }

  try {
    showMessage(messageEl, adminId ? "Updating admin..." : "Creating admin...", "success");

    let res;
    if (adminId) {
      // Update
      res = await fetch(`${API_BASE}/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, id: parseInt(adminId) }),
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

    if (!res.ok) {
      showMessage(messageEl, data.message || data.error || "Operation failed", "error");
      return;
    }

    showMessage(messageEl, adminId ? "Admin updated successfully" : "Admin created successfully", "success");
    document.getElementById("adminModal").style.display = "none";
    document.getElementById("adminForm").reset();
    document.getElementById("adminId").value = "";
    loadAdmins();
  } catch (error) {
    console.error("Error saving admin:", error);
    showMessage(messageEl, "Error saving admin: " + error.message, "error");
  }
}

// Edit admin
async function editAdmin(id) {
  try {
    const res = await fetch(`${API_BASE}/getAdminById/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load admin");

    const admin = await res.json();

    if (!admin) {
      showMessage(document.getElementById("adminMessage"), "Admin not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit Admin";
    document.getElementById("adminId").value = admin.user_id || admin.id;
    document.getElementById("adminUsername").value = admin.username || "";
    document.getElementById("adminName").value = admin.name || "";
    document.getElementById("adminSurname").value = admin.surname || "";
    document.getElementById("adminEmail").value = admin.email || "";
    document.getElementById("adminGender").value = admin.gender || "";
    document.getElementById("adminBirthDate").value = admin.birth_date || "";
    document.getElementById("adminBirthPlace").value = admin.birth_place || "";
    document.getElementById("adminPhone").value = admin.phone_number || "";
    document.getElementById("adminSSN").value = admin.ssn || "";
    document.getElementById("adminPassword").required = false;

    document.getElementById("adminModal").style.display = "block";
  } catch (error) {
    console.error("Error loading admin:", error);
    showMessage(document.getElementById("adminMessage"), "Error loading admin", "error");
  }
}

// Delete admin
async function deleteAdmin(id) {
  if (!confirm("Are you sure you want to delete this admin?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/delete/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("adminMessage"), "Admin deleted successfully", "success");
      loadAdmins();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("adminMessage"), data.message || "Failed to delete admin", "error");
    }
  } catch (error) {
    console.error("Error deleting admin:", error);
    showMessage(document.getElementById("adminMessage"), "Error deleting admin: " + error.message, "error");
  }
}

