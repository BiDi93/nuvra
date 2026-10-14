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

    const loadProfile = async (targetUser) => {
        const userId = typeof targetUser === 'string' ? targetUser : targetUser?.id;
        if (!userId) return null;
        try {
            let data = null;
            try {
                data = await fetchProfile(userId);
            } catch (fetchErr) {
                // Profile might not exist yet
            }

            // Fallback: Jika trigger database belum sempat menjana profil, bina terus dari metadata auth pengguna
            if (!data && typeof targetUser === 'object' && targetUser?.email) {
                const detectedName = targetUser.user_metadata?.full_name || targetUser.user_metadata?.name || targetUser.email.split('@')[0];
                const detectedAvatar = targetUser.user_metadata?.avatar_url || targetUser.user_metadata?.picture || null;
                const cleanUsername = targetUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + targetUser.id.substring(0, 4);

                const { data: newProfile, error: upsertErr } = await supabase
                    .from('profiles')
                    .upsert({
                        id: targetUser.id,
                        email: targetUser.email,
                        full_name: detectedName,
                        username: cleanUsername,
                        avatar_url: detectedAvatar,
                        role: targetUser.user_metadata?.role || 'player',
                    })
                    .select()
                    .single();

                if (!upsertErr && newProfile) {
                    data = newProfile;
                }
            }

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
                loadProfile(session.user);
            }
            setLoading(false);
        });

        // 2. Langgan perubahan status pengesahan (Log masuk, log keluar, OAuth callback)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (newSession?.user) {
                    await loadProfile(newSession.user);
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
