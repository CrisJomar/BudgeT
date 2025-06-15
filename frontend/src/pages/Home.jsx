import React from "react";

export default function Home() {
  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-blue-400 mb-4">
          Welcome to BudgeT
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Your personal finance manager to help you track expenses, manage
          payments, and stay on top of your financial goals.
        </p>
        <div className="flex justify-center space-x-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-500 transition">
            Get Started
          </button>
          <button className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-600 transition">
            Learn More
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">Track Expenses</h2>
          <p className="text-gray-400">
            Monitor your spending and categorize expenses to gain insight into
            your habits.
          </p>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">Manage Payments</h2>
          <p className="text-gray-400">
            Get reminders and stay on top of bills and recurring payments.
          </p>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">Set Goals</h2>
          <p className="text-gray-400">
            Define savings or payoff goals and track your progress visually.
          </p>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">View Reports</h2>
          <p className="text-gray-400">
            Generate financial reports to understand your spending patterns.
          </p>
        </div>
      </div>
    </div>
  );
}
