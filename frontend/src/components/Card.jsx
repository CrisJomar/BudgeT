import React from "react";

export default function Card({ account }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-2">
        {account.institution_name || "Unknown Institution"}
      </h3>
      <p className="text-gray-600 text-sm mb-1">
        Account type: {account.account_type || "Not specified"}
      </p>
      <p className="text-gray-600 text-xs mb-4">
        Last updated:{" "}
        {new Date(account.last_synced).toLocaleString() || "Never"}
      </p>

      <div className="text-right">
        <button className="text-blue-500 text-sm hover:text-blue-700">
          View Details
        </button>
      </div>
    </div>
  );
}
