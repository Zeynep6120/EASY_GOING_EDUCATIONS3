// Contact page functionality - Vanilla JavaScript

document.addEventListener("DOMContentLoaded", function() {
  // Initialize header
  if (typeof initHeader === "function") {
    initHeader();
  }

  // Setup contact form
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactSubmit);
  }
});

async function handleContactSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("contactMessage");

  const formData = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    message: document.getElementById("message").value.trim(),
  };

  if (!formData.name || !formData.email || !formData.message) {
    showMessage(messageEl, "Please fill all required fields", "error");
    return;
  }

  try {
    showMessage(messageEl, "Sending message...", "success");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await res.json();
    
    if (result.message) {
      showMessage(messageEl, result.message, "success");
      document.getElementById("contactForm").reset();
    } else {
      showMessage(messageEl, "Message sent successfully!", "success");
      document.getElementById("contactForm").reset();
    }
  } catch (error) {
    console.error("Error sending message:", error);
    showMessage(messageEl, "Error sending message. Please try again.", "error");
  }
}

