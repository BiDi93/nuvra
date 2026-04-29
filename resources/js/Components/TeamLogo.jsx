import React from "react";

/**
 * Deterministic hash for string to get consistent "random" values
 */
const getHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

export default function TeamLogo({ name, size = 32, style = {} }) {
    const hash = getHash(name || "Team");
    
    // ── Predefined Sporty Colors ──
    const colors = [
        "#10b981", // Emerald
        "#3b82f6", // Blue
        "#ef4444", // Red
        "#f59e0b", // Amber
        "#8b5cf6", // Violet
        "#ec4899", // Pink
        "#06b6d4", // Cyan
        "#f97316", // Orange
    ];
    
    const primaryColor = colors[hash % colors.length];
    const secondaryColor = "#1a1a1a";
    const shapeType = hash % 3; // 0: Shield, 1: Circle, 2: Diamond
    const patternType = hash % 4; // 0: Solid, 1: Stripes, 2: Gradient, 3: Half-tone

    const renderPattern = () => {
        switch (patternType) {
            case 1: // Vertical Stripes
                return (
                    <defs>
                        <pattern id={`stripes-${hash}`} patternUnits="userSpaceOnUse" width="10" height="10">
                            <rect width="5" height="10" fill="rgba(255,255,255,0.1)" />
                        </pattern>
                    </defs>
                );
            case 2: // Diagonal Stripes
                return (
                    <defs>
                        <pattern id={`diag-${hash}`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                            <rect width="4" height="8" fill="rgba(255,255,255,0.15)" />
                        </pattern>
                    </defs>
                );
            default:
                return null;
        }
    };

    const getShapePath = () => {
        switch (shapeType) {
            case 1: // Circle
                return <circle cx="50" cy="50" r="48" />;
            case 2: // Diamond / Rhombus
                return <path d="M50 2 L98 50 L50 98 L2 50 Z" />;
            default: // Classic Shield
                return <path d="M50 2 L95 15 C 95 60, 80 90, 50 98 C 20 90, 5 60, 5 15 Z" />;
        }
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            style={{
                filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))",
                ...style
            }}
        >
            {renderPattern()}
            
            {/* Base Shape */}
            <g fill={primaryColor} stroke="rgba(255,255,255,0.2)" strokeWidth="2">
                {getShapePath()}
            </g>

            {/* Pattern Overlay */}
            {patternType > 0 && (
                <g fill={`url(#${patternType === 1 ? `stripes-${hash}` : `diag-${hash}`})`}>
                    {getShapePath()}
                </g>
            )}

            {/* Inner Border / Detail */}
            <g fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4">
                <path d="M50 10 L85 20 C 85 55, 75 80, 50 88 C 25 80, 15 55, 15 20 Z" transform={shapeType !== 0 ? "scale(0.8) translate(12, 12)" : ""} />
            </g>

            {/* Text / Letter */}
            <text
                x="50"
                y="65"
                textAnchor="middle"
                fill="#fff"
                style={{
                    fontSize: 45,
                    fontWeight: 900,
                    fontFamily: "'Inter', sans-serif",
                    textShadow: "0px 2px 4px rgba(0,0,0,0.5)"
                }}
            >
                {name?.[0]?.toUpperCase() || "T"}
            </text>
            
            {/* Small detail dots for "pro" look */}
            <circle cx="50" cy="15" r="2" fill="rgba(255,255,255,0.5)" />
        </svg>
    );
}
