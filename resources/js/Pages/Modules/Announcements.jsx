import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export default function Announcements() {
    // 1. CHANGE: Destructure 'profile' instead of 'attributes'
    // 'attributes' holds Pace/Shooting. 'profile' holds Name/Coach_ID.
    const { profile } = useOutletContext(); 

    // 2. Extract coach_id from the profile
    const coach_id = profile?.coach_id;

    // Debugging (Optional: Check your console to see exactly what 'profile' holds)
    console.log("Player Profile:", profile);

    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (coach_id) {
            fetch(`/api/coach/${coach_id}/announcements`)
                .then(res => res.json())
                .then(data => {
                    setNews(data);
                    setLoading(false);
                })
                .catch(err => setLoading(false));
        }
    }, [coach_id]);
    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 mb-2">
                    Team Updates
                </h1>
                <p className="text-gray-400 font-medium">
                    Latest news from the Head Coach
                </p>
            </div>

            <div className="grid gap-6">
                {news.map((item, index) => (
                    <div
                        key={item.id}
                        // ANIMATION CLASSES: Fade In + Hover Scale + Hover Shadow
                        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-purple-200 transition-all duration-300 ease-out cursor-default group"
                        style={{ animationDelay: `${index * 100}ms` }} // Staggered animation
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-purple-100 text-purple-600 p-2 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    📣
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                    {item.title}
                                </h3>
                            </div>
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                {new Date(item.created_at).toLocaleDateString(
                                    "en-GB",
                                    {
                                        weekday: "short",
                                        day: "numeric",
                                        month: "long",
                                    },
                                )}
                            </span>
                        </div>

                        <div className="pl-0 md:pl-12">
                            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                {item.content}
                            </p>
                        </div>
                    </div>
                ))}

                {news.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold">
                            No announcements yet. Stay tuned!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
