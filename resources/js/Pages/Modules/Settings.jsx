import React from 'react';

export default function Settings() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Profile Settings</h1>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md">
                <label className="block text-sm font-bold text-gray-700 mb-2">Change Password</label>
                <input type="password" className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 mb-4" placeholder="••••••" />
                <button className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold">Update</button>
            </div>
        </div>
    );
}