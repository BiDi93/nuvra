import React, { useState, useEffect } from "react";

export default function RecordStats() {
    const coachId = 1; // This should ideally come from auth context
    const [players, setPlayers] = useState([]);
    const [team, setTeam] = useState(null);

    const [formData, setFormData] = useState({
        player_id: "",
        minutes_played: "90",
        goals: "0",
        assists: "0",
        rating: "",
        cleansheet: false,
        // New match details
        category: "",
        league_name: "",
        event_name: "",
        opponent_name: "",
        match_date: "",
        venue: "",
        coach_id: coachId,
    });

    useEffect(() => {
        //Fetch players in the team based on coach ID
        fetch(`/api/coach/${coachId}/players`)
            .then((res) => res.json())
            .then(setPlayers)
            .catch((err) => console.error("Error loading players:", err));

        //Fetch team info
        fetch(`/api/coach/${coachId}/team`)
            .then((res) => res.json())
            .then(setTeam)
            .catch((err) => console.error("Error fetching team:", err));
    }, [coachId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch("/api/performances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message) {
                    alert("Stats Saved Successfully! 📈");
                    // Reset form
                    setFormData({
                        ...formData,
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
                    });
                } else {
                    // Handle validation errors
                    alert(
                        "Error: " +
                        Object.values(data.errors).join("\n"),
                    );
                }
            })
            .catch(() => alert("An unexpected error occurred."));
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
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
                Record New Match Performance
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

                <button className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:-translate-y-1">
                    Save Performance
                </button>
            </form>
        </div>
    );
}
