---
description: Project High Level Overview
---

I've dived deeper into the code, and here is what this project is:

Project Purpose: Sports Team Management System
This is a dedicated platform for managing sports teams (specifically Football/Soccer), designed to bridge the gap between Coaches and Players.

It handles the full lifecycle of team management:

Key Features:
1. For Coaches:

Squad Management: View and manage player rosters (names, positions, jersey numbers).
Recruitment: Review and approve "scouted" players or new applicants (players start in a "Waiting Room" / Pending status).
Performance Tracking: Input match stats (Goals, Ratings, Cleansheets) directly for each player after games.
Scheduling: Manage training sessions and match fixtures.
Payments: Track fee payments from players (integrated with Billplz).
Communication: Post announcements to the team.


2. For Players:

Digital Profile: A "FIFA-card" style profile showing their attributes (Pace, Shooting, Passing, etc.) and stats.
Performance History: View their history of matches, goals, and ratings over time.
Payments: View payment history and pay outstanding fees.
Teammates: View their squad.


Technical Note (Under the Hood)
The application is built using a Modern Monolith approach:

Backend: Laravel is primarily acting as an API, but interestingly, it uses Direct Database Queries (DB::table) rather than standard Laravel Models for most operations. This makes it performant but a bit unconventional for a standard Laravel app.

Frontend: A Single Page Application (SPA) using React, managed by Inertia.js or just standard client-side routing, giving it a very snappy app-like feel.

In short: It's a "Club Operations Platform" to digitize the day-to-day running of a grassroot or semi-pro football team.