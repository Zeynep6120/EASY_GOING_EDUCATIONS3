// Contact Service
import {
  CONTACT_CREATE_API,
  CONTACT_GET_ALL_BY_PAGE_API,
} from "../helpers/api-routes.js";
import { getAuthHeaders } from "../helpers/auth-helpers.js";

export const createContactMessage = async (payload) => {
  return fetch(CONTACT_CREATE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const getAllContactMessageByPage = async (
  page = 0,
  size = 10,
  sort = "date",
  type = "desc"
) => {
  const qs = `page=${page}&size=${size}&sort=${sort}&type=${type}`;
  return fetch(`${CONTACT_GET_ALL_BY_PAGE_API}?${qs}`, {
    headers: getAuthHeaders(),
  });
};

