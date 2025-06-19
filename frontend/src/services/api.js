import axios from "axios";

const API_URL = "http://localhost:8000";

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add token to EVERY request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Make sure Bearer prefix is included
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Adding token to request:", token.substring(0, 10) + "...");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only refresh token on 401 errors and if we haven't already tried refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("Attempting to refresh token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          console.error("No refresh token available");
          localStorage.removeItem("token");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        console.log(
          "Using refresh token:",
          refreshToken.substring(0, 10) + "..."
        );

        // Use direct axios call for token refresh to avoid interceptor loop
        const response = await axios.post(`${API_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        if (response.data && response.data.access) {
          console.log("Token refreshed successfully");
          localStorage.setItem("token", response.data.access);

          // Update authorization header for future requests
          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${response.data.access}`;

          // Force page reload to ensure all components use the new token
          window.location.reload();

          // The original request will be retried when the page reloads
          return Promise.resolve({
            data: { message: "Token refreshed, reloading page" },
          });
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const getAccounts = () => {
  return apiClient.get("/api/accounts/");
};

export const getTransactions = () => {
  return apiClient.get("/api/transactions/");
};

// New Plaid API functions
export const createLinkToken = async () => {
  try {
    console.log("Sending request to create link token...");
    const response = await apiClient.post("/api/create-link-token/");
    console.log("Successfully created link token");
    return response;
  } catch (error) {
    // Log more detailed error information
    console.error("Error creating link token:", error);
    console.error("Error details:", error.response?.data);
    throw error;
  }
};

export const exchangePublicToken = (publicToken) => {
  return apiClient.post("/api/exchange-token/", { public_token: publicToken });
};

export const syncTransactions = () => {
  return apiClient.post("/api/sync-transactions/");
};

export default apiClient;
