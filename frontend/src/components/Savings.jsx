import React from "react";

export default function Savings() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Savings Goals</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Emergency Fund</span>
          <span className="text-green-600">$5,000</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Vacation Fund</span>
          <span className="text-blue-600">$2,500</span>
        </div>
        <div className="flex items-center justify-between">
          <span>New Car Fund</span>
          <span className="text-red-600">$10,000</span>
        </div>
      </div>
    </div>
  );
}
