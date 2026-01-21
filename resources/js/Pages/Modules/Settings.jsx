import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Settings() {
    const { profile } = useOutletContext();
    
    // Form State
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Image State
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    
    // UI State
    const [loading, setLoading] = useState(false);

    // Initialize data when profile loads
    useEffect(() => {
        if (profile) {
            setName(profile.name);
            // We use the profile image from DB, or a default placeholder
            setPreviewUrl(profile.profile_image || "/images/playerImage/beckam.jpg");
        }
    }, [profile]);

    // Handle File Selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create a fake local URL to show preview immediately
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // 1. Create FormData (Required for file uploads)
        const formData = new FormData();
        formData.append('name', name);
        
        if (password) {
            formData.append('password', password);
            formData.append('password_confirmation', confirmPassword);
        }

        if (imageFile) {
            formData.append('profile_image', imageFile);
        }

        // 2. Send Request
        fetch(`/api/player/${profile.id}/update`, {
            method: 'POST',
            body: formData, // <--- No 'Content-Type': 'application/json' needed here!
        })
        .then(async res => {
            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                alert("Profile Saved Successfully! ✅");
                // Optional: Reload page to reflect changes in Sidebar immediately
                window.location.reload(); 
            } else {
                alert(`Error: ${data.message || 'Something went wrong'}`);
            }
        })
        .catch(err => {
            setLoading(false);
            console.error(err);
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-black text-gray-900 mb-8">Profile Settings</h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-10">
                
                {/* LEFT: Profile Picture */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer w-40 h-40">
                        {/* The Image */}
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-100 shadow-md">
                            <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Overlay on Hover */}
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-xs uppercase tracking-wider">Change Photo</span>
                        </div>

                        {/* Hidden Input Trigger */}
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Click image to edit</p>
                </div>

                {/* RIGHT: Text Fields */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Name Field */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Display Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Your Name"
                        />
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>
                    <h3 className="text-lg font-bold text-gray-900">Change Password</h3>

                    {/* Password Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">New Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Min. 6 characters"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Confirm Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Retype password"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex justify-end">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
}