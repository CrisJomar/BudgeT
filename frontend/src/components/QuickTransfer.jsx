import React from "react";
import { usePlaidLink } from "react-plaid-link";
import axios from "axios";

export default function QuickTransfer() {
  const { open, ready } = usePlaidLink({
    token: "YOUR_LINK_TOKEN_FROM_BACKEND",
    onSuccess: (publicToken) => {
      // Send the public token to the backend
      axios.post("/api/exchange-token", { publicToken });
    },
    onExit: (error) => {
      console.error("Plaid Link exited:", error);
    },
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Transfer</h2>
      <form>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Account
          </label>
          <select className="w-full p-2 border border-gray-300 rounded">
            <option>Checking Account</option>
            <option>Savings Account</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Account
          </label>
          <select className="w-full p-2 border border-gray-300 rounded">
            <option>Savings Account</option>
            <option>Investment Account</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            placeholder="$0.00"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Transfer Now
        </button>
      </form>
      <button
        onClick={() => open()}
        disabled={!ready}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition mt-4"
      >
        Connect Account
      </button>
    </div>
  );
}
