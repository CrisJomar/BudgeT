import React from "react";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import DailyLimit from "../components/DailyLimit";
import QuickTransfer from "../components/QuickTransfer";
import Savings from "../components/Savings";
import Activity from "../components/Activity";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">My Finances</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card />
          <Card />
          <Card />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <DailyLimit />
          <QuickTransfer />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Savings />
          <Activity />
        </div>
      </main>
    </div>
  );
}
