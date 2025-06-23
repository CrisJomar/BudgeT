import axios from "axios";

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token on every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (redirect to login)
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized access, redirecting to login");
      // Uncomment to redirect to login
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Make sure to export apiClient as a named export
export default apiClient; // Also exported as default for convenience

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
