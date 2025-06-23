import React, { useState, useEffect } from "react";
import apiClient from "../services/api";

export default function Payments() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [payments, setPayments] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New payment form state
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    recipient: "",
    amount: "",
    dueDate: "",
    category: "",
    description: "",
    isRecurring: false,
    frequency: "monthly",
  });

  // Add this helper function near the top of your component before the return statement
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Add this debugging code at the top of your component
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(
      "Current auth token:",
      token ? `${token.substring(0, 15)}...` : "No token"
    );

    // Test auth endpoint directly
    const testAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found for verification");
          return;
        }

        // The correct way to verify a token with djangorestframework-simplejwt
        const response = await apiClient.post("/api/token/verify/", { token });
        console.log("Auth verified successfully");
      } catch (err) {
        console.error("Auth verification failed:", err);
      }
    };

    testAuth();
  }, []);

  // Update your fetchPayments function with better date handling
  const fetchPayments = async () => {
    try {
      setLoading(true);

      console.log("Starting to fetch payments");
      const response = await apiClient.get("/api/payments/");
      console.log("Payments API response:", response.data);

      const allPayments = response.data;
      console.log("All payments:", allPayments);

      // Format current date properly to midnight for accurate comparison
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of the day
      console.log("Current date for filtering:", currentDate);

      // Add dummy upcoming payments for testing if needed
      const dummyPayments = [
        {
          id: 999,
          recipient: "Sample Electric Company",
          amount: 89.99,
          dueDate: "2025-06-25", // Future date
          category: "Utilities",
          description: "Monthly electricity bill",
          isRecurring: true,
          frequency: "monthly",
          status: "pending",
        },
        {
          id: 998,
          recipient: "Sample Internet Provider",
          amount: 75.0,
          dueDate: "2025-06-21", // Very soon
          category: "Utilities",
          description: "Internet service",
          isRecurring: true,
          frequency: "monthly",
          status: "pending",
        },
        {
          id: 997,
          recipient: "Sample Streaming Service",
          amount: 14.99,
          dueDate: "2025-06-19", // Today
          category: "Subscription",
          description: "Movie streaming",
          isRecurring: true,
          frequency: "monthly",
          status: "pending",
        },
      ];

      // Combine real and dummy payments for testing
      // const combinedPayments = [...allPayments, ...dummyPayments];
      // Uncomment the line above and use combinedPayments instead of allPayments
      // if you want to see example data

      // Fix date comparison by parsing dates consistently
      const upcoming = allPayments.filter((payment) => {
        // Parse the payment date correctly
        const dueDate = new Date(payment.dueDate);
        dueDate.setHours(0, 0, 0, 0); // Set to start of day for fair comparison

        const isPaid = payment.status === "paid";
        const isDueInFuture = dueDate >= currentDate;

        console.log(
          `Payment ${
            payment.id
          }: isPaid=${isPaid}, isDueInFuture=${isDueInFuture}, dueDate=${dueDate.toISOString()}`
        );

        return !isPaid && isDueInFuture;
      });

      console.log("Upcoming payments after filter:", upcoming);

      const history = allPayments.filter((payment) => {
        const dueDate = new Date(payment.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return payment.status === "paid" || dueDate < currentDate;
      });

      setPayments(allPayments);
      setUpcomingPayments(upcoming);
      setPaymentHistory(history);
      setError(null);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Failed to load payments data");
    } finally {
      setLoading(false);
    }
  };

  // Call fetchPayments when the component mounts
  useEffect(() => {
    fetchPayments();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPayment((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Update your handleSubmit function to properly format data
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Format the payment data properly
      const paymentData = {
        recipient: newPayment.recipient,
        amount: parseFloat(newPayment.amount),
        // Ensure date is in YYYY-MM-DD format
        dueDate: newPayment.dueDate,
        category: newPayment.category,
        description: newPayment.description || "",
        isRecurring: newPayment.isRecurring,
        frequency: newPayment.isRecurring ? newPayment.frequency : "monthly",
        status: "pending",
      };

      console.log("Submitting payment data:", paymentData);

      const response = await apiClient.post("/api/payments/", paymentData);
      console.log("Payment created:", response.data);

      // Reset form and refresh data
      setNewPayment({
        recipient: "",
        amount: "",
        dueDate: "",
        category: "",
        description: "",
        isRecurring: false,
        frequency: "monthly",
      });
      setShowNewPaymentForm(false);

      // Now fetchPayments is properly defined and can be called
      await fetchPayments();
    } catch (err) {
      console.error("Error creating payment:", err);

      // Display validation errors from the server
      if (err.response?.data) {
        const errorData = err.response.data;

        if (typeof errorData === "object") {
          // Format validation errors nicely
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => {
              // Handle both string and array error formats
              const errorMsg = Array.isArray(errors)
                ? errors.join(", ")
                : errors;
              return `${field}: ${errorMsg}`;
            })
            .join("\n");

          setError(`Validation failed:\n${errorMessages}`);
        } else {
          setError(`Error: ${errorData}`);
        }
      } else {
        setError(
          "Failed to create payment. Please check your input and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this function after your markAsPaid function
  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      // Prepare update data based on status
      const updateData = { status: newStatus };

      // If marking as paid, include the paid date
      if (newStatus === "paid") {
        updateData.paidDate = new Date().toISOString();
      }

      // Send PATCH request to update status
      await apiClient.patch(`/api/payments/${paymentId}/`, updateData);

      // Update local state
      const updatedPayments = payments.map((payment) =>
        payment.id === paymentId
          ? {
              ...payment,
              status: newStatus,
              // Only update paidDate if status is "paid"
              ...(newStatus === "paid"
                ? { paidDate: new Date().toISOString() }
                : {}),
            }
          : payment
      );

      setPayments(updatedPayments);

      // Re-filter the payments
      const currentDate = new Date();
      const upcoming = updatedPayments.filter(
        (payment) =>
          payment.status !== "paid" && new Date(payment.dueDate) >= currentDate
      );
      const history = updatedPayments.filter(
        (payment) =>
          payment.status === "paid" || new Date(payment.dueDate) < currentDate
      );

      setUpcomingPayments(upcoming);
      setPaymentHistory(history);
    } catch (err) {
      console.error(`Error updating payment status to ${newStatus}:`, err);
      setError(`Failed to update payment status to ${newStatus}`);
    }
  };

  // Update your markAsPaid function to use the new generic function
  const markAsPaid = async (paymentId) => {
    await updatePaymentStatus(paymentId, "paid");
  };

  // Calculate total upcoming payments
  const totalUpcoming = upcomingPayments.reduce(
    (sum, payment) => sum + (payment.amount ? Number(payment.amount) : 0),
    0
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        <button
          onClick={() => setShowNewPaymentForm(!showNewPaymentForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showNewPaymentForm ? "Cancel" : "Schedule Payment"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showNewPaymentForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Schedule New Payment</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Recipient
                </label>
                <input
                  type="text"
                  name="recipient"
                  value={newPayment.recipient}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newPayment.amount}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={newPayment.dueDate}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={newPayment.category}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent/Mortgage">Rent/Mortgage</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Subscription">Subscription</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newPayment.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="2"
                ></textarea>
              </div>
              <div className="md:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  name="isRecurring"
                  id="isRecurring"
                  checked={newPayment.isRecurring}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="isRecurring" className="text-gray-700">
                  This is a recurring payment
                </label>

                {newPayment.isRecurring && (
                  <div className="ml-4">
                    <select
                      name="frequency"
                      value={newPayment.frequency}
                      onChange={handleInputChange}
                      className="shadow border rounded py-1 px-2 text-gray-700 focus:outline-none focus:shadow-outline"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? "Scheduling..." : "Schedule Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Summary Card */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Upcoming Payments</p>
            <p className="text-2xl font-bold text-blue-600">
              ${totalUpcoming.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              {upcomingPayments.length} payments due
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Next Payment</p>
            {upcomingPayments.length > 0 ? (
              <>
                <p className="text-2xl font-bold text-yellow-600">
                  $
                  {typeof upcomingPayments[0].amount === "number"
                    ? upcomingPayments[0].amount.toFixed(2)
                    : upcomingPayments[0].amount
                    ? Number(upcomingPayments[0].amount).toFixed(2)
                    : "0.00"}
                </p>
                <p className="text-sm text-gray-500">
                  Due{" "}
                  {new Date(upcomingPayments[0].dueDate).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="text-lg text-gray-500">No upcoming payments</p>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Recurring Payments</p>
            <p className="text-2xl font-bold text-green-600">
              {payments.filter((p) => p.isRecurring).length}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Tabs */}
      <div className="mb-4 border-b">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 ${
                activeTab === "upcoming"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming Payments
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 ${
                activeTab === "history"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("history")}
            >
              Payment History
            </button>
          </li>
          <li>
            <button
              className={`inline-block p-4 ${
                activeTab === "recurring"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("recurring")}
            >
              Recurring Payments
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {activeTab === "upcoming" && (
            <>
              {upcomingPayments.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Countdown
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingPayments.map((payment) => {
                      const daysUntilDue = getDaysUntilDue(payment.dueDate);
                      const isPriority = daysUntilDue <= 3;

                      return (
                        <tr
                          key={payment.id}
                          className={isPriority ? "bg-yellow-50" : ""}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {daysUntilDue === 0 ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Due Today!
                              </span>
                            ) : daysUntilDue < 0 ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Overdue by {Math.abs(daysUntilDue)} days
                              </span>
                            ) : daysUntilDue <= 3 ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {daysUntilDue} days left
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">
                                {daysUntilDue} days left
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.recipient}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            $
                            {typeof payment.amount === "number"
                              ? payment.amount.toFixed(2)
                              : payment.amount
                              ? Number(payment.amount).toFixed(2)
                              : "0.00"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <PaymentStatusMenu
                              payment={payment}
                              onStatusChange={updatePaymentStatus}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => markAsPaid(payment.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Mark as Paid
                            </button>
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No upcoming payments
                </p>
              )}
            </>
          )}

          {activeTab === "history" && (
            <>
              {paymentHistory.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.paidDate
                            ? new Date(payment.paidDate).toLocaleDateString()
                            : "Not paid"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.recipient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          $
                          {typeof payment.amount === "number"
                            ? payment.amount.toFixed(2)
                            : payment.amount
                            ? Number(payment.amount).toFixed(2)
                            : "0.00"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {payment.status === "paid" ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Missed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No payment history
                </p>
              )}
            </>
          )}

          {activeTab === "recurring" && (
            <>
              {payments.filter((p) => p.isRecurring).length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments
                      .filter((p) => p.isRecurring)
                      .map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.recipient}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            $
                            {typeof payment.amount === "number"
                              ? payment.amount.toFixed(2)
                              : payment.amount
                              ? Number(payment.amount).toFixed(2)
                              : "0.00"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {payment.frequency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No recurring payments
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Add this as a component in your file

const PaymentStatusMenu = ({ payment, onStatusChange }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-2 py-1 border rounded text-sm flex items-center"
      >
        <span
          className={`w-2 h-2 rounded-full mr-2 ${
            payment.status === "paid"
              ? "bg-green-500"
              : payment.status === "missed"
              ? "bg-red-500"
              : "bg-yellow-500"
          }`}
        ></span>
        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute z-10 mt-1 bg-white shadow-lg rounded border">
          <button
            onClick={() => {
              onStatusChange(payment.id, "pending");
              setShowMenu(false);
            }}
            className="block px-4 py-2 text-sm text-left hover:bg-gray-100 w-full"
          >
            Pending
          </button>
          <button
            onClick={() => {
              onStatusChange(payment.id, "paid");
              setShowMenu(false);
            }}
            className="block px-4 py-2 text-sm text-left hover:bg-gray-100 w-full"
          >
            Paid
          </button>
          <button
            onClick={() => {
              onStatusChange(payment.id, "missed");
              setShowMenu(false);
            }}
            className="block px-4 py-2 text-sm text-left hover:bg-gray-100 w-full"
          >
            Missed
          </button>
        </div>
      )}
    </div>
  );
};
