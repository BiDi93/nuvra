# NUVRA — Technical Documentation
> Version 1.0 | April 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Application Architecture](#3-application-architecture)
4. [Database Design](#4-database-design)
5. [API Routes](#5-api-routes)
6. [Backend — Controllers & Functions](#6-backend--controllers--functions)
7. [Frontend — Pages & Components](#7-frontend--pages--components)
8. [Authentication System](#8-authentication-system)
9. [Third-Party Integrations](#9-third-party-integrations)
10. [File Structure](#10-file-structure)

---

## 1. System Overview

NUVRA adalah platform pengurusan sukan bola sepak yang terdiri daripada **dua modul utama**:

| Modul | Pengguna | Fungsi |
|-------|----------|--------|
| **Nuvra Club** | Pemain & Jurulatih | Pengurusan squad, rekod prestasi, jadual, bayaran, pengumuman |
| **Nuvra Community** | Orang awam | Daftar untuk pickup game, tempah slot, ikuti pengumuman komuniti |

### User Roles

| Role | Akses |
|------|-------|
| **Coach** | Urus squad, rekod stats, luluskan pemain, post pengumuman, lihat bayaran |
| **Player** | Lihat profil, stats, jadual, buat bayaran, lihat rakan sepasukan |
| **Community Admin** | Cipta game, post pengumuman komuniti |
| **Community Player** | Daftar game, pilih team side, lihat pengumuman |

---

## 2. Tech Stack

### Backend
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| PHP | ^8.2 | Bahasa backend |
| Laravel | 12.0 | Framework backend |
| Laravel Sanctum | 4.0 | API token authentication |
| Laravel Socialite | 5.24 | Google OAuth |
| SQLite / MySQL | — | Database (SQLite local, MySQL production) |

### Frontend
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| React | 19.2.3 | UI framework |
| React Router DOM | 7.13.0 | Client-side routing (SPA) |
| Axios | 1.13.3 | HTTP client untuk API calls |
| Tailwind CSS | 3.4.17 | Styling utility |
| Vite | 7.0.7 | Build tool |
| Recharts | 3.6.0 | Graf & carta |
| FullCalendar React | 6.1.20 | Kalendar interaktif |

### Third-Party
| Servis | Kegunaan |
|--------|----------|
| **Billplz** | Payment gateway (monthly fees) |
| **Google OAuth** | Social login untuk pemain |
| **Laravel Mail** | Email notifikasi untuk community games |

---

## 3. Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (React SPA)                 │
│   NuvraPortal → Login → Dashboard / Community Portal   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / API calls (Axios)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   LARAVEL BACKEND                        │
│                                                         │
│   routes/web.php  ──▶  SPA catch-all (React)           │
│   routes/api.php  ──▶  API Endpoints                   │
│                                                         │
│   Controllers:                                          │
│   ├─ PlayerController                                   │
│   ├─ CoachController                                    │
│   ├─ AuthController (Google OAuth)                      │
│   ├─ TeamController                                     │
│   ├─ PerformanceController                              │
│   ├─ AnnouncementController                             │
│   ├─ ScheduleController                                 │
│   ├─ PaymentControllerBillplz                           │
│   ├─ CommunityAuthController                            │
│   ├─ CommunityGameController                            │
│   └─ CommunityAnnouncementController                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     DATABASE                             │
│   Club: users, coaches, players, attributes,            │
│         matches, performances, payments,                │
│         announcements, schedules, teams                 │
│                                                         │
│   Community: community_users, community_games,          │
│              community_bookings, community_announcements│
└─────────────────────────────────────────────────────────┘
```

### Request Flow (Club Portal)
```
User buka browser
  → React Router load halaman
  → Check localStorage untuk auth_token
  → Jika ada token: call GET /api/player/me
  → Laravel verify token → return player data
  → React render dashboard dengan data
```

### Request Flow (Community Portal)
```
User buka /community
  → CommunityHome.jsx check localStorage community_token
  → Jika tiada: redirect ke login/register
  → Login: POST /api/community/login → dapat token
  → GET /api/community/games → list semua games
  → POST /api/community/games/{id}/join → tempah slot
```

---

## 4. Database Design

### Entity Relationship Diagram

```
coaches ──────────────────────────────────────────────────┐
  │                                                        │
  ├──< players >──────< attributes (1:1)                  │
  │       │                                               │
  │       ├──< performances >──< matches >< ──────────────┘
  │       │
  │       └──< payments
  │
  ├──< announcements
  ├──< schedules
  └──< teams (as head_coach)

community_users
  ├──< community_games (as creator)
  ├──< community_bookings >──< community_games
  └──< community_announcements
```

---

### Table Structures

#### `users`
Pengguna utama sistem (Google OAuth & manual registration).

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `name` | string | NOT NULL | Nama penuh |
| `email` | string | UNIQUE, NOT NULL | Emel |
| `email_verified_at` | timestamp | nullable | Pengesahan emel |
| `password` | string | nullable | Hashed password |
| `google_id` | string | nullable | ID dari Google OAuth |
| `avatar` | string | nullable | URL gambar profil (Google) |
| `role` | string | nullable | `'player'` atau `'coach'` |
| `remember_token` | string | nullable | — |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `coaches`
Jurulatih yang mengurus squad.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `name` | string | NOT NULL | Nama jurulatih |
| `email` | string | UNIQUE, NOT NULL | Emel login |
| `password` | string | NOT NULL | Hashed password |
| `team_name` | string | NOT NULL | Nama pasukan |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `players`
Pemain yang berdaftar di bawah jurulatih.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `coach_id` | bigint | FK → coaches.id, nullable, cascade | Jurulatih yang mengurus |
| `name` | string | NOT NULL | Nama pemain |
| `age` | integer | nullable | Umur |
| `address` | text | nullable | Alamat |
| `email` | string | UNIQUE, nullable | Emel login |
| `date_of_birth` | date | nullable | Tarikh lahir |
| `position` | string | NOT NULL | Posisi (Striker, Goalkeeper, dll) |
| `jersey_number` | integer | nullable | Nombor jersi |
| `height_cm` | integer | nullable | Tinggi (cm) |
| `weight_kg` | integer | nullable | Berat (kg) |
| `strong_foot` | enum | nullable | `'left'`, `'right'`, `'both'` |
| `password` | string | NOT NULL | Hashed password |
| `profile_image` | string | nullable | Path gambar profil |
| `status` | string | DEFAULT `'pending'` | `'pending'`, `'active'`, `'rejected'` |
| `photo_url` | string | nullable | URL gambar (alternatif) |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `attributes`
Stats FIFA-style untuk setiap pemain (one-to-one dengan players).

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `player_id` | bigint | FK → players.id, cascade | Pemain |
| `pace` | integer | DEFAULT 50 | Laju (0–100) |
| `shooting` | integer | DEFAULT 50 | Tembakan (0–100) |
| `passing` | integer | DEFAULT 50 | Hantaran (0–100) |
| `dribbling` | integer | DEFAULT 50 | Dribbling (0–100) |
| `defending` | integer | DEFAULT 50 | Pertahanan (0–100) |
| `physical` | integer | DEFAULT 50 | Fizikal (0–100) |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `matches`
Rekod perlawanan pasukan.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `coach_id` | bigint | FK → coaches.id, cascade | Jurulatih |
| `opponent_name` | string | NOT NULL | Nama lawan |
| `match_date` | date | NOT NULL | Tarikh perlawanan |
| `match_time` | time | nullable | Masa perlawanan |
| `venue` | string | DEFAULT `'Home'` | Tempat |
| `league_type` | string | DEFAULT `'League'` | `'League'`, `'Friendly'`, `'Cup'` |
| `category` | string | nullable | Kategori umur/division |
| `league_name` | string | nullable | Nama liga |
| `event_name` | string | nullable | Nama event |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `performances`
Stats seseorang pemain dalam satu perlawanan.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `player_id` | bigint | FK → players.id, cascade | Pemain |
| `match_id` | bigint | FK → matches.id, cascade | Perlawanan |
| `minutes_played` | integer | DEFAULT 0 | Minit bermain |
| `goals` | integer | DEFAULT 0 | Gol |
| `assists` | integer | DEFAULT 0 | Assist |
| `rating` | decimal(3,1) | nullable | Rating (contoh: 8.5) |
| `cleansheet` | boolean | DEFAULT false | Cleansheet (untuk GK/DEF) |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `announcements`
Pengumuman daripada jurulatih kepada squad.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `coach_id` | bigint | FK → coaches.id, cascade | Jurulatih |
| `title` | string | NOT NULL | Tajuk pengumuman |
| `content` | text | NOT NULL | Isi pengumuman |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `schedules`
Jadual aktiviti pasukan (latihan, perlawanan, mesyuarat).

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `coach_id` | bigint | FK → coaches.id, cascade | Jurulatih |
| `title` | string | NOT NULL | Contoh: "vs Cyberjaya FC", "Fitness Training" |
| `type` | string | NOT NULL | `'match'`, `'training'`, `'meeting'` |
| `start_time` | datetime | NOT NULL | Masa mula |
| `end_time` | datetime | nullable | Masa tamat |
| `location` | string | nullable | Lokasi |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `payments`
Rekod bayaran bulanan pemain.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `player_id` | bigint | FK → players.id, cascade | Pemain |
| `month_year` | string | NOT NULL | Contoh: `"Feb 2026"` |
| `amount` | decimal(8,2) | NOT NULL | Jumlah bayaran |
| `status` | string | DEFAULT `'completed'` | Status bayaran |
| `transaction_id` | string | nullable | ID transaksi Billplz |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `teams`
Maklumat pasukan/kelab.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `name` | string | NOT NULL | Nama pasukan |
| `slug` | string | UNIQUE, nullable | URL-friendly name |
| `based_location` | string | nullable | Lokasi berpangkalan |
| `established_year` | string | nullable | Tahun ditubuhkan |
| `logo` | string | nullable | Path logo pasukan |
| `primary_color` | string | DEFAULT `'#000000'` | Warna utama pasukan |
| `home_venue` | string | nullable | Stadium/padang home |
| `head_coach_id` | bigint | FK → coaches.id, set null | Ketua jurulatih |
| `bio` | text | nullable | Penerangan pasukan |
| `social_link` | string | nullable | Link media sosial |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `community_users`
Pengguna modul Community (sistem auth berasingan).

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `name` | string | NOT NULL | Nama |
| `email` | string | UNIQUE, NOT NULL | Emel login |
| `password` | string | NOT NULL | Hashed password |
| `role` | enum | DEFAULT `'player'` | `'player'`, `'admin'` |
| `phone` | string | nullable | Nombor telefon |
| `avatar` | string | nullable | Gambar profil |
| `remember_token` | string | nullable | Token auth custom |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `community_games`
Game pickup yang dibuka untuk orang awam.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `title` | string | NOT NULL | Tajuk game |
| `description` | text | nullable | Penerangan |
| `venue` | string | NOT NULL | Lokasi |
| `game_date` | datetime | NOT NULL | Tarikh & masa |
| `team_a_name` | string | DEFAULT `'Team A'` | Nama Team A |
| `team_b_name` | string | DEFAULT `'Team B'` | Nama Team B |
| `max_slots_per_team` | unsigned int | DEFAULT 20 | Max pemain setiap team |
| `status` | enum | DEFAULT `'open'` | `'open'`, `'full'`, `'cancelled'`, `'completed'` |
| `created_by` | bigint | FK → community_users.id, cascade | Admin yang cipta |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `community_bookings`
Rekod tempahan slot pemain dalam sesuatu game.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `game_id` | bigint | FK → community_games.id, cascade | Game |
| `community_user_id` | bigint | FK → community_users.id, cascade | Pemain |
| `team_side` | enum | NOT NULL | `'team_a'`, `'team_b'` |
| `status` | enum | DEFAULT `'confirmed'` | `'confirmed'`, `'cancelled'` |
| — | — | UNIQUE(game_id, community_user_id) | Satu pemain satu slot |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### `community_announcements`
Pengumuman dari admin kepada komuniti.

| Column | Type | Constraint | Keterangan |
|--------|------|-----------|------------|
| `id` | bigint | PK, auto-increment | — |
| `title` | string | NOT NULL | Tajuk |
| `body` | text | NOT NULL | Kandungan |
| `created_by` | bigint | FK → community_users.id, cascade | Admin |
| `created_at` | timestamp | — | — |
| `updated_at` | timestamp | — | — |

---

#### Laravel System Tables
| Table | Kegunaan |
|-------|----------|
| `personal_access_tokens` | Sanctum API tokens |
| `sessions` | Session management |
| `cache` | Application cache |
| `jobs` | Queue jobs |
| `password_reset_tokens` | Reset password flow |

---

## 5. API Routes

### Base URL: `/api`

#### Authentication & Player

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `POST` | `/login` | — | Login pemain atau jurulatih |
| `POST` | `/coach/login` | — | Login khusus jurulatih |
| `POST` | `/register` | — | Daftar akaun baharu |
| `POST` | `/player/onboarding` | — | Hantar permohonan sertai pasukan |
| `GET` | `/user` | Sanctum | Dapatkan maklumat user semasa |
| `GET` | `/player/me` | Token | Dapatkan profil penuh pemain login |
| `GET` | `/players` | — | Senarai semua pemain |
| `POST` | `/players` | — | Cipta rekod pemain |
| `GET` | `/players/{id}` | — | Profil pemain + stats + attributes |
| `POST` | `/player/{id}/update` | — | Kemaskini profil (nama, password, gambar) |
| `POST` | `/player/{id}/attributes` | — | Kemaskini FIFA attributes |
| `GET` | `/players/{id}/teammates` | — | Dapatkan rakan sepasukan |
| `GET` | `/player/{id}/payments` | — | Sejarah bayaran pemain |

#### Coach Portal

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `GET` | `/coach/{id}/team` | — | Dapatkan maklumat pasukan coach |
| `GET` | `/coach/{id}/players` | — | Senarai pemain aktif |
| `POST` | `/coach/{id}/players` | — | Tambah pemain baharu |
| `GET` | `/coach/{id}/requests` | — | Senarai permohonan pemain (pending) |
| `POST` | `/coach/{id}/request/{playerId}` | — | Luluskan / tolak pemain |
| `GET` | `/coach/{id}/announcements` | — | Senarai pengumuman |
| `POST` | `/announcements` | — | Cipta pengumuman baharu |
| `GET` | `/coach/{id}/schedule` | — | Dapatkan jadual aktiviti |
| `POST` | `/schedule` | — | Cipta jadual baharu |
| `DELETE` | `/schedule/{id}` | — | Padam jadual |
| `GET` | `/coach/{id}/payments/{month}` | — | Status bayaran bulanan squad |
| `GET` | `/coach/{id}/matches` | — | Senarai perlawanan (untuk dropdown) |

#### Performance

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `POST` | `/performances` | — | Rekod stats pemain dalam perlawanan |

#### Payments (Billplz)

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `POST` | `/payment/create-bill` | Sanctum | Cipta bil bayaran Billplz |
| `POST` | `/payment/verify` | Sanctum | Semak & sahkan status bayaran |

#### Community Auth

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `POST` | `/community/register` | — | Daftar akaun komuniti |
| `POST` | `/community/login` | — | Login komuniti |
| `POST` | `/community/logout` | Token | Logout komuniti |
| `GET` | `/community/me` | Token | Dapatkan pengguna komuniti semasa |

#### Community Games

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `GET` | `/community/games` | — | Senarai semua game (public) |
| `GET` | `/community/games/{id}` | — | Detail satu game + roster |
| `POST` | `/community/games` | Admin token | Cipta game baharu |
| `PATCH` | `/community/games/{id}/cancel` | Admin token | Batalkan game |
| `POST` | `/community/games/{id}/join` | Token | Tempah slot dalam game |
| `DELETE` | `/community/games/{id}/leave` | Token | Batalkan tempahan |

#### Community Announcements

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `GET` | `/community/announcements` | — | Senarai semua pengumuman |
| `POST` | `/community/announcements` | Admin token | Cipta pengumuman |
| `DELETE` | `/community/announcements/{id}` | Admin token | Padam pengumuman |

#### OAuth (Web Routes)

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `GET` | `/auth/google` | Redirect ke Google OAuth |
| `GET` | `/auth/google/callback` | Handle callback dari Google |

---

## 6. Backend — Controllers & Functions

### `PlayerController`

| Function | Fungsi |
|----------|--------|
| `index()` | Return senarai semua pemain dari DB |
| `store()` | Cipta rekod pemain baru (nama, email, position, coach_id, dll) |
| `show($id)` | Return profil pemain + attributes + performance history + match history |
| `me()` | Identify pemain dari Bearer token → return profil lengkap |
| `update($id)` | Kemaskini nama / password / gambar profil pemain |
| `updateAttributes($id)` | Kemaskini FIFA stats (pace, shooting, passing, dribbling, defending, physical) |
| `login()` | Semak email & password di jadual `players` atau `coaches`, return token |
| `register()` | Cipta user baru di jadual `users` (untuk Google auth flow) |
| `submitApplication()` | Kemaskini user dengan coach_id dan position, set status `'pending'` |
| `getTeammates($id)` | Return semua pemain di bawah coach yang sama |
| `getTeams()` | Return senarai semua coaches & nama pasukan |
| `getCoachPlayers($coachId)` | Return semua pemain aktif di bawah coach tertentu |

---

### `CoachController`

| Function | Fungsi |
|----------|--------|
| `login()` | Authenticate jurulatih, return dummy token (sistem legacy) |
| `getMyTeam($coachId)` | Return semua pemain aktif + attributes di bawah coach |
| `addPlayer()` | Tambah pemain baharu terus ke dalam squad (status: active) |
| `getPendingRequests($coachId)` | Return semua permohonan pemain yang `status = 'pending'` |
| `handleRequest()` | Terima `action: approve/decline` → kemaskini `players.status` |

---

### `AuthController`

| Function | Fungsi |
|----------|--------|
| `redirectToGoogle()` | Guna Socialite untuk redirect user ke Google login |
| `handleGoogleCallback()` | Terima data dari Google, cipta/kemaskini user, redirect ke `/onboarding` atau `/dashboard` |

---

### `TeamController`

| Function | Fungsi |
|----------|--------|
| `getCoachTeam($coachId)` | Return rekod team yang dikaitkan dengan coach (dari jadual `teams`) |

---

### `PerformanceController`

| Function | Fungsi |
|----------|--------|
| `store()` | Cipta match (atau cari yang sedia ada), kemudian simpan performance stats pemain. Guna `updateOrInsert` untuk elak duplikasi match. Semua dalam satu DB transaction. |

**Data yang direkod:** `coach_id`, `opponent_name`, `match_date`, `category`, `league_name`, `event_name`, `venue`, `player_id`, `minutes_played`, `goals`, `assists`, `rating`, `cleansheet`

---

### `AnnouncementController`

| Function | Fungsi |
|----------|--------|
| `index($coachId)` | Return semua pengumuman untuk coach tertentu (terbaru dahulu) |
| `store()` | Simpan pengumuman baru dengan `coach_id`, `title`, `content` |

---

### `ScheduleController`

| Function | Fungsi |
|----------|--------|
| `index($coachId)` | Return semua jadual untuk coach (latihan, perlawanan, mesyuarat) |
| `store()` | Cipta jadual baru dengan jenis (`match`, `training`, `meeting`), masa, lokasi |
| `destroy($id)` | Padam jadual berdasarkan ID |

---

### `PaymentControllerBillplz`

| Function | Fungsi |
|----------|--------|
| `createBill()` | Cipta bil Billplz untuk pemain (jumlah tetap RM50), return URL pembayaran |
| `verifyPayment()` | Semak status bil dengan Billplz API, jika berjaya simpan ke jadual `payments` |
| `getMyPayments($id)` | Return sejarah bayaran pemain (month_year, amount, status, transaction_id) |
| `getTeamPayments($coachId, $month)` | Return status bayaran semua pemain squad untuk bulan tertentu |

---

### `CommunityAuthController`

| Function | Fungsi |
|----------|--------|
| `register()` | Daftar community user baru (name, email, password, phone) |
| `login()` | Authenticate, simpan random token ke `remember_token`, return token |
| `logout()` | Clear `remember_token` dari DB |
| `me()` | Cari user berdasarkan `remember_token` dalam request header |

---

### `CommunityGameController`

| Function | Fungsi |
|----------|--------|
| `index()` | Return semua game (status: open/full) dengan kiraan slot Team A & Team B |
| `show($id)` | Return detail game + senarai pemain dalam setiap team |
| `store()` | Cipta game baru (admin sahaja), hantar email notifikasi ke semua community users |
| `cancel($id)` | Tukar status game kepada `'cancelled'` (admin sahaja) |
| `join($id)` | Pemain pilih team side, check kapasiti, simpan ke `community_bookings`. Tukar status game ke `'full'` jika penuh |
| `leave($id)` | Tukar booking status ke `'cancelled'`, jika game was `'full'` tukar balik ke `'open'` |
| `notifyPlayers()` | Helper: hantar email ke semua community users tentang game baru |

---

### `CommunityAnnouncementController`

| Function | Fungsi |
|----------|--------|
| `index()` | Return semua pengumuman komuniti dengan nama author |
| `store()` | Cipta pengumuman baru (admin sahaja) |
| `destroy($id)` | Padam pengumuman (admin sahaja) |

---

## 7. Frontend — Pages & Components

### Layouts

| File | Fungsi |
|------|--------|
| `Layouts/DashboardLayout.jsx` | Layout utama untuk player dashboard. Mengandungi sidebar navigasi dengan SVG icons, player avatar, logout. Verify auth token on mount, redirect ke login jika tiada token atau pending/rejected. |
| `Layouts/CoachLayouts.jsx` | Layout untuk coach portal. Sidebar dengan navigasi khusus coach (squad, stats, schedule, payment, announcements). |

---

### Pages — Portal & Auth

| File | Fungsi |
|------|--------|
| `Pages/NuvraPortal.jsx` | Landing page utama NUVRA. Tunjuk hero section, dua portal card (Community & Club), stats count-up, feature sections (Community & Club), How It Works, CTA. |
| `Pages/Login.jsx` | Halaman login/register untuk player & coach. Toggle antara login dan register form. |
| `Pages/Authentication/AuthPage.jsx` | Auth page flow selepas Google OAuth. |
| `Pages/Authentication/GoogleCallback.jsx` | Handle redirect dari Google, extract token, redirect ke dashboard atau onboarding. |
| `Pages/Onboarding.jsx` | Form untuk pemain pilih pasukan (coach) dan posisi selepas Google login. Hantar ke `/api/player/onboarding`. |
| `Pages/WaitingRoom.jsx` | Halaman tunggu kelulusan jurulatih. Papar status `pending`. |

---

### Pages — Player Modules

| File | Fungsi |
|------|--------|
| `Pages/Modules/Overview.jsx` | Dashboard pemain. Tunjuk FIFA card, stats keseluruhan (gol, assist, minit, rating), performance history. |
| `Pages/Modules/PlayerShedule.jsx` | Jadual aktiviti pemain. Tunjuk tarikh latihan, perlawanan, mesyuarat dari jurulatih. |
| `Pages/Modules/PlayerPayment.jsx` | Sejarah dan status bayaran bulanan. Ada butang bayar yang redirect ke Billplz. |
| `Pages/Modules/Announcements.jsx` | Senarai pengumuman dari jurulatih. |
| `Pages/Modules/Settings.jsx` | Tetapan profil pemain. Boleh tukar nama, password, gambar profil. |

---

### Pages — Coach Modules

| File | Fungsi |
|------|--------|
| `Pages/CoachModules/SquadManagement.jsx` | Urus squad — lihat semua pemain, kemaskini jersey number, filter by position, lihat profil individu. |
| `Pages/CoachModules/RecordStats.jsx` | Form rekod stats perlawanan. Pilih pemain, masukkan match details, rekod gol/assist/rating/cleansheet. |
| `Pages/CoachModules/CoachSchedule.jsx` | Urus jadual dengan FullCalendar. Tambah/padam event (match, training, meeting). |
| `Pages/CoachModules/CoachPayment.jsx` | Lihat status bayaran semua pemain untuk bulan tertentu. |
| `Pages/CoachModules/CoachAnnouncements.jsx` | Buat dan lihat pengumuman kepada squad. |
| `Pages/CoachModules/PendingRequest.jsx` | Senarai permohonan pemain pending. Butang approve / decline. |
| `Pages/CoachAddStats.jsx` | Alternatif form untuk tambah stats. |
| `Pages/CoachPlayerView.jsx` | Pandangan jurulatih pada profil seseorang pemain (FIFA card + stats history). |

---

### Pages — Community

| File | Fungsi |
|------|--------|
| `Pages/Community/CommunityHome.jsx` | Halaman utama community. Navigation bar, papar game-game terbuka, link ke announcements. |
| `Pages/Community/CommunityFeed.jsx` | Feed aktiviti komuniti. |
| `Pages/Community/CommunityAnnouncements.jsx` | Senarai pengumuman komuniti. |
| `Pages/Community/GameDetail.jsx` | Detail satu game — venue, masa, roster Team A & Team B, butang Join/Leave. |
| `Pages/Community/Admin/CreateGame.jsx` | Form admin untuk cipta game baru (title, venue, date, team names, max slots). |
| `Pages/Community/Admin/PostAnnouncement.jsx` | Form admin untuk post pengumuman komuniti. |

---

### Components

| File | Fungsi |
|------|--------|
| `Components/ProtectedRoute.jsx` | Route guard — semak localStorage token, redirect ke login jika tiada. |
| `Components/DynamicBackground.jsx` | Ambient animated background (dua glow orbs). |
| `Components/PageLoader.jsx` | Loading screen dengan spinner semasa app load. |

---

## 8. Authentication System

NUVRA menggunakan **tiga sistem auth yang berbeza**:

### 1. Club Player Auth (Laravel Sanctum)
```
POST /api/login
  ← email + password
  → Bearer token (Sanctum personal_access_token)
  → Simpan dalam localStorage sebagai "auth_token"
  → Setiap request: Authorization: Bearer <token>
```

### 2. Coach Auth (Custom Token)
```
POST /api/coach/login
  ← email + password
  → Custom dummy token
  → Simpan dalam localStorage sebagai "coach_token"
  → Coach ID digunakan untuk semua API calls
```

### 3. Community Auth (Custom Remember Token)
```
POST /api/community/login
  ← email + password
  → Random string token simpan dalam community_users.remember_token
  → Return token kepada client
  → Simpan dalam localStorage sebagai "community_token"
  → Semak: cari user where remember_token = token dalam header
```

### 4. Google OAuth (Socialite)
```
GET /auth/google
  → Redirect ke Google consent page

GET /auth/google/callback
  → Terima data (name, email, google_id, avatar)
  → Cari atau cipta user dalam jadual `users`
  → Jika baru: redirect ke /onboarding
  → Jika sedia ada: redirect ke /dashboard
```

### Player Status Flow
```
Daftar → status: "pending"
          ↓
Coach review → approve → status: "active" → boleh login
               decline → status: "rejected" → diblok
```

---

## 9. Third-Party Integrations

### Billplz (Payment Gateway)
- **Sandbox URL**: `https://www.billplz-sandbox.com/api/v3`
- **Endpoint yang digunakan**: `POST /bills` (cipta bil), `GET /bills/{id}` (semak status)
- **Flow**:
  1. Player klik "Bayar" → frontend call `POST /api/payment/create-bill`
  2. Backend cipta bil di Billplz, return `url` pembayaran
  3. Player redirect ke Billplz untuk bayar
  4. Selepas bayar, frontend call `POST /api/payment/verify`
  5. Backend semak status dengan Billplz API, simpan ke `payments` table

### Google OAuth (Socialite)
- **Config**: `config/services.php` — `google.client_id`, `google.client_secret`, `google.redirect`
- **Scope**: email, profile (nama, gambar)
- **Flow**: Redirect → Consent → Callback → Create/Update user

### Laravel Mail (Email Notifications)
- Digunakan dalam `CommunityGameController::store()`
- Hantar email ke semua `community_users` apabila game baru dicipta
- **Content**: Title game, venue, tarikh, link untuk join

---

## 10. File Structure

```
nuvra-app/
│
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── PlayerController.php
│   │       ├── CoachController.php
│   │       ├── AuthController.php
│   │       ├── TeamController.php
│   │       ├── PerformanceController.php
│   │       ├── AnnouncementController.php
│   │       ├── ScheduleController.php
│   │       ├── PaymentControllerBillplz.php
│   │       ├── CommunityAuthController.php
│   │       ├── CommunityGameController.php
│   │       └── CommunityAnnouncementController.php
│   │
│   └── Models/
│       ├── User.php
│       └── Team.php
│
├── database/
│   └── migrations/
│       ├── create_users_table.php
│       ├── create_players_table.php
│       ├── create_coaches_table.php
│       ├── create_attributes_table.php
│       ├── create_matches_table.php
│       ├── create_performances_table.php
│       ├── create_announcements_table.php
│       ├── create_schedules_table.php
│       ├── create_payments_table.php
│       ├── create_teams_table.php
│       ├── create_community_users_table.php
│       ├── create_community_games_table.php
│       ├── create_community_bookings_table.php
│       └── create_community_announcements_table.php
│
├── routes/
│   ├── api.php          ← Semua API endpoints
│   └── web.php          ← SPA catch-all + Google OAuth routes
│
├── resources/
│   ├── css/
│   │   └── app.css      ← Design tokens, base styles
│   │
│   └── js/
│       ├── app.jsx       ← React entry point + Router setup
│       │
│       ├── Components/
│       │   ├── ProtectedRoute.jsx
│       │   ├── DynamicBackground.jsx
│       │   └── PageLoader.jsx
│       │
│       ├── Layouts/
│       │   ├── DashboardLayout.jsx   ← Player sidebar layout
│       │   └── CoachLayouts.jsx      ← Coach sidebar layout
│       │
│       └── Pages/
│           ├── NuvraPortal.jsx
│           ├── Login.jsx
│           ├── Onboarding.jsx
│           ├── WaitingRoom.jsx
│           ├── CoachAddStats.jsx
│           ├── CoachPlayerView.jsx
│           │
│           ├── Authentication/
│           │   ├── AuthPage.jsx
│           │   └── GoogleCallback.jsx
│           │
│           ├── Modules/              ← Player pages
│           │   ├── Overview.jsx
│           │   ├── PlayerShedule.jsx
│           │   ├── PlayerPayment.jsx
│           │   ├── Announcements.jsx
│           │   └── Settings.jsx
│           │
│           ├── CoachModules/         ← Coach pages
│           │   ├── SquadManagement.jsx
│           │   ├── RecordStats.jsx
│           │   ├── CoachSchedule.jsx
│           │   ├── CoachPayment.jsx
│           │   ├── CoachAnnouncements.jsx
│           │   └── PendingRequest.jsx
│           │
│           └── Community/            ← Community module
│               ├── CommunityHome.jsx
│               ├── CommunityFeed.jsx
│               ├── CommunityAnnouncements.jsx
│               ├── GameDetail.jsx
│               └── Admin/
│                   ├── CreateGame.jsx
│                   └── PostAnnouncement.jsx
│
├── public/
│   └── images/logoImage/NUVRA_LOGO.png
│
├── config/
│   └── services.php     ← Billplz & Google OAuth credentials
│
├── package.json
├── composer.json
├── tailwind.config.js
└── vite.config.js
```

---

*Document ini disediakan berdasarkan analisis penuh codebase NUVRA pada April 2026.*
*Untuk sebarang pertanyaan teknikal, rujuk fail controller atau migration yang berkaitan.*
