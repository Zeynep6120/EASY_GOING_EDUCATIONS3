// SweetAlert2 wrapper
// Note: SweetAlert2 needs to be loaded in HTML

export const swAlert = (title, icon = "info", text = "") => {
  // icon: success | error | info | warning | question
  if (typeof Swal === "undefined") {
    console.warn("SweetAlert2 is not loaded");
    alert(title + (text ? `\n${text}` : ""));
    return Promise.resolve({ isConfirmed: true });
  }

  return Swal.fire({
    title,
    text,
    icon,
  });
};

export const swConfirm = (
  title,
  icon = "warning",
  text = "",
  confirmButtonText = "Yes"
) => {
  if (typeof Swal === "undefined") {
    console.warn("SweetAlert2 is not loaded");
    const confirmed = confirm(title + (text ? `\n${text}` : ""));
    return Promise.resolve({ isConfirmed: confirmed });
  }

  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText,
    showCancelButton: true,
  });
};

