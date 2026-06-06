import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
export const TOKEN_KEY = "couple_budget_token";

export const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message;
  }

  return "Ha ocurrido un error inesperado";
};

