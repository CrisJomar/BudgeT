import React, { useState, useEffect } from "react";
import apiClient from "../services/api";

export default function Savings() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSavingsGoals = async () => {
      try {
        const response = await apiClient.get("/api/savings-goals/");
        setGoals(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching savings goals:", error);
        setError("Failed to load savings goals");
        setLoading(false);
      }
    };

    fetchSavingsGoals();
  }, []);

  if (loading) return <p>Loading savings goals...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Savings Goals</h2>
      {goals.length === 0 ? (
        <p>No savings goals set yet. Add your first goal!</p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center justify-between">
              <span>{goal.name}</span>
              <span className={`text-${goal.color || "green"}-600`}>
                ${goal.target_amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
