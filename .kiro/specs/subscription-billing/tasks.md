# Implementation Plan: Subscription & Billing System

## Overview

Implement a full SaaS billing system for SalesPilot AI with four pricing tiers, Xendit payment gateway integration, subscription lifecycle management (upgrades, downgrades, cancellations, trials, renewals), usage tracking with limit enforcement, and user/admin dashboards. All backend logic uses raw SQL via `neon()` tagged templates with the existing JWT auth system.

## Tasks

- [ ] 1. Database schema and shared types
  - [ ] 1.1 Create database migration SQL and run schema setup
    - Create `frontend/lib/billing/migrations/001_billing_schema.sql` with all billing tables: `plans`, `subscriptions`, `transactions`, `invoices`, `payment_methods`, `subscription_logs`, `usage_counters`, `webhook_events`, `rate_limits`
    - Include seed data for the four plans (Free, Starter, Professional, Business) with correct pricing and JSONB features
    - Add `plan_id`, `subscription_status`, and `role` columns to existing `users` table
    - Include all indexes and constraints from the design document
    - Create an API route `app/api/billing/init/route.ts` to execute the migration (dev-only)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [ ] 1.2 Create shared TypeScript types and interfaces
    - Create `frontend/lib/billing/types.ts` with all shared types: `PlanDefinition`, `PlanFeatures`, `Subscription`, `SubscriptionStatus`, `ProrationResult`, `UsageType`, `UsageRecord`, `UsageCheckResult`, `BillingEmailType`, `EmailPayload`, `WebhookEvent`, `WebhookProcessingResult`
    - Export all types for consumption by domain modules and API routes
    - _Requirements: 1.1, 1.2, 2.1, 7.4_

- [ ] 2. Plan Catalog module
  - [ ] 2.1 Implement Plan Catalog with pricing logic
    - Create `frontend/lib/billing/plan-catalog.ts`
    - Implement `getAllPlans()` — query `plans` table and map to `PlanDefinition`
    - Implement `getPlanById(planId)` — single plan lookup
    - Implement `getPriceForCycle(planId, cycle)` — return monthly or yearly price
    - Implement `getRecommendedPlan()` — return plan with `is_recommended = true`
    - Include static plan data fallback if DB is unavailable (hardcoded constants matching seed)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property test for yearly pricing discount (Property 1)
    - **Property 1: Yearly pricing discount calculation**
    - Verify for any plan with monthly_price > 0, yearly_price equals `monthlyPrice * 12 * 0.80`
    - Use `fast-check` with arbitrary plan prices
    - **Validates: Requirements 1.3**

  - [ ] 2.3 Create GET /api/billing/plans route
    - Create `frontend/app/api/billing/plans/route.ts`
    - Return all plans with pricing for both cycles
    - Public endpoint (no auth required) for the pricing page
    - _Requirements: 1.1, 1.3_

- [ ] 3. Subscription Engine module
  - [ ] 3.1 Implement subscription state machine and core transitions
    - Create `frontend/lib/billing/subscription-engine.ts`
    - Implement `getSubscription(userId)` — query current subscription from DB
    - Implement `getEffectivePlan(userId)` — resolve active plan considering status
    - Implement `createTrial(userId)` — create trialing subscription with professional features, trial_end = now + 7 days
    - Implement `activateSubscription(userId, planId, cycle)` — transition to active, set period dates
    - Implement `extendPeriod(subscriptionId)` — renewal logic: period_start = old_end, period_end = old_end + cycle duration
    - All state changes wrapped in database transactions with `SELECT FOR UPDATE` row locking
    - Every transition inserts a row in `subscription_logs`
    - _Requirements: 4.6, 5.2, 6.1, 6.6, 11.4_

  - [ ] 3.2 Implement upgrade, downgrade, cancel, and resume transitions
    - Implement `upgradePlan(userId, newPlanId)` — immediate activation with proration calculation
    - Implement `downgradePlan(userId, newPlanId)` — set status to `pending_downgrade`, store `downgrade_to_plan_id`, defer to period end
    - Implement `cancelSubscription(userId)` — set status to `pending_cancellation`, set `cancelled_at`
    - Implement `resumeSubscription(userId)` — revert `pending_cancellation` to `active`, clear `cancelled_at`
    - Implement `enterGracePeriod(subscriptionId)` — set status to `grace_period`, `grace_period_end = period_end + 3 days`
    - Implement `expireToFree(subscriptionId)` — transition to free plan
    - Implement `changeBillingCycle(userId, newCycle)` — monthly-to-yearly immediate with proration; yearly-to-monthly deferred
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 12.1, 12.2_

  - [ ] 3.3 Implement proration calculation
    - Implement `calculateProration(currentPlan, newPlan, cycle, periodStart, periodEnd)` — returns `ProrationResult`
    - Formula: credit = currentPrice * (daysRemaining / totalDays), charge = newPrice * (daysRemaining / totalDays), net = charge - credit
    - Round to nearest integer (IDR has no decimals)
    - _Requirements: 4.1, 12.1_

  - [ ]* 3.4 Write property tests for subscription state transitions (Properties 7, 8, 9, 10, 11)
    - **Property 7: Deferred plan changes** — downgrade/yearly-to-monthly keeps current plan until period_end
    - **Property 8: Cancellation preserves access until period end** — status becomes pending_cancellation, features unchanged until period_end
    - **Property 9: Subscription expiration transitions to Free** — pending_cancellation past period_end OR expired trial → free
    - **Property 10: Resume removes pending cancellation** — status reverts to active, cancelled_at null, period_end unchanged
    - **Property 11: State change logging completeness** — every transition logged with correct previous/new state
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 12.2**

  - [ ]* 3.5 Write property test for proration calculation (Property 6)
    - **Property 6: Proration calculation correctness**
    - For any upgrade from plan A to plan B (price_B > price_A), with D days remaining in T total days: net = round((price_B - price_A) * (D / T))
    - Use `fast-check` with constrained integer generators for prices and days
    - **Validates: Requirements 4.1, 12.1**

  - [ ]* 3.6 Write property test for renewal period extension (Property 12)
    - **Property 12: Renewal period extension**
    - Successful renewal sets period_start = old_period_end, period_end = old_period_end + duration(cycle)
    - **Validates: Requirements 5.2**

  - [ ]* 3.7 Write property test for trial creation (Property 13) and trial-to-paid transition (Property 14)
    - **Property 13: Trial creation with correct duration and features** — status = trialing, plan_id = professional, trial_end = created_at + 7 days
    - **Property 14: Trial-to-paid subscription transition** — immediately transitions to active with correct plan_id and billing_cycle
    - **Validates: Requirements 6.1, 6.6**

  - [ ] 3.8 Create GET and PATCH /api/billing/subscription routes
    - Create `frontend/app/api/billing/subscription/route.ts`
    - GET — return current subscription status, plan details, period dates, usage summary
    - PATCH — handle actions: `upgrade`, `downgrade`, `cancel`, `resume`, `change_cycle`
    - All routes protected by JWT auth via `getUserIdFromRequest()`
    - Validate plan transitions (no upgrade to same/lower, no downgrade to same/higher)
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 8.1, 8.4, 11.2, 12.1, 12.2_

- [ ] 4. Checkpoint - Core subscription engine
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Payment Processor module
  - [ ] 5.1 Implement Xendit invoice creation and checkout flow
    - Create `frontend/lib/billing/payment-processor.ts`
    - Implement `createCheckoutInvoice(params)` — build `XenditInvoiceRequest`, call Xendit POST /v2/invoices, store pending transaction in DB, return checkout URL
    - Implement `generateIdempotencyKey(userId, planId, timestamp)` — crypto hash for uniqueness
    - Use `fetch` for Xendit API calls with proper headers (`Authorization: Basic base64(XENDIT_SECRET_KEY:)`)
    - Support all payment methods: BANK_TRANSFER, EWALLET, QR_CODE, CREDIT_CARD, RETAIL_OUTLET, DIRECT_DEBIT
    - Set invoice_duration to 86400 seconds (24h)
    - Configure success_redirect_url and failure_redirect_url
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 5.2 Write property tests for payment processor (Properties 2, 3)
    - **Property 2: Invoice amount matches plan and billing cycle** — amount equals getPriceForCycle(planId, cycle)
    - **Property 3: Idempotency key uniqueness** — distinct requests produce distinct keys
    - **Validates: Requirements 2.1, 2.5**

  - [ ] 5.3 Implement rate limiting middleware
    - Create `frontend/lib/billing/rate-limiter.ts`
    - Implement sliding window rate limiting using `rate_limits` table
    - 5 requests per minute per user per endpoint
    - Return HTTP 429 with `Retry-After` header when exceeded
    - _Requirements: 11.6_

  - [ ]* 5.4 Write property test for rate limiting (Property 21)
    - **Property 21: Rate limiting enforcement**
    - 6th request in 60-second window receives 429; requests after window reset succeed
    - **Validates: Requirements 11.6**

  - [ ] 5.5 Create POST /api/billing/subscribe route
    - Create `frontend/app/api/billing/subscribe/route.ts`
    - Validate request body (plan_id, billing_cycle)
    - Check rate limit before processing
    - Call Payment Processor to create Xendit invoice
    - Return `{ checkoutUrl, transactionId }`
    - Protected by JWT auth
    - _Requirements: 2.1, 2.3, 2.4, 11.2, 11.6_

- [ ] 6. Webhook Handler module
  - [ ] 6.1 Implement webhook verification and idempotent processing
    - Create `frontend/lib/billing/webhook-handler.ts`
    - Implement `verifySignature(callbackToken, expectedToken)` — constant-time comparison
    - Implement `isAlreadyProcessed(eventId)` — check `webhook_events` table
    - Implement `processEvent(event)` — route to correct handler based on event type (invoice.paid, invoice.expired, invoice.payment_failed)
    - Implement `logEvent(event, result)` — insert into `webhook_events` table
    - On `invoice.paid`: update transaction status, call `activateSubscription()` or `extendPeriod()`, create invoice record
    - On `invoice.expired`: mark transaction as expired
    - On `invoice.payment_failed`: mark transaction failed, enter grace period for renewals, send notification
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 11.1, 11.3_

  - [ ]* 6.2 Write property tests for webhook handler (Properties 4, 5)
    - **Property 4: Webhook signature verification** — invalid token → reject 401; valid token → proceed
    - **Property 5: Webhook idempotent processing** — processing N times produces same state as once
    - **Validates: Requirements 3.1, 3.4, 3.7, 11.3**

  - [ ] 6.3 Create POST /api/billing/webhooks/xendit route
    - Create `frontend/app/api/billing/webhooks/xendit/route.ts`
    - NO JWT auth — authenticated via `x-callback-token` header
    - Verify signature, check idempotency, process event, return 200 immediately
    - Log all events regardless of processing outcome
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.7_

- [ ] 7. Checkpoint - Payment and webhook flow
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Usage Tracker module
  - [ ] 8.1 Implement usage tracking and limit enforcement
    - Create `frontend/lib/billing/usage-tracker.ts`
    - Implement `checkUsage(userId, usageType)` — return current count, max allowed, remaining
    - Implement `incrementUsage(userId, usageType, amount?)` — atomic increment with limit check; reject if at limit (unless unlimited = -1)
    - Implement `getUsageSummary(userId)` — return all usage records for user
    - Implement `resetCycleCounters(userId)` — reset all counters to 0, update cycle dates
    - Implement `getUsageLimitForPlan(planId, usageType)` — lookup plan features for limit value
    - Auto-create default usage record (count=0) on first access
    - Check and reset cycle if current date >= cycle_end on any access
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.2 Write property tests for usage tracker (Properties 15, 16, 17)
    - **Property 15: Usage limit enforcement per plan** — at limit with non-unlimited plan blocks increment
    - **Property 16: Usage counter reset at cycle boundary** — crossing cycle_end resets all counters to 0
    - **Property 17: Usage tracking isolation** — incrementing type T only affects type T
    - **Validates: Requirements 7.1, 7.2, 7.4, 7.5**

  - [ ] 8.3 Create GET /api/billing/usage route
    - Create `frontend/app/api/billing/usage/route.ts`
    - Return usage summary for authenticated user: current counts, limits, cycle reset date
    - Protected by JWT auth
    - _Requirements: 7.5, 8.2, 11.2_

- [ ] 9. Notification Service module
  - [ ] 9.1 Implement notification service with email dispatch
    - Create `frontend/lib/billing/notification-service.ts`
    - Implement `send(payload)` — dispatch transactional email based on type (trial_started, trial_expiring, payment_success, payment_failed, renewal_reminder, subscription_cancelled, plan_changed, welcome)
    - Implement `scheduleReminder(userId, type, sendAt, data)` — store scheduled notification for cron processing
    - Use existing email infrastructure or a provider like Resend/SendGrid
    - Build email templates for each billing event type
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [ ] 10. Transaction history and invoices
  - [ ] 10.1 Create GET /api/billing/transactions route
    - Create `frontend/app/api/billing/transactions/route.ts`
    - Return paginated payment history for authenticated user with date, amount, status, payment method
    - Protected by JWT auth
    - _Requirements: 8.3, 11.2_

  - [ ] 10.2 Create GET /api/billing/invoices/[id]/pdf route
    - Create `frontend/app/api/billing/invoices/[id]/pdf/route.ts`
    - Generate and serve PDF receipt for the specified invoice
    - Verify the invoice belongs to the authenticated user
    - Use a lightweight PDF generation library (e.g., `@react-pdf/renderer` or `pdfkit`)
    - _Requirements: 8.4, 8.5_

- [ ] 11. Admin Revenue Dashboard API
  - [ ] 11.1 Create GET /api/billing/admin/revenue route
    - Create `frontend/app/api/billing/admin/revenue/route.ts`
    - Calculate and return: MRR, ARR, total revenue, today's revenue, active subscriber count, trial count, churn rate, conversion rate, ARPU
    - Return plan distribution breakdown (subscriber count per plan)
    - Return revenue chart data (daily/monthly over selectable range)
    - Return 20 most recent transactions with user info
    - Protected by JWT auth + admin role check (HTTP 403 for non-admin)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 11.2_

  - [ ]* 11.2 Write property tests for revenue metrics (Properties 18, 19)
    - **Property 18: Revenue metrics calculation** — MRR = sum(monthly) + sum(yearly/12); ARR = MRR*12; ARPU = revenue/subscribers
    - **Property 19: Authorization enforcement** — no JWT → 401; non-admin JWT → 403
    - **Validates: Requirements 9.1, 9.2, 9.5, 9.7, 11.2**

- [ ] 12. Checkpoint - Backend modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Frontend - Pricing page
  - [ ] 13.1 Create pricing page and PricingCard component
    - Create `frontend/app/pricing/page.tsx` — public pricing page with all four plans
    - Create `frontend/components/billing/PricingCard.tsx` — individual plan card with features, price, CTA
    - Create `frontend/components/billing/PricingToggle.tsx` — monthly/yearly toggle with savings display
    - Card-based layout: side by side on desktop, stacked on mobile
    - Highlight Professional plan as "Most Popular" with accent ring
    - Dark mode support, glass effect cards, Framer Motion entrance animations
    - CTA: "Get Started" for Free, "Subscribe" for paid, "Current Plan" (disabled) for active
    - Fetch plans from GET /api/billing/plans; toggle updates prices in real time
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 13.2 Write property test for frontend payment status ignored (Property 20)
    - **Property 20: Frontend payment status ignored**
    - API requests with `paymentStatus` in body are ignored; status determined from DB only
    - **Validates: Requirements 11.1**

- [ ] 14. Frontend - Billing dashboard
  - [ ] 14.1 Create billing dashboard page and subscription status components
    - Create `frontend/app/billing/page.tsx` — billing dashboard with subscription info, usage, history
    - Create `frontend/components/billing/SubscriptionStatus.tsx` — current plan status banner with renewal date and next payment
    - Create `frontend/components/billing/UsageMeter.tsx` — progress bar for each usage type (prospect discovery, exports, AI credits)
    - Create `frontend/components/billing/PaymentHistory.tsx` — transaction list table with date, amount, status, method, download invoice
    - Fetch data from GET /api/billing/subscription, GET /api/billing/usage, GET /api/billing/transactions
    - Dark-first UI with TailwindCSS, Framer Motion animations
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 12.3_

  - [ ] 14.2 Create upgrade/downgrade modal and cancel modal
    - Create `frontend/components/billing/UpgradeModal.tsx` — plan change confirmation with proration display
    - Create `frontend/components/billing/CancelModal.tsx` — cancellation confirmation with access end date
    - Upgrade modal: show current plan, new plan, prorated amount, confirm button
    - Cancel modal: warn about losing features, show access end date, confirm/keep buttons
    - Wire to PATCH /api/billing/subscription with appropriate action
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 8.4_

  - [ ] 14.3 Create billing success and failure pages
    - Create `frontend/app/billing/success/page.tsx` — post-payment success with animation and subscription details
    - Create `frontend/app/billing/failed/page.tsx` — payment failure with retry option
    - Success page fetches updated subscription status and displays confirmation
    - Failure page provides "Try Again" button linking back to pricing/billing
    - _Requirements: 2.3, 2.4_

- [ ] 15. Frontend - Trial banner and admin dashboard
  - [ ] 15.1 Create trial banner and upgrade prompt components
    - Create `frontend/components/billing/TrialBanner.tsx` — countdown notification showing days remaining in trial
    - Display banner on all pages during trial period
    - Show upgrade modal when trial has 1 day remaining
    - Fetch trial status from subscription endpoint
    - _Requirements: 6.3, 6.4_

  - [ ] 15.2 Create admin revenue dashboard page
    - Create `frontend/app/admin/revenue/page.tsx` — admin-only revenue analytics
    - Create `frontend/components/billing/RevenueChart.tsx` — MRR/revenue line chart with time range selector
    - Display summary cards: MRR, ARR, total revenue, today's revenue
    - Display subscriber metrics: active count, trial count, churn rate, conversion rate, ARPU
    - Display plan distribution breakdown and recent transactions table
    - Use a charting library (e.g., Recharts) for revenue and growth charts
    - Restrict access to admin role; show 403 for non-admin users
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 16. Integration wiring and sidebar navigation
  - [ ] 16.1 Wire billing into app layout and sidebar navigation
    - Add "Billing" and "Pricing" links to `frontend/components/layout/Sidebar.tsx`
    - Add "Admin > Revenue" link (visible only to admin role)
    - Add trial banner to `frontend/app/layout.tsx` (conditional render for trialing users)
    - Integrate usage limit checks into existing prospect discovery, export, and AI features — call `checkUsage()` before actions
    - Wire `createTrial()` into registration flow (call on new user signup)
    - _Requirements: 6.1, 7.3, 8.4, 9.7_

  - [ ] 16.2 Add renewal cron job logic
    - Create `frontend/lib/billing/renewal-cron.ts` — logic to check due renewals and create invoices
    - Implement `checkDueRenewals(today)` — find active subscriptions where period_end <= today
    - For each due subscription, create renewal invoice via Payment Processor
    - Implement `checkExpiredTrials(today)` — find trialing subscriptions where trial_end <= today, transition to free
    - Implement `checkExpiredGracePeriods(today)` — find grace_period subscriptions where grace_period_end <= today, transition to free
    - Implement `sendRenewalReminders(today)` — find subscriptions with period_end in 3 days, send reminder email
    - Create API route `frontend/app/api/billing/cron/route.ts` to trigger from external cron service (protected by secret key)
    - _Requirements: 5.1, 5.3, 5.4, 6.5, 10.4_

- [ ] 17. Final checkpoint - Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between major phases
- Property tests use `fast-check` library and validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- All SQL uses `neon()` tagged template literals — no ORM
- All API routes use existing `getUserIdFromRequest()` and `unauthorized()` from `@/lib/auth-server`
- Frontend uses TailwindCSS 4 with dark-first design, Framer Motion for animations
- Xendit API calls use test/sandbox mode during development

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5", "3.6", "3.7", "3.8"] },
    { "id": 4, "tasks": ["5.1", "5.3", "8.1", "9.1"] },
    { "id": 5, "tasks": ["5.2", "5.4", "5.5", "6.1", "8.2", "8.3"] },
    { "id": 6, "tasks": ["6.2", "6.3", "10.1", "10.2"] },
    { "id": 7, "tasks": ["11.1", "11.2"] },
    { "id": 8, "tasks": ["13.1", "13.2"] },
    { "id": 9, "tasks": ["14.1", "14.2", "14.3"] },
    { "id": 10, "tasks": ["15.1", "15.2"] },
    { "id": 11, "tasks": ["16.1", "16.2"] }
  ]
}
```
