import React from "react";

export default function Card() {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-md">
      <div className="text-sm tracking-widest">DE45 6582 2251 5760</div>
      <div className="text-2xl font-bold mt-2">40,189.38 €</div>
      <div className="flex justify-between mt-2 text-sm">
        <span>23. September</span>
        <span className="text-green-400">+6%</span>
      </div>
    </div>
  );
}
