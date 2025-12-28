// Miscellaneous helper functions
import { config } from "./config.js";

export const wait = (delay = 5) => 
  new Promise((resolve) => setTimeout(resolve, delay * 1000));

export const getGenderValues = () => {
  return config.genders.map((item) => item.value);
};

export const getTermValues = () => {
  return config.educationTerms.map((item) => item.value);
};

export const getDayLabel = (val) => {
  const day = config.days.find((t) => t.value === val);
  return day?.label ?? "";
};

export const getLessonNames = (lessons) => {
  return lessons.map((item) => item?.lessonName || item?.lesson_name).join(" - ");
};

export const getDayValues = () => {
  return config.days.map((item) => item.value);
};

export const isLater = (timeBefore, timeAfter) => {
  const tb = new Date(`2000-01-01T${timeBefore}`);
  const ta = new Date(`2000-01-01T${timeAfter}`);
  return ta > tb;
};

export const isStringArray = (str) => {
  try {
    const arr = JSON.parse(str);
    return Array.isArray(arr) && arr.length > 0;
  } catch (error) {
    return false;
  }
};

export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getTermLabel = (val) => {
  const term = config.educationTerms.find((t) => t.value === val);
  return term?.label ?? "";
};

export const isTimeValid = (timeString) => {
  if (!timeString) return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

