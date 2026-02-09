import React, { useState, useEffect } from "react";

export default function RecordStats() {
    const coachId = 1;
    const [matches, setMatches] = useState([]);
    const [players, setPlayers] = useState([]);
    const [team, setTeam] = useState(null);

    const [formData, setFormData] = useState({
        match_id: "",
        player_id: "",
        minutes_played: "90",
        goals: "0",
        assists: "0",
        rating: "",
    });

    useEffect(() => {
        // Fetch matches and players for the coach's team
        fetch(`/api/coach/${coachId}/matches`)
            .then((res) => res.json())
            .then(setMatches);

        //Fetch players in the team
        fetch("/api/teams")
            .then((res) => res.json())
            .then(setPlayers);

        //Fetch players in the team based on coach ID
        fetch(`/api/coach/${coachId}/players`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Players Loaded:", data); // Helpful for debugging
                setPlayers(data);
            })
            .catch((err) => console.error("Error loading players:", err));

        //Fetch team info
        fetch(`/api/coach/${coachId}/team`)
            .then((res) => res.json())
            .then((data) => setTeam(data))
            .catch((err) => console.error("Error fetching team:", err));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch("/api/performances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        }).then((res) => {
            if (res.ok) {
                alert("Stats Saved Successfully! 📈");
                setFormData({
                    ...formData,
                    rating: "",
                    goals: "0",
                    assists: "0",
                });
            }
        });
    };

    const labelStyle =
        "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2";
    const inputStyle =
        "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all";

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
                Record Match Performance
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* --- SELECT MATCH DROPDOWN --- */}
                    <div>
                        <label className={labelStyle}>Select Match</label>
                        <select
                            className={inputStyle}
                            required
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    match_id: e.target.value,
                                })
                            }
                        >
                            <option value="">Choose Game...</option>

                            {/* 👇 This now reads "vs Royal Tigers FC (Date)" */}
                            {matches.map((m) => (
                                <option key={m.id} value={m.id}>
                                    vs {m.opponent_name} (
                                    {new Date(
                                        m.match_date,
                                    ).toLocaleDateString()}
                                    )
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelStyle}>Select Player</label>
                        <select
                            className={inputStyle}
                            required
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    player_id: e.target.value,
                                })
                            }
                        >
                            <option value="">Who played?</option>

                            {/* 👇 Mapping the players from your DB */}
                            {players.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}{" "}
                                    {p.jersey_number
                                        ? `(#${p.jersey_number})`
                                        : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelStyle}>Mins</label>
                        <input
                            type="number"
                            className={inputStyle}
                            value={formData.minutes_played}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    minutes_played: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Rating</label>
                        <input
                            type="number"
                            step="0.1"
                            className={inputStyle}
                            placeholder="8.5"
                            required
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    rating: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Goals</label>
                        <input
                            type="number"
                            className={inputStyle}
                            value={formData.goals}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    goals: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Assists</label>
                        <input
                            type="number"
                            className={inputStyle}
                            value={formData.assists}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    assists: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>

                <button className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:-translate-y-1">
                    Save Performance
                </button>
            </form>
        </div>
    );
}
