# Implementation Plan: SalesPilot MVP

## Overview

This plan implements SalesPilot MVP from foundation to full-feature delivery. The implementation follows a dependency-ordered approach: infrastructure and shared services first, then domain modules, followed by the frontend layer, and finally integration wiring. The backend uses PHP 8.4 with Laravel 12 (modular architecture), and the frontend uses TypeScript with Next.js and Tailwind CSS.

## Tasks

- [ ] 1. Project scaffolding and infrastructure setup
  - [ ] 1.1 Initialize Laravel 12 backend project with Docker configuration
    - Create `docker-compose.yml` with PHP 8.4, PostgreSQL, and Redis services
    - Configure Laravel `.env` for PostgreSQL with UUID support and Redis caching
    - Set up `Dockerfile` for production deployment (Railway-compatible)
    - Configure Sanctum for API token authentication
    - _Requirements: 16.1, 16.4, 15.1_

  - [ ] 1.2 Initialize Next.js frontend project with TypeScript and Tailwind CSS
    - Create Next.js App Router project with TypeScript strict mode
    - Configure Tailwind CSS with custom color palette, typography scale, and spacing system
    - Set up project directory structure (`components/ui/`, `hooks/`, `lib/`, `types/`, `styles/`)
    - Create base layout with responsive sidebar and header components
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 1.3 Create modular backend directory structure and service providers
    - Create module directories: `app/Modules/{Auth,CompanyProfile,Research,Proposal,Outreach,Pipeline,User}/`
    - Each module with subdirectories: `Controllers/`, `Services/Interfaces/`, `Models/`, `Requests/`, `Events/`, `Providers/`
    - Register module service providers in `config/app.php`
    - Create base module route registration
    - _Requirements: 15.1, 15.2, 15.4, 15.6_

  - [ ] 1.4 Create database migrations for all tables with UUID primary keys
    - Write migrations for: users, company_profiles, target_companies, research_reports, proposals, outreach_emails, whatsapp_messages, leads, lead_stage_history
    - Define UUID primary keys, foreign key constraints with cascading deletes
    - Add database indexes on user_id, target_company_id, and stage columns
    - Add CHECK constraint on leads.stage for enum values (prospect, proposal_sent, won, lost)
    - Add unique constraints: users(email), company_profiles(user_id), target_companies(user_id, company_name), leads(user_id, target_company_id)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

  - [ ] 1.5 Create shared services: API response helpers, global exception handler, rate limiting
    - Implement standardized JSON response trait (success/error format)
    - Configure global exception handler mapping domain exceptions to HTTP codes
    - Set up rate limiting middleware (60 requests/min per user)
    - Configure API versioning prefix (`api/v1/`)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ] 1.6 Implement AI Service Layer (shared OpenAI GPT-4 integration)
    - Create `AIServiceInterface` with `generate(systemPrompt, userPrompt, options)` method
    - Implement `OpenAIService` with 30-second timeout, error handling, and retry logic
    - Create `AIResponse` DTO and `AIServiceException`
    - Bind interface to concrete implementation in a shared service provider
    - _Requirements: 15.5, 5.2, 6.3, 7.3, 8.4_

- [ ] 2. Authentication module (backend)
  - [ ] 2.1 Implement user registration endpoint
    - Create `RegisterRequest` Form Request with validation (email max 255, name 1-100, password 8-128 with complexity rules)
    - Create `AuthController@register` storing user with bcrypt cost 12
    - Send email verification link within 60 seconds
    - Return standardized success response
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

  - [ ] 2.2 Implement email verification endpoint
    - Create signed URL verification route
    - Activate account on valid link click within 24 hours
    - Reject expired links (>24 hours) with re-send option
    - _Requirements: 1.2, 1.4_

  - [ ] 2.3 Implement login endpoint with lockout logic
    - Create `LoginRequest` Form Request
    - Create `AuthController@login` issuing Sanctum token (7-day expiry) on success
    - Return generic error message for invalid credentials (no email/password distinction)
    - Track failed attempts in Redis; lock account after 5 failures in 5 minutes for 15 minutes
    - Reject login for unverified email accounts
    - _Requirements: 2.1, 2.2, 2.6, 2.7, 2.8_

  - [ ] 2.4 Implement logout and session management
    - Create `AuthController@logout` invalidating current Sanctum token
    - Configure token expiration handling (401 on expired tokens)
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ] 2.5 Implement password reset flow
    - Create forgot-password endpoint sending reset link (60-second delivery)
    - Create reset-password endpoint accepting new password via signed token
    - Invalidate all existing sessions on successful reset
    - Respond identically for existing and non-existing emails (anti-enumeration)
    - Invalidate reset link after single use; reject links older than 60 minutes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.6 Write property tests for authentication module
    - **Property 1: Password Validation Correctness** — test valid/invalid password generation
    - **Property 2: Duplicate Email Rejection** — test registration with existing email
    - **Property 3: Generic Authentication Error** — verify identical error messages for wrong email/password
    - **Property 4: Account Lockout After Failed Attempts** — test 5 consecutive failures trigger lockout
    - **Property 5: Unverified Email Login Rejection** — test unverified user login blocked
    - **Property 6: Password Reset Invalidates All Sessions** — verify token invalidation
    - **Property 7: Anti-Enumeration Response Consistency** — verify identical response for any email
    - **Validates: Requirements 1.3, 1.5, 1.7, 2.2, 2.6, 2.7, 2.8, 3.2, 3.4**

- [ ] 3. Checkpoint - Backend auth module
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Company Profile module (backend)
  - [ ] 4.1 Implement CompanyProfile model, service, and CRUD endpoints
    - Create `CompanyProfile` model with UUID, user scoping, and JSONB products_services field
    - Implement `CompanyProfileServiceInterface` with `getByUser`, `createOrUpdate`, `isComplete`
    - Create `CompanyProfileController` with store/update and show endpoints
    - Create `CompanyProfileRequest` Form Request (required: company_name, industry, description, at least one product)
    - Apply automatic user_id scoping via model scope
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 14.1, 14.3_

  - [ ]* 4.2 Write property tests for Company Profile module
    - **Property 8: Company Profile Round-Trip** — save and retrieve returns identical data
    - **Property 9: Company Profile Required Field Validation** — missing fields rejected
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

- [ ] 5. Target Company module (backend)
  - [ ] 5.1 Implement TargetCompany model, service, and CRUD endpoints
    - Create `TargetCompany` model with UUID, user scoping, and unique (user_id, company_name) constraint
    - Implement CRUD controller: list (with research_report exists flag), create, update, show (with all associated content), delete (cascade)
    - Create `TargetCompanyRequest` Form Request with name length validation (2-200 chars)
    - Enforce duplicate name rejection per user
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 5.8_

  - [ ]* 5.2 Write property tests for Target Company module
    - **Property 13: Target Company Name Length Validation** — test 2-200 chars constraint
    - **Property 27: Target Company Edit Round-Trip** — update and retrieve returns updated values
    - **Property 28: Target Company Cascading Deletion** — verify all associated records removed
    - **Property 29: Duplicate Target Company Name Rejection Per User** — same name per user rejected, different users allowed
    - **Validates: Requirements 5.8, 10.3, 10.5, 10.6**

- [ ] 6. Research module (backend)
  - [ ] 6.1 Implement Research service and endpoints
    - Create `ResearchReport` model with UUID, user scoping, and target_company relationship
    - Implement `ResearchServiceInterface` with `generateReport`, `getReport`, `regenerateReport`
    - Build structured AI prompt including target company name and optional website URL
    - Parse GPT-4 response into report sections (overview, industry, news, pain points, size)
    - Store with `generated_at` timestamp; regeneration replaces previous report
    - Handle 30-second timeout and parse failures with descriptive errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 6.2 Write property tests for Research module
    - **Property 10: Research Prompt Construction** — verify company name included, website URL conditionally included
    - **Property 11: Research Report Storage Round-Trip** — store and retrieve returns all sections
    - **Property 12: Research Regeneration Replaces Previous** — only one report per target company
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.6, 5.7**

- [ ] 7. Proposal module (backend)
  - [ ] 7.1 Implement Proposal service and endpoints
    - Create `Proposal` model with UUID, user scoping, and target_company relationship
    - Implement `ProposalServiceInterface` with `generate`, `getByTargetCompany`, `regenerate`
    - Pre-condition check: Company Profile complete + Research Report exists
    - Build structured prompt combining Company_Profile + Research_Report + additional context (max 2000 chars)
    - Parse response into sections: executive_summary, problem_statement, proposed_solution, key_benefits, next_steps
    - Store each generation as new record (versioning is additive)
    - Handle 30-second timeout with descriptive error
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9, 6.10_

  - [ ]* 7.2 Write property tests for Proposal module
    - **Property 14: Content Generation Requires Complete Profile** — block if profile incomplete
    - **Property 15: Content Generation Requires Research Report** — block if no research
    - **Property 16: Proposal Contains Required Sections** — verify all 5 sections present
    - **Property 17: Content Versioning Is Additive** — new proposal doesn't remove previous
    - **Validates: Requirements 6.2, 6.5, 6.6, 6.8, 6.10**

- [ ] 8. Outreach module (backend)
  - [ ] 8.1 Implement Outreach Email service and endpoints
    - Create `OutreachEmail` model with UUID, user scoping, tone enum (formal, friendly, direct)
    - Implement `OutreachServiceInterface@generateEmail` and `getEmails`
    - Pre-condition check: Company Profile complete + Research Report exists
    - Build prompt with tone instruction, contact name/role, Company_Profile, Research_Report
    - Parse response: subject_line (max 100 chars), body with greeting, value proposition, CTA
    - Default tone to 'formal' if not specified; versioning is additive
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 7.8, 7.9_

  - [ ] 8.2 Implement WhatsApp Message service and endpoints
    - Create `WhatsAppMessage` model with UUID, user scoping, message (VARCHAR 500)
    - Implement `OutreachServiceInterface@generateWhatsApp` and `getWhatsAppMessages`
    - Pre-condition check: Company Profile complete + Research Report exists
    - Build prompt with 500-char constraint, conversational tone, value hook, soft CTA
    - Truncate/validate response to max 500 chars; versioning is additive
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8, 8.9, 8.10_

  - [ ]* 8.3 Write property tests for Outreach module
    - **Property 18: Outreach Email Structure** — subject ≤100 chars, body has required parts
    - **Property 19: WhatsApp Message Length Constraint** — message ≤500 chars
    - **Property 17: Content Versioning Is Additive** — new content doesn't remove previous (emails + WhatsApp)
    - **Validates: Requirements 7.2, 7.6, 8.2, 8.7**

- [ ] 9. Pipeline module (backend)
  - [ ] 9.1 Implement Pipeline service and endpoints
    - Create `Lead` model with UUID, user scoping, stage enum constraint, unique (user_id, target_company_id)
    - Create `LeadStageHistory` model with lead relationship
    - Implement `PipelineServiceInterface` with `createLead` (default: prospect), `moveStage` (record history), `deleteLead`, `getLeads` (filter by stage, search by name), `getLeadWithHistory`
    - Reject duplicate leads for same target company
    - Delete lead retains target company and all content
    - Search: case-insensitive substring match on target company name
    - Order: most recently updated first within each stage
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

  - [ ]* 9.2 Write property tests for Pipeline module
    - **Property 20: Lead Default Stage** — new leads always start as 'prospect'
    - **Property 21: Stage Transition Records History** — each move creates history entry
    - **Property 22: Leads Ordered By Most Recently Updated** — verify ordering
    - **Property 23: Unrestricted Stage Movement** — any stage to any stage allowed
    - **Property 24: Lead Deletion Retains Target Company Content** — content preserved
    - **Property 25: Pipeline Search Correctness** — case-insensitive substring match
    - **Property 26: Duplicate Lead Rejection** — reject duplicate for same target company
    - **Property 39: Stage Enum Constraint** — reject invalid stage values
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.7, 9.8, 9.9, 16.6**

- [ ] 10. User module and data isolation (backend)
  - [ ] 10.1 Implement User module with account deletion and data isolation
    - Create global query scope trait for automatic user_id filtering
    - Apply scope to all user-owned models (CompanyProfile, TargetCompany, Lead, ResearchReport, Proposal, OutreachEmail, WhatsAppMessage)
    - Implement account deletion endpoint (cascading all user data)
    - Return HTTP 403 for cross-user resource access attempts
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 10.2 Write property tests for data isolation and cross-cutting concerns
    - **Property 36: User Data Isolation** — user A cannot access user B's resources
    - **Property 37: Account Deletion Cascades All Data** — all user data removed
    - **Property 38: UUID Primary Keys** — all records have valid UUID v4
    - **Property 32: Standardized API Success Response Format** — verify response structure
    - **Property 33: Standardized API Error Response Format** — verify error structure
    - **Property 34: Rate Limiting Enforcement** — 60 req/min then 429
    - **Property 35: Authentication Required for Protected Endpoints** — 401 without token
    - **Validates: Requirements 14.1, 14.2, 14.4, 16.1, 13.2, 13.3, 13.6, 13.7**

- [ ] 11. Dashboard module (backend)
  - [ ] 11.1 Implement Dashboard API endpoint
    - Create single endpoint returning: lead counts per stage, total target companies, proposals this month, emails this month
    - Return 5 most recently updated leads with stage and last activity date
    - Include company profile completion status
    - Cache dashboard data in Redis for 5 minutes per user
    - _Requirements: 12.1, 12.2, 12.4, 12.5_

  - [ ]* 11.2 Write property tests for Dashboard module
    - **Property 30: Dashboard Counts Accuracy** — verify counts match actual data
    - **Property 31: Dashboard Recent Leads Ordering** — exactly 5 most recent, ordered correctly
    - **Validates: Requirements 12.1, 12.2**

- [ ] 12. Checkpoint - Backend modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Frontend shared infrastructure
  - [ ] 13.1 Implement API client with interceptors and type definitions
    - Create centralized API client (`lib/api.ts`) with Axios/fetch wrapper
    - Add automatic Bearer token injection from localStorage
    - Add response interceptors: 401 → redirect to login, 422 → extract field errors, 429 → rate limit toast, 500 → generic error toast
    - Define TypeScript interfaces for all API response types (`ApiResponse<T>`, `ApiError`)
    - Create type definitions for all domain entities (User, CompanyProfile, TargetCompany, ResearchReport, Proposal, OutreachEmail, WhatsAppMessage, Lead)
    - _Requirements: 13.2, 13.3, 11.4_

  - [ ] 13.2 Implement shared UI component library
    - Create reusable components: Button (variants, loading state), Input (with label, error), Card, Toast, Modal, Skeleton loader
    - Implement Toast notification system (5-second auto-dismiss, manual dismiss)
    - Implement accessible form controls with `aria-describedby`, focus indicators, keyboard navigation
    - Create responsive Sidebar and Header layout components with mobile hamburger menu
    - _Requirements: 11.2, 11.3, 11.5, 11.6_

  - [ ] 13.3 Implement auth hooks and protected route wrapper
    - Create `useAuth` hook (login, logout, register, resetPassword, token management)
    - Create `useApi` hook for typed API calls with loading/error states
    - Create auth guard component redirecting unauthenticated users to login
    - Implement token persistence and expiration handling
    - _Requirements: 2.3, 2.4, 13.7, 13.9_

- [ ] 14. Frontend authentication pages
  - [ ] 14.1 Implement Registration, Login, and Password Reset pages
    - Create Registration page with form validation (email, name, password with complexity indicator)
    - Create Login page with generic error display
    - Create Password Reset request and reset form pages
    - Display field-level validation errors from API responses
    - Handle email verification flow (success/expired link pages)
    - _Requirements: 1.1, 1.7, 2.1, 2.2, 3.1, 3.2, 11.6_

- [ ] 15. Frontend Dashboard page
  - [ ] 15.1 Implement Dashboard with stats, recent leads, and quick actions
    - Display stat cards: leads per stage, target companies count, proposals this month, emails this month
    - Display 5 most recently updated leads with stage badges
    - Display quick-action links: add target company, generate research, create lead
    - Display company profile completion banner if incomplete
    - Implement loading skeleton while data loads
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 11.4_

- [ ] 16. Frontend Company Profile page
  - [ ] 16.1 Implement Company Profile form page
    - Create form with all fields: company name, industry, description, target market, value propositions
    - Implement dynamic product/service list (add/remove items with name + description)
    - Pre-populate form with existing data on page load
    - Display validation errors inline and show success toast on save
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 17. Frontend Target Companies pages
  - [ ] 17.1 Implement Target Companies list and detail pages
    - Create list page showing all target companies with name, URL, date added, research status indicator
    - Create add/edit forms with name (2-200 chars), website URL, and notes fields
    - Create detail page showing all associated content (research, proposals, emails, messages) ordered by date descending
    - Implement delete with confirmation dialog explaining cascade behavior
    - Handle duplicate name error from API
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 18. Frontend AI features (Research, Proposals, Outreach)
  - [ ] 18.1 Implement AI Research generation UI
    - Create research form on target company detail page with company name and optional website URL
    - Display research report sections with generation date
    - Implement regenerate button replacing previous report
    - Show loading indicator during generation; disable button; handle 30s timeout
    - Block if company profile incomplete with link to profile page
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 11.7_

  - [ ] 18.2 Implement AI Proposal generation UI
    - Create proposal generator with optional additional context textarea (max 2000 chars)
    - Display proposals with all 5 sections, ordered by date descending
    - Implement copy-to-clipboard for full proposal text
    - Block if profile incomplete or research missing with appropriate messages
    - Show loading indicator; disable button; handle 30s timeout
    - _Requirements: 6.1, 6.2, 6.7, 6.5, 6.6, 6.10, 11.7_

  - [ ] 18.3 Implement AI Outreach Email generation UI
    - Create email generator with tone selector (formal/friendly/direct), optional contact name and role
    - Display emails with subject line and body, ordered by date descending
    - Implement copy-to-clipboard for subject and body (separately and together)
    - Block if profile incomplete or research missing with appropriate messages
    - Show loading indicator; disable button; handle 30s timeout
    - _Requirements: 7.1, 7.2, 7.5, 7.7, 7.8, 11.7_

  - [ ] 18.4 Implement AI WhatsApp Message generation UI
    - Create message generator with optional contact name field
    - Display messages with character count indicator, ordered by date descending
    - Implement copy-to-clipboard for message text
    - Block if profile incomplete or research missing with appropriate messages
    - Show loading indicator; disable button; handle 30s timeout
    - _Requirements: 8.1, 8.6, 8.8, 8.9, 11.7_

- [ ] 19. Frontend Pipeline page
  - [ ] 19.1 Implement Pipeline board with drag-and-drop
    - Create Kanban-style board with 4 stage columns (Prospect, Proposal Sent, Won, Lost)
    - Display lead cards showing: company name, date added, days in current stage
    - Implement drag-and-drop stage transitions with optimistic UI (rollback on API failure)
    - Implement stage selection dropdown as alternative to drag-and-drop
    - Implement search by company name (case-insensitive) and filter by stage
    - Order leads by most recently updated within each stage
    - _Requirements: 9.1, 9.4, 9.5, 9.8_

  - [ ] 19.2 Implement Lead detail view and management
    - Create lead detail modal/page showing: all generated content for target company, current stage, stage history with timestamps
    - Implement add lead functionality (from target company, default to Prospect)
    - Implement delete lead with confirmation dialog explaining what will be removed vs retained
    - Handle duplicate lead error from API
    - _Requirements: 9.2, 9.3, 9.6, 9.7, 9.9, 9.10_

- [ ] 20. Checkpoint - Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Integration, wiring, and final verification
  - [ ] 21.1 End-to-end integration testing and final wiring
    - Verify full user flow: register → verify email → login → create profile → add target company → research → proposal → email → WhatsApp → pipeline
    - Verify data isolation between test users
    - Verify cascading deletions (target company, lead, user account)
    - Verify rate limiting and error responses across all endpoints
    - Test responsive layout at 320px, 768px, and 1920px viewports
    - _Requirements: 14.1, 14.2, 16.3, 13.6, 11.1_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate the 39 correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- The backend modules can be developed largely in parallel once the infrastructure (Task 1) is complete
- Frontend tasks depend on backend API availability; use API mocks for parallel development if needed
- Docker configuration enables consistent development environments and production deployment

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5", "1.6"] },
    { "id": 3, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 4, "tasks": ["2.6", "4.1", "5.1"] },
    { "id": 5, "tasks": ["4.2", "5.2", "6.1"] },
    { "id": 6, "tasks": ["6.2", "7.1", "8.1", "8.2"] },
    { "id": 7, "tasks": ["7.2", "8.3", "9.1"] },
    { "id": 8, "tasks": ["9.2", "10.1", "11.1"] },
    { "id": 9, "tasks": ["10.2", "11.2"] },
    { "id": 10, "tasks": ["13.1", "13.2"] },
    { "id": 11, "tasks": ["13.3", "14.1"] },
    { "id": 12, "tasks": ["15.1", "16.1", "17.1"] },
    { "id": 13, "tasks": ["18.1", "18.2", "18.3", "18.4"] },
    { "id": 14, "tasks": ["19.1", "19.2"] },
    { "id": 15, "tasks": ["21.1"] }
  ]
}
```
