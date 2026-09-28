import React, { useState } from "react";

const API = "/api/community/admin/qa-tools";

export default function QaTools() {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const headers = () => {
        const token = localStorage.getItem("community_token") || localStorage.getItem("auth_token");
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    const createPlayer = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await fetch(`${API}/test-players`, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ email, phone: phone || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not create a test player.");
            setMessage(`${data.message} Vellar ID ${data.vellar_ids?.join(", ")}.`);
            setEmail("");
            setPhone("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deletePlayers = async () => {
        if (!window.confirm("Delete every flagged test player? Other accounts stay.")) return;
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await fetch(`${API}/test-players`, { method: "DELETE", headers: headers() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not delete test players.");
            setMessage(data.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px", color: "#fff" }}>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>QA test players</h1>
            <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 20, lineHeight: 1.5 }}>
                Creates and deletes only flagged test players. Pass an inbox the team controls. Leave the phone empty for an email-only player. This screen is off in production and after QA turns the flag off.
            </p>
            {error && <p style={{ color: "#f87171" }}>{error}</p>}
            {message && <p style={{ color: "#00D4EC" }}>{message}</p>}
            <form onSubmit={createPlayer} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                />
                <input
                    type="text"
                    placeholder="Phone, optional"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                />
                <button type="submit" disabled={loading} style={buttonStyle}>
                    {loading ? "Working…" : "Create test player"}
                </button>
            </form>
            <button type="button" onClick={deletePlayers} disabled={loading} style={{ ...buttonStyle, marginTop: 16, background: "rgba(255,255,255,0.08)" }}>
                Delete flagged test players
            </button>
        </div>
    );
}

const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "#fff",
    padding: "12px 14px",
};

const buttonStyle = {
    background: "#00D4EC",
    color: "#041018",
    border: 0,
    borderRadius: 8,
    padding: "12px 14px",
    fontWeight: 700,
    cursor: "pointer",
};
