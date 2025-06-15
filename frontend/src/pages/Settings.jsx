import React from "react";

export default function Settings() {
  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Settings</h1>

        {/* Profile Settings */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Cristian Hernandez"
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 234 567 890"
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold transition"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Preferences */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Dark Mode</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-500 transition"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Enable Notifications</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-500 transition"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
