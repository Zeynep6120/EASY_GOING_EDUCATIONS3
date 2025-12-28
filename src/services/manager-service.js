// Manager Service
import {
  MANAGER_GET_ALL_BY_PAGE_API,
  MANAGER_DELETE_API,
  MANAGER_CREATE_API,
  MANAGER_GET_BY_ID_API,
  MANAGER_UPDATE_API,
} from "../helpers/api-routes.js";
import { getAuthHeaders } from "../helpers/auth-helpers.js";

export const getAllManagersByPage = async (
  page = 0,
  size = 10,
  sort = "name",
  type = "asc"
) => {
  const qs = `page=${page}&size=${size}&sort=${sort}&type=${type}`;
  return fetch(`${MANAGER_GET_ALL_BY_PAGE_API}?${qs}`, {
    headers: getAuthHeaders(),
  });
};

export const deleteManager = async (id) => {
  return fetch(`${MANAGER_DELETE_API}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

export const createManager = async (payload) => {
  return fetch(MANAGER_CREATE_API, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

export const getManagerById = async (id) => {
  return fetch(`${MANAGER_GET_BY_ID_API}/${id}`, {
    headers: getAuthHeaders(),
  });
};

export const updateManager = async (payload) => {
  return fetch(`${MANAGER_UPDATE_API}/${payload.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

