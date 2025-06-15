import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Wallet", path: "/wallet" },
    { name: "Payments", path: "/payments" },
    { name: "Activity", path: "/activity" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <aside className="w-72 bg-gray-900 text-white p-8 flex flex-col h-screen shadow-lg">
      {/* App Title */}
      <h1 className="text-3xl font-extrabold text-blue-400 mb-10 text-center tracking-wide">
        BudgeT
      </h1>

      {/* Navigation */}
      <nav className="flex-1 space-y-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="block text-gray-300 hover:text-blue-400 transition font-medium px-2 py-1 rounded hover:bg-gray-800"
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Bottom Buttons */}
      <div className="mt-auto space-y-4">
        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-semibold">
          Login
        </button>
        <button className="w-full px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg transition font-semibold">
          Logout
        </button>
      </div>
    </aside>
  );
}
