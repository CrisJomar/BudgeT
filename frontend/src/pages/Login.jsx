// filepath: /Users/cris/Proyects/BudgeT/frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Add Link import
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state
  const navigate = useNavigate();
  const API_URL = "http://localhost:8000"; // Define API_URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/token/`, {
        username,
        password,
      });

      console.log("Login response:", response.data);

      if (response.data.access && response.data.refresh) {
        localStorage.setItem("token", response.data.access);
        localStorage.setItem("refreshToken", response.data.refresh);

        console.log(
          "Token saved:",
          response.data.access.substring(0, 10) + "..."
        );
        console.log(
          "Refresh token saved:",
          response.data.refresh.substring(0, 10) + "..."
        );

        navigate("/dashboard");
      } else {
        setError("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to BudgeT</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            disabled={loading} // Disable button while loading
          >
            {loading ? "Logging in..." : "Login"} {/* Show loading text */}
          </button>
        </form>

        {/* Add register section here */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">Don't have an account?</p>
          <Link
            to="/register"
            className="mt-2 block w-full bg-gray-100 text-gray-800 py-2 rounded hover:bg-gray-200 border border-gray-300"
          >
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}
