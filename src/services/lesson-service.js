// Lesson Service
import {
  LESSON_CREATE_API,
  LESSON_DELETE_API,
  LESSON_GET_ALL_API,
  LESSON_GET_ALL_BY_PAGE_API,
} from "../helpers/api-routes.js";
import { getAuthHeaders } from "../helpers/auth-helpers.js";

export const getAllLessonsByPage = async (
  page = 0,
  size = 10,
  sort = "lessonName",
  type = "asc"
) => {
  const qs = `page=${page}&size=${size}&sort=${sort}&type=${type}`;
  return fetch(`${LESSON_GET_ALL_BY_PAGE_API}?${qs}`, {
    headers: getAuthHeaders(),
  });
};

export const deleteLesson = async (id) => {
  return fetch(`${LESSON_DELETE_API}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

export const createLesson = async (payload) => {
  return fetch(LESSON_CREATE_API, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

export const getAllLessons = async () => {
  return fetch(LESSON_GET_ALL_API, {
    headers: getAuthHeaders(),
  });
};

