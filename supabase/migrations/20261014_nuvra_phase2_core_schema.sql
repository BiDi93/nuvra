-- ==============================================================================
-- NUVRA 2.0 (FASA 2: APLIKASI TERAS & INTEGRASI SUPABASE)
-- SKEMA PANGKALAN DATA (PostgreSQL / Supabase)
-- 
-- Modul:
-- 1. profiles (Profil Pemain, Pengurus Kelab, Pengusaha Padang, Admin)
-- 2. player_club_history (Sejarah Kelab & Liga - Model Terbuka Grassroots)
-- 3. venues (Padang / Kompleks Sukan)
-- 4. venue_slots (Slot Masa & Tempahan Pengusaha Padang)
-- 5. matches (Cari Lawan & Perlawanan Sparring 50/50 Kos)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. JADUAL PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    vellar_id TEXT UNIQUE, -- Keserasian bersama ekosistem Vellar/Nuvra sedia ada
    phone_number TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'club_manager', 'venue_operator', 'admin')),
    
    -- Atribut Khusus Pemain
    position TEXT DEFAULT 'Midfielder' CHECK (position IN (
        'Goalkeeper', 'Defender', 'Midfielder', 'Forward / Striker',
        'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'
    )),
    dominant_foot TEXT DEFAULT 'Right' CHECK (dominant_foot IN ('Right', 'Left', 'Both')),
    district TEXT,     -- e.g. Shah Alam, Petaling Jaya, Subang Jaya, Johor Bahru
    state TEXT,        -- e.g. Selangor, Kuala Lumpur, Johor
    bio TEXT,
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    
    -- Statistik Pemain (Gaya Kad FIFA / Kad Statistik NUVRA)
    pace INT DEFAULT 70 CHECK (pace BETWEEN 0 AND 99),
    shooting INT DEFAULT 70 CHECK (shooting BETWEEN 0 AND 99),
    passing INT DEFAULT 70 CHECK (passing BETWEEN 0 AND 99),
    dribbling INT DEFAULT 70 CHECK (dribbling BETWEEN 0 AND 99),
    defending INT DEFAULT 70 CHECK (defending BETWEEN 0 AND 99),
    physical INT DEFAULT 70 CHECK (physical BETWEEN 0 AND 99),
    overall_rating INT DEFAULT 70 CHECK (overall_rating BETWEEN 0 AND 99),
    
    -- Maklumat Pengurus Kelab (Jika pengguna mendaftar sebagai / menguruskan kelab)
    primary_club_name TEXT,
    primary_club_logo TEXT,
    
    is_profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk pencarian pantas
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_district ON public.profiles(district);
CREATE INDEX IF NOT EXISTS idx_profiles_position ON public.profiles(position);

-- ------------------------------------------------------------------------------
-- 2. JADUAL PLAYER_CLUB_HISTORY (Sejarah Kelab & Liga Tanpa Roster Terikat)
-- Membolehkan pemain merekod penglibatan pelbagai kelab sosial/liga secara bebas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_club_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    club_name TEXT NOT NULL,
    club_logo TEXT,
    league_name TEXT NOT NULL, -- Contoh: 'Vellar League Season 1', 'Liga Lembah Klang', 'Selangor Champions League'
    season TEXT NOT NULL,      -- Contoh: '2025/2026', '2025', '2024'
    position_played TEXT,
    jersey_number INT,
    appearances INT DEFAULT 0,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    clean_sheets INT DEFAULT 0,
    achievements TEXT,         -- Contoh: 'Juara Divisyen 2', 'Kasut Emas', 'Naib Juara'
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_player_id ON public.player_club_history(player_id);

-- ------------------------------------------------------------------------------
-- 3. JADUAL VENUES (Padang & Kompleks Sukan)
-- Diuruskan oleh Pengusaha Padang (venue_operator)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    district TEXT NOT NULL,  -- Contoh: 'Petaling Jaya', 'Subang Jaya', 'Cyberjaya'
    state TEXT NOT NULL DEFAULT 'Selangor',
    address TEXT NOT NULL,
    google_maps_url TEXT,
    pitch_type TEXT NOT NULL DEFAULT 'Artificial Turf 11v11' CHECK (pitch_type IN (
        'Artificial Turf 11v11', 'Natural Grass 11v11', 'Artificial Turf 7v7',
        'Artificial Turf 9v9', 'Futsal Court (Indoor)', 'Futsal Court (Outdoor)'
    )),
    facilities TEXT[] DEFAULT ARRAY['Floodlights', 'Parking', 'Surau', 'Changing Room']::TEXT[],
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    contact_phone TEXT,
    pricing_per_hour NUMERIC(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_district ON public.venues(district);
CREATE INDEX IF NOT EXISTS idx_venues_operator ON public.venues(operator_id);

-- ------------------------------------------------------------------------------
-- 4. JADUAL VENUE_SLOTS (Slot Masa & Tempahan Padang)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venue_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'locked', 'cancelled')),
    booked_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Elakkan pertindihan slot sama pada padang yang sama
    CONSTRAINT unique_venue_slot UNIQUE (venue_id, slot_date, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_venue_slots_date ON public.venue_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_venue_slots_status ON public.venue_slots(status);
CREATE INDEX IF NOT EXISTS idx_venue_slots_venue ON public.venue_slots(venue_id);

-- ------------------------------------------------------------------------------
-- 5. JADUAL MATCHES (Cari Lawan / Sparring & Perkongsian Kos 50/50)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    match_type TEXT NOT NULL DEFAULT 'sparring' CHECK (match_type IN ('sparring', 'friendly', 'tournament', 'pickup')),
    format TEXT NOT NULL DEFAULT '11v11' CHECK (format IN ('11v11', '9v9', '7v7', '5v5')),
    
    -- Pasukan Tuan Rumah / Host (Pencipta Cabaran)
    host_manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    host_club_name TEXT NOT NULL,
    host_club_logo TEXT,
    
    -- Pasukan Pelawat / Lawan (Opponent)
    opponent_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    opponent_club_name TEXT,
    opponent_club_logo TEXT,
    
    -- Lokasi & Slot
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    venue_slot_id UUID REFERENCES public.venue_slots(id) ON DELETE SET NULL,
    venue_name_custom TEXT, -- Sekiranya padang belum berdaftar dalam sistem
    district TEXT,
    match_date DATE NOT NULL,
    kickoff_time TIME NOT NULL,
    end_time TIME,
    
    -- Model Kos Sparring 50/50
    split_mode TEXT NOT NULL DEFAULT '50_50' CHECK (split_mode IN ('50_50', 'host_only', 'free', 'custom')),
    total_pitch_cost NUMERIC(10,2) DEFAULT 0.00,
    host_share_cost NUMERIC(10,2) DEFAULT 0.00,
    opponent_share_cost NUMERIC(10,2) DEFAULT 0.00,
    referee_cost NUMERIC(10,2) DEFAULT 0.00,
    host_referee_share NUMERIC(10,2) DEFAULT 0.00,
    opponent_referee_share NUMERIC(10,2) DEFAULT 0.00,
    
    -- Status Perlawanan & Pembayaran
    status TEXT NOT NULL DEFAULT 'open_challenge' CHECK (status IN (
        'open_challenge',  -- Menunggu kelab lawan menerima cabaran
        'matched',         -- Lawan telah terima, menunggu pengesahan/bayaran
        'confirmed',       -- Disahkan, siap untuk sepak mula
        'completed',       -- Perlawanan selesai
        'cancelled'        -- Dibatalkan
    )),
    host_payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (host_payment_status IN ('unpaid', 'paid', 'verified')),
    opponent_payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (opponent_payment_status IN ('unpaid', 'paid', 'verified')),
    
    -- Keputusan (Bila selesai)
    host_score INT,
    opponent_score INT,
    
    -- Keperluan & Syarat Perlawanan
    preferred_opponent_level TEXT DEFAULT 'Social / Casual' CHECK (preferred_opponent_level IN (
        'Social / Casual', 'Semi-Pro', 'Open', 'Veteran 35+', 'Under 18'
    )),
    rules_notes TEXT,     -- Contoh: 'Jersi Gelap, sediakan 2 biji bola, referee berlesen'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_host ON public.matches(host_manager_id);
CREATE INDEX IF NOT EXISTS idx_matches_opponent ON public.matches(opponent_manager_id);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATIK TRIGGER: USER SIGNUP KE PROFILES
-- Menyegerakkan pendaftaran Google OAuth atau Email ke jadual profiles
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    detected_name TEXT;
    detected_avatar TEXT;
    clean_username TEXT;
BEGIN
    -- Ambil maklumat daripada metadata Google OAuth atau metadata emel
    detected_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    detected_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NULL
    );
    clean_username := LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')) || '_' || SUBSTRING(NEW.id::TEXT, 1, 4);

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        username,
        avatar_url,
        role
    )
    VALUES (
        NEW.id,
        NEW.email,
        detected_name,
        clean_username,
        detected_avatar,
        COALESCE(NEW.raw_user_meta_data->>'role', 'player')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger untuk kemas kini updated_at secara automatik
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE OR REPLACE TRIGGER trg_venues_updated_at
    BEFORE UPDATE ON public.venues
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE OR REPLACE TRIGGER trg_venue_slots_updated_at
    BEFORE UPDATE ON public.venue_slots
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE OR REPLACE TRIGGER trg_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Memastikan keselamatan data di peringkat pangkalan data Supabase
-- ------------------------------------------------------------------------------

-- Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_club_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 7.1 Polisi PROFILES
-- Sesiapa sahaja boleh melihat profil umum pemain
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Pengguna hanya boleh kemas kini profil sendiri
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 7.2 Polisi PLAYER_CLUB_HISTORY
CREATE POLICY "Club history is viewable by everyone"
    ON public.player_club_history FOR SELECT
    USING (true);

CREATE POLICY "Players can insert own club history"
    ON public.player_club_history FOR INSERT
    WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update own club history"
    ON public.player_club_history FOR UPDATE
    USING (auth.uid() = player_id);

CREATE POLICY "Players can delete own club history"
    ON public.player_club_history FOR DELETE
    USING (auth.uid() = player_id);

-- 7.3 Polisi VENUES
CREATE POLICY "Venues are viewable by everyone"
    ON public.venues FOR SELECT
    USING (true);

CREATE POLICY "Venue operators can create venues"
    ON public.venues FOR INSERT
    WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Venue operators can update own venues"
    ON public.venues FOR UPDATE
    USING (auth.uid() = operator_id);

-- 7.4 Polisi VENUE_SLOTS
CREATE POLICY "Venue slots are viewable by everyone"
    ON public.venue_slots FOR SELECT
    USING (true);

CREATE POLICY "Venue operators can manage slots"
    ON public.venue_slots FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.venues
            WHERE venues.id = venue_slots.venue_id
            AND venues.operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can book available slots"
    ON public.venue_slots FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- 7.5 Polisi MATCHES (Cari Lawan / Sparring)
CREATE POLICY "Matches are viewable by everyone"
    ON public.matches FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create matches"
    ON public.matches FOR INSERT
    WITH CHECK (auth.uid() = host_manager_id);

CREATE POLICY "Host manager or opponent manager can update match"
    ON public.matches FOR UPDATE
    USING (auth.uid() = host_manager_id OR auth.uid() = opponent_manager_id);

CREATE POLICY "Host manager can delete/cancel open challenge"
    ON public.matches FOR DELETE
    USING (auth.uid() = host_manager_id AND status = 'open_challenge');
