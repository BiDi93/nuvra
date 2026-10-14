import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    supabase,
    isSupabaseConfigured,
    signInWithGoogle as apiSignInWithGoogle,
    signInWithPassword as apiSignInWithPassword,
    signUpWithEmail as apiSignUpWithEmail,
    signOut as apiSignOut,
    fetchProfile
} from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (userId) => {
        try {
            const data = await fetchProfile(userId);
            setProfile(data);
            if (data?.role) {
                localStorage.setItem('nuvra_role', data.role);
            }
            return data;
        } catch (err) {
            console.warn('[NUVRA Auth] Gagal memuat profil pengguna:', err);
            return null;
        }
    };

    useEffect(() => {
        if (!isSupabaseConfigured) {
            // Semak fallback legacy localStorage jika Supabase belum disambung
            const legacyUser = localStorage.getItem('community_user');
            if (legacyUser) {
                try {
                    const parsed = JSON.parse(legacyUser);
                    setUser(parsed);
                    setProfile({
                        id: parsed.id,
                        full_name: parsed.name,
                        email: parsed.email,
                        role: parsed.role || 'player',
                        position: parsed.position || 'Midfielder',
                    });
                } catch (e) {
                    // Ignore parsing error
                }
            }
            setLoading(false);
            return;
        }

        // 1. Dapatkan sesi aktif semasa Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                loadProfile(session.user.id);
            }
            setLoading(false);
        });

        // 2. Langgan perubahan status pengesahan (Log masuk, log keluar, OAuth callback)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (newSession?.user) {
                    await loadProfile(newSession.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const loginWithGoogle = async (redirectTo) => {
        return await apiSignInWithGoogle(redirectTo);
    };

    const loginWithPassword = async (email, password) => {
        const data = await apiSignInWithPassword(email, password);
        if (data.user) {
            await loadProfile(data.user.id);
        }
        return data;
    };

    const register = async (email, password, metadata) => {
        const data = await apiSignUpWithEmail(email, password, metadata);
        return data;
    };

    const logout = async () => {
        await apiSignOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        localStorage.removeItem('community_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('community_user');
        localStorage.removeItem('nuvra_role');
    };

    const refreshProfile = async () => {
        if (user?.id) {
            return await loadProfile(user.id);
        }
        return null;
    };

    const value = {
        user,
        profile,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        loginWithGoogle,
        loginWithPassword,
        register,
        logout,
        refreshProfile,
        userRole: profile?.role || 'player',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth mesti digunakan di dalam <AuthProvider>');
    }
    return context;
}
