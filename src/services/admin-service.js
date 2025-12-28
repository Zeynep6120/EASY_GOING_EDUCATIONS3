// Admin Service
import {
  ADMIN_CREATE_API,
  ADMIN_GET_ALL_BY_PAGE_API,
  ADMIN_DELETE_API,
} from "../helpers/api-routes.js";
import { getAuthHeaders } from "../helpers/auth-helpers.js";

export const getAllAdminsByPage = async (
  page = 0,
  size = 10,
  sort = "name",
  type = "asc"
) => {
  const qs = `page=${page}&size=${size}&sort=${sort}&type=${type}`;
  return fetch(`${ADMIN_GET_ALL_BY_PAGE_API}?${qs}`, {
    headers: getAuthHeaders(),
  });
};

export const deleteAdmin = async (id) => {
  return fetch(`${ADMIN_DELETE_API}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

export const createAdmin = async (payload) => {
  return fetch(ADMIN_CREATE_API, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

