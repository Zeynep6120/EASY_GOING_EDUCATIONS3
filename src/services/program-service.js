// Lesson Program Service
import {
  PROGRAM_CREATE_API,
  PROGRAM_DELETE_API,
  PROGRAM_GET_ALL_API,
  PROGRAM_GET_ALL_BY_PAGE_API,
  PROGRAM_GET_STUDENT_API,
  PROGRAM_GET_UNASSIGNED_API,
} from "../helpers/api-routes.js";
import { getAuthHeaders } from "../helpers/auth-helpers.js";

export const getAllProgramsByPage = async (
  page = 0,
  size = 10,
  sort = "id",
  type = "asc"
) => {
  const qs = `page=${page}&size=${size}&sort=${sort}&type=${type}`;
  return fetch(`${PROGRAM_GET_ALL_BY_PAGE_API}?${qs}`, {
    headers: getAuthHeaders(),
  });
};

export const deleteProgram = async (id) => {
  return fetch(`${PROGRAM_DELETE_API}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

export const createProgram = async (payload) => {
  return fetch(PROGRAM_CREATE_API, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

export const getAllPrograms = async () => {
  return fetch(PROGRAM_GET_ALL_API, {
    headers: getAuthHeaders(),
  });
};

export const getAllUnassignedPrograms = async () => {
  return fetch(PROGRAM_GET_UNASSIGNED_API, {
    headers: getAuthHeaders(),
  });
};

export const getAllProgramsByStudent = async () => {
  return fetch(PROGRAM_GET_STUDENT_API, {
    headers: getAuthHeaders(),
  });
};

