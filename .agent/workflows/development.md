---
description: How to start the development environment for NUVRA
---

# Development Workflow

This workflow describes how to start the development environment for the NUVRA application.

## Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js and npm

## Setup

If this is your first time running the project, you need to set it up:

1. Install PHP dependencies:
   ```bash
   composer install
   ```

2. Setup the environment file:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. Run database migrations:
   ```bash
   php artisan migrate
   ```

4. Install JavaScript dependencies:
   ```bash
   npm install
   ```

## Running the Application

To start the development server, queue worker, and Vite dev server all at once, use the configured composer script:

// turbo
1. Start the development environment
   ```bash
   composer run dev
   ```

This command runs:
- `php artisan serve` (Laravel Server)
- `php artisan queue:listen` (Queue Worker)
- `npm run dev` (Vite Frontend Server)
- `php artisan pail` (Logs)

You can access the application at `http://localhost:8000`.
