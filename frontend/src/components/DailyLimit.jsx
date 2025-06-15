import React from "react";

export default function DailyLimit() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Daily Spending Limit</h2>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-600 dark:text-gray-400">Limit:</span>
        <span className="text-lg font-bold">$100</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: "75%" }}
        ></div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        You have spent $75 today.
      </p>
    </div>
  );
}
