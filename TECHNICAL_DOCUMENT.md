# NUVRA — Technical Documentation
> Version 3.2 | June 6, 2026 (Payment Approval Flow & Route Cleanup)

---

## 1. System Philosophy: Unified Community Model

NUVRA has transitioned from a hierarchical "Club/Coach" management system to a flat **Unified Community Model**. The system philosophy now prioritizes public accessibility, pickup game discovery, and social performance tracking.

### Core Architectural Shift
- **Legacy:** Required `Coach` and `Player` profiles linked to specific `Teams`. Matches were internal to clubs.
- **Active:** Any `User` can be a `club_owner` (organizer) or a `player`. Matches (stored in `matches` table) are open to the public via a slot-based registration system with a receipt-based payment approval flow.

---

## 2. User Roles & Authentication

### Unified Users Table (`users`)
All identities are now stored in the central `users` table, distinguished by the `role` attribute.

| Role | Responsibility |
|------|----------------|
| `club_owner` | Organizes games, sets pricing, manages QR codes for payment, and approves/rejects bookings. |
| `player` / `community_player` | Joins games, uploads payment receipts, and tracks performance stats. |
| `coach` | (Legacy) Previously managed club squads; deprecated and no longer routed. |

**Authentication:**
- Powered by **Laravel Sanctum** (token-based, used by the React SPA).
- **Google OAuth** (Socialite) is the primary onboarding flow for community players, automatically creating records in the `users` table (`CommunityAuthController`).
- Password reset is handled by `NewPasswordController` (`/api/forgot-password`, `/api/reset-password`).

---

## 3. Core Data Entities (Active Schema)

> **Database engine:** SQLite (`nuvra_db`). Note that SQLite cannot `ALTER` a `CHECK` constraint, so enum changes are applied by rebuilding the table (see migration `2026_06_06_234203`).

### `matches` (via `FootballMatch` Model)
The central entity for all events. Restructured in migration `2026_05_20`.
- **Ownership:** `club_owner_id` (FK to `users.id`).
- **Logistics:** `price`, `total_slots`, `venue`, `match_date`, `match_time`.
- **Customization:** `title`, `description`, `team_a_name`, `team_b_name` (team names nullable as of `2026_05_23`).
- **Lifecycle:** Status enum (`open`, `full`, `cancelled`, `completed`).

### `match_player` (Pivot Table)
Manages the many-to-many relationship between `users` and `matches`, including the full payment lifecycle.
- **Tracking:** `user_id`, `match_id`.
- **Status enum** (expanded `2026_06_06`): `pending` → `awaiting_approval` → `confirmed` / `rejected`, plus `cancelled`.
- **Payment fields** (added `2026_06_06`): `payment_receipt` (uploaded receipt path), `paid_at` (timestamp).
- **Validation:** Only `confirmed` players count towards the `total_slots` limit.

### `performances` (Player Statistics)
Linked to the unified identity.
- **Linkage:** Uses `user_id` (replacing the legacy `player_id`).
- **Metrics:** `goals`, `assists`, `rating`, `cleansheet`, `minutes_played`.

### Payment Approval Flow
1. **Join** (`POST /games/{id}/join`) — creates a `match_player` row in `pending`.
2. **Upload receipt** (`POST /games/{id}/receipt`) — stores the receipt, sets `paid_at`, moves status to `awaiting_approval`.
3. **Owner decision** — `PATCH /bookings/{id}/approve` → `confirmed` (counts toward slots) or `PATCH /bookings/{id}/reject` → `rejected`.

Booking lists (`GET /games/{id}/bookings`) are sorted so `awaiting_approval` rows surface first for the organizer.

---

## 4. Backend Architecture

### Key Controllers
- **`CommunityGameController`**: Game discovery, slot registration, receipt upload, booking approval/rejection, member directory, and profile/avatar/stats aggregation.
- **`CommunityAuthController`**: Unified registration, login/logout, `me`, and Google OAuth callback logic.
- **`CommunityAnnouncementController`**: Community announcements (index/store/destroy).
- **`CommunityAnalyticsController`**: Aggregated analytics for organizers.
- **`NewPasswordController`**: Password reset.

### Active API Routes
The route file (`routes/api.php`) was cleaned up on **June 6, 2026** to remove all legacy Club/Coach/Player portal routes (which referenced deleted controllers and broke `php artisan route:list`). Only the routes below remain.

**Auth / utility**

| Endpoint | Description |
|----------|-------------|
| `POST /api/forgot-password` | Request a password reset. |
| `POST /api/reset-password` | Complete a password reset. |
| `GET /api/user` | Authenticated user info (Sanctum). |

**Community (`/api/community/*`)**

| Endpoint | Description |
|----------|-------------|
| `POST /register`, `POST /login` | Unified auth (also `/logout`, `/me` when authenticated). |
| `GET /games`, `GET /games/{id}` | Public game discovery with real-time slot counts. |
| `POST /games` | Create a game (organizer). |
| `PATCH /games/{id}/cancel` | Cancel a game. |
| `POST /games/{id}/join` | Reserve a slot (status `pending`). |
| `POST /games/{id}/receipt` | Upload payment receipt (status → `awaiting_approval`). |
| `DELETE /games/{id}/leave` | Withdraw from a game. |
| `GET /games/{id}/bookings` | Organizer view of all bookings. |
| `PATCH /bookings/{id}/approve` / `reject` | Organizer confirms or rejects a booking. |
| `GET /profile`, `POST /profile/avatar` | Own profile stats + avatar upload. |
| `GET /members`, `GET /members/{id}` | Member directory + public player profile. |
| `GET /announcements`, `POST /announcements`, `DELETE /announcements/{id}` | Announcements. |
| `GET /analytics` | Organizer analytics. |

---

## 5. Frontend Architecture (React SPA)

### Routing & Redirection (`app.jsx`)
- **Redirection:** Legacy routes `/dashboard/*` and `/coach-dashboard/*` are intercepted and redirected to `/community/feed` via `<Navigate />`.
- **Primary Layout:** `CommunityLayout.jsx` provides the navigation shell (Sidebar/Header) for all community views.

### Key Pages (`resources/js/Pages/Community/`)
- **`CommunityFeed`** — game discovery feed.
- **`GameDetail`** — game info, join/receipt-upload, and (for organizers) the bookings approval panel.
- **`PlayerProfile`** — own profile with stats and avatar upload.
- **`PublicPlayerProfile`** — public stats view for `/community/members/:id`.
- **`CommunityMembers`** — member directory.
- **`CommunityAnnouncements`** — announcement feed.
- **Admin** (`Community/Admin/`) — `CreateGame`, `PostAnnouncement`, `Analytics`.

### Design System: "Athletic Minimal"
- **Styling:** Primarily custom CSS-in-JS (localized `styles` objects) with a move towards Tailwind CSS.
- **Visuals:** Glassmorphism (`glass-panel`), high-contrast gradients (Cyan/Magenta), dark mode backgrounds.
- **Responsiveness:** Mobile-responsive layouts and profile picture upload added (June 2026).

---

## 6. Deprecated Legacy Components

Treat the following as **Legacy** — not used for new feature development, and in several cases now fully removed from routing:

- **Controllers removed from disk:** `PlayerController.php`, `PaymentController.php` (only `PaymentControllerBillplz.php` survives).
- **Controllers orphaned (files linger, no routes):** `CoachController.php`, `TeamController.php`, `PerformanceController.php`, `ScheduleController.php`, `AnnouncementController.php`, `PaymentControllerBillplz.php`.
- **Models:** `Player.php`, `Coach.php`, `Team.php`, `CommunityUser.php`.
- **Tables:** `community_games`, `community_bookings`, `community_users` (replaced by unified `matches` / `match_player` / `users`).

---

## 7. Technical Debt & Future Verification
- **Orphaned controllers/models:** Several legacy controller and model files remain on disk as dead code despite having no routes; candidates for deletion.
- **Performance recording:** `performances` writes are no longer routed via `PerformanceController`; a unified write path under the community model is still pending.
- **Data integrity:** Ensure historical `performances` are mapped from legacy `player_id` to `user_id`.
- **Test alignment:** Tests referencing legacy tables (`CommunityTest.php`) must be updated to the unified schema.
- **Style standardization:** Transition localized style objects to global Tailwind CSS classes for consistency.

---
*Document updated and verified: June 6, 2026.*
