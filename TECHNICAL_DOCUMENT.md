# NUVRA — Technical Documentation
> Version 2.0 | April 2026

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

### Third-Party
| Servis | Kegunaan |
|--------|----------|
| **Billplz** | Payment gateway (monthly club fees) |
| **Google OAuth** | Social login untuk pemain |
| **Laravel Mail** | Email notifikasi untuk community games |
| **Laravel Storage** | Simpan resit bayaran & QR code images |

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


╔══════════════════════════════════════════════════════════════════╗
║                  COMMUNITY MODULE — ERD                          ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   ┌─────────┐    1       1 ┌──────────────────┐                 ║
║   │  users  │◀─────────────│ community_users  │                 ║
║   └─────────┘  user_id     └────────┬─────────┘                 ║
║   (Sanctum auth)                    │                            ║
║                                     │ 1                          ║
║                         ┌───────────┼───────────┐               ║
║                         ▼           ▼            ▼               ║
║                   ┌──────────┐  ┌──────────┐  ┌────────────┐   ║
║                   │ games    │  │ bookings │  │ announce-  │   ║
║                   │(as admin)│  │          │  │ ments      │   ║
║                   └────┬─────┘  └────┬─────┘  └────────────┘   ║
║                        │ 1           │                           ║
║                        │             │ N                         ║
║                        └──── 1 ◀─────┘                          ║
║                         game_id                                  ║
║                                                                  ║
║   community_bookings                                             ║
║   ├── game_id       ──▶ community_games                          ║
║   ├── community_user_id ──▶ community_users                      ║
║   ├── team_side     (team_a | team_b)                            ║
║   ├── status        (payment_submitted | confirmed | cancelled)  ║
║   └── receipt_path  (uploaded image)                             ║
╚══════════════════════════════════════════════════════════════════╝


╔══════════════════════════════════════════════════════════════════╗
║               CROSS-MODULE LINK — users table                    ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║              ┌──────────────────────────┐                        ║
║              │          users           │                        ║
║              │  (central auth table)    │                        ║
║              │  role: player            │                        ║
║              │        coach             │                        ║
║              │        community_player  │                        ║
║              │        community_admin   │                        ║
║              └──────┬──────┬───────┬───┘                        ║
║                     │      │       │                             ║
║              user_id│      │       │user_id                     ║
║                     ▼      ▼       ▼                             ║
║              ┌───────┐  ┌───────┐  ┌─────────────────┐         ║
║              │players│  │coaches│  │ community_users  │         ║
║              └───────┘  └───────┘  └─────────────────┘         ║
║                                                                  ║
║  Semua profil dikaitkan kepada users untuk Sanctum auth.         ║
╚══════════════════════════════════════════════════════════════════╝
```

---

### Table Structures

---

#### `users`
> Jadual auth pusat — semua pengguna (club & community) ada rekod di sini.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ role                │ enum          │ player | coach |                     │
│                     │               │ community_player | community_admin   │
│ name                │ string        │ Nama penuh                           │
│ email               │ string UNIQUE │ Emel login                           │
│ phone               │ string        │ nullable — Nombor telefon            │
│ email_verified_at   │ timestamp     │ nullable                             │
│ password            │ string        │ nullable — Hashed (null if Google)   │
│ google_id           │ string        │ nullable — Google OAuth ID           │
│ avatar              │ string        │ nullable — URL gambar (Google)       │
│ remember_token      │ string        │ nullable                             │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `coaches`
> Jurulatih yang mengurus squad.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ user_id             │ bigint FK     │ → users.id (cascade) nullable        │
│ name                │ string        │ Nama jurulatih                       │
│ email               │ string UNIQUE │ Emel login                           │
│ password            │ string        │ Hashed password                      │
│ team_name           │ string        │ Nama pasukan                         │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `players`
> Pemain berdaftar di bawah jurulatih.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ user_id             │ bigint FK     │ → users.id (cascade) nullable        │
│ coach_id            │ bigint FK     │ → coaches.id (cascade) nullable      │
│ name                │ string        │ Nama pemain                          │
│ email               │ string UNIQUE │ nullable — Emel login                │
│ password            │ string        │ Hashed password                      │
│ age                 │ integer       │ nullable                             │
│ date_of_birth       │ date          │ nullable                             │
│ address             │ text          │ nullable                             │
│ position            │ string        │ Striker, GK, Defender, dll           │
│ jersey_number       │ integer       │ nullable                             │
│ height_cm           │ integer       │ nullable                             │
│ weight_kg           │ integer       │ nullable                             │
│ strong_foot         │ enum          │ nullable — left | right | both       │
│ profile_image       │ string        │ nullable — Path gambar profil        │
│ photo_url           │ string        │ nullable — URL alternatif            │
│ status              │ string        │ pending | active | rejected          │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `attributes`
> FIFA-style stats — satu rekod per pemain (1:1 dengan players).

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ player_id           │ bigint FK     │ → players.id (cascade)               │
│ pace                │ integer       │ DEFAULT 50 — range 0–100             │
│ shooting            │ integer       │ DEFAULT 50                           │
│ passing             │ integer       │ DEFAULT 50                           │
│ dribbling           │ integer       │ DEFAULT 50                           │
│ defending           │ integer       │ DEFAULT 50                           │
│ physical            │ integer       │ DEFAULT 50                           │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `matches`
> Rekod perlawanan — dicipta oleh jurulatih.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ coach_id            │ bigint FK     │ → coaches.id (cascade)               │
│ opponent_name       │ string        │ Nama lawan                           │
│ match_date          │ date          │ Tarikh perlawanan                    │
│ match_time          │ time          │ nullable                             │
│ venue               │ string        │ DEFAULT 'Home'                       │
│ league_type         │ string        │ League | Friendly | Cup              │
│ category            │ string        │ nullable — Kategori umur/division    │
│ league_name         │ string        │ nullable                             │
│ event_name          │ string        │ nullable                             │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `performances`
> Stats seseorang pemain dalam satu perlawanan (player × match).

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ player_id           │ bigint FK     │ → players.id (cascade)               │
│ match_id            │ bigint FK     │ → matches.id (cascade)               │
│ minutes_played      │ integer       │ DEFAULT 0                            │
│ goals               │ integer       │ DEFAULT 0                            │
│ assists             │ integer       │ DEFAULT 0                            │
│ rating              │ decimal(3,1)  │ nullable — contoh: 8.5               │
│ cleansheet          │ boolean       │ DEFAULT false (untuk GK/DEF)         │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `announcements`
> Pengumuman daripada jurulatih kepada squad.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ coach_id            │ bigint FK     │ → coaches.id (cascade)               │
│ title               │ string        │ Tajuk pengumuman                     │
│ content             │ text          │ Isi kandungan                        │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `schedules`
> Jadual aktiviti pasukan (latihan, perlawanan, mesyuarat).

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ coach_id            │ bigint FK     │ → coaches.id (cascade)               │
│ title               │ string        │ Contoh: "vs Cyberjaya FC"            │
│ type                │ string        │ match | training | meeting           │
│ start_time          │ datetime      │ Masa mula                            │
│ end_time            │ datetime      │ nullable — Masa tamat                │
│ location            │ string        │ nullable — Lokasi                    │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `payments`
> Rekod bayaran bulanan pemain (via Billplz).

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ player_id           │ bigint FK     │ → players.id (cascade)               │
│ month_year          │ string        │ Contoh: "Feb 2026"                   │
│ amount              │ decimal(8,2)  │ Jumlah bayaran                       │
│ status              │ string        │ DEFAULT 'completed'                  │
│ transaction_id      │ string        │ nullable — ID transaksi Billplz      │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `teams`
> Maklumat pasukan/kelab.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ name                │ string        │ Nama pasukan                         │
│ slug                │ string UNIQUE │ nullable — URL-friendly name         │
│ based_location      │ string        │ nullable                             │
│ established_year    │ string        │ nullable                             │
│ logo                │ string        │ nullable — Path logo                 │
│ primary_color       │ string        │ DEFAULT '#000000'                    │
│ home_venue          │ string        │ nullable                             │
│ head_coach_id       │ bigint FK     │ → coaches.id (set null)              │
│ bio                 │ text          │ nullable                             │
│ social_link         │ string        │ nullable                             │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `community_users`
> Profil pengguna modul Community — dikaitkan kepada `users` untuk Sanctum auth.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ user_id             │ bigint FK     │ → users.id (cascade) nullable        │
│ name                │ string        │ Nama                                 │
│ email               │ string UNIQUE │ Emel                                 │
│ password            │ string        │ Hashed password                      │
│ role                │ enum          │ DEFAULT 'player' — player | admin    │
│ phone               │ string        │ nullable                             │
│ avatar              │ string        │ nullable                             │
│ remember_token      │ string        │ nullable                             │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `community_games`
> Game pickup yang dibuka oleh admin kepada orang awam.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ title               │ string        │ Tajuk game                           │
│ description         │ text          │ nullable                             │
│ venue               │ string        │ Lokasi                               │
│ game_date           │ datetime      │ Tarikh & masa game                   │
│ team_a_name         │ string        │ DEFAULT 'Team A'                     │
│ team_b_name         │ string        │ DEFAULT 'Team B'                     │
│ max_slots_per_team  │ unsigned int  │ DEFAULT 20 — Max pemain setiap team  │
│ price_per_player    │ decimal(8,2)  │ DEFAULT 0 — 0 = Free                 │
│ payment_qr_path     │ string        │ nullable — Path QR code image        │
│ status              │ enum          │ open | full | cancelled | completed  │
│ created_by          │ bigint FK     │ → community_users.id (cascade)       │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### `community_bookings`
> Rekod tempahan slot pemain — termasuk status bayaran dan resit.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ game_id             │ bigint FK     │ → community_games.id (cascade)       │
│ community_user_id   │ bigint FK     │ → community_users.id (cascade)       │
│ team_side           │ enum          │ team_a | team_b                      │
│ status              │ enum          │ payment_submitted | confirmed |       │
│                     │               │ cancelled                            │
│ receipt_path        │ string        │ nullable — Path resit pembayaran     │
│ —                   │ UNIQUE        │ (game_id, community_user_id)         │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

> **Booking Status Flow:**
> ```
> [FREE GAME]  JOIN click ──────────────────────────▶  confirmed
>
> [PAID GAME]  JOIN click + upload resit ──────────▶  payment_submitted
>                                                           │
>                                          ┌────────────────┤
>                                          ▼                ▼
>                                       confirmed        cancelled
>                                    (admin approve)  (admin reject)
> ```

---

#### `community_announcements`
> Pengumuman daripada admin kepada semua komuniti.

```
┌─────────────────────┬───────────────┬──────────────────────────────────────┐
│ Column              │ Type          │ Notes                                │
├─────────────────────┼───────────────┼──────────────────────────────────────┤
│ id                  │ bigint PK     │ Auto-increment                       │
│ title               │ string        │ Tajuk pengumuman                     │
│ body                │ text          │ Kandungan                            │
│ created_by          │ bigint FK     │ → community_users.id (cascade)       │
│ created_at          │ timestamp     │ —                                    │
│ updated_at          │ timestamp     │ —                                    │
└─────────────────────┴───────────────┴──────────────────────────────────────┘
```

---

#### Laravel System Tables
| Table | Kegunaan |
|-------|----------|
| `personal_access_tokens` | Sanctum Bearer tokens (semua modul) |
| `sessions` | Session management |
| `cache` | Application cache |
| `jobs` | Queue jobs |
| `password_reset_tokens` | Reset password flow |

---

## 5. API Routes

### Base URL: `/api`

#### Authentication & Player (Club)

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
| `GET` | `/coach/{id}/matches` | — | Senarai perlawanan |

#### Performance

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `POST` | `/performances` | — | Rekod stats pemain dalam perlawanan |

#### Payments — Club (Billplz)

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `POST` | `/payment/create-bill` | Sanctum | Cipta bil bayaran Billplz |
| `POST` | `/payment/verify` | Sanctum | Semak & sahkan status bayaran |

#### Community Auth

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `POST` | `/community/register` | — | Daftar akaun komuniti (cipta User + CommunityUser) |
| `POST` | `/community/login` | — | Login komuniti, return Sanctum token |
| `POST` | `/community/logout` | Sanctum | Logout, padam token |
| `GET` | `/community/me` | Sanctum | Dapatkan pengguna komuniti semasa |

#### Community Games

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `GET` | `/community/games` | — | Senarai semua game open/full (public) |
| `GET` | `/community/games/{id}` | — | Detail satu game + roster + QR URL |
| `POST` | `/community/games` | Admin | Cipta game baru + upload QR (FormData) |
| `PATCH` | `/community/games/{id}/cancel` | Admin | Batalkan game |
| `POST` | `/community/games/{id}/join` | Sanctum | Tempah slot — free (terus confirmed) atau paid (upload resit) |
| `DELETE` | `/community/games/{id}/leave` | Sanctum | Batalkan tempahan (free games sahaja) |
| `GET` | `/community/games/{id}/bookings` | Admin | Senarai semua bookings + receipt URLs |

#### Community Bookings — Payment Approval

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `PATCH` | `/community/bookings/{id}/approve` | Admin | Luluskan booking → status: confirmed |
| `PATCH` | `/community/bookings/{id}/reject` | Admin | Tolak booking → status: cancelled, slot freed |

#### Community Announcements

| Method | Endpoint | Auth | Fungsi |
|--------|----------|------|--------|
| `GET` | `/community/announcements` | Sanctum | Senarai semua pengumuman komuniti |
| `POST` | `/community/announcements` | Admin | Cipta pengumuman |
| `DELETE` | `/community/announcements/{id}` | Admin | Padam pengumuman |

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
| `index()` | Return senarai semua pemain |
| `store()` | Cipta rekod pemain baru |
| `show($id)` | Return profil pemain + attributes + performance history |
| `me()` | Identify pemain dari Bearer token → return profil lengkap |
| `update($id)` | Kemaskini nama / password / gambar profil |
| `updateAttributes($id)` | Kemaskini FIFA stats |
| `login()` | Semak email & password, return token |
| `register()` | Cipta user baru (untuk Google auth flow) |
| `submitApplication()` | Set coach_id, position, status pending |
| `getTeammates($id)` | Return semua pemain di bawah coach yang sama |
| `getTeams()` | Return senarai semua coaches & nama pasukan |
| `getCoachPlayers($coachId)` | Return semua pemain aktif di bawah coach |

---

### `CoachController`

| Function | Fungsi |
|----------|--------|
| `login()` | Authenticate jurulatih, return token |
| `getMyTeam($coachId)` | Return semua pemain aktif + attributes |
| `addPlayer()` | Tambah pemain terus ke squad (status: active) |
| `getPendingRequests($coachId)` | Return permohonan status pending |
| `handleRequest()` | approve/decline → kemaskini players.status |

---

### `AuthController`

| Function | Fungsi |
|----------|--------|
| `redirectToGoogle()` | Redirect user ke Google login via Socialite |
| `handleGoogleCallback()` | Terima data Google, cipta/kemaskini user, redirect ke onboarding atau dashboard |

---

### `TeamController`

| Function | Fungsi |
|----------|--------|
| `getCoachTeam($coachId)` | Return rekod team yang dikaitkan dengan coach |

---

### `PerformanceController`

| Function | Fungsi |
|----------|--------|
| `store()` | Cipta match (atau cari yang sedia ada), simpan performance stats. Semua dalam satu DB transaction. |

---

### `AnnouncementController`

| Function | Fungsi |
|----------|--------|
| `index($coachId)` | Return semua pengumuman untuk coach (terbaru dahulu) |
| `store()` | Simpan pengumuman baru |

---

### `ScheduleController`

| Function | Fungsi |
|----------|--------|
| `index($coachId)` | Return semua jadual untuk coach |
| `store()` | Cipta jadual baru |
| `destroy($id)` | Padam jadual |

---

### `PaymentControllerBillplz`

| Function | Fungsi |
|----------|--------|
| `createBill()` | Cipta bil Billplz (RM50 fixed), return URL pembayaran |
| `verifyPayment()` | Semak status bil dengan Billplz API, simpan ke payments |
| `getMyPayments($id)` | Return sejarah bayaran pemain |
| `getTeamPayments($coachId, $month)` | Return status bayaran squad untuk bulan tertentu |

---

### `CommunityAuthController`

| Function | Fungsi |
|----------|--------|
| `register()` | Cipta User (Sanctum) + CommunityUser profile. Return Sanctum token + community_users data (id, role) |
| `login()` | Auth via Laravel Auth, cipta Sanctum token. Fetch CommunityUser untuk return role dan community id yang betul |
| `logout()` | Padam Sanctum token semasa |
| `me()` | Return profil user semasa via $request->user() |

---

### `CommunityGameController`

| Function | Fungsi |
|----------|--------|
| `resolveUser()` | Helper — ambil CommunityUser profile dari Sanctum-authenticated user |
| `index()` | Return semua game open/full + slot counts + payment_qr_url |
| `show($id)` | Return detail game + roster (team_a, team_b) + booking_status setiap pemain |
| `store()` | Admin cipta game — accept FormData dengan price_per_player + QR image upload |
| `cancel($id)` | Admin batalkan game → status: cancelled |
| `join($id)` | Free game → confirmed terus. Paid game → wajib upload resit → payment_submitted. Slot dikira terus (payment_submitted + confirmed = locked) |
| `leave($id)` | Batalkan booking sendiri — hanya untuk free game (confirmed). Paid game tidak boleh self-cancel |
| `bookings($id)` | Admin — return semua bookings (payment_submitted + confirmed) dengan receipt_url |
| `approveBooking($bookingId)` | Admin luluskan → status: confirmed |
| `rejectBooking($bookingId)` | Admin tolak → status: cancelled, slot freed, game reopen jika perlu |

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
| `Layouts/DashboardLayout.jsx` | Layout player — sidebar navigasi, avatar, logout. Verify auth token on mount. |
| `Layouts/CoachLayouts.jsx` | Layout coach — sidebar navigasi khusus coach. |

---

### Pages — Portal & Auth

| File | Fungsi |
|------|--------|
| `Pages/NuvraPortal.jsx` | Landing page utama NUVRA. Hero section, dua portal card, stats, features, CTA. |
| `Pages/Login.jsx` | Login/register untuk player & coach. |
| `Pages/Authentication/AuthPage.jsx` | Auth flow selepas Google OAuth. |
| `Pages/Authentication/GoogleCallback.jsx` | Handle redirect Google, extract token, redirect ke dashboard atau onboarding. |
| `Pages/Onboarding.jsx` | Form pilih pasukan & posisi selepas Google login. |
| `Pages/WaitingRoom.jsx` | Halaman tunggu kelulusan jurulatih (status: pending). |

---

### Pages — Player Modules

| File | Fungsi |
|------|--------|
| `Pages/Modules/Overview.jsx` | Dashboard pemain — FIFA card, stats (gol, assist, minit, rating), performance history. |
| `Pages/Modules/PlayerShedule.jsx` | Jadual aktiviti — latihan, perlawanan, mesyuarat dari jurulatih. |
| `Pages/Modules/PlayerPayment.jsx` | Sejarah & status bayaran bulanan. Butang bayar redirect ke Billplz. |
| `Pages/Modules/Announcements.jsx` | Pengumuman dari jurulatih. |
| `Pages/Modules/Settings.jsx` | Tetapan profil — tukar nama, password, gambar. |

---

### Pages — Coach Modules

| File | Fungsi |
|------|--------|
| `Pages/CoachModules/SquadManagement.jsx` | Urus squad — lihat pemain, kemaskini jersey number, filter posisi. |
| `Pages/CoachModules/RecordStats.jsx` | Form rekod stats perlawanan — gol, assist, rating, cleansheet. |
| `Pages/CoachModules/CoachSchedule.jsx` | Urus jadual dengan FullCalendar. |
| `Pages/CoachModules/CoachPayment.jsx` | Status bayaran semua pemain untuk bulan tertentu. |
| `Pages/CoachModules/CoachAnnouncements.jsx` | Buat dan lihat pengumuman kepada squad. |
| `Pages/CoachModules/PendingRequest.jsx` | Permohonan pemain pending — approve / decline. |
| `Pages/CoachAddStats.jsx` | Alternatif form tambah stats. |
| `Pages/CoachPlayerView.jsx` | Pandangan coach pada profil pemain (FIFA card + stats history). |

---

### Pages — Community

| File | Fungsi |
|------|--------|
| `Pages/Community/CommunityHome.jsx` | Login/register page untuk community portal. |
| `Pages/Community/CommunityFeed.jsx` | Feed — senarai game open, card setiap game dengan slot counts. |
| `Pages/Community/CommunityAnnouncements.jsx` | Senarai pengumuman komuniti. |
| `Pages/Community/GameDetail.jsx` | Detail game — venue, masa, price badge, seat grid, PaymentModal (paid games), booking status banner, AdminBookingsPanel (admin). |
| `Pages/Community/Admin/CreateGame.jsx` | Admin form cipta game — title, venue, date, team names, max slots, price per player, QR code upload. |
| `Pages/Community/Admin/PostAnnouncement.jsx` | Admin form post pengumuman komuniti. |

---

### Components

| File | Fungsi |
|------|--------|
| `Components/ProtectedRoute.jsx` | Route guard — semak localStorage token, redirect ke login jika tiada. |
| `Components/DynamicBackground.jsx` | Animated ambient background (glow orbs). |
| `Components/PageLoader.jsx` | Loading screen semasa page load. |

---

### Key Inline Components (dalam GameDetail.jsx)

| Component | Fungsi |
|-----------|--------|
| `PaymentModal` | Modal untuk join game berbayar — tunjuk QR, jumlah, mandatory receipt upload |
| `SlotVisual` | Seat grid visual — tunjuk slot penuh/kosong, progress bar, butang join |
| `AdminBookingsPanel` | Admin panel — senarai bookings mengikut status (payment_submitted, confirmed), butang approve/reject, link ke resit |

---

## 8. Authentication System

NUVRA menggunakan **Sanctum sebagai auth engine** untuk semua modul, dengan profil berasingan:

```
┌─────────────────────────────────────────────────────────────┐
│                    SANCTUM (users table)                     │
│             personal_access_tokens                          │
└─────────┬───────────────────────┬───────────────────────────┘
          │                       │
          ▼                       ▼
   ┌──────────────┐        ┌─────────────────┐
   │   Club Auth  │        │ Community Auth  │
   │              │        │                 │
   │ players      │        │ community_users │
   │ coaches      │        │ (role:          │
   │              │        │  player/admin)  │
   └──────────────┘        └─────────────────┘
```

### 1. Club Player Auth
```
POST /api/login
  ← email + password (players atau coaches table)
  → Bearer token (Sanctum)
  → Simpan: localStorage "auth_token"
```

### 2. Coach Auth
```
POST /api/coach/login
  ← email + password
  → Token
  → Simpan: localStorage "coach_token"
```

### 3. Community Auth (Sanctum)
```
POST /api/community/login
  ← email + password
  → Sanctum token (via User model)
  → Fetch community_users profile → return community id & role
  → Simpan: localStorage "community_token" + "community_user"

Setiap request:
  Authorization: Bearer <community_token>
  → auth:sanctum middleware verify
  → resolveUser() fetch community_users by user_id
```

### 4. Google OAuth (Socialite)
```
GET /auth/google → Google consent page
GET /auth/google/callback
  → Terima: name, email, google_id, avatar
  → findOrCreate user dalam users table
  → Jika baru: redirect /onboarding
  → Jika sedia ada: redirect /dashboard
```

### Player Status Flow (Club)
```
Daftar → status: "pending"
    ↓
Coach review
    ├── approve → status: "active"  → boleh login
    └── decline → status: "rejected" → diblok
```

---

## 9. Payment Flows

### Community Game Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAID GAME FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Player klik JOIN TEAM                                          │
│         │                                                       │
│         ▼                                                       │
│  PaymentModal terbuka                                           │
│  ├── Tunjuk QR code (DuitNow/bank)                             │
│  ├── Tunjuk jumlah: RM X.XX                                    │
│  └── Upload resit (mandatory)                                  │
│         │                                                       │
│         ▼                                                       │
│  POST /games/{id}/join (FormData: team_side + receipt)         │
│         │                                                       │
│         ▼                                                       │
│  Booking dicipta: status = payment_submitted                   │
│  Slot DIKIRA terus (slot locked)                               │
│  Resit disimpan: storage/public/receipts/                      │
│         │                                                       │
│         ▼                                                       │
│  Player nampak: "Receipt submitted. Awaiting admin approval."  │
│                                                                 │
│         ┌───────────── Admin review ─────────────────┐         │
│         │                                            │         │
│         ▼                                            ▼         │
│  PATCH /bookings/{id}/approve           PATCH /bookings/{id}/reject
│         │                                            │         │
│         ▼                                            ▼         │
│  status: confirmed                        status: cancelled    │
│  Player: "You're in!"                     Slot freed           │
│                                           Game reopen jika full│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FREE GAME FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│  Player klik JOIN → Slot confirmed terus. Tiada modal.         │
│  Player boleh cancel sendiri (DELETE /games/{id}/leave).       │
└─────────────────────────────────────────────────────────────────┘
```

### Club Monthly Payment Flow (Billplz)

```
Player klik "Bayar"
    │
    ▼
POST /api/payment/create-bill
    │ (RM 50 fixed)
    ▼
Billplz API: cipta bil → return payment URL
    │
    ▼
Player redirect ke Billplz → buat bayaran
    │
    ▼
POST /api/payment/verify
    │
    ▼
Semak Billplz API → simpan ke payments table
    │
    ▼
Player: payment history dikemaskini
```

---

## 10. Third-Party Integrations

### Billplz (Club Payment Gateway)
- **Sandbox URL**: `https://www.billplz-sandbox.com/api/v3`
- **Endpoints**: `POST /bills` (cipta bil), `GET /bills/{id}` (semak status)
- **Config**: `.env` — `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`

### Google OAuth (Socialite)
- **Config**: `config/services.php` — `google.client_id`, `google.client_secret`, `google.redirect`
- **Scope**: email, profile (nama, gambar)

### Laravel Storage (File Uploads)
- **Community QR codes**: `storage/app/public/payment-qr/`
- **Community receipts**: `storage/app/public/receipts/`
- **Served via**: `public/storage` symlink (`php artisan storage:link`)

### Laravel Mail (Email Notifications)
- Digunakan dalam `CommunityGameController::store()` (sedia ada, currently disabled)
- Hantar email ke semua `community_users` bila game baru dicipta

---

## 11. File Structure

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
│       ├── CommunityUser.php
│       └── Team.php
│
├── database/
│   └── migrations/
│       ├── 0001_01_01_000000_create_users_table.php
│       ├── create_players_table.php
│       ├── create_coaches_table.php
│       ├── create_attributes_table.php
│       ├── create_matches_table.php
│       ├── create_performances_table.php
│       ├── create_announcements_table.php
│       ├── create_schedules_table.php
│       ├── create_payments_table.php
│       ├── create_teams_table.php
│       ├── add_google_fields_to_users_table.php
│       ├── add_role_to_users_table.php          ← role enum + phone
│       ├── link_profiles_to_users_table.php     ← user_id FK ke players, coaches, community_users
│       ├── create_community_users_table.php
│       ├── create_community_games_table.php
│       ├── create_community_bookings_table.php
│       ├── create_community_announcements_table.php
│       ├── add_payment_fields_to_community_games.php     ← price_per_player, payment_qr_path
│       └── add_payment_fields_to_community_bookings.php  ← receipt_path, status expanded
│
├── routes/
│   ├── api.php          ← Semua API endpoints
│   └── web.php          ← SPA catch-all + Google OAuth
│
├── storage/
│   └── app/public/
│       ├── receipts/    ← Resit bayaran community (uploaded by players)
│       └── payment-qr/  ← QR code images (uploaded by admin per game)
│
├── resources/
│   ├── css/
│   │   └── app.css
│   │
│   └── js/
│       ├── app.jsx
│       │
│       ├── Components/
│       │   ├── ProtectedRoute.jsx
│       │   ├── DynamicBackground.jsx
│       │   └── PageLoader.jsx
│       │
│       ├── Layouts/
│       │   ├── DashboardLayout.jsx
│       │   └── CoachLayouts.jsx
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
│           ├── Modules/                 ← Player pages
│           │   ├── Overview.jsx
│           │   ├── PlayerShedule.jsx
│           │   ├── PlayerPayment.jsx
│           │   ├── Announcements.jsx
│           │   └── Settings.jsx
│           │
│           ├── CoachModules/            ← Coach pages
│           │   ├── SquadManagement.jsx
│           │   ├── RecordStats.jsx
│           │   ├── CoachSchedule.jsx
│           │   ├── CoachPayment.jsx
│           │   ├── CoachAnnouncements.jsx
│           │   └── PendingRequest.jsx
│           │
│           └── Community/               ← Community module
│               ├── CommunityHome.jsx    ← Login/register
│               ├── CommunityFeed.jsx    ← Game listing
│               ├── CommunityAnnouncements.jsx
│               ├── GameDetail.jsx       ← Seat grid, PaymentModal, AdminBookingsPanel
│               └── Admin/
│                   ├── CreateGame.jsx   ← Price + QR upload
│                   └── PostAnnouncement.jsx
│
├── public/
│   ├── storage → ../storage/app/public  ← Symlink untuk file uploads
│   └── images/logoImage/NUVRA_LOGO.png
│
├── config/
│   └── services.php     ← Billplz & Google OAuth credentials
│
├── .env                 ← Credentials (tidak di-commit)
├── package.json
├── composer.json
├── tailwind.config.js
└── vite.config.js
```

---

*Document ini dikemaskini berdasarkan analisis penuh codebase NUVRA — April 2026 (v2.0).*
*Merangkumi: payment flow baru untuk Community module, Sanctum auth fix, database schema terkini.*
