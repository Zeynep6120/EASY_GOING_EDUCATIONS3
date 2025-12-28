// Students page functionality
import { api } from "./api.js";

export async function loadStudents() {
  try {
    const students = await api.getStudents();
    const tbody = document.getElementById("studentsBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    students.forEach((student) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${student.user_id}</td>
        <td>${student.name}</td>
        <td>${student.surname || ""}</td>
        <td>${student.email}</td>
        <td>${student.father_name || ""}</td>
        <td>${student.mother_name || ""}</td>
        <td>${student.advisor_name || ""}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Öğrenciler yüklenemedi:", error);
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();
  
  // Back button
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
});
