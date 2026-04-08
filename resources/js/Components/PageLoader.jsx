import React, { useState, useEffect } from 'react';

export default function PageLoader() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate a tiny delay so the loader is visible momentarily during page transitions
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`page-loader ${!loading ? 'fade-out' : ''}`}>
            <div className="loader-spinner" />
        </div>
    );
}
