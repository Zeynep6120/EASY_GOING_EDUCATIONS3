const API_BASE = "/api/auth";

async function loadTeachers() {
  try {
    const res = await fetch(`${API_BASE}/teachers`);
    const teachers = await res.json();
    const select = document.getElementById("advisorTeacher");
    teachers.forEach((teacher) => {
      const option = document.createElement("option");
      option.value = teacher.teacher_id;
      option.textContent = `${teacher.name} ${teacher.surname}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Öğretmenler yüklenemedi.");
  }
}

document.getElementById("detailsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fatherName = document.getElementById("fatherName").value;
  const motherName = document.getElementById("motherName").value;
  const advisorTeacherId = document.getElementById("advisorTeacher").value;
  const message = document.getElementById("message");

  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_BASE}/update-student-details`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fatherName, motherName, advisorTeacherId }),
    });
    const data = await res.json();
    if (res.ok) {
      message.style.color = "green";
      message.textContent = "Detaylar kaydedildi!";
      setTimeout(() => (window.location.href = "index.html"), 2000);
    } else {
      message.textContent = data.message;
    }
  } catch (error) {
    message.textContent = "Hata oluştu.";
  }
});

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

window.onload = loadTeachers;
