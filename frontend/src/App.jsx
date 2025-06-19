import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Payments from "./pages/Payments";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Layout component with Sidebar for authenticated routes
const DashboardLayout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
};

// Layout component for public routes (no sidebar)
const PublicLayout = ({ children }) => {
  return <div className="w-full">{children}</div>;
};

// Protected route that checks authentication
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication routes (no sidebar) */}
        <Route
          path="/login"
          element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          }
        />
        <Route
          path="/register"
          element={
            <PublicLayout>
              <Register />
            </PublicLayout>
          }
        />

        {/* Public routes with sidebar */}
        <Route
          path="/"
          element={
            <DashboardLayout>
              <Home />
            </DashboardLayout>
          }
        />

        {/* Protected routes with sidebar */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Wallet />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Payments />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Activity />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
