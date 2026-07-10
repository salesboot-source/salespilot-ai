# Implementation Plan: Revenue Intelligence Engine

## Overview

Transform SalesPilot AI from an AI writing tool into an AI Revenue Consultant by implementing 5 independent domain modules (Company Intelligence, Revenue Intelligence, Opportunity Scanner, Proposal Engine, Outreach Engine), a normalization layer, section registry, and new frontend pages (Dashboard, Heat Map, Report). The implementation uses TypeScript with Next.js on the frontend, Neon PostgreSQL for persistence, and fast-check for property-based testing.

## Tasks

- [ ] 1. Set up project structure, shared types, and AI provider interface
  - [ ] 1.1 Create the intelligence module directory structure and shared types
    - Create `frontend/lib/intelligence/` directory with subdirectories: `types/`, `company-intelligence/`, `revenue-intelligence/`, `opportunity-scanner/`, `proposal-engine/`, `outreach-engine/`
    - Create `frontend/lib/intelligence/types/score.ts` with the `EnrichedScore` interface
    - Create `frontend/lib/intelligence/types/report.ts` with the `NormalizedReport` interface
    - Create `frontend/lib/intelligence/types/shared.ts` with common types (`ModuleResult<T>`, etc.)
    - _Requirements: 1.6, 12.1_

  - [ ] 1.2 Implement the AIProvider interface and OpenAI implementation
    - Create `frontend/lib/intelligence/ai-provider.ts` with `PromptConfig`, `AIProviderResponse`, and `AIProvider` interface
    - Implement `OpenAIProvider` class using the existing OpenAI SDK dependency
    - Include error handling for rate limits, timeouts, and invalid responses per the error handling spec
    - _Requirements: 10.1, 10.2_

  - [ ] 1.3 Create the normalization layer
    - Create `frontend/lib/intelligence/normalization.ts` implementing `NormalizationLayer` interface
    - Implement `normalizeReport()` to combine all module outputs into a single `NormalizedReport`
    - Implement `denormalizeForStorage()` to produce the database storage payload
    - Implement `hydrateFromStorage()` to reconstruct a `NormalizedReport` from a database row
    - Implement `getNextVersion()` pure function for sequential version management
    - _Requirements: 9.1, 9.4, 12.1_

- [ ] 2. Implement Company Intelligence module
  - [ ] 2.1 Implement Company Intelligence types and prompt builder
    - Create `frontend/lib/intelligence/company-intelligence/types.ts` with `ResearchInput` and `CompanyProfile` interfaces
    - Create `frontend/lib/intelligence/company-intelligence/prompts.ts` with prompt construction for company research
    - _Requirements: 1.6_

  - [ ] 2.2 Implement Company Intelligence module logic
    - Create `frontend/lib/intelligence/company-intelligence/index.ts` implementing `CompanyIntelligenceModule`
    - Implement `gatherIntelligence()` method that calls AIProvider, validates response, and returns typed `CompanyProfile`
    - Include error isolation with `ModuleResult<CompanyProfile>` pattern
    - _Requirements: 1.6, 10.1_

- [ ] 3. Implement Revenue Intelligence module
  - [ ] 3.1 Implement Revenue Intelligence types and prompt builder
    - Create `frontend/lib/intelligence/revenue-intelligence/types.ts` with `RevenueScores` interface
    - Create `frontend/lib/intelligence/revenue-intelligence/prompts.ts` with `PromptBuilder` for scoring prompts
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 3.2 Implement Score Validator
    - Create `frontend/lib/intelligence/revenue-intelligence/validator.ts` implementing `ScoreValidator`
    - Implement `validate()` to parse raw AI response into typed `RevenueScores`
    - Implement `clampScore()` to enforce [0, 100] range for all percentage scores
    - Implement `enrichScore()` helper to construct `EnrichedScore` objects
    - Ensure deal size min <= max invariant, non-negative values
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 3.3 Implement Revenue Intelligence module logic
    - Create `frontend/lib/intelligence/revenue-intelligence/index.ts` implementing `RevenueIntelligenceModule`
    - Implement `computeScores()` method that uses PromptBuilder, calls AIProvider, and validates with ScoreValidator
    - Preserve v0.3 scores (opportunityScore, buyingIntent, digitalMaturity) alongside new scores
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 3.4 Write property tests for revenue score validation (P1, P2)
    - **Property 1: Revenue score validation** — validate that ScoreValidator produces EnrichedScore objects with value in [0,100], non-empty explanation, confidence in [0,100], and non-empty evidence array
    - **Property 2: Deal size range invariant** — validate dealSize.min <= dealSize.max, both non-negative
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [ ] 4. Implement Opportunity Scanner module
  - [ ] 4.1 Implement Opportunity Scanner types
    - Create `frontend/lib/intelligence/opportunity-scanner/types.ts` with `Verdict`, `DashboardMetrics`, `CompanyReportSummary`, `SortCriterion`, and `ScoreChange` interfaces
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 7.1_

  - [ ] 4.2 Implement verdict calculation
    - Create `frontend/lib/intelligence/opportunity-scanner/verdict.ts` implementing `computeVerdict()` pure function
    - Apply weighted formula: Revenue Potential 30%, Urgency 25%, Decision Maker Confidence 20%, Competition Risk (inverse) 15%, Deal Size 10%
    - Map to stars: clamp(1, 5, round(weightedScore / 20))
    - Map stars to action labels: {5: "Pursue Immediately", 4: "Strong Opportunity", 3: "Worth Exploring", 2: "Low Priority", 1: "Skip"}
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 4.3 Implement dashboard aggregation functions
    - Create `frontend/lib/intelligence/opportunity-scanner/dashboard.ts` with pure functions
    - Implement `computeDashboardMetrics()`: aggregate revenue potential (sum of dealSizeMax where aiVerdictStars >= 4), high intent count (buyingIntent === 'High' AND urgencyScore > 70), top opportunities (max 10, sorted by stars desc then revenue desc), contact today (actionDate equals today), losing momentum (report older than 14 days AND urgencyScore > 60), recently researched (5 most recent)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 4.4 Implement heat map sorting and color coding
    - Create `frontend/lib/intelligence/opportunity-scanner/heatmap.ts` with pure functions
    - Implement `sortReports()` for all SortCriterion values (descending order)
    - Implement `getScoreColor()`: green >= 75, amber 50-74, red <= 49
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ] 4.5 Implement version comparison
    - Add `compareVersions()` to `frontend/lib/intelligence/opportunity-scanner/index.ts`
    - Compare all numeric and string fields, classify direction as 'up', 'down', or 'same'
    - Return non-empty `ScoreChange[]` when reports differ
    - _Requirements: 9.3_

  - [ ]* 4.6 Write property tests for verdict calculation (P9)
    - **Property 9: Verdict calculation correctness** — validate weighted formula, star clamping, and action label mapping for random score inputs
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5**

  - [ ]* 4.7 Write property tests for dashboard aggregations (P10, P11, P12, P14)
    - **Property 10: Aggregate revenue potential** — sum of dealSizeMax where aiVerdictStars >= 4
    - **Property 11: High intent count** — count where buyingIntent === 'High' AND urgencyScore > 70
    - **Property 12: Top opportunities ordering** — max 10 entries, sorted correctly
    - **Property 14: Losing momentum filtering** — older than 14 days AND urgencyScore > 60
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

  - [ ]* 4.8 Write property tests for heat map (P15, P16)
    - **Property 15: Score color coding** — green >= 75, amber 50-74, red <= 49
    - **Property 16: Heat map sort correctness** — descending order for all criteria
    - **Validates: Requirements 7.2, 7.4, 11.2**

  - [ ]* 4.9 Write property tests for version comparison (P19)
    - **Property 19: Version comparison correctness** — identifies all differing fields with correct direction classification
    - **Validates: Requirements 9.3**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Proposal Engine module
  - [ ] 6.1 Implement Proposal Engine types and prompt builder
    - Create `frontend/lib/intelligence/proposal-engine/types.ts` with `ServiceRecommendation`, `SalesBlueprintStep`, `ObjectionEntry`, and `ProposalOutput` interfaces
    - Create `frontend/lib/intelligence/proposal-engine/prompts.ts` with prompt construction for service recommendations, sales blueprint, and objection intelligence
    - _Requirements: 2.1, 3.1, 3.2, 4.1_

  - [ ] 6.2 Implement Proposal Engine module logic
    - Create `frontend/lib/intelligence/proposal-engine/index.ts` implementing `ProposalEngineModule`
    - Implement `generateRecommendations()` that produces 3-10 service recommendations ordered by probability descending
    - Filter recommendations against user's service catalog when provided
    - Generate 7-step sales blueprint personalized by industry, size, and pain points
    - Generate objection intelligence with all 4 categories, budget severity detection for small/declining companies
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

  - [ ]* 6.3 Write property tests for service recommendations (P4, P5, P6)
    - **Property 4: Service recommendations structure** — array length 3-10, probability in [0,100], valid estimatedValue ranges
    - **Property 5: Service recommendations ordering** — ordered by probability descending
    - **Property 6: Service catalog filtering** — all recommended services are members of user catalog
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [ ]* 6.4 Write property tests for objection intelligence (P7, P8)
    - **Property 7: Objection intelligence completeness** — at least 4 entries, all categories present, severity values in {33, 66, 100}
    - **Property 8: Budget constraint severity detection** — High severity for small/declining companies with no funding
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 6.5 Write property tests for sales blueprint (P18)
    - **Property 18: Sales blueprint step structure** — valid channel, non-empty timing, talkingPoints, and sampleMessage
    - **Validates: Requirements 3.2**

- [ ] 7. Implement Outreach Engine module
  - [ ] 7.1 Implement Outreach Engine types and prompt builder
    - Create `frontend/lib/intelligence/outreach-engine/types.ts` with `TimelineAction` and `TimelineOutput` interfaces
    - Create `frontend/lib/intelligence/outreach-engine/prompts.ts` with timeline prompt construction personalized by digital presence
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 7.2 Implement Outreach Engine module logic
    - Create `frontend/lib/intelligence/outreach-engine/index.ts` implementing `OutreachEngineModule`
    - Implement `buildTimeline()` producing minimum 6 action steps with day offsets (1, 2, 4, 7, 10, 14)
    - Implement `computeActionDates()` to convert day offsets to absolute dates from report generation date
    - Implement `getContactToday()` to filter timeline actions where actionDate matches today
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 6.4_

  - [ ]* 7.3 Write property tests for AI timeline (P13, P17)
    - **Property 13: Contact today filtering** — returns exactly those entries where actionDate equals today
    - **Property 17: AI Timeline structure** — at least 6 entries, positive day, valid fields
    - **Validates: Requirements 6.4, 8.1, 8.3**

- [ ] 8. Implement database schema and persistence layer
  - [ ] 8.1 Create database migration for v0.4 schema changes
    - Create migration file to add new columns to `company_reports` table: revenue_potential, deal_size_min, deal_size_max, urgency_score, decision_maker_confidence, competition_risk, ai_verdict_stars, ai_verdict_label, prompt_version
    - Create performance indexes for dashboard and heat map queries
    - _Requirements: 12.1, 12.4_

  - [ ] 8.2 Create ai_timeline_actions table migration
    - Create the `ai_timeline_actions` table with all columns (id, user_id, report_id, company_name, action_date, day_number, action_type, channel, description, priority, completed, created_at)
    - Add foreign key constraints and cascade delete rules
    - Create indexes for user+date and report queries
    - _Requirements: 8.1, 12.2, 12.3_

  - [ ] 8.3 Implement database query functions
    - Create `frontend/lib/intelligence/db.ts` with typed query functions
    - Implement: `persistReport()`, `getReportById()`, `getReportsByUser()`, `getVersionHistory()`, `persistTimelineActions()`, `getTimelineActionsByDate()`, `queryReports()` (by userId, companyName, dateRange, aiVerdictStars, buyingIntent)
    - _Requirements: 9.1, 9.2, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 8.4 Write property tests for version management and metadata (P20, P21)
    - **Property 20: Version number sequential invariant** — strictly increasing sequence starting from 1 with no gaps
    - **Property 21: Knowledge memory metadata completeness** — stored rows contain all required fields
    - **Validates: Requirements 9.1, 9.4**

- [ ] 9. Implement API routes (orchestration layer)
  - [ ] 9.1 Implement POST /api/research orchestrator endpoint
    - Create/update `frontend/app/api/research/route.ts` to orchestrate all 5 modules in sequence
    - Load user's company profile, execute Company Intelligence → Revenue Intelligence → Proposal Engine → Opportunity Scanner → Outreach Engine
    - Normalize output via NormalizationLayer, persist to database, return NormalizedReport
    - Handle partial report generation (return completed sections on timeout)
    - Provide progressive status messaging
    - _Requirements: 10.1, 10.2, 10.3, 9.1, 9.4_

  - [ ] 9.2 Implement GET /api/dashboard endpoint
    - Create `frontend/app/api/dashboard/route.ts`
    - Query user's reports and timeline actions, compute DashboardMetrics via OpportunityScannerModule
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 9.3 Implement GET /api/heatmap endpoint
    - Create `frontend/app/api/heatmap/route.ts`
    - Query user's CompanyReportSummary data, apply sorting via OpportunityScannerModule
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 9.4 Implement report version endpoints
    - Create `frontend/app/api/reports/[id]/versions/route.ts` for version history
    - Create `frontend/app/api/reports/[id]/compare/route.ts` for version comparison
    - _Requirements: 9.2, 9.3_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement frontend Section Registry and report rendering
  - [ ] 11.1 Implement Section Registry
    - Create `frontend/lib/intelligence/section-registry.ts` with `SectionDefinition`, `SectionSchema`, and `SectionRegistry` interfaces and implementation
    - Register all report sections: Company Overview, Revenue Scores, Service Recommendations, Sales Blueprint, Objection Intelligence, AI Verdict, AI Timeline
    - _Requirements: 11.1, 11.4_

  - [ ] 11.2 Create section renderer components
    - Create `frontend/components/intelligence/renderers/` directory with renderer components for each section type: `ScoresRenderer`, `ListRenderer`, `StepsRenderer`, `TableRenderer`, `VerdictRenderer`, `TimelineRenderer`, `TextRenderer`
    - Apply color-coded score indicators (green >= 75, amber 50-74, red <= 49)
    - Render AI Verdict with filled star icons and action label
    - _Requirements: 11.2, 11.3, 11.4_

  - [ ] 11.3 Implement the intelligence report page
    - Create `frontend/app/research/[id]/page.tsx` (or update existing research page) for full report display
    - Implement sticky sidebar navigation for section jumping
    - Render sections dynamically via SectionRegistry
    - Implement collapsible cards for each section
    - Implement keyboard shortcuts: j (next section), k (previous section), e (export)
    - Apply dark-mode-optimized color palette with WCAG AA contrast
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ] 11.4 Implement service recommendation editing
    - Add inline editing capability for service recommendation priorities
    - Add ability to remove recommended services
    - Persist modifications via API call to update stored report
    - _Requirements: 11.7_

- [ ] 12. Implement Revenue Dashboard page
  - [ ] 12.1 Create the Revenue Dashboard page
    - Create `frontend/app/dashboard/page.tsx` (update existing or create new)
    - Display aggregate Revenue Potential metric, High Intent Companies count, Top Opportunities list, Contact Today list, Losing Momentum list, Recently Researched list
    - Implement empty state when no companies researched
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 13. Implement Company Heat Map page
  - [ ] 13.1 Create the Company Heat Map page
    - Create `frontend/app/heatmap/page.tsx`
    - Display all researched companies as sortable ranked list
    - Implement sort controls for all criteria (Opportunity Score, Deal Size Max, Buying Intent, Urgency Score, Newest)
    - Display per-company: name, AI Verdict stars, Revenue Potential, Deal Size range, Urgency Score
    - Apply score color coding (green/amber/red)
    - Implement click-through navigation to full intelligence report
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 14. Implement report version history and comparison UI
  - [ ] 14.1 Create version history and comparison views
    - Add version history panel to report page showing all versions with stars and revenue potential
    - Implement version comparison side-by-side view highlighting score changes
    - Use `compareVersions()` from Opportunity Scanner for change detection
    - _Requirements: 9.2, 9.3_

- [ ] 15. Implement progressive loading and partial report handling
  - [ ] 15.1 Add progressive status UI and partial report support
    - Add loading states with progressive status messages indicating current processing section
    - Handle partial report responses: render completed sections, show "Incomplete" badge on missing sections with "Regenerate" button
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 16. Wire navigation and integrate with existing layout
  - [ ] 16.1 Update sidebar navigation and routing
    - Add Dashboard, Heat Map, and Report links to existing Sidebar component
    - Ensure routes are protected behind authentication
    - Wire all new pages into the existing AppLayout
    - _Requirements: 6.7, 7.5_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript (Next.js frontend with server-side API routes)
- Database is Neon PostgreSQL, accessed via the existing `lib/db.ts` utility
- All modules use dependency injection via constructor parameters for testability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "3.1", "6.1", "7.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.2", "4.3", "4.4", "4.5", "6.2", "7.2"] },
    { "id": 4, "tasks": ["3.4", "4.6", "4.7", "4.8", "4.9", "6.3", "6.4", "6.5", "7.3"] },
    { "id": 5, "tasks": ["8.1", "8.2"] },
    { "id": 6, "tasks": ["8.3", "8.4"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.4"] },
    { "id": 8, "tasks": ["11.1"] },
    { "id": 9, "tasks": ["11.2", "11.3", "11.4"] },
    { "id": 10, "tasks": ["12.1", "13.1", "14.1", "15.1"] },
    { "id": 11, "tasks": ["16.1"] }
  ]
}
```
