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
    <aside className="w-64 bg-gray-800 h-screen p-6 flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-6">BudgeT</h1>
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className="block py-2 px-4 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="w-full py-2 text-white bg-red-600 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
