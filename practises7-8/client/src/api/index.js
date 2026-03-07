import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

const ACCESS_TOKEN_KEY = "accessToken";

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  setAccessToken: (token) => {
    if (!token) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      return;
    }
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  clearAccessToken: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  userRegister: async (user) => {
    const response = await apiClient.post("/auth/register", user);
    return response.data;
  },

  userLogin: async (user) => {
    const response = await apiClient.post("/auth/login", user);
    if (response.data?.accessToken) {
      api.setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  getProducts: async () => {
    const response = await apiClient.get("/products");
    return response.data;
  },

  addProduct: async (product) => {
    const response = await apiClient.post("/products", product);
    return response.data;
  },

  getProductById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  editProductById: async (id, product) => {
    const response = await apiClient.put(`/products/${id}`, product);
    return response.data;
  },

  deleteProductById: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};
