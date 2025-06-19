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
  const navigate = useNavigate();

  // Function to refresh all data
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

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      console.log("Current token:", localStorage.getItem("token"));
      // Try making a simple authenticated request
      await apiClient.get("/api/accounts/");
      console.log("Authentication is working!");
    } catch (error) {
      console.error("Authentication check failed:", error);
      if (error.response && error.response.status === 401) {
        console.error("Token is invalid or expired");
        // You could add token refresh logic here
      }
    }
  };

  // Check if token exists and fetch data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found!");
      navigate("/login");
      return;
    }

    // Only fetch data if a token exists
    fetchData();
  }, [navigate]);

  // Call checkAuthStatus in a useEffect
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Add this useEffect for auto-refresh
  useEffect(() => {
    // Set up periodic refresh (every 5 minutes)
    const refreshInterval = setInterval(() => {
      if (accounts.length > 0) {
        syncTransactions();
      }
    }, 300000); // 5 minutes in milliseconds

    return () => clearInterval(refreshInterval);
  }, [fetchData, syncTransactions, accounts.length]);

  // Extract unique categories
  useEffect(() => {
    if (transactions.length > 0) {
      const uniqueCategories = [
        ...new Set(transactions.map((t) => t.category)),
      ];
      setCategories(uniqueCategories);
    }
  }, [transactions]);

  // Function to sync transactions
  const handleSyncTransactions = async () => {
    try {
      setSyncingTransactions(true);
      console.log("Syncing transactions...");

      const response = await syncTransactions();
      console.log("Sync response:", response.data);

      await fetchData(); // Refresh data after sync
      alert("Transactions synced successfully!");
    } catch (error) {
      console.error("Error syncing transactions:", error);

      // Show more detailed error information
      if (error.response && error.response.data) {
        console.error("Server error details:", error.response.data);
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

  // Function to generate link token
  const generateLinkToken = useCallback(async () => {
    console.log("Generating link token");
    try {
      const response = await createLinkToken();
      console.log("Link token response:", response.data);

      if (response.data && response.data.link_token) {
        console.log("Setting link token:", response.data.link_token);
        setLinkToken(response.data.link_token);
      } else {
        console.error("No link_token in response:", response.data);
        setError("Failed to initialize bank connection.");
      }
    } catch (error) {
      console.error("Error creating link token:", error);
      setError("Failed to initialize bank connection.");
    }
  }, []);

  // Handle Plaid success
  const onPlaidSuccess = useCallback(async (publicToken, metadata) => {
    try {
      await exchangePublicToken(publicToken);
      await fetchData(); // Refresh data after connecting bank
      alert("Bank account connected successfully!");
    } catch (error) {
      console.error("Error exchanging public token:", error);
      alert("Failed to connect bank account. Please try again.");
    }
  }, []);

  // Add a useEffect to only initialize Plaid Link when linkToken changes
  useEffect(() => {
    if (linkToken) {
      console.log("Link token available, Plaid Link can be opened");
    }
  }, [linkToken]);

  // Move the config and usePlaidLink hook into a conditional block
  // Only create the Plaid Link instance when you actually have a token
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

  // Update the handleConnectBank function
  const handleConnectBank = async () => {
    console.log("Connect bank clicked");

    if (linkToken && ready) {
      // We already have a token and Plaid is ready, so open the link
      console.log("Opening Plaid Link with existing token");
      open();
    } else {
      try {
        // We need to generate a new token first
        console.log("Generating new link token");
        await generateLinkToken();
        console.log(
          "Token generation completed, will open automatically in useEffect"
        );
        // The link will open automatically when linkToken state updates and useEffect runs
      } catch (error) {
        console.error("Failed to generate link token:", error);
        alert("Unable to connect to bank. Please try again later.");
      }
    }
  };

  // Add a useEffect to automatically open Plaid when the token is set and ready
  useEffect(() => {
    // This effect will run whenever linkToken or ready changes
    if (linkToken && ready) {
      console.log("Token ready, opening Plaid automatically");
      open();
    }
  }, [linkToken, ready, open]);

  const forceLogin = () => {
    // Redirect to login
    navigate("/login");
  };

  const filteredTransactions = transactions
    .filter((t) => categoryFilter === "all" || t.category === categoryFilter)
    .filter((t) => {
      if (selectedAccountId === "all") return true;

      // Add debugging
      console.log("Comparing:", {
        selectedId: selectedAccountId,
        transactionAccountId: t.plaid_account,
        type: typeof t.plaid_account,
        match: t.plaid_account == selectedAccountId, // Note: using == for type coercion
      });

      // Try different comparison approaches depending on data structure
      return (
        // Option 1: If plaid_account is the ID directly (but possibly as a number vs string)
        t.plaid_account == selectedAccountId || // Use == for type coercion
        // Option 2: If plaid_account is an object with an id field
        t.plaid_account?.id == selectedAccountId ||
        // Option 3: If plaid_account is a URL or string containing the ID
        String(t.plaid_account).includes(selectedAccountId)
      );
    });

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="space-x-2">
            <button
              onClick={handleConnectBank}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading} // Only disable when loading
            >
              {accounts.length > 0 ? "Connect Another Bank" : "Connect Bank"}
            </button>
            <button
              onClick={handleSyncTransactions}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              disabled={syncingTransactions || accounts.length === 0}
            >
              {syncingTransactions ? "Syncing..." : "Sync Transactions"}
            </button>
            <button
              onClick={forceLogin}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Re-authenticate
            </button>
          </div>
        </div>

        {/* Accounts Section */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
          {accounts.length === 0 ? (
            <p className="text-gray-500">
              No accounts connected yet. Click "Connect Bank" to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <h3 className="font-medium">
                    {account.name || "Bank Account"}
                  </h3>
                  {account.institution_name && (
                    <p className="text-sm text-gray-700">
                      {account.institution_name}
                    </p>
                  )}
                  {account.account_type && (
                    <p className="text-sm text-gray-600 mt-1">
                      Type: {account.account_type}
                    </p>
                  )}
                  {account.mask && (
                    <p className="text-sm text-gray-600">
                      Account: ****{account.mask}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    Connected on{" "}
                    {new Date(account.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transactions Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recent Transactions</h2>
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <span className="mr-2 text-gray-700">Account:</span>
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    console.log("Selected account:", e.target.value);
                    setSelectedAccountId(e.target.value);
                  }}
                  className="border rounded px-2 py-1"
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
              <div className="flex items-center">
                <span className="mr-2 text-gray-700">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {transactions.length > 0 && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">
                Transaction Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Total Transactions</p>
                  <p className="text-xl font-bold">{transactions.length}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Total Spending</p>
                  <p className="text-xl font-bold text-red-600">
                    $
                    {transactions
                      .filter((t) => parseFloat(t.amount) > 0)
                      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Total Income</p>
                  <p className="text-xl font-bold text-green-600">
                    $
                    {Math.abs(
                      transactions
                        .filter((t) => parseFloat(t.amount) < 0)
                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
          {loading ? (
            <p>Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500">
              No transactions found. Click "Sync Transactions" to fetch your
              latest transactions.
            </p>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
            </>
          )}
        </section>
      </main>
    </div>
  );
}
