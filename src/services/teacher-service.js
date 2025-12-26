// Teacher Service
import {
  ADVISOR_GET_ALL_API,
  TEACHER_ASSIGN_PROGRAM_API,
  TEACHER_CREATE_API,
  TEACHER_DELETE_API,
  TEACHER_GET_ALL_API,
  TEACHER_GET_ALL_BY_PAGE_API,
  TEACHER_GET_BY_ID_API,
  TEACHER_UPDATE_API,
} from "../helpers/api-routes.js";
import { getAuthHeaders } from "../helpers/auth-helpers.js";

export const getAllTeachersByPage = async (
  page = 0,
  size = 10,
  sort = "name",
  type = "asc"
) => {
  const qs = `page=${page}&size=${size}&sort=${sort}&type=${type}`;
  return fetch(`${TEACHER_GET_ALL_BY_PAGE_API}?${qs}`, {
    headers: getAuthHeaders(),
  });
};

export const deleteTeacher = async (id) => {
  return fetch(`${TEACHER_DELETE_API}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

export const createTeacher = async (payload) => {
  return fetch(TEACHER_CREATE_API, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

export const getTeacherById = async (id) => {
  if (!id) throw new Error("Id is missing");
  return fetch(`${TEACHER_GET_BY_ID_API}/${id}`, {
    headers: getAuthHeaders(),
  });
};

export const updateTeacher = async (payload) => {
  return fetch(`${TEACHER_UPDATE_API}/${payload.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

export const getAllAdvisorTeachers = async () => {
  return fetch(ADVISOR_GET_ALL_API, {
    headers: getAuthHeaders(),
  });
};

export const getAllTeachers = async () => {
  return fetch(TEACHER_GET_ALL_API, {
    headers: getAuthHeaders(),
  });
};

export const assignProgramToTeacher = async (payload) => {
  return fetch(TEACHER_ASSIGN_PROGRAM_API, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

