// Users Management - Vanilla JavaScript

const API_BASE = "/api/users";

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

  loadUsers();
  setupModal();
  setupForm();
});

// Load users
async function loadUsers() {
  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load users" }));
      throw new Error(errorData.message || errorData.error || `HTTP ${res.status}: Failed to load users`);
    }

    const data = await res.json();
    const users = Array.isArray(data) ? data : [];
    displayUsers(users);
    
    // Clear any previous error messages on success
    const messageEl = document.getElementById("userMessage");
    if (messageEl && users.length > 0) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading users:", error);
    showMessage(
      document.getElementById("userMessage"),
      "Error loading users: " + error.message,
      "error"
    );
  }
}

// Display users in table
function displayUsers(users) {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = "<tr><td colspan='8'>No users found</td></tr>";
    return;
  }

  tbody.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td>${user.user_id || user.id}</td>
      <td>${user.username || ""}</td>
      <td>${user.name || ""}</td>
      <td>${user.surname || ""}</td>
      <td>${user.email || ""}</td>
      <td>${user.role || ""}</td>
      <td>${user.is_active ? "Yes" : "No"}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editUser(${user.user_id || user.id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteUser(${user.user_id || user.id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("userModal");
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
      document.getElementById("userForm").reset();
      document.getElementById("userId").value = "";
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
  const addBtn = document.getElementById("addUserBtn");
  const form = document.getElementById("userForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add User";
      document.getElementById("userForm").reset();
      document.getElementById("userId").value = "";
      document.getElementById("userPassword").required = true;
      document.getElementById("userIsActive").checked = true;
      document.getElementById("userModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("userMessage");
  const userId = document.getElementById("userId").value;

  const formData = {
    username: document.getElementById("userUsername").value.trim(),
    name: document.getElementById("userName").value.trim(),
    surname: document.getElementById("userSurname").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    role: document.getElementById("userRole").value,
    gender: document.getElementById("userGender").value || null,
    birth_date: document.getElementById("userBirthDate").value || null,
    birth_place: document.getElementById("userBirthPlace").value.trim() || null,
    phone_number: document.getElementById("userPhone").value.trim() || null,
    ssn: document.getElementById("userSSN").value.trim() || null,
    is_active: document.getElementById("userIsActive").checked,
  };

  const password = document.getElementById("userPassword").value.trim();
  if (password) {
    formData.password = password;
  }

  // Validation
  if (!formData.username || !formData.name || !formData.surname || !formData.email || !formData.role) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  if (!userId && !formData.password) {
    showMessage(messageEl, "Password is required for new user", "error");
    return;
  }

  try {
    showMessage(messageEl, userId ? "Updating user..." : "Creating user...", "success");

    let res;
    if (userId) {
      // Update
      res = await fetch(`${API_BASE}/${userId}`, {
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

    if (!res.ok) {
      showMessage(messageEl, data.message || data.error || "Operation failed", "error");
      return;
    }

    showMessage(messageEl, userId ? "User updated successfully" : "User created successfully", "success");
    document.getElementById("userModal").style.display = "none";
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    loadUsers();
  } catch (error) {
    console.error("Error saving user:", error);
    showMessage(messageEl, "Error saving user: " + error.message, "error");
  }
}

// Edit user
async function editUser(id) {
  const messageEl = document.getElementById("userMessage");
  try {
    showMessage(messageEl, "Loading user...", "success");
    
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load user" }));
      throw new Error(errorData.message || errorData.error || `HTTP ${res.status}: Failed to load user`);
    }

    const user = await res.json();

    if (!user) {
      showMessage(messageEl, "User not found", "error");
      return;
    }

    // Fill form
    document.getElementById("modalTitle").textContent = "Edit User";
    document.getElementById("userId").value = user.user_id || user.id;
    document.getElementById("userUsername").value = user.username || "";
    document.getElementById("userName").value = user.name || "";
    document.getElementById("userSurname").value = user.surname || "";
    document.getElementById("userEmail").value = user.email || "";
    document.getElementById("userRole").value = user.role || "";
    document.getElementById("userGender").value = user.gender || "";
    
    // Format birth_date for date input (YYYY-MM-DD)
    if (user.birth_date) {
      const birthDate = new Date(user.birth_date);
      if (!isNaN(birthDate.getTime())) {
        document.getElementById("userBirthDate").value = birthDate.toISOString().split('T')[0];
      } else {
        document.getElementById("userBirthDate").value = "";
      }
    } else {
      document.getElementById("userBirthDate").value = "";
    }
    
    document.getElementById("userBirthPlace").value = user.birth_place || "";
    document.getElementById("userPhone").value = user.phone_number || "";
    document.getElementById("userSSN").value = user.ssn || "";
    document.getElementById("userIsActive").checked = user.is_active !== false;
    document.getElementById("userPassword").required = false;

    document.getElementById("userModal").style.display = "block";
    
    // Clear loading message
    if (messageEl) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading user:", error);
    showMessage(messageEl, "Error loading user: " + error.message, "error");
  }
}

// Delete user
window.deleteUser = async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) {
    return;
  }

  const messageEl = document.getElementById("userMessage");
  try {
    showMessage(messageEl, "Deleting user...", "success");
    
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      showMessage(messageEl, "User deleted successfully", "success");
      // Reload users after a short delay
      setTimeout(() => {
        loadUsers();
      }, 500);
    } else {
      showMessage(messageEl, data.message || data.error || "Failed to delete user", "error");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    showMessage(messageEl, "Error deleting user: " + error.message, "error");
  }
}

// Make editUser globally accessible
window.editUser = editUser;

