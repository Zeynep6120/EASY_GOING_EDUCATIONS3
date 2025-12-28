// Contact page functionality
import { api } from "./api.js";
import { showMessage } from "../helpers/utils.js";

document.getElementById("contactForm").addEventListener("submit", async (e) => {
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
    const result = await api.sendContactMessage(formData);
    
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
});
