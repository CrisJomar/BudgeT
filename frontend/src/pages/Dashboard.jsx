import React, { useState, useEffect, useCallback } from "react";
import {
  getAccounts,
  getTransactions,
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
} from "../services/api";
import { usePlaidLink } from "react-plaid-link";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api";

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingTransactions, setSyncingTransactions] = useState(false);
  const [error, setError] = useState(null);
  const [linkToken, setLinkToken] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  // Existing helper functions and API calls remain the same
  const getBankName = (transaction) => {
    if (!transaction.plaid_account) {
      return "Unknown Bank";
    }

    let matchingAccount = accounts.find(
      (acc) =>
        acc.id === transaction.plaid_account ||
        String(acc.id) === String(transaction.plaid_account)
    );

    if (!matchingAccount && typeof transaction.plaid_account === "object") {
      matchingAccount = accounts.find(
        (acc) =>
          acc.id === transaction.plaid_account.id ||
          String(acc.id) === String(transaction.plaid_account.id)
      );
    }

    if (!matchingAccount && transaction.account_id) {
      matchingAccount = accounts.find(
        (acc) =>
          acc.plaid_account_id === transaction.account_id ||
          String(acc.plaid_account_id) === String(transaction.account_id)
      );
    }

    return matchingAccount?.institution_name || "Unknown Bank";
  };

  // Calculate financial summary data
  const calculateSummary = () => {
    const total = transactions.length;
    const spending = transactions
      .filter((t) => parseFloat(t.amount) > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const income = Math.abs(
      transactions
        .filter((t) => parseFloat(t.amount) < 0)
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
    );

    const balance = accounts.reduce(
      (sum, account) => sum + parseFloat(account.current_balance || 0),
      0
    );

    // Get most recent transactions
    const recent = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // Calculate spending by category
    const byCategory = transactions.reduce((acc, transaction) => {
      const category = transaction.category || "Uncategorized";
      const amount = parseFloat(transaction.amount || 0);

      if (amount > 0) {
        // Only count spending
        if (!acc[category]) acc[category] = 0;
        acc[category] += amount;
      }
      return acc;
    }, {});

    // Convert to array and sort by amount
    const topCategories = Object.entries(byCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      total,
      spending,
      income,
      balance,
      recent,
      topCategories,
    };
  };

  // Keep existing data fetching and API functions
  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsResponse, transactionsResponse] = await Promise.all([
        getAccounts(),
        getTransactions(),
      ]);
      setAccounts(accountsResponse.data);
      setTransactions(transactionsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data");

      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshAccountBalances = async () => {
    try {
      setRefreshingBalances(true);
      await apiClient.post("/api/refresh-account-balances/");
      fetchData();
    } catch (error) {
      console.error("Error refreshing balances:", error);
    } finally {
      setRefreshingBalances(false);
    }
  };

  // Keep existing useEffects for data fetching and token handling
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found!");
      navigate("/login");
      return;
    }
    fetchData();
  }, [navigate]);

  // Other existing functions for Plaid integration remain the same
  const generateLinkToken = useCallback(async () => {
    console.log("Generating link token");
    try {
      const response = await createLinkToken();
      if (response.data && response.data.link_token) {
        setLinkToken(response.data.link_token);
      } else {
        setError("Failed to initialize bank connection.");
      }
    } catch (error) {
      console.error("Error creating link token:", error);
      setError("Failed to initialize bank connection.");
    }
  }, []);

  const onPlaidSuccess = useCallback(async (publicToken, metadata) => {
    try {
      await exchangePublicToken(publicToken);
      await fetchData();
      alert("Bank account connected successfully!");
    } catch (error) {
      console.error("Error exchanging public token:", error);
      alert("Failed to connect bank account. Please try again.");
    }
  }, []);

  const { open, ready } = usePlaidLink(
    linkToken
      ? {
          token: linkToken,
          onSuccess: (public_token, metadata) => {
            onPlaidSuccess(public_token, metadata);
          },
          onExit: (err, metadata) => {
            console.log("Plaid Link exit:", err, metadata);
          },
        }
      : {
          token: null,
          onSuccess: () => {},
        }
  );

  const handleConnectBank = async () => {
    if (linkToken && ready) {
      open();
    } else {
      try {
        await generateLinkToken();
      } catch (error) {
        console.error("Failed to generate link token:", error);
        alert("Unable to connect to bank. Please try again later.");
      }
    }
  };

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  const handleSyncTransactions = async () => {
    try {
      setSyncingTransactions(true);
      const response = await syncTransactions();
      await fetchData();
      alert("Transactions synced successfully!");
    } catch (error) {
      console.error("Error syncing transactions:", error);
      if (error.response && error.response.data) {
        alert(
          `Failed to sync transactions: ${
            error.response.data.error || "Unknown error"
          }`
        );
      } else {
        alert("Failed to sync transactions. See console for details.");
      }
    } finally {
      setSyncingTransactions(false);
    }
  };

  const filteredTransactions = transactions
    .filter((t) => categoryFilter === "all" || t.category === categoryFilter)
    .filter((t) => {
      if (selectedAccountId === "all") return true;
      return (
        t.plaid_account == selectedAccountId ||
        t.plaid_account?.id == selectedAccountId ||
        String(t.plaid_account).includes(selectedAccountId)
      );
    });

  // Get summary data
  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top header with actions */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Financial Dashboard
          </h1>

          <div className="flex space-x-3">
            <button
              onClick={handleConnectBank}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm"
              disabled={loading}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Connect Bank
            </button>

            <button
              onClick={refreshAccountBalances}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm"
              disabled={refreshingBalances}
            >
              <svg
                className={`w-4 h-4 mr-2 ${
                  refreshingBalances ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshingBalances ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={handleSyncTransactions}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm"
              disabled={syncingTransactions || accounts.length === 0}
            >
              <svg
                className={`w-4 h-4 mr-2 ${
                  syncingTransactions ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              {syncingTransactions ? "Syncing..." : "Sync Transactions"}
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              className={`
                ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              `}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`
                ${
                  activeTab === "accounts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              `}
              onClick={() => setActiveTab("accounts")}
            >
              Accounts
            </button>
            <button
              className={`
                ${
                  activeTab === "transactions"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              `}
              onClick={() => setActiveTab("transactions")}
            >
              Transactions
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Financial summary cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                          <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Balance
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              ${summary.balance.toFixed(2)}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                          <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Monthly Income
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              ${summary.income.toFixed(2)}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                          <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Monthly Spending
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              ${summary.spending.toFixed(2)}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                          <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Linked Accounts
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              {accounts.length}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two column layout with accounts summary and top spending */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Connected accounts preview */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Connected Accounts
                      </h3>
                      <button
                        onClick={() => setActiveTab("accounts")}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View All
                      </button>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                      <dl className="sm:divide-y sm:divide-gray-200">
                        {accounts.slice(0, 3).map((account) => (
                          <div
                            key={account.id}
                            className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
                          >
                            <dt className="text-sm font-medium text-gray-500">
                              {account.institution_name || "Bank"}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-1">
                              {account.name ||
                                account.account_name ||
                                "Account"}{" "}
                              •••• {account.mask || "****"}
                            </dd>
                            <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:text-right">
                              $
                              {parseFloat(account.current_balance || 0).toFixed(
                                2
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      {accounts.length === 0 && (
                        <div className="text-center py-8">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No accounts connected
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Connect your bank to get started.
                          </p>
                          <div className="mt-6">
                            <button
                              type="button"
                              onClick={handleConnectBank}
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                            >
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              Connect Bank
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top spending categories */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Top Spending Categories
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      {summary.topCategories.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {summary.topCategories.map((category) => (
                            <li key={category.name} className="px-6 py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-3"></span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {category.name}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-red-600">
                                  ${category.amount.toFixed(2)}
                                </span>
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      (category.amount / summary.spending) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">
                            No transaction data available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Recent Transactions
                    </h3>
                    <button
                      onClick={() => setActiveTab("transactions")}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Category
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Bank
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summary.recent.length > 0 ? (
                          summary.recent.map((transaction) => (
                            <tr key={transaction.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(
                                  transaction.date
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {transaction.category || "Uncategorized"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getBankName(transaction)}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                                  transaction.amount < 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                ${Math.abs(transaction.amount).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                              No recent transactions
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Accounts Tab */}
            {activeTab === "accounts" && (
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Connected Accounts
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      All your connected financial accounts in one place.
                    </p>
                  </div>

                  {accounts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className="bg-white border rounded-lg shadow-sm hover:shadow-md transition"
                        >
                          <div className="p-5">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">
                                  {account.name ||
                                    account.account_name ||
                                    "Account"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {account.institution_name || "Bank"}
                                </p>
                              </div>
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                                <svg
                                  className="w-6 h-6 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                  />
                                </svg>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                  Current Balance
                                </span>
                                <span className="text-lg font-semibold">
                                  $
                                  {parseFloat(
                                    account.current_balance || 0
                                  ).toFixed(2)}
                                </span>
                              </div>

                              {account.available_balance !== null && (
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-sm text-gray-500">
                                    Available
                                  </span>
                                  <span className="text-sm font-medium">
                                    $
                                    {parseFloat(
                                      account.available_balance || 0
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              )}

                              {account.limit > 0 && (
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-sm text-gray-500">
                                    Credit Limit
                                  </span>
                                  <span className="text-sm font-medium">
                                    ${parseFloat(account.limit || 0).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                              <div className="flex justify-between items-center">
                                <span>••••{account.mask || "xxxx"}</span>
                                <span>{account.account_type || "Account"}</span>
                              </div>
                              {account.last_synced && (
                                <p className="mt-1">
                                  Updated{" "}
                                  {new Date(
                                    account.last_synced
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add account card */}
                      <div
                        onClick={handleConnectBank}
                        className="bg-white border border-dashed rounded-lg shadow-sm hover:shadow-md transition p-5 flex flex-col items-center justify-center cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                          <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </div>
                        <h4 className="text-base font-medium text-gray-900">
                          Connect New Account
                        </h4>
                        <p className="text-sm text-gray-500 text-center mt-1">
                          Add another bank or financial institution
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No accounts connected
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by connecting your first bank account.
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={handleConnectBank}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Connect Bank
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Transaction History
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {filteredTransactions.length} transactions found
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="relative">
                        <select
                          value={selectedAccountId}
                          onChange={(e) => setSelectedAccountId(e.target.value)}
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="all">All Accounts</option>
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name ||
                                `Account ending in ${account.mask || "****"}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat || "Uncategorized"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Category
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Bank
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((transaction) => (
                            <tr
                              key={transaction.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {transaction.date
                                  ? new Date(
                                      transaction.date
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.name}
                                </div>
                                {transaction.payment_channel && (
                                  <div className="text-xs text-gray-500">
                                    {transaction.payment_channel}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {transaction.category || "Uncategorized"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getBankName(transaction)}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                                  transaction.amount < 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                ${Math.abs(transaction.amount).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                              No transactions match your filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
