# Sprint 1 — Deliverable

## Status: ✅ Complete

All code compiles. Frontend builds to production with zero errors.

---

## Project Structure

```
sales-pilot-ai/
├── backend/                          # Laravel 12 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Controller.php           # Base controller with response helpers
│   │   │   │   ├── AuthController.php       # Register, login, logout, user
│   │   │   │   ├── CompanyProfileController.php  # GET/PUT company profile
│   │   │   │   └── HealthController.php     # Health check endpoint
│   │   │   └── Requests/
│   │   │       ├── RegisterRequest.php      # Registration validation
│   │   │       ├── LoginRequest.php         # Login validation
│   │   │       └── CompanyProfileRequest.php # Profile validation
│   │   └── Models/
│   │       ├── User.php                     # UUID, HasApiTokens, HasUuids
│   │       └── CompanyProfile.php           # UUID, JSONB products_services
│   ├── bootstrap/
│   │   └── app.php                          # Exception handling, middleware config
│   ├── config/
│   │   ├── app.php
│   │   ├── database.php                     # PostgreSQL configuration
│   │   ├── cors.php                         # CORS for frontend origin
│   │   └── sanctum.php                      # Sanctum stateful domains
│   ├── database/
│   │   └── migrations/
│   │       ├── 2024_01_01_000001_create_users_table.php
│   │       ├── 2024_01_01_000002_create_personal_access_tokens_table.php
│   │       └── 2024_01_01_000003_create_company_profiles_table.php
│   ├── routes/
│   │   └── api.php                          # All API routes
│   ├── public/
│   │   └── index.php
│   ├── artisan
│   ├── composer.json
│   └── .env.example
│
├── frontend/                         # Next.js 16 + TypeScript + Tailwind
│   ├── app/
│   │   ├── layout.tsx                       # Root layout with providers
│   │   ├── providers.tsx                    # AuthProvider + ToastProvider
│   │   ├── globals.css                      # Tailwind + custom animations
│   │   ├── page.tsx                         # Root redirect (→ dashboard or login)
│   │   ├── login/page.tsx                   # Login page
│   │   ├── register/page.tsx                # Registration page
│   │   ├── dashboard/page.tsx               # Dashboard with profile CTA
│   │   └── company-profile/page.tsx         # Full profile CRUD form
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx                   # Primary/secondary/ghost + loading
│   │   │   ├── Input.tsx                    # With label, error, focus ring
│   │   │   ├── Textarea.tsx                 # With label, error
│   │   │   └── Toast.tsx                    # Toast notifications + provider
│   │   └── layout/
│   │       ├── Sidebar.tsx                  # Dark sidebar with nav
│   │       └── AppLayout.tsx                # Protected layout with mobile menu
│   ├── lib/
│   │   ├── api.ts                           # Typed API client with token injection
│   │   └── auth.tsx                         # Auth context + useAuth hook
│   ├── .env.local
│   ├── tsconfig.json
│   └── package.json
│
├── MVP_IMPLEMENTATION_PLAN.md
└── SPRINT_1_DELIVERABLE.md           # This file
```

---

## API List

| Method | Endpoint               | Auth | Description                      |
|--------|------------------------|------|----------------------------------|
| GET    | /api/v1/health         | No   | Health check                     |
| POST   | /api/v1/register       | No   | Create account, return token     |
| POST   | /api/v1/login          | No   | Authenticate, return token       |
| POST   | /api/v1/logout         | Yes  | Revoke current token             |
| GET    | /api/v1/user           | Yes  | Get current user + profile status|
| GET    | /api/v1/company-profile| Yes  | Get user's company profile       |
| PUT    | /api/v1/company-profile| Yes  | Create or update company profile |

### Standardized Response Format

**Success:**
```json
{
  "success": true,
  "message": "Company profile saved successfully",
  "data": { ... }
}
```

**Error (validation):**
```json
{
  "success": false,
  "message": "Please check your input.",
  "errors": {
    "company_name": ["Company name is required."],
    "products_services": ["Add at least one product or service."]
  }
}
```

**Error (auth):**
```json
{
  "success": false,
  "message": "Invalid credentials. Please try again.",
  "errors": null
}
```

---

## Database Schema

### users
| Column     | Type         | Constraints          |
|------------|--------------|----------------------|
| id         | UUID         | Primary Key          |
| full_name  | VARCHAR(100) | NOT NULL             |
| email      | VARCHAR(255) | UNIQUE, NOT NULL     |
| password   | VARCHAR(255) | NOT NULL (bcrypt)    |
| created_at | TIMESTAMP    |                      |
| updated_at | TIMESTAMP    |                      |

### personal_access_tokens (Sanctum)
| Column         | Type      | Constraints       |
|----------------|-----------|-------------------|
| id             | BIGINT    | Primary Key, Auto |
| tokenable_type | VARCHAR   |                   |
| tokenable_id   | UUID      |                   |
| name           | VARCHAR   |                   |
| token          | VARCHAR(64)| UNIQUE           |
| abilities      | TEXT      | Nullable          |
| last_used_at   | TIMESTAMP | Nullable          |
| expires_at     | TIMESTAMP | Nullable          |
| created_at     | TIMESTAMP |                   |
| updated_at     | TIMESTAMP |                   |

### company_profiles
| Column             | Type    | Constraints                    |
|--------------------|---------|--------------------------------|
| id                 | UUID    | Primary Key                    |
| user_id            | UUID    | UNIQUE, FK → users ON DELETE CASCADE |
| company_name       | VARCHAR(255) | NOT NULL                  |
| industry           | VARCHAR(255) | NOT NULL                  |
| description        | TEXT    | NOT NULL                       |
| products_services  | JSONB   | NOT NULL                       |
| target_market      | TEXT    | Nullable                       |
| value_propositions | TEXT    | Nullable                       |
| created_at         | TIMESTAMP |                              |
| updated_at         | TIMESTAMP |                              |

---

## Deployment Instructions

### Backend (Railway)

1. Push the `backend/` directory to a Git repo
2. Create a new project on Railway
3. Add a PostgreSQL plugin
4. Connect the repo, set root directory to `backend/`
5. Set environment variables:
   ```
   APP_NAME=SalesPilot
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=base64:... (generate with: php artisan key:generate --show)
   APP_URL=https://your-railway-url.up.railway.app
   FRONTEND_URL=https://your-vercel-url.vercel.app
   DB_CONNECTION=pgsql
   DB_HOST=(from Railway PostgreSQL plugin)
   DB_PORT=5432
   DB_DATABASE=(from Railway)
   DB_USERNAME=(from Railway)
   DB_PASSWORD=(from Railway)
   ```
6. Build command: `composer install --no-dev --optimize-autoloader && php artisan migrate --force`
7. Start command: `php artisan serve --host=0.0.0.0 --port=$PORT`

### Frontend (Vercel)

1. Push the `frontend/` directory to a Git repo
2. Import into Vercel
3. Set root directory to `frontend/`
4. Set environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api/v1
   ```
5. Deploy (auto-detected as Next.js)

---

## Manual Testing Checklist

### Registration
- [ ] Navigate to /register
- [ ] Submit with empty fields → validation errors appear
- [ ] Submit with invalid email → error shown
- [ ] Submit with short password (<8 chars) → error shown
- [ ] Submit with mismatched passwords → error shown
- [ ] Submit with valid data → redirected to /dashboard
- [ ] Token stored in localStorage

### Login
- [ ] Navigate to /login
- [ ] Submit with wrong credentials → "Invalid credentials" error
- [ ] Submit with valid credentials → redirected to /dashboard
- [ ] Token stored in localStorage

### Dashboard
- [ ] Shows user's first name in welcome message
- [ ] Shows "Set Up Profile" banner when no profile exists
- [ ] Shows "✓ Complete" when profile exists
- [ ] Mobile: hamburger menu opens sidebar

### Company Profile
- [ ] Navigate to /company-profile
- [ ] Form is empty on first visit
- [ ] Fill required fields and save → success toast
- [ ] Refresh page → data is pre-populated
- [ ] Add multiple products (click "+ Add another")
- [ ] Remove a product (click ×)
- [ ] Save with missing required fields → validation errors
- [ ] After saving, dashboard shows "✓ Complete"

### Logout
- [ ] Click "Sign out" in sidebar → redirected to /login
- [ ] Token removed from localStorage
- [ ] Cannot access /dashboard without re-login

### Responsive
- [ ] Desktop (1200px+): sidebar visible, content area wide
- [ ] Tablet (768px): sidebar still visible
- [ ] Mobile (375px): sidebar hidden, hamburger menu works
- [ ] No horizontal scroll at any breakpoint

---

## What's NOT in Sprint 1

- AI features (research, proposals, email, WhatsApp)
- Target companies
- Pipeline
- Password reset
- Email verification
- Rate limiting
- Redis
- Docker
- Property tests
- Analytics / Dashboard stats
- Billing
- Notifications
