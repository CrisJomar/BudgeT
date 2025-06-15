import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home"; // Import Home page
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Payments from "./pages/Payments";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Home />} /> {/* Add Home route */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
