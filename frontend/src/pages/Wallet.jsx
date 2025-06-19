import React, { useState, useEffect } from "react";
import apiClient from "../services/api";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Wallet() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletData, setWalletData] = useState({
    accounts: [],
    totalBalance: 0,
    transactions: [],
  });
  const [view, setView] = useState("overview"); // "overview", "transactions", "settings"

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      // Fetch accounts and transactions in parallel
      const [accountsResponse, transactionsResponse] = await Promise.all([
        apiClient.get("/api/accounts/"),
        apiClient.get("/api/transactions/"),
      ]);

      const accounts = accountsResponse.data;
      const transactions = transactionsResponse.data;

      // Calculate total balance from all accounts
      const totalBalance = accounts.reduce(
        (sum, account) => sum + (account.balance || 0),
        0
      );

      setWalletData({
        accounts,
        totalBalance,
        transactions,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching wallet data:", err);
      setError("Failed to load wallet data. Please try again later.");
      setLoading(false);
    }
  };

  // Chart data for account balance distribution
  const chartData = {
    labels: walletData.accounts.map(
      (account) => account.name || `Account ending in ${account.mask || "****"}`
    ),
    datasets: [
      {
        label: "Balance",
        data: walletData.accounts.map((account) => account.balance || 0),
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={fetchWalletData}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Wallet</h1>

        <div className="flex space-x-2">
          <button
            onClick={() => setView("overview")}
            className={`px-4 py-2 rounded-lg ${
              view === "overview" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView("transactions")}
            className={`px-4 py-2 rounded-lg ${
              view === "transactions" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setView("settings")}
            className={`px-4 py-2 rounded-lg ${
              view === "settings" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {view === "overview" && (
        <>
          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Total Balance</h2>
            <p className="text-3xl font-bold text-blue-600">
              ${walletData.totalBalance.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Across {walletData.accounts.length} accounts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Distribution Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Balance Distribution
              </h2>
              {walletData.accounts.length > 0 ? (
                <div className="h-64">
                  <Doughnut
                    data={chartData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <p className="text-center text-gray-500 py-12">
                  No accounts to display
                </p>
              )}
            </div>

            {/* Connected Accounts */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
              {walletData.accounts.length > 0 ? (
                <ul className="divide-y">
                  {walletData.accounts.map((account) => (
                    <li
                      key={account.id}
                      className="py-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {account.name || "Account"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {account.account_type || "Bank Account"} ••••{" "}
                          {account.mask || "****"}
                        </p>
                      </div>
                      <span className="font-semibold">
                        ${(account.balance || 0).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-6">
                  No accounts connected yet
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {view === "transactions" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          {walletData.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {walletData.transactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {transaction.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.category || "Uncategorized"}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          transaction.amount < 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">
              No transactions available
            </p>
          )}
        </div>
      )}

      {view === "settings" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Settings</h2>

          <div className="mb-6">
            <h3 className="font-medium mb-2">Connected Institutions</h3>
            <ul className="divide-y border rounded-lg">
              {walletData.accounts.map((account) => (
                <li
                  key={account.id}
                  className="p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {account.institution_name || "Bank"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Connected on{" "}
                      {new Date(
                        account.created_at || new Date()
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-red-500 hover:text-red-700 text-sm">
                    Disconnect
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Connect New Account
          </button>
        </div>
      )}
    </div>
  );
}
