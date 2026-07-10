# Requirements Document

## Introduction

The Revenue Intelligence Engine (v0.4) upgrades SalesPilot AI from an AI writing tool into an AI Revenue Consultant. Building on the existing AI Company Intelligence Engine (v0.3) — which generates executive summaries, company overviews, technology stacks, scoring, pain points, and sales strategies — the v0.4 engine adds revenue-focused scoring, service recommendation rankings, a multi-step sales blueprint, objection intelligence, an AI verdict system, a revenue dashboard, a company heat map, an AI timeline, and knowledge memory. The goal: a user enters one company name and receives a professional consulting report that answers "Should I contact them? What should I sell? How much is this opportunity worth? What should I do next?" — all within 60 seconds.

## Glossary

- **Revenue_Intelligence_Engine**: The v0.4 AI system that generates revenue-focused intelligence reports from company research data
- **Report_Generator**: The AI component that produces the full intelligence report including revenue scoring, service recommendations, and sales blueprint
- **Revenue_Dashboard**: The frontend view aggregating revenue metrics, high-intent companies, top opportunities, and action items across all researched companies
- **Company_Heat_Map**: The ranking view that orders all researched companies by configurable criteria (opportunity, deal size, buying intent, urgency, recency)
- **Service_Recommendation_Engine**: The AI component that ranks available services by probability, expected ROI, and estimated project value for a given company
- **Sales_Blueprint**: The structured multi-step sales plan generated per company covering first contact through closing strategy
- **Objection_Intelligence**: The AI component that predicts budget, timing, existing vendor, and internal team objections with tailored rebuttals
- **AI_Verdict**: The star-rating system (1-5 stars) with explanation that provides an instant pursue/skip recommendation
- **AI_Timeline**: The day-by-day recommended action plan generated for each researched company
- **Knowledge_Memory**: The storage system that persists AI reasoning, scores, model version, prompt version, and change history for each company report
- **User**: An authenticated SalesPilot AI user who researches companies and manages a sales pipeline
- **Target_Company**: A company record created by the User as a prospective sales target
- **Report**: A complete Revenue Intelligence Engine output stored per company per generation

## Requirements

### Requirement 1: Revenue Intelligence Scoring

**User Story:** As a User, I want revenue-focused scoring metrics for each researched company, so that I can prioritize opportunities by financial potential and urgency.

#### Acceptance Criteria

1. WHEN a company research report is generated, THE Revenue_Intelligence_Engine SHALL produce a Revenue Potential score as an integer from 0 to 100 with reasoning text
2. WHEN a company research report is generated, THE Revenue_Intelligence_Engine SHALL produce a Deal Size Estimate as a currency range (minimum and maximum in USD) with reasoning text
3. WHEN a company research report is generated, THE Revenue_Intelligence_Engine SHALL produce an Urgency Score as an integer from 0 to 100 with reasoning text
4. WHEN a company research report is generated, THE Revenue_Intelligence_Engine SHALL produce a Decision Maker Confidence score as an integer from 0 to 100 with reasoning text
5. WHEN a company research report is generated, THE Revenue_Intelligence_Engine SHALL produce a Competition Risk score as an integer from 0 to 100 with reasoning text
6. THE Revenue_Intelligence_Engine SHALL include the existing v0.3 scores (Opportunity Score, Buying Intent, Digital Maturity) alongside the new revenue scores in every report

### Requirement 2: Service Recommendation Engine

**User Story:** As a User, I want ranked service recommendations with ROI and project value estimates, so that I can identify which services to pitch and quantify the opportunity.

#### Acceptance Criteria

1. WHEN a company research report is generated, THE Service_Recommendation_Engine SHALL rank a minimum of 3 and a maximum of 10 services from the available catalog (Website, SEO, AI Automation, CRM, ERP, Booking System, Marketplace, Chatbot, Custom Software, Marketing Automation)
2. FOR EACH recommended service, THE Service_Recommendation_Engine SHALL provide a Probability percentage (0-100), an Expected ROI description, and an Estimated Project Value as a currency range in USD
3. THE Service_Recommendation_Engine SHALL order recommendations by Probability in descending order
4. WHEN the User's company profile lists specific services offered, THE Service_Recommendation_Engine SHALL limit recommendations to those services only

### Requirement 3: Sales Blueprint

**User Story:** As a User, I want a structured multi-step sales plan for each company, so that I know exactly what to do from first contact through closing.

#### Acceptance Criteria

1. WHEN a company research report is generated, THE Report_Generator SHALL produce a Sales Blueprint containing seven sequential steps: First Contact, Second Contact, Third Contact, Meeting Agenda, Proposal Direction, Negotiation Strategy, and Closing Strategy
2. FOR EACH step in the Sales Blueprint, THE Report_Generator SHALL provide a recommended channel (email, LinkedIn, WhatsApp, phone, in-person), a timing recommendation, key talking points, and a sample message or agenda
3. THE Report_Generator SHALL personalize the Sales Blueprint based on the target company's industry, size, and identified pain points

### Requirement 4: Objection Intelligence

**User Story:** As a User, I want predicted objections with prepared rebuttals, so that I can handle resistance confidently during sales conversations.

#### Acceptance Criteria

1. WHEN a company research report is generated, THE Objection_Intelligence SHALL predict a minimum of 4 objections categorized as: Budget, Timing, Existing Vendor, and Internal Team
2. FOR EACH predicted objection, THE Objection_Intelligence SHALL provide: the objection statement, a severity level (Low, Medium, High), a recommended rebuttal, and a supporting evidence point
3. IF the target company has indicators of budget constraints (small size, declining growth, no recent funding), THEN THE Objection_Intelligence SHALL flag the Budget objection as High severity

### Requirement 5: AI Verdict

**User Story:** As a User, I want an instant star-rating recommendation for each company, so that I can quickly decide whether to invest time in pursuing them.

#### Acceptance Criteria

1. WHEN a company research report is generated, THE Revenue_Intelligence_Engine SHALL produce an AI Verdict as a star rating from 1 to 5 stars
2. THE Revenue_Intelligence_Engine SHALL map star ratings to action labels: 5 stars maps to "Pursue Immediately", 4 stars maps to "Strong Opportunity", 3 stars maps to "Worth Exploring", 2 stars maps to "Low Priority", and 1 star maps to "Skip"
3. THE Revenue_Intelligence_Engine SHALL provide a verdict explanation of 2-4 sentences summarizing the key factors that determined the rating
4. THE Revenue_Intelligence_Engine SHALL derive the star rating from a weighted combination of Revenue Potential (30%), Urgency Score (25%), Decision Maker Confidence (20%), Competition Risk (15% inverse), and Deal Size Estimate (10%); WHEN the weighted score is zero or below a minimum threshold, THE Revenue_Intelligence_Engine SHALL assign 1 star
5. IF the computed star rating falls outside the valid 1-5 range, THEN THE Revenue_Intelligence_Engine SHALL default to 1 star with the action label "Skip"

### Requirement 6: Revenue Dashboard

**User Story:** As a User, I want a dashboard aggregating revenue intelligence across all my researched companies, so that I can manage my pipeline and prioritize daily actions.

#### Acceptance Criteria

1. THE Revenue_Dashboard SHALL display an aggregate Revenue Potential metric calculated as the sum of Deal Size Estimate maximums across all companies with 4-5 star verdicts
2. THE Revenue_Dashboard SHALL display a count of High Intent Companies defined as companies with Buying Intent "High" and Urgency Score above 70
3. THE Revenue_Dashboard SHALL display a ranked list of Top Opportunities showing up to 10 companies ordered by AI Verdict stars descending, then Revenue Potential descending
4. THE Revenue_Dashboard SHALL display a "Companies To Contact Today" list containing companies whose AI Timeline indicates an action scheduled for the current date
5. THE Revenue_Dashboard SHALL display a "Companies Losing Momentum" list containing companies whose most recent report is older than 14 days and had an Urgency Score above 60
6. THE Revenue_Dashboard SHALL display a "Recently Researched" list showing the 5 most recently generated reports ordered by creation date descending
7. WHEN no companies have been researched, THE Revenue_Dashboard SHALL display an empty state directing the User to research their first company

### Requirement 7: Company Heat Map

**User Story:** As a User, I want to see all my researched companies ranked by different criteria, so that I can identify patterns and prioritize outreach systematically.

#### Acceptance Criteria

1. THE Company_Heat_Map SHALL display all researched companies as a sortable ranked list
2. THE Company_Heat_Map SHALL support sorting by: Opportunity Score, Deal Size Estimate (maximum), Buying Intent, Urgency Score, and creation date (Newest)
3. FOR EACH company in the Company_Heat_Map, THE Company_Heat_Map SHALL display: company name, AI Verdict stars, Revenue Potential score, Deal Size Estimate range, and Urgency Score
4. THE Company_Heat_Map SHALL apply color-coding to scores: green for values 75 and above, amber for values 50-74, and red for values 0-49; scores above 100 SHALL display as green
5. WHEN the User selects a company from the Company_Heat_Map, THE Company_Heat_Map SHALL navigate to that company's full intelligence report

### Requirement 8: AI Timeline

**User Story:** As a User, I want a day-by-day action plan for each company, so that I know exactly what to do and when without needing to plan manually.

#### Acceptance Criteria

1. WHEN a company research report is generated, THE Revenue_Intelligence_Engine SHALL produce an AI Timeline containing a minimum of 6 dated action steps
2. THE AI_Timeline SHALL use relative days from the report generation date: Day 1 (Research and Prepare), Day 2 (First Email), Day 4 (LinkedIn Connection), Day 7 (Send Proposal), Day 10 (Follow Up), and Day 14 (Closing Attempt)
3. FOR EACH action step in the AI_Timeline, THE Revenue_Intelligence_Engine SHALL provide: the day number, action type, recommended channel, a specific action description, and a priority level (High, Medium, Low)
4. THE AI_Timeline SHALL personalize action descriptions based on the target company's preferred communication channels detected from their digital presence

### Requirement 9: Knowledge Memory

**User Story:** As a User, I want the system to store all AI reasoning, versions, and history for each company, so that I can track changes over time and compare report versions.

#### Acceptance Criteria

1. WHEN a company research report is generated, THE Knowledge_Memory SHALL store: the complete AI output, all input parameters, the AI model identifier, the prompt version identifier, a version number, and the generation timestamp
2. WHEN a company has multiple report versions, THE Knowledge_Memory SHALL enable the User to view any previous version by selecting from a version history list
3. WHEN a company has multiple report versions, THE Knowledge_Memory SHALL enable the User to compare two versions side-by-side highlighting changed scores and new recommendations
4. THE Knowledge_Memory SHALL increment the version number sequentially for each new report generated for the same company; IF a report generation fails or is cancelled, THEN THE Knowledge_Memory SHALL skip that version number and continue with the next sequential number
5. THE Knowledge_Memory SHALL retain all historical versions without automatic deletion

### Requirement 10: Report Generation Performance

**User Story:** As a User, I want the complete intelligence report generated quickly, so that I can research companies efficiently without long waits.

#### Acceptance Criteria

1. THE Revenue_Intelligence_Engine SHALL complete the full report generation (including all revenue scores, service recommendations, sales blueprint, objection intelligence, AI verdict, and AI timeline) within 60 seconds of the User initiating the research request; IF generation exceeds 60 seconds but completes successfully, THEN THE Revenue_Intelligence_Engine SHALL deliver the complete report rather than enforcing a hard cutoff
2. WHILE the report is being generated, THE Revenue_Intelligence_Engine SHALL provide progressive status messages to the User indicating which section is currently being processed
3. IF the report generation exceeds 60 seconds, THEN THE Revenue_Intelligence_Engine SHALL return a partial report containing all sections completed within the time limit and indicate which sections are incomplete

### Requirement 11: Frontend Report Presentation

**User Story:** As a User, I want the intelligence report displayed in a premium, interactive format, so that I can navigate, understand, and act on the data efficiently.

#### Acceptance Criteria

1. THE Revenue_Intelligence_Engine frontend SHALL display the report using a sticky sidebar navigation allowing the User to jump between report sections without scrolling
2. THE Revenue_Intelligence_Engine frontend SHALL render all numerical scores with color-coded visual indicators: green for values 75 and above (including scores exceeding 100), amber for values 50-74, red for values 0-49
3. THE Revenue_Intelligence_Engine frontend SHALL display the AI Verdict using filled star icons with the action label prominently visible
4. THE Revenue_Intelligence_Engine frontend SHALL render each report section as a collapsible card that the User can expand or collapse independently
5. THE Revenue_Intelligence_Engine frontend SHALL support keyboard shortcuts: "j" to move to the next section, "k" to move to the previous section, and "e" to export the report
6. THE Revenue_Intelligence_Engine frontend SHALL use a dark-mode-optimized color palette with sufficient contrast ratios meeting WCAG AA standards
7. WHEN the User edits a service recommendation priority or removes a recommended service, THE Revenue_Intelligence_Engine frontend SHALL persist the modification to the stored report

### Requirement 12: Data Persistence and Schema

**User Story:** As a User, I want all revenue intelligence data stored reliably, so that I can access my reports, dashboard, and history at any time.

#### Acceptance Criteria

1. THE Revenue_Intelligence_Engine SHALL store all report data in the Neon PostgreSQL database using a JSONB column for the complete AI output and indexed columns for frequently queried scores (Revenue Potential, Urgency Score, AI Verdict stars, Buying Intent)
2. THE Revenue_Intelligence_Engine SHALL associate every report with the authenticated User's ID and optionally with a Target_Company ID using foreign key constraints
3. WHEN a User account is deleted, THE Revenue_Intelligence_Engine SHALL cascade-delete all associated reports, timeline entries, and knowledge memory records
4. THE Revenue_Intelligence_Engine SHALL support querying reports by: User ID, company name, date range, AI Verdict rating, and Buying Intent level
