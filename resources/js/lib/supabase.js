import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://kyarnmrmcnvekvjgfatv.supabase.co').trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YXJubXJtY252ZWt2amdmYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5Mzg4MjksImV4cCI6MjEwNzUxNDgyOX0.MUIZOwCz9p8v7SwUjO9VpmeFORT6ki_G44x9YYZT5Jc').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
        },
    }
);

// =============================================================================
// AUTHENTICATION HELPERS (Termasuk Google OAuth)
// =============================================================================

/**
 * Log masuk menggunakan Google OAuth
 * @param {string} [redirectTo] - URL ubah hala selepas log masuk berjaya
 */
export async function signInWithGoogle(redirectTo) {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase belum dikonfigurasi dalam .env');
    }
    const targetUrl = redirectTo || `${window.location.origin}/dashboard/player`;
    console.log('[NUVRA Supabase] Melancarkan Google OAuth ke:', targetUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: targetUrl,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });

    if (error) {
        console.error('[NUVRA Supabase] Ralat Google OAuth:', error);
        throw error;
    }

    if (data?.url) {
        console.log('[NUVRA Supabase] Redirecting browser ke:', data.url);
        window.location.href = data.url;
    }

    return data;
}

/**
 * Log masuk menggunakan Emel & Kata Laluan
 */
export async function signInWithPassword(email, password) {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase belum dikonfigurasi dalam .env');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

/**
 * Daftar pengguna baru dengan Metadata Profil
 */
export async function signUpWithEmail(email, password, metadata = {}) {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase belum dikonfigurasi dalam .env');
    }
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: metadata.full_name || '',
                role: metadata.role || 'player',
                position: metadata.position || 'Midfielder',
                district: metadata.district || '',
                dominant_foot: metadata.dominant_foot || 'Right',
            },
        },
    });
    if (error) throw error;
    return data;
}

/**
 * Log keluar
 */
export async function signOut() {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Dapatkan sesi & pengguna semasa
 */
export async function getCurrentUser() {
    if (!isSupabaseConfigured) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

// =============================================================================
// PROFILES API HELPERS
// =============================================================================

export async function fetchProfile(userId) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}

export async function updateProfile(userId, updates) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// =============================================================================
// PLAYER CLUB HISTORY (Sejarah Kelab & Liga Tanpa Roster Terikat)
// =============================================================================

export async function fetchPlayerClubHistory(playerId) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
        .from('player_club_history')
        .select('*')
        .eq('player_id', playerId)
        .order('is_current', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function addPlayerClubHistory(historyRecord) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
        .from('player_club_history')
        .insert([historyRecord])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deletePlayerClubHistory(historyId) {
    if (!isSupabaseConfigured) return null;
    const { error } = await supabase
        .from('player_club_history')
        .delete()
        .eq('id', historyId);

    if (error) throw error;
    return true;
}

// =============================================================================
// VENUES & VENUE SLOTS (Padang & Pengurusan Slot)
// =============================================================================

export async function fetchVenues(districtFilter = null) {
    if (!isSupabaseConfigured) return [];
    let query = supabase
        .from('venues')
        .select('*, operator:profiles!operator_id(full_name, phone_number)')
        .eq('is_active', true)
        .order('name');

    if (districtFilter) {
        query = query.eq('district', districtFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function fetchVenueSlots(venueId, slotDate = null) {
    if (!isSupabaseConfigured) return [];
    let query = supabase
        .from('venue_slots')
        .select('*')
        .eq('venue_id', venueId)
        .order('slot_date')
        .order('start_time');

    if (slotDate) {
        query = query.eq('slot_date', slotDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function createVenueSlot(slotData) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
        .from('venue_slots')
        .insert([slotData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// =============================================================================
// MATCHES (Cari Lawan / Sparring 50/50)
// =============================================================================

export async function fetchOpenMatchChallenges(filters = {}) {
    if (!isSupabaseConfigured) return [];
    let query = supabase
        .from('matches')
        .select(`
            *,
            host:profiles!host_manager_id(full_name, avatar_url, phone_number),
            opponent:profiles!opponent_manager_id(full_name, avatar_url),
            venue:venues(name, district, address)
        `)
        .order('match_date', { ascending: true })
        .order('kickoff_time', { ascending: true });

    if (filters.status) {
        query = query.eq('status', filters.status);
    } else {
        query = query.in('status', ['open_challenge', 'matched', 'confirmed']);
    }

    if (filters.district) {
        query = query.eq('district', filters.district);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function createMatchChallenge(matchData) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
        .from('matches')
        .insert([matchData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function acceptMatchChallenge(matchId, opponentData) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
        .from('matches')
        .update({
            opponent_manager_id: opponentData.opponent_manager_id,
            opponent_club_name: opponentData.opponent_club_name,
            opponent_club_logo: opponentData.opponent_club_logo || null,
            status: 'matched',
        })
        .eq('id', matchId)
        .eq('status', 'open_challenge')
        .select()
        .single();

    if (error) throw error;
    return data;
}
