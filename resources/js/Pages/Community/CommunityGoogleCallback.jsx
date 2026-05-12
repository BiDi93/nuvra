import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLoader from "../../Components/PageLoader";
import DynamicBackground from "../../Components/DynamicBackground";

const CommunityGoogleCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const id = searchParams.get('id');
        const name = searchParams.get('name');
        const role = searchParams.get('role');

        if (token && id) {
            localStorage.setItem('community_token', token);
            localStorage.setItem('community_user', JSON.stringify({
                id: parseInt(id),
                name: decodeURIComponent(name),
                role: role || 'player'
            }));

            navigate('/community/feed');
        } else {
            navigate('/community?error=google_failed');
        }
    }, [navigate, searchParams]);

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810' }}>
            <PageLoader />
            <DynamicBackground />
            <div style={{ zIndex: 1, textAlign: 'center' }}>
                <div style={{ 
                    width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', 
                    borderTopColor: '#00D4EC', borderRadius: '50%', 
                    animation: 'spin 1s linear infinite', margin: '0 auto 16px' 
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1 }}>AUTHENTICATING...</span>
            </div>
        </div>
    );
};

export default CommunityGoogleCallback;