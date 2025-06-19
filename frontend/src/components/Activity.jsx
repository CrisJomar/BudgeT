import React from "react";

export default function Activity({ transactions }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 text-sm text-gray-900">
                {new Date(transaction.date).toLocaleDateString()}
              </td>
              <td className="py-2 px-4 text-sm text-gray-900">
                {transaction.name}
              </td>
              <td className="py-2 px-4 text-sm text-gray-500">
                {transaction.category || "Uncategorized"}
              </td>
              <td
                className={`py-2 px-4 text-sm text-right ${
                  parseFloat(transaction.amount) < 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                ${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
