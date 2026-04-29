import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

function unwrapCachedResponse(payload) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!accessToken || !refreshToken) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return Promise.reject(error);
      }

      try {
        const response = await api.refreshAccessToken();
        const isRefreshExpired = response?.refresh_expired;

        if (isRefreshExpired) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          return Promise.reject(error);
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const api = {
  getUsers: async () => {
    const response = await apiClient.get("/users");
    return unwrapCachedResponse(response.data);
  },
  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return unwrapCachedResponse(response.data);
  },
  editUserById: async (id, user) => {
    const response = await apiClient.put(`/users/${id}`, user);
    return response.data;
  },
  deleteUserById: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
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

  setRefreshToken: (token) => {
    if (!token) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
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
    if (response.data?.refreshToken) {
      api.setRefreshToken(response.data.refreshToken);
    }
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  getProducts: async () => {
    const response = await apiClient.get("/products");
    return unwrapCachedResponse(response.data);
  },

  addProduct: async (product) => {
    const response = await apiClient.post("/products", product);
    return response.data;
  },

  getProductById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return unwrapCachedResponse(response.data);
  },

  editProductById: async (id, product) => {
    const response = await apiClient.put(`/products/${id}`, product);
    return response.data;
  },

  deleteProductById: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
  getProtectedSellerOrAdmin: async () => {
    const response = await apiClient.get("/protected-route");
    return response.data;
  },
  getProtectedAdmin: async () => {
    const response = await apiClient.get("/protected-admin-route");
    return response.data;
  },
  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const response = await apiClient.post("/auth/refresh", { refreshToken });
    if (response.data?.accessToken)
      api.setAccessToken(response.data.accessToken);
    if (response.data?.refreshToken)
      api.setRefreshToken(response.data.refreshToken);
    return response.data;
  },
};
