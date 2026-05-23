# NUVRA — Technical Documentation
> Version 3.1 | May 24, 2026 (Comprehensive Revamp)

---

## 1. System Philosophy: Unified Community Model

NUVRA has transitioned from a hierarchical "Club/Coach" management system to a flat **Unified Community Model**. The system philosophy now prioritizes public accessibility, pickup game discovery, and social performance tracking.

### Core Architectural Shift
- **Legacy:** Required `Coach` and `Player` profiles linked to specific `Teams`. Matches were internal to clubs.
- **Active:** Any `User` can be a `club_owner` (organizer) or a `player`. Matches (stored in `matches` table) are open to the public via a slot-based registration system.

---

## 2. User Roles & Authentication

### Unified Users Table (`users`)
All identities are now stored in the central `users` table, distinguished by the `role` attribute.

| Role | Responsibility |
|------|----------------|
| `club_owner` | Organizes games, sets pricing, manages QR codes for payment, and confirms bookings. |
| `player` / `community_player` | Joins games, uploads payment receipts, and tracks performance stats. |
| `coach` | (Legacy) Previously managed club squads; now largely deprecated in the primary user flow. |

**Authentication:** 
- Powered by **Laravel Sanctum**.
- **Google OAuth** (Socialite) is the primary onboarding flow for community players, automatically creating records in the `users` table.

---

## 3. Core Data Entities (Active Schema)

### `matches` (via `FootballMatch` Model)
The central entity for all events. Restructured in migration `2026_05_20`.
- **Ownership:** `club_owner_id` (FK to `users.id`).
- **Logistics:** `price`, `total_slots`, `venue`, `match_date`, `match_time`.
- **Customization:** `title`, `description`, `team_a_name`, `team_b_name`.
- **Lifecycle:** Status enum (`open`, `full`, `cancelled`, `completed`).

### `match_player` (Pivot Table)
Manages the many-to-many relationship between `users` and `matches`.
- **Tracking:** `user_id`, `match_id`, and `status` (`pending`, `confirmed`, `cancelled`).
- **Validation:** Only `confirmed` players count towards the `total_slots` limit.

### `performances` (Player Statistics)
Updated to link directly to the unified identity.
- **Linkage:** Now uses `user_id` instead of the legacy `player_id`.
- **Metrics:** `goals`, `assists`, `rating`, `cleansheet`, `minutes_played`.

---

## 4. Backend Architecture

### Key Controllers
- **`CommunityGameController`**: Handles game discovery, registration logic, and profile stats aggregation.
- **`CommunityAuthController`**: Manages unified registration and Google OAuth callback logic.
- **`PerformanceController`**: Records match results. *Note: Must be updated to consistently use `user_id`.*

### Active API Routes (`/api/community/*`)
| Endpoint | Description |
|----------|-------------|
| `GET /games` | Fetches active games with real-time slot counts. |
| `POST /games/{id}/join` | Handles slot reservation and receipt upload. |
| `GET /profile` | Aggregates stats (Goals, Rating) directly from `performances`. |
| `PATCH /bookings/{id}/approve` | Admin action to confirm a player's payment. |

---

## 5. Frontend Architecture (React SPA)

### Routing & Redirection (`app.jsx`)
The frontend is the primary enforcer of the revamp.
- **Redirection:** Legacy routes like `/dashboard` and `/coach-dashboard` are explicitly intercepted and redirected to `/community/feed` via `<Navigate />`.
- **Primary Layout:** `CommunityLayout.jsx` provides the navigation shell (Sidebar/Header) for all community views.

### Design System: "Athletic Minimal"
- **Styling:** Primarily custom CSS-in-JS (localized `styles` objects) with a move towards Tailwind CSS.
- **Visuals:** Uses glassmorphism (`glass-panel`), high-contrast gradients (Cyan/Magenta), and dark mode backgrounds.

---

## 6. Deprecated Legacy Components

The following components should be treated as **Legacy** and not used for new feature development:
- **Models:** `Player.php`, `Coach.php`, `Team.php`, `CommunityUser.php`.
- **Tables:** `community_games`, `community_bookings` (replaced by unified `matches` and `match_player`).
- **Controllers:** `CoachController.php`, `PlayerController.php` (for dashboard logic).

---

## 7. Technical Debt & Future Verification
- **Test Alignment:** Current tests in `CommunityTest.php` are failing due to reliance on legacy tables and must be updated to the unified schema.
- **Data Integrity:** Ensure that historical stats in `performances` are mapped from legacy `player_id` to the new `user_id`.
- **Style Standardization:** Transition localized style objects to global Tailwind CSS classes for consistency.

---
*Document officially updated and verified: May 24, 2026.*
