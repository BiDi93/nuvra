# NUVRA — Technical Documentation
> Version 2.1 | April 28, 2026

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
9. [Payment Flows](#9-payment-flows)
10. [Third-Party Integrations](#10-third-party-integrations)
11. [File Structure](#11-file-structure)

---

## 1. System Overview

NUVRA adalah platform pengurusan sukan bola sepak yang terdiri daripada **dua modul utama**:

| Modul | Pengguna | Fungsi |
|-------|----------|--------|
| **Nuvra Club** | Pemain & Jurulatih | Pengurusan squad, rekod prestasi, jadual, bayaran, pengumuman |
| **Nuvra Community** | Orang awam | Daftar untuk pickup game, tempah slot, buat bayaran, ikuti pengumuman komuniti |

### User Roles

| Role | Modul | Akses |
|------|-------|-------|
| `coach` | Club | Urus squad, rekod stats, luluskan pemain, post pengumuman, lihat bayaran |
| `player` | Club | Lihat profil, stats, jadual, buat bayaran, lihat rakan sepasukan |
| `community_admin` | Community | Cipta game, set harga, upload QR bayaran, approve/reject bookings, post pengumuman |
| `community_player` | Community | Daftar game, pilih team, upload resit bayaran, lihat status booking |

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
| React Hot Toast | — | Toast notifications |

---

## 3. Application Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      BROWSER (React SPA)                     │
│                                                              │
│   NuvraPortal ──┬──▶ Club Portal (Login → Dashboard)        │
│                 └──▶ Community Portal (/community/...)       │
└───────────────────────────┬──────────────────────────────────┘
                            │  HTTP / API calls
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      LARAVEL BACKEND                         │
│                                                              │
│  routes/web.php  ──▶  SPA catch-all + Google OAuth          │
│  routes/api.php  ──▶  REST API Endpoints                    │
│                                                              │
│  Controllers:                                                │
│  ├─ Club:      PlayerController, CoachController             │
│  │             AuthController, TeamController                │
│  │             PerformanceController, AnnouncementController │
│  │             ScheduleController, PaymentControllerBillplz  │
│  │                                                           │
│  └─ Community: CommunityAuthController                       │
│                CommunityGameController                       │
│                CommunityAnnouncementController               │
└───────────────────────────┬──────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
   ┌────────────────────┐   ┌──────────────────────────┐
   │   CLUB DATABASE    │   │   COMMUNITY DATABASE     │
   │                    │   │                          │
   │  users             │   │  community_users         │
   │  coaches           │   │  community_games         │
   │  players           │   │  community_bookings      │
   │  attributes        │   │  community_announcements │
   │  matches           │   └──────────────────────────┘
   │  performances      │
   │  payments          │   ┌──────────────────────────┐
   │  announcements     │   │   FILE STORAGE           │
   │  schedules         │   │  storage/public/receipts │
   │  teams             │   │  storage/public/payment-qr│
   └────────────────────┘   └──────────────────────────┘
```

---

## 4. Database Design

### Entity Relationship Diagram

```
╔══════════════════════════════════════════════════════════════════╗
║                    CLUB MODULE — ERD                             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   ┌─────────┐    1      N ┌──────────┐   N      1 ┌──────────┐ ║
║   │  users  │────────────▶│ players  │────────────▶│ coaches  │ ║
║   └─────────┘  user_id    └────┬─────┘  coach_id   └────┬─────┘ ║
║        │                      │                         │       ║
║        │               1 ◀────┘                     1 ◀─┘       ║
║        │          ┌──────────────┐              ┌──────────────┐ ║
║        │          │  attributes  │              │    teams     │ ║
║        │          │  (1 : 1)     │              │ (head_coach) │ ║
║        │          └──────────────┘              └──────────────┘ ║
║        │                                                         ║
║        └── (via user_id) ──────────────────────────────┐        ║
║                                                         ▼        ║
║   coaches ─────────────────────────────────────── coaches        ║
║      │                                              (user_id)    ║
║      │ 1                                                         ║
║      ├─── N ┌──────────────────┐                                 ║
║      │      │  announcements   │                                 ║
║      │      └──────────────────┘                                 ║
║      │                                                           ║
║      ├─── N ┌──────────────────┐                                 ║
║      │      │    schedules     │                                 ║
║      │      └──────────────────┘                                 ║
║      │                                                           ║
║      └─── N ┌──────────────────┐                                 ║
║             │     matches      │                                 ║
║             └────────┬─────────┘                                 ║
║                      │ 1                                         ║
║                      │                                           ║
║   players ──── N ────┤                                           ║
║      │               │                                           ║
║      └───────── N ───▼─────────                                  ║
║                 ┌──────────────┐                                 ║
║                 │ performances │ (player × match)                ║
║                 └──────────────┘                                 ║
║                                                                  ║
║   players ────── N ┌──────────┐                                  ║
║                    │ payments │                                  ║
║                    └──────────┘                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

### Table Schemas

#### `users`
> Central authentication table for all modules.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | — |
| `name` | string | Full name |
| `email` | string | Unique email |
| `password` | string | Hashed |
| `google_id` | string | nullable — Google OAuth ID |
| `avatar` | string | nullable — URL |
| `role` | string | `coach`, `player`, `community_admin`, `community_player` |
| `created_at` | timestamp | — |

---

#### `players`
> Club module — Player profiles.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | — |
| `user_id` | bigint FK | → `users.id` (cascade) |
| `coach_id` | bigint FK | → `coaches.id` (set null) |
| `name` | string | — |
| `email` | string | Unique |
| `date_of_birth`| date | nullable |
| `position` | string | e.g. "ST", "CM" |
| `jersey_number`| integer | nullable |
| `height_cm` | integer | nullable |
| `weight_kg` | integer | nullable |
| `strong_foot` | string | `left`, `right`, `both` |
| `status` | string | `pending`, `active`, `rejected` |
| `profile_image`| string | nullable — Image path |
| `created_at` | timestamp | — |

---

#### `coaches`
> Club module — Coach profiles.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | — |
| `user_id` | bigint FK | → `users.id` (cascade) |
| `name` | string | — |
| `email` | string | Unique |
| `team_name` | string | Main team name |
| `created_at` | timestamp | — |

---

#### `attributes`
> Player FIFA-style attributes (1-99).

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | — |
| `player_id` | bigint FK | → `players.id` (cascade) |
| `pace` | integer | DEFAULT 50 |
| `shooting` | integer | DEFAULT 50 |
| `passing` | integer | DEFAULT 50 |
| `dribbling` | integer | DEFAULT 50 |
| `defending` | integer | DEFAULT 50 |
| `physical` | integer | DEFAULT 50 |

---

#### `matches`
> Recorded matches created by coaches.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | — |
| `coach_id` | bigint FK | → `coaches.id` |
| `opponent_name`| string | — |
| `match_date` | date | — |
| `venue` | string | nullable |
| `league_name` | string | nullable |
| `category` | string | nullable |
| `event_name` | string | nullable |

---

#### `performances`
> Individual player stats per match.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | — |
| `player_id` | bigint FK | → `players.id` (cascade) |
| `match_id` | bigint FK | → `matches.id` (cascade) |
| `goals` | integer | DEFAULT 0 |
| `assists` | integer | DEFAULT 0 |
| `minutes_played`| integer | DEFAULT 0 |
| `rating` | decimal(3,1) | 0.0 - 10.0 |
| `cleansheet` | boolean | DEFAULT false |

---

#### `community_games`
> Pickup games opened to public.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | — |
| `title` | string | — |
| `venue` | string | — |
| `game_date` | datetime | — |
| `team_a_name` | string | DEFAULT 'Team A' |
| `team_b_name` | string | DEFAULT 'Team B' |
| `max_slots_per_team` | uint | DEFAULT 20 |
| `price_per_player` | decimal | DEFAULT 0 |
| `payment_qr_path` | string | nullable |
| `status` | enum | `open`, `full`, `cancelled`, `completed` |
| `created_by` | bigint FK | → `community_users.id` |

---

## 5. API Routes

### Base URL: `/api`

#### Club Module (Player & Coach)

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `POST` | `/login` | — | Login unified |
| `POST` | `/register` | — | Daftar akaun baharu |
| `POST` | `/player/onboarding`| — | Hantar permohonan sertai pasukan |
| `GET` | `/player/me` | Sanctum | Dapatkan profil penuh pemain login |
| `GET` | `/players/{id}` | Sanctum | Profil pemain + stats + attributes |
| `POST` | `/player/{id}/update`| Sanctum | Kemaskini profil (nama, password, gambar) |
| `POST` | `/player/{id}/attributes` | Coach | Kemaskini FIFA attributes |
| `GET` | `/players/{id}/teammates` | Sanctum | Dapatkan rakan sepasukan |
| `GET` | `/coach/{id}/players`| Coach | Senarai pemain aktif (squad) |
| `GET` | `/coach/{id}/requests`| Coach | Senarai permohonan pending |
| `POST` | `/performances` | Coach | Rekod stats perlawanan |
| `GET` | `/teams` | — | Senarai semua pasukan/coach sedia ada |

#### Community Module

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `POST` | `/community/login` | — | Login komuniti |
| `GET` | `/community/games` | — | Senarai game open/full |
| `POST` | `/community/games/{id}/join` | Sanctum | Tempah slot (paid/free) |
| `PATCH` | `/community/bookings/{id}/approve` | Admin | Luluskan bayaran resit |

---

## 6. Backend — Controllers & Functions

### `PlayerController`
- `me()`: Fetch profile via `user_id` or `email`.
- `show($id)`: Detailed profile with match history and attributes.
- `update()`: Profile edits (name, image, password).
- `getTeammates()`: List players under the same coach.
- `submitApplication()`: Create `pending` player record.

### `CoachController`
- `login()`: Authenticate coach via unified `users` table.
- `getMyTeam($coachId)`: Get all `active` players for a coach.
- `addPlayer()`: Direct add player to squad (status: `active`).
- `handleRequest()`: Approve/Decline pending applications.

### `CommunityGameController`
- `index()`: Public listing of active games.
- `join()`: Handles logic for free vs paid games (receipt upload).
- `bookings()`: Admin view of all participants and receipts.
- `approveBooking()` / `rejectBooking()`: Payment verification logic.

---

## 7. Frontend — Pages & Components

### Layouts
- `DashboardLayout.jsx`: Player navigation and auth check.
- `CoachLayouts.jsx`: Coach-specific navigation.
- `CommunityLayout.jsx`: Layout for community portal.

### Key Pages
- `NuvraPortal.jsx`: Main entry point / landing page.
- `Overview.jsx`: Player dashboard with FIFA card and charts.
- `SquadManagement.jsx`: Coach view to manage player roster.
- `GameDetail.jsx`: Interactive seat grid and payment modal for community games.

---

## 8. Authentication System

NUVRA uses **Laravel Sanctum** for all API authentication.
- **Unified Users**: All roles (coach, player, admin) exist in the `users` table.
- **Role-Based Access**: Middleware checks `user.role` to protect specific routes.
- **Social Auth**: Laravel Socialite handles Google OAuth login, automatically linking to the `users` table.

---

## 9. Payment Flows

### Community Paid Games
1. Player joins a paid game.
2. `PaymentModal` displays Admin's QR code.
3. Player uploads receipt image.
4. Booking created with `payment_submitted` status.
5. Admin reviews and approves -> Status becomes `confirmed`.

### Club Monthly Fees
- Handled via **Billplz** integration.
- `createBill` generates a unique payment URL.
- `verifyPayment` updates the `payments` table upon success.

---

## 10. Third-Party Integrations

### Billplz (Club Payments)
- **Config**: `config/services.php`
- **Keys**: `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_SANDBOX`
- **Flow**: `createBill()` -> Redirect -> `verifyPayment()` (Callback/Redirect)

### Google OAuth (Socialite)
- **Config**: `config/services.php`
- **Flow**: Redirect to Google -> Handle Callback -> findOrCreate User -> Onboarding/Dashboard.

---

## 11. File Structure (Key Files)

```
app/
├── Http/Controllers/
│   ├── PlayerController.php
│   ├── CoachController.php
│   ├── CommunityGameController.php
│   ├── PaymentControllerBillplz.php
│   └── ...
└── Models/
    ├── User.php
    ├── Player.php
    ├── Coach.php
    ├── Attribute.php
    ├── FootballMatch.php
    ├── Performance.php
    ├── Team.php
    └── CommunityUser.php

database/migrations/
├── 0001_01_01_000000_create_users_table.php
├── 2026_01_05_030830_create_players_table.php
├── 2026_01_07_174151_create_coaches_tables.php
├── 2026_04_02_150200_create_community_games_table.php
└── ...
```

---
*Dokumen dikemaskini: 28 April 2026. Menyelaraskan skema pangkalan data terkini dan integrasi unified auth.*
