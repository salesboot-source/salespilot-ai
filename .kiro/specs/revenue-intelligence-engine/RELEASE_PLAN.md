# Release Plan: Revenue Intelligence Engine

## Principles

- Each release is independently deployable, demoable, and rollback-safe
- No unfinished UI ships — every page is complete or not present
- The codebase remains deployable after every release
- Releases are sequential — never implement multiple simultaneously

---

## Release 0.4.0 — AI Decision Engine

**Theme:** Answer "Should I contact them? How much is this opportunity worth?"

### Tasks Included

| Task | Description |
|------|-------------|
| 1.1 | Create intelligence module directory structure and shared types |
| 1.2 | Implement AIProvider interface and OpenAI implementation |
| 1.3 | Create normalization layer |
| 2.1 | Company Intelligence types and prompt builder |
| 2.2 | Company Intelligence module logic |
| 3.1 | Revenue Intelligence types and prompt builder |
| 3.2 | Implement Score Validator |
| 3.3 | Revenue Intelligence module logic |
| 3.4* | Property tests for revenue score validation (P1, P2) |
| 4.1 | Opportunity Scanner types |
| 4.2 | Verdict calculation |
| 4.6* | Property tests for verdict calculation (P9) |
| 8.1 | Database migration for v0.4 schema changes |
| 8.3 | Database query functions (persistReport, getReportById, getReportsByUser subset) |
| 9.1 | POST /api/research orchestrator (partial — Company Intelligence + Revenue Intelligence + Verdict only) |
| 11.1 | Section Registry (register: Company Overview, Revenue Scores, AI Verdict) |
| 11.2 | Section renderers: ScoresRenderer, VerdictRenderer, TextRenderer |
| 11.3 | Intelligence report page (partial — sidebar nav, collapsible cards, keyboard shortcuts, for available sections) |
| 15.1 | Progressive loading and partial report handling |

### Expected UI Changes

- **Research page** now displays a premium intelligence report with:
  - Company Overview section (executive summary, overview, tech stack, digital presence, pain points)
  - Revenue Scores section (5 new scores + 3 preserved v0.3 scores, all color-coded)
  - AI Verdict section (1-5 stars with action label and explanation)
  - Progressive loading indicators during generation
  - "Incomplete" badge on missing sections (service recs, blueprint, etc.) with note that they are coming soon
  - Sticky sidebar navigation, collapsible cards, keyboard shortcuts (j/k/e)
  - Dark-mode color palette with WCAG AA contrast
- No new pages (Dashboard, Heat Map) yet — sidebar links are not added

### API Changes

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/research` | POST | Updated to use new module pipeline (Company Intel → Revenue Intel → Verdict). Returns NormalizedReport with `status: 'partial'` and `incompleteSections: ['serviceRecommendations', 'salesBlueprint', 'objectionIntelligence', 'timeline']` |

### Database Changes

- **ALTER** `company_reports`: Add columns `revenue_potential`, `deal_size_min`, `deal_size_max`, `urgency_score`, `decision_maker_confidence`, `competition_risk`, `ai_verdict_stars`, `ai_verdict_label`, `prompt_version`
- **CREATE** performance indexes: `idx_reports_user_verdict`, `idx_reports_user_urgency`, `idx_reports_user_revenue`, `idx_reports_user_intent`, `idx_reports_user_created`

### Acceptance Criteria

1. User enters a company name → receives revenue scores within 60s
2. All 5 revenue scores display as color-coded EnrichedScore cards (value, explanation, confidence, evidence)
3. AI Verdict displays 1-5 filled stars with correct action label
4. Deal Size shows min-max range in USD
5. v0.3 scores (opportunityScore, buyingIntent, digitalMaturity) still appear alongside new scores
6. Progressive status messages appear during generation ("Analyzing company...", "Computing scores...", "Generating verdict...")
7. Report page renders with sticky sidebar, collapsible cards, keyboard nav
8. Partial report gracefully shows completed sections and marks others as incomplete
9. Score color coding: green ≥ 75, amber 50-74, red ≤ 49
10. Property tests P1, P2, P9 pass (if implemented)

### Manual Testing Checklist

- [ ] Research a known company → verify all revenue scores are in [0,100]
- [ ] Verify Deal Size min ≤ max
- [ ] Verify AI Verdict stars match weighted formula expectations
- [ ] Verify progressive status messages appear in sequence
- [ ] Test with slow network — confirm partial report renders
- [ ] Verify keyboard shortcuts j/k/e work
- [ ] Verify sidebar sticky behavior on scroll
- [ ] Collapse/expand each section
- [ ] Verify dark mode contrast passes visual check
- [ ] Verify existing v0.3 research flow still works for companies researched before migration
- [ ] Verify new columns default correctly for pre-existing rows

### Deployment Checklist

- [ ] Run database migration (ALTER TABLE + CREATE INDEX) against production
- [ ] Verify migration is backward-compatible (new columns have defaults)
- [ ] Deploy frontend build
- [ ] Verify `/api/research` responds correctly
- [ ] Smoke test: research one company end-to-end
- [ ] Verify no console errors on report page
- [ ] Confirm old reports still load correctly (hydration from storage)

### Rollback Plan

1. **Frontend:** Redeploy previous frontend build (no new routes added)
2. **API:** Previous `/api/research` route.ts is overwritten — rollback via git revert + redeploy
3. **Database:** New columns have defaults and are nullable — no data loss. Can be dropped with: `ALTER TABLE company_reports DROP COLUMN revenue_potential, deal_size_min, deal_size_max, urgency_score, decision_maker_confidence, competition_risk, ai_verdict_stars, ai_verdict_label, prompt_version;` and dropping indexes
4. **Risk:** Low — additive changes only, no destructive schema modifications

---

## Release 0.4.1 — Service Recommendation

**Theme:** Answer "What should I sell them?"

### Tasks Included

| Task | Description |
|------|-------------|
| 6.1 | Proposal Engine types and prompt builder (serviceRecommendations portion) |
| 6.2 | Proposal Engine module logic (generateRecommendations — service recommendations only, no blueprint/objections yet) |
| 6.3* | Property tests for service recommendations (P4, P5, P6) |
| 11.2 | Section renderer: ListRenderer (for service recommendations) |
| 11.4 | Service recommendation inline editing (priority edit, remove) |
| 9.1 | Update POST /api/research to include Proposal Engine (service recommendations only) |

### Expected UI Changes

- **Report page** gains a new section: **Service Recommendations**
  - 3-10 ranked services with probability percentage, expected ROI, estimated value range
  - Color-coded probability scores
  - Inline editing: user can adjust priority or remove recommendations
  - Edits persist to stored report
- Report `status` upgrades: `incompleteSections` no longer includes `serviceRecommendations`
- Section Registry updated with Service Recommendations entry

### API Changes

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/research` | POST | Now includes `serviceRecommendations` array in NormalizedReport. `incompleteSections` reduced to `['salesBlueprint', 'objectionIntelligence', 'timeline']` |
| `/api/research` | PATCH | New — persists inline edits to service recommendations |

### Database Changes

- None — service recommendations stored in existing JSONB `output` column

### Acceptance Criteria

1. Report shows 3-10 service recommendations ordered by probability descending
2. Each recommendation shows: service name, probability %, expected ROI, estimated value range
3. When user's company profile has a service catalog, only those services appear
4. User can edit recommendation priority inline
5. User can remove a recommendation — it disappears and persists on reload
6. Property tests P4, P5, P6 pass (if implemented)

### Manual Testing Checklist

- [ ] Research a company → verify 3-10 service recommendations appear
- [ ] Verify recommendations are sorted by probability descending
- [ ] Set up a user company profile with 3 specific services → verify only those appear
- [ ] Edit a recommendation priority → reload page → verify edit persisted
- [ ] Remove a recommendation → reload → verify it's gone
- [ ] Research a company with no user catalog → verify full catalog appears
- [ ] Verify estimated value min ≤ max for all recommendations

### Deployment Checklist

- [ ] Deploy frontend build
- [ ] Verify `/api/research` now returns `serviceRecommendations`
- [ ] Smoke test: research company, verify recommendations section renders
- [ ] Test inline editing flow
- [ ] Verify old reports without recommendations still load (graceful empty state)

### Rollback Plan

1. **Frontend:** Redeploy previous build — Section Registry won't include recommendations
2. **API:** Revert route.ts — Proposal Engine won't be called
3. **Database:** No schema changes — JSONB data with recommendations is harmless to old code (ignored)
4. **Risk:** Very low — additive only

---

## Release 0.4.2 — Sales Blueprint

**Theme:** Answer "How should I approach them?"

### Tasks Included

| Task | Description |
|------|-------------|
| 6.1 | Proposal Engine prompts (sales blueprint + objection portions) |
| 6.2 | Proposal Engine module logic (full — add blueprint and objection generation) |
| 6.4* | Property tests for objection intelligence (P7, P8) |
| 6.5* | Property tests for sales blueprint (P18) |
| 11.2 | Section renderers: StepsRenderer (blueprint), TableRenderer (objections) |
| 9.1 | Update POST /api/research to include full Proposal Engine output |

### Expected UI Changes

- **Report page** gains two new sections:
  - **Sales Blueprint** — 7-step plan displayed as sequential cards with channel icons, timing, talking points, and sample messages
  - **Objection Intelligence** — table with 4+ objections showing category, objection statement, severity (color-coded), rebuttal, and supporting evidence
- Report `status` upgrades: `incompleteSections` reduced to `['timeline']`
- Budget objection highlighted with High severity badge for small/declining companies

### API Changes

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/research` | POST | Now includes `salesBlueprint` and `objectionIntelligence` in NormalizedReport. `incompleteSections` reduced to `['timeline']` |

### Database Changes

- None — stored in existing JSONB `output` column

### Acceptance Criteria

1. Sales Blueprint shows exactly 7 steps in correct sequence
2. Each step has: channel icon, timing, talking points (bulleted), sample message
3. Blueprint is personalized (references company's industry, size, and pain points from Company Intelligence)
4. Objection Intelligence shows minimum 4 entries covering all categories
5. Budget objection is High severity for small/declining companies with no funding
6. Severity color coding: High = red, Medium = amber, Low = green
7. Property tests P7, P8, P18 pass (if implemented)

### Manual Testing Checklist

- [ ] Research a large enterprise company → verify budget severity is NOT High
- [ ] Research a small declining company → verify budget severity IS High
- [ ] Verify all 7 blueprint steps render with correct channel icons
- [ ] Verify blueprint references the target company's specific industry
- [ ] Verify all 4 objection categories present (Budget, Timing, Existing Vendor, Internal Team)
- [ ] Verify sample messages are non-empty and contextual
- [ ] Verify old reports (pre-0.4.2) still load without blueprint/objections sections

### Deployment Checklist

- [ ] Deploy frontend build
- [ ] Verify `/api/research` now returns full `salesBlueprint` and `objectionIntelligence`
- [ ] Smoke test: research company, verify both new sections render
- [ ] Test with various company sizes to verify budget severity logic
- [ ] Verify partial reports still handle missing sections gracefully

### Rollback Plan

1. **Frontend:** Redeploy previous build — blueprint/objection renderers won't be registered
2. **API:** Revert to previous route.ts — Proposal Engine generates recommendations only
3. **Database:** No schema changes — JSONB data is ignored by older code
4. **Risk:** Very low — additive only

---

## Release 0.5.0 — Opportunity Radar

**Theme:** Pipeline visibility — "Which companies should I focus on today?"

### Tasks Included

| Task | Description |
|------|-------------|
| 4.3 | Dashboard aggregation functions |
| 4.4 | Heat map sorting and color coding |
| 4.7* | Property tests for dashboard aggregations (P10, P11, P12, P14) |
| 4.8* | Property tests for heat map (P15, P16) |
| 7.1 | Outreach Engine types and prompt builder |
| 7.2 | Outreach Engine module logic |
| 7.3* | Property tests for AI Timeline (P13, P17) |
| 8.2 | Create ai_timeline_actions table migration |
| 8.3 | Database query functions (remaining — persistTimelineActions, getTimelineActionsByDate, queryReports) |
| 9.1 | Update POST /api/research to include full pipeline (add Outreach Engine) |
| 9.2 | GET /api/dashboard endpoint |
| 9.3 | GET /api/heatmap endpoint |
| 11.2 | Section renderer: TimelineRenderer |
| 12.1 | Revenue Dashboard page |
| 13.1 | Company Heat Map page |
| 16.1 | Update sidebar navigation and routing |

### Expected UI Changes

- **NEW: Revenue Dashboard page** (`/dashboard` — replaces or enhances existing)
  - Aggregate Revenue Potential metric (sum of dealSizeMax for 4-5 star companies)
  - High Intent Companies count badge
  - Top Opportunities list (max 10, clickable to full report)
  - "Contact Today" list (today's timeline actions)
  - "Losing Momentum" list (stale high-urgency companies)
  - "Recently Researched" list (5 most recent)
  - Empty state when no companies researched
- **NEW: Company Heat Map page** (`/heatmap`)
  - Sortable ranked list of all researched companies
  - Sort controls: Opportunity Score, Deal Size Max, Buying Intent, Urgency Score, Newest
  - Per-company row: name, AI Verdict stars, Revenue Potential, Deal Size range, Urgency Score
  - Color-coded scores (green/amber/red)
  - Click-through to full intelligence report
- **Report page** gains final section: **AI Timeline**
  - Day-by-day action plan (min 6 steps)
  - Each step: day number, date, action type, channel, description, priority
  - Personalized by digital presence
- **Sidebar** updated with Dashboard and Heat Map navigation links
- Report `status` now always `'complete'` — no more `incompleteSections`

### API Changes

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/research` | POST | Full pipeline — all 5 modules. Returns complete NormalizedReport with `status: 'complete'` |
| `/api/dashboard` | GET | New — returns DashboardMetrics |
| `/api/heatmap` | GET | New — returns sorted CompanyReportSummary[] (accepts `?sort=` param) |

### Database Changes

- **CREATE TABLE** `ai_timeline_actions` with columns: id, user_id, report_id, company_name, action_date, day_number, action_type, channel, description, priority, completed, created_at
- **CREATE INDEX** `idx_timeline_user_date` on (user_id, action_date)
- **CREATE INDEX** `idx_timeline_report` on (report_id)
- **Foreign keys**: user_id → users(id) CASCADE, report_id → company_reports(id) CASCADE

### Acceptance Criteria

1. Dashboard shows correct aggregate Revenue Potential (sum of dealSizeMax where stars ≥ 4)
2. High Intent count matches companies with buyingIntent='High' AND urgencyScore > 70
3. Top Opportunities list has max 10 entries, sorted by stars desc then revenue desc
4. "Contact Today" shows only today's timeline actions
5. "Losing Momentum" shows reports older than 14 days with urgencyScore > 60
6. Heat Map displays all researched companies with correct color coding
7. Heat Map sorting works for all 5 criteria
8. Clicking a company in Heat Map navigates to its full report
9. AI Timeline section shows min 6 dated action steps in report
10. Timeline is personalized based on company's digital presence
11. Sidebar shows Dashboard and Heat Map links (authenticated users only)
12. Empty state displays correctly when no companies researched
13. Property tests P10, P11, P12, P13, P14, P15, P16, P17 pass (if implemented)

### Manual Testing Checklist

- [ ] Research 3+ companies → verify Dashboard aggregates correctly
- [ ] Verify "Contact Today" matches timeline actions for today's date
- [ ] Verify "Losing Momentum" by checking a report older than 14 days with high urgency
- [ ] Sort Heat Map by each criterion → verify order is correct
- [ ] Verify color coding on Heat Map scores
- [ ] Click company in Heat Map → verify navigation to report page
- [ ] Research a company → verify AI Timeline section with 6+ steps
- [ ] Verify timeline uses correct day offsets (1, 2, 4, 7, 10, 14)
- [ ] Verify sidebar links appear only when authenticated
- [ ] Test empty state (new user with no research) on Dashboard
- [ ] Verify cascade delete: delete a report → timeline actions removed

### Deployment Checklist

- [ ] Run database migration: CREATE TABLE ai_timeline_actions + indexes
- [ ] Deploy frontend build
- [ ] Verify `/api/dashboard` responds correctly
- [ ] Verify `/api/heatmap` responds correctly with sort parameter
- [ ] Verify `/api/research` now returns complete reports with timeline
- [ ] Smoke test: research a company → check Dashboard updates → check Heat Map entry
- [ ] Verify sidebar navigation renders correctly
- [ ] Test on mobile viewport (Dashboard and Heat Map responsive)

### Rollback Plan

1. **Frontend:** Redeploy previous build — Dashboard and Heat Map pages removed, sidebar reverts
2. **API:** Revert route files — dashboard/heatmap endpoints disappear, research returns partial
3. **Database:** DROP TABLE ai_timeline_actions (data loss for timeline only — acceptable since it's regenerable). No changes needed to company_reports.
4. **Risk:** Medium — new table creation, but CASCADE rules make cleanup safe. Timeline data is regenerable.

---

## Release 0.5.1 — Knowledge Memory

**Theme:** "How has this opportunity changed over time?"

### Tasks Included

| Task | Description |
|------|-------------|
| 4.5 | Version comparison logic |
| 4.9* | Property tests for version comparison (P19) |
| 8.3 | Database query functions (getVersionHistory subset) |
| 8.4* | Property tests for version management (P20, P21) |
| 9.4 | Report version endpoints (GET /api/reports/[id]/versions, GET /api/reports/[id]/compare) |
| 14.1 | Version history and comparison UI |

### Expected UI Changes

- **Report page** gains:
  - **Version history panel** showing all previous versions with: version number, AI Verdict stars, Revenue Potential, generation date
  - Click any version to load that historical report
  - **"Compare" button** to open side-by-side comparison view
- **Version comparison view:**
  - Two reports displayed side-by-side
  - Changed scores highlighted with up/down arrows and color (green for improvement, red for decline)
  - New/removed recommendations called out

### API Changes

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/reports/[id]/versions` | GET | New — returns version history list |
| `/api/reports/[id]/compare` | GET | New — accepts `?v1=N&v2=M`, returns both reports + ScoreChange[] |

### Database Changes

- None — version data already stored in company_reports table (version column exists from v0.3). Query functions leverage existing schema.

### Acceptance Criteria

1. Version history panel lists all versions for a company, ordered by version desc
2. Each version entry shows: version number, stars, revenue potential, date
3. Clicking a historical version loads that complete report
4. Compare view shows two reports side-by-side
5. All changed numeric scores show direction arrows (up/down/same)
6. String field changes (buyingIntent level change) are highlighted
7. Version numbers are sequential with no gaps (unless generation failed)
8. Re-researching a company increments version correctly
9. Property tests P19, P20, P21 pass (if implemented)

### Manual Testing Checklist

- [ ] Research a company twice → verify version history shows 2 entries
- [ ] Click older version → verify historical report loads
- [ ] Compare v1 vs v2 → verify changed scores highlighted
- [ ] Verify direction arrows are correct (if score went up, arrow is green/up)
- [ ] Research 5 times → verify versions are 1, 2, 3, 4, 5 sequentially
- [ ] Verify first-time research shows version history panel with single entry
- [ ] Test compare with identical reports → verify "same" indicators

### Deployment Checklist

- [ ] Deploy frontend build
- [ ] Verify `/api/reports/[id]/versions` returns correct data
- [ ] Verify `/api/reports/[id]/compare` returns diff data
- [ ] Smoke test: compare two versions of same company
- [ ] Verify reports generated before this release show in version history
- [ ] Verify no performance regression on report page load

### Rollback Plan

1. **Frontend:** Redeploy previous build — version panel and compare view disappear
2. **API:** Revert version endpoint files — 404 on version/compare routes
3. **Database:** No changes — nothing to undo
4. **Risk:** Very low — purely additive UI and read-only endpoints

---

## Release Sequence Summary

```
v0.4.0  AI Decision Engine       → Revenue Scores + AI Verdict + Report UI
v0.4.1  Service Recommendation   → Ranked services + inline editing
v0.4.2  Sales Blueprint          → 7-step plan + objection intelligence
v0.5.0  Opportunity Radar        → Dashboard + Heat Map + AI Timeline
v0.5.1  Knowledge Memory         → Version history + comparison
```

## Cross-Release Rules

1. **Never implement multiple releases simultaneously** — complete and deploy one before starting the next
2. **Each release is independently rollback-safe** — rolling back release N does not break releases 1..N-1
3. **No unfinished UI** — if a page isn't complete, it doesn't appear in navigation
4. **Feature flags not required** — each release is small enough to ship without conditional logic
5. **Property tests are optional per release** (marked with *) but recommended before shipping
6. **Existing data compatibility** — every release gracefully handles reports generated by prior versions
