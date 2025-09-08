import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${
        response.status
      }`
    );
    return response;
  },
  (error) => {
    console.error(
      `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${
        error.response?.status
      }`
    );
    console.error("Response error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const databaseService = {
  async testConnection() {
    try {
      const response = await api.post("/database/connect-db");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to test database connection"
      );
    }
  },

  async getCollections() {
    try {
      const response = await api.get("/database/collections");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch tables");
    }
  },

  async getCollectionData(collectionName, limit = 100) {
    try {
      const response = await api.get(
        `/database/collections/${collectionName}/${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch table data"
      );
    }
  },
};
