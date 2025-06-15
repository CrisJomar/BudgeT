import React from "react";

export default function Activity() {
  const activities = [
    { id: 1, type: "Deposit", amount: "$500", date: "2023-10-01" },
    { id: 2, type: "Withdrawal", amount: "$200", date: "2023-10-02" },
    { id: 3, type: "Transfer", amount: "$150", date: "2023-10-03" },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <ul className="space-y-4">
        {activities.map((activity) => (
          <li key={activity.id} className="flex justify-between">
            <span>{activity.type}</span>
            <span>{activity.amount}</span>
            <span className="text-gray-500">{activity.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
