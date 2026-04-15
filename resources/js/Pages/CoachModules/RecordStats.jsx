import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";

export default function RecordStats() {
    const user = JSON.parse(localStorage.getItem("community_user") || "{}");
    const token = localStorage.getItem("community_token") || localStorage.getItem("auth_token");
    const coachId = user.id || 1; 

    const [players, setPlayers] = useState([]);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(false);

    const initialFormState = {
        player_id: "",
        minutes_played: "90",
        goals: "0",
        assists: "0",
        rating: "",
        cleansheet: false,
        category: "",
        league_name: "",
        event_name: "",
        opponent_name: "",
        match_date: "",
        venue: "",
        coach_id: coachId,
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        const headers = { Authorization: `Bearer ${token}` };
        
        //Fetch players in the team based on coach ID
        fetch(`/api/coach/${coachId}/players`, { headers })
            .then((res) => res.json())
            .then(setPlayers)
            .catch((err) => console.error("Error loading players:", err));

        //Fetch team info
        fetch(`/api/coach/${coachId}/team`, { headers })
            .then((res) => res.json())
            .then(setTeam)
            .catch((err) => console.error("Error fetching team:", err));
    }, [coachId, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading("Saving stats...");

        try {
            const res = await fetch("/api/performances", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success("Stats Saved Successfully! 📈", { id: toastId });
                // Reset form but keep match details for potentially recording another player for same match
                setFormData({
                    ...formData,
                    player_id: "",
                    rating: "",
                    goals: "0",
                    assists: "0",
                    cleansheet: false,
                });
            } else {
                const errorMsg = data.errors ? Object.values(data.errors).flat().join("\n") : data.message;
                toast.error(`Error: ${errorMsg}`, { id: toastId });
            }
        } catch (err) {
            toast.error("An unexpected error occurred.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const labelStyle =
        "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2";
    const inputStyle =
        "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all";

    return (
        <div className="max-w-4xl space-y-8">
            <Toaster position="top-right" />

            {/* Page Header */}
            <div>
                <p className="text-xs font-bold text-purple-500 tracking-widest uppercase mb-1">NUVRA · CLUB PORTAL</p>
                <h1 className="text-3xl font-black text-gray-900">Record Stats</h1>
                <p className="text-gray-500 text-sm mt-1">Log match performance for your players.</p>
            </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-6">
                New Match Performance
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* --- MATCH DETAILS --- */}
                <div className="p-6 border border-gray-200 rounded-2xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Match Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                            type="text"
                            name="category"
                            placeholder="Category (e.g., U-21)"
                            className={inputStyle}
                            value={formData.category}
                            onChange={handleChange}
                        />
                        <input
                            type="text"
                            name="league_name"
                            placeholder="League Name"
                            className={inputStyle}
                            value={formData.league_name}
                            onChange={handleChange}
                        />
                        <input
                            type="text"
                            name="event_name"
                            placeholder="Event Name (Optional)"
                            className={inputStyle}
                            value={formData.event_name}
                            onChange={handleChange}
                        />
                        <input
                            type="text"
                            name="opponent_name"
                            placeholder="Opponent Name"
                            required
                            className={inputStyle}
                            value={formData.opponent_name}
                            onChange={handleChange}
                        />
                        <div>
                            <label className={labelStyle}>Game Date</label>
                            <input
                                type="date"
                                name="match_date"
                                required
                                className={inputStyle}
                                value={formData.match_date}
                                onChange={handleChange}
                            />
                        </div>
                        {/* New Venue Input */}
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                name="venue"
                                placeholder="Venue / Location (Default: None)"
                                className={inputStyle}
                                value={formData.venue || ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* --- PLAYER STATS --- */}
                <div className="p-6 border border-gray-200 rounded-2xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Player Performance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className={labelStyle}>Select Player</label>
                            <select
                                name="player_id"
                                className={inputStyle}
                                required
                                value={formData.player_id}
                                onChange={handleChange}
                            >
                                <option value="">Who played?</option>
                                {players.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.jersey_number ? `(#${p.jersey_number})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                        <input type="number" name="minutes_played" placeholder="Mins" className={inputStyle} value={formData.minutes_played} onChange={handleChange} />
                        <input type="number" step="0.1" name="rating" placeholder="Rating" required className={inputStyle} value={formData.rating} onChange={handleChange} />
                        <input type="number" name="goals" placeholder="Goals" className={inputStyle} value={formData.goals} onChange={handleChange} />
                        <input type="number" name="assists" placeholder="Assists" className={inputStyle} value={formData.assists} onChange={handleChange} />
                        <div className="flex items-center justify-center h-full pb-2">
                            <input
                                type="checkbox"
                                id="cleansheet"
                                name="cleansheet"
                                className="h-5 w-5 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500"
                                checked={formData.cleansheet}
                                onChange={handleChange}
                            />
                            <label htmlFor="cleansheet" className="ml-2 text-sm font-bold text-gray-700">
                                Cleansheet?
                            </label>
                        </div>
                    </div>
                </div>

                <button 
                    disabled={loading}
                    className={`w-full ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white font-bold py-4 rounded-xl transition-colors`}
                >
                    {loading ? "Saving..." : "Save Performance"}
                </button>
            </form>
        </div>
        </div>
    );
}
