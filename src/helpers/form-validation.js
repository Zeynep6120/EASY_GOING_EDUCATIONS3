// Form validation helpers
// Note: For full validation, you might want to use a library like Yup or Joi

export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

export const transformFormDataToJSON = (formData) => {
  if (formData instanceof FormData) {
    return Object.fromEntries(formData.entries());
  }
  return formData;
};

export const response = (ok, message, errors) => {
  return {
    ok,
    message,
    errors,
    responseId: Math.random(),
  };
};

export const transformValidationErrors = (errors) => {
  const errObject = {};
  if (Array.isArray(errors)) {
    errors.forEach((error) => {
      if (error.path) {
        errObject[error.path] = error.message;
      }
    });
  } else if (typeof errors === "object") {
    Object.assign(errObject, errors);
  }

  return response(false, "", errObject);
};

export const initialResponse = () => response(false, "", null);

// Basic validation functions
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== "";
};

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.length <= maxLength;
};

export const validatePhone = (phone) => {
  const re = /^[\d\s\-\+\(\)]+$/;
  return !phone || re.test(phone);
};

export const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

