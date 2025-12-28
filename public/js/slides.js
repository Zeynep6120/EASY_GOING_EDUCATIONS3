// Slides Management - Vanilla JavaScript

const API_BASE = "/api/content/slides";

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

  loadSlides();
  setupModal();
  setupForm();
});

// Load slides
async function loadSlides() {
  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to load slides");
    }

    const data = await res.json();
    const slides = Array.isArray(data) ? data : [];
    displaySlides(slides);
  } catch (error) {
    console.error("Error loading slides:", error);
    showMessage(
      document.getElementById("slideMessage"),
      "Error loading slides: " + error.message,
      "error"
    );
  }
}

// Display slides in table
function displaySlides(slides) {
  const tbody = document.getElementById("slideTableBody");
  if (!tbody) return;

  if (slides.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No slides found</td></tr>";
    return;
  }

  tbody.innerHTML = slides
    .map(
      (slide, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${slide.slide_id || slide.id}</td>
      <td>${slide.title || ""}</td>
      <td>${(slide.description || "").substring(0, 50)}${(slide.description || "").length > 50 ? "..." : ""}</td>
      <td>${slide.image || "-"}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editSlide(${slide.slide_id || slide.id})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteSlide(${slide.slide_id || slide.id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Setup modal
function setupModal() {
  const modal = document.getElementById("slideModal");
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
      document.getElementById("slideForm").reset();
      document.getElementById("slideId").value = "";
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
  const addBtn = document.getElementById("addSlideBtn");
  const form = document.getElementById("slideForm");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = "Add Slide";
      document.getElementById("slideForm").reset();
      document.getElementById("slideId").value = "";
      document.getElementById("slideModal").style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("slideMessage");
  const slideId = document.getElementById("slideId").value;

  const formData = {
    title: document.getElementById("slideTitle").value.trim(),
    description: document.getElementById("slideDescription").value.trim() || null,
    image: document.getElementById("slideImage").value.trim() || null,
  };

  if (!formData.title) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  try {
    showMessage(messageEl, slideId ? "Updating slide..." : "Creating slide...", "success");

    let res;
    if (slideId) {
      res = await fetch(`${API_BASE}/${slideId}`, {
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

    showMessage(messageEl, slideId ? "Slide updated successfully" : "Slide created successfully", "success");
    document.getElementById("slideModal").style.display = "none";
    document.getElementById("slideForm").reset();
    document.getElementById("slideId").value = "";
    loadSlides();
  } catch (error) {
    console.error("Error saving slide:", error);
    showMessage(messageEl, "Error saving slide: " + error.message, "error");
  }
}

// Edit slide
async function editSlide(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load slide");

    const slide = await res.json();

    if (!slide) {
      showMessage(document.getElementById("slideMessage"), "Slide not found", "error");
      return;
    }

    document.getElementById("modalTitle").textContent = "Edit Slide";
    document.getElementById("slideId").value = slide.slide_id || slide.id;
    document.getElementById("slideTitle").value = slide.title || "";
    document.getElementById("slideDescription").value = slide.description || "";
    document.getElementById("slideImage").value = slide.image || "";

    document.getElementById("slideModal").style.display = "block";
  } catch (error) {
    console.error("Error loading slide:", error);
    showMessage(document.getElementById("slideMessage"), "Error loading slide", "error");
  }
}

// Delete slide
window.deleteSlide = async function deleteSlide(id) {
  if (!confirm("Are you sure you want to delete this slide?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      showMessage(document.getElementById("slideMessage"), "Slide deleted successfully", "success");
      loadSlides();
    } else {
      const data = await res.json();
      showMessage(document.getElementById("slideMessage"), data.message || "Failed to delete slide", "error");
    }
  } catch (error) {
    console.error("Error deleting slide:", error);
    showMessage(document.getElementById("slideMessage"), "Error deleting slide: " + error.message, "error");
  }
}

// Make editSlide globally accessible
window.editSlide = editSlide;

