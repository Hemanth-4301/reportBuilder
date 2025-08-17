import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    return Promise.reject(error);
  }
);

export const reportsService = {
  async generateReport(reportConfig) {
    try {
      // Validate visualization fields before sending
      if (reportConfig.visualization.type !== "table") {
        if (
          !reportConfig.visualization.xAxis ||
          !reportConfig.visualization.yAxis
        ) {
          throw new Error(
            "X-Axis and Y-Axis fields are required for chart visualizations"
          );
        }
        if (
          (reportConfig.visualization.type === "bubble" ||
            reportConfig.visualization.type === "scatter") &&
          !reportConfig.visualization.radius
        ) {
          throw new Error(
            "Radius field is required for Bubble and Scatter chart visualizations"
          );
        }
      }

      const response = await api.post("/reports/generate-report", reportConfig);
      return response.data;
    } catch (error) {
      console.error("Report generation error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to generate report"
      );
    }
  },
};
