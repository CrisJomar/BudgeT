import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { apiClient } from "../services/api"; // or whatever the correct path is

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, transactions, payments, system
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
  });

  // Fetch activities from various endpoints and combine them
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);

        // Fetch data in parallel from multiple endpoints
        const [transactionsRes, paymentsRes] = await Promise.all([
          apiClient.get("/api/transactions/"),
          apiClient.get("/api/payments/"),
        ]);

        // Transform transactions into activity items
        const transactionActivities = transactionsRes.data.map(
          (transaction) => ({
            id: `tx-${transaction.id}`,
            type: "transaction",
            title: transaction.name,
            description: transaction.category || "Uncategorized",
            amount: transaction.amount,
            date: transaction.date,
            source: transaction.institution_name || "Unknown Bank",
            icon: "cash",
          })
        );

        // Transform payments into activity items
        const paymentActivities = paymentsRes.data.map((payment) => ({
          id: `pay-${payment.id}`,
          type: "payment",
          title: payment.recipient,
          description: payment.category || "Uncategorized",
          amount: payment.amount,
          date: payment.paidDate || payment.dueDate,
          status: payment.status || "pending",
          dueDate: payment.dueDate,
          isRecurring: payment.isRecurring,
          icon: "receipt",
        }));

        // Add some system activities (these would come from a real endpoint in production)
        const systemActivities = [
          {
            id: "sys-1",
            type: "system",
            title: "Account Connected",
            description: "Successfully connected to your bank account",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            icon: "link",
          },
          {
            id: "sys-2",
            type: "system",
            title: "Transactions Synced",
            description: "Successfully synced 12 new transactions",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            icon: "refresh",
          },
        ];

        // Combine all activities and sort by date (most recent first)
        const allActivities = [
          ...transactionActivities,
          ...paymentActivities,
          ...systemActivities,
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        setActivities(allActivities);
        setError(null);
      } catch (err) {
        console.error("Error fetching activity data:", err);
        setError("Failed to load activity data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Filter activities based on selected filter and search term
  const filteredActivities = activities.filter((activity) => {
    const matchesFilter = filter === "all" || activity.type === filter;
    const matchesSearch =
      searchTerm === "" ||
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.description &&
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesDateRange = true;
    if (dateRange.start) {
      const activityDate = new Date(activity.date);
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      matchesDateRange = activityDate >= startDate;
    }
    if (dateRange.end && matchesDateRange) {
      const activityDate = new Date(activity.date);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      matchesDateRange = activityDate <= endDate;
    }

    return matchesFilter && matchesSearch && matchesDateRange;
  });

  // Group activities by date for better display
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.date.split("T")[0]; // Get YYYY-MM-DD part
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  // Activity type icon
  const getActivityIcon = (activity) => {
    switch (activity.icon) {
      case "cash":
        return (
          <div className="bg-blue-100 rounded-full p-2 mr-4">
            <svg
              className="w-6 h-6 text-blue-500"
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
        );
      case "receipt":
        return (
          <div className="bg-green-100 rounded-full p-2 mr-4">
            <svg
              className="w-6 h-6 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
        );
      case "link":
        return (
          <div className="bg-purple-100 rounded-full p-2 mr-4">
            <svg
              className="w-6 h-6 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
        );
      case "refresh":
        return (
          <div className="bg-yellow-100 rounded-full p-2 mr-4">
            <svg
              className="w-6 h-6 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 rounded-full p-2 mr-4">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("transaction")}
            className={`px-4 py-2 rounded-lg ${
              filter === "transaction"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setFilter("payment")}
            className={`px-4 py-2 rounded-lg ${
              filter === "payment"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setFilter("system")}
            className={`px-4 py-2 rounded-lg ${
              filter === "system"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            System
          </button>
        </div>
      </div>

      {/* Search and filter section */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 md:flex md:space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.start || ""}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 mt-4 md:mt-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.end || ""}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Activity timeline */}
      {!loading && !error && Object.keys(groupedActivities).length === 0 && (
        <div className="bg-white shadow-md rounded-lg p-8 text-center text-gray-500">
          No activities found matching your filters.
        </div>
      )}

      {!loading && !error && Object.keys(groupedActivities).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div
              key={date}
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {dayActivities.map((activity) => (
                  <li key={activity.id} className="px-6 py-4">
                    <div className="flex items-start">
                      {getActivityIcon(activity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <div className="flex items-center">
                            {activity.amount !== undefined && (
                              <span
                                className={`text-sm font-semibold ${
                                  activity.type === "payment" ||
                                  parseFloat(activity.amount) > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                $
                                {Math.abs(
                                  parseFloat(activity.amount || 0)
                                ).toFixed(2)}
                              </span>
                            )}
                            <span className="ml-2 text-xs text-gray-500">
                              {new Date(activity.date).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {activity.description}
                        </p>
                        <div className="mt-1 flex items-center">
                          {activity.type === "transaction" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {activity.source}
                            </span>
                          )}
                          {activity.type === "payment" && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                activity.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {activity.status === "paid"
                                ? "Paid"
                                : "Scheduled"}
                            </span>
                          )}
                          {activity.type === "payment" &&
                            activity.isRecurring && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Recurring
                              </span>
                            )}
                          {activity.type === "system" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              System
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
