# Requirements Document

## Introduction

The AI Prospect Discovery Engine (Release 0.5) transforms SalesPilot AI from a manual company research tool into an automated AI sales assistant that discovers, ranks, and recommends companies without any manual database building. Building on the existing Revenue Intelligence Engine (v0.4), this release introduces automated internet-based company discovery, a modular search provider architecture, real-time technology analysis, opportunity scoring at scale, and a Prospect Discovery page that becomes the primary product surface. The core promise: a user registers, completes their company profile, searches "Travel Agency Singapore," and receives 200+ ranked companies with clear guidance on which 10 to contact — all without entering a single company manually.

## Glossary

- **Prospect_Discovery_Engine**: The complete v0.5 system that automatically discovers, analyzes, ranks, and presents companies from internet sources based on user search queries
- **Search_Provider**: A modular adapter that connects to a specific external data source (Google Business, company directories, BuiltWith, etc.) and returns raw company data in a normalized format
- **Provider_Registry**: The registry that manages all active Search_Providers, their health status, rate limits, and fallback ordering
- **Discovery_Pipeline**: The sequential processing chain that transforms a user keyword into ranked company results: Search → Collect → Deduplicate → Normalize → Analyze → Score → Rank → Display
- **Technology_Analyzer**: The component that visits company websites and detects technology stack, platform, CMS, frameworks, analytics tools, and third-party integrations
- **Company_Analyzer**: The component that combines technology data, business signals, and publicly available information to produce a complete company profile with scoring
- **Opportunity_Scoring_Engine**: The AI component that assigns a 1-5 star Opportunity Rating with reasoning, evidence, suggested offer, estimated revenue, win probability, and recommended action to each discovered company
- **Company_Card**: The UI component displaying a single discovered company with all scores, signals, and action buttons
- **Smart_Filter**: A search filter that narrows prospect results by structured attributes (country, industry, technology, revenue, digital maturity, etc.)
- **Search_Progress_Indicator**: The animated progress bar UI component that shows real-time pipeline stage completion without using spinners
- **Workspace**: The user's saved collection of selected prospect companies, separate from CRM, used for active research and outreach planning
- **AI_Insights_Panel**: The summary panel aggregating statistics across all discovery results including total companies, potential revenue, average opportunity, and market recommendations
- **Discovery_Dashboard**: The daily intelligence view showing today's revenue opportunity, high-intent companies found, AI recommendations, and action items
- **User**: An authenticated SalesPilot AI user who has completed their company profile and selected services
- **Prospect_Result**: A single company record discovered and scored by the Discovery_Pipeline, stored with all metadata and scores

## Requirements

### Requirement 1: Post-Profile Redirect to Prospect Discovery

**User Story:** As a User, I want to be automatically redirected to the Prospect Discovery page after completing my company profile, so that I can immediately start discovering prospects without navigating manually.

#### Acceptance Criteria

1. WHEN a User completes and saves their company profile for the first time, THE Prospect_Discovery_Engine SHALL redirect the User to the /prospect-discovery route
2. WHEN a User completes their company profile update, THE Prospect_Discovery_Engine SHALL redirect the User to the /prospect-discovery route
3. THE Prospect_Discovery_Engine SHALL set the /prospect-discovery page as the primary navigation destination after login for users with a completed company profile
4. IF a User has not completed their company profile, THEN THE Prospect_Discovery_Engine SHALL redirect the User to the /company-profile route instead of /prospect-discovery

### Requirement 2: Prospect Discovery Search Interface

**User Story:** As a User, I want a search-first discovery page with a prominent search box and example queries, so that I can quickly describe the type of companies I want to find.

#### Acceptance Criteria

1. THE Prospect_Discovery_Engine SHALL display a hero section containing a large search input field with placeholder text "Search companies, industries, cities or services..."
2. THE Prospect_Discovery_Engine SHALL display example search queries below the search input: "Hotels in Bali", "Travel Agency Singapore", "Restaurant Bandung", "Dental Clinic Australia", "Software House Malaysia", "Factories Jakarta"
3. WHEN a User submits a search query, THE Prospect_Discovery_Engine SHALL initiate the Discovery_Pipeline with that query as the primary keyword
4. WHEN a User clicks an example query, THE Prospect_Discovery_Engine SHALL populate the search input with that query and initiate the Discovery_Pipeline
5. THE Prospect_Discovery_Engine SHALL accept free-text search queries containing company types, industries, locations, services, or combinations thereof

### Requirement 3: Smart Filters

**User Story:** As a User, I want advanced filters to narrow discovery results by business attributes and technology indicators, so that I can focus on the most relevant prospects.

#### Acceptance Criteria

1. THE Prospect_Discovery_Engine SHALL provide Smart_Filters for the following categories: Country, City, Industry, Employee Size range, Estimated Revenue range, Technology stack, Website Exists (boolean), Website Quality rating, SEO Score range, Hiring status (boolean), Funding status (boolean), Recently Opened (boolean), Google Rating range, Review Count range, Digital Maturity range, Opportunity Score range, and Buying Intent level
2. THE Prospect_Discovery_Engine SHALL provide Smart_Filters for technology detection: Has Booking System, Has CRM, Uses WordPress, Uses Shopify, Uses Laravel, Uses React, Uses Next.js, Uses WooCommerce, Uses AI Chatbot, Has Mobile App, Has Online Payment
3. WHEN a User applies one or more Smart_Filters, THE Prospect_Discovery_Engine SHALL filter the displayed Prospect_Results to include only companies matching all active filter criteria
4. THE Prospect_Discovery_Engine SHALL render Smart_Filters as a sticky sidebar or collapsible panel that remains accessible while scrolling through results
5. WHEN a User clears all Smart_Filters, THE Prospect_Discovery_Engine SHALL display the full unfiltered result set

### Requirement 4: Modular Search Provider Architecture

**User Story:** As a User, I want the system to search multiple data sources for company information, so that I receive comprehensive discovery results regardless of any single source's limitations.

#### Acceptance Criteria

1. THE Provider_Registry SHALL support registering, enabling, disabling, and replacing Search_Providers without modifying core Discovery_Pipeline code
2. THE Provider_Registry SHALL define a standard adapter interface that each Search_Provider implements, containing: search method accepting a query and returning normalized company records, health check method, rate limit configuration, and provider metadata
3. THE Prospect_Discovery_Engine SHALL include initial Search_Provider adapters for: Google Business/Maps data, public company directories, company website crawling, BuiltWith technology detection, and public job board data
4. THE Provider_Registry SHALL support future Search_Provider additions for: LinkedIn public data, Crunchbase, Apollo, Clearbit, Wappalyzer, news sources, and government company registries without architectural changes
5. IF a Search_Provider fails or exceeds its rate limit, THEN THE Provider_Registry SHALL skip that provider and continue the Discovery_Pipeline with results from remaining providers
6. THE Provider_Registry SHALL cache provider responses for identical queries within a configurable time window to reduce external API calls

### Requirement 5: AI Discovery Pipeline

**User Story:** As a User, I want the system to automatically process my search query through a complete discovery pipeline, so that I receive deduplicated, normalized, analyzed, and ranked company results.

#### Acceptance Criteria

1. WHEN a User submits a search query, THE Discovery_Pipeline SHALL execute the following stages in sequence: Search providers → Collect raw results → Deduplicate by company identity → Normalize data format → Visit company websites → Analyze technology stack → Analyze business signals → Estimate opportunity → Rank companies → Display results
2. THE Discovery_Pipeline SHALL deduplicate companies by matching on company name similarity (above 85% threshold) combined with matching website domain or matching physical address
3. THE Discovery_Pipeline SHALL normalize all company records into a standard schema containing: company name, website URL, physical location, industry classification, employee count estimate, revenue estimate, technology stack array, and raw source metadata
4. THE Discovery_Pipeline SHALL process a minimum of 50 companies per search query from combined provider results; WHEN fewer than 50 results are available from all providers combined, THE Discovery_Pipeline SHALL return all available results
5. IF any pipeline stage fails for a specific company record, THEN THE Discovery_Pipeline SHALL mark that record with incomplete data flags and continue processing remaining records

### Requirement 6: Technology Analysis

**User Story:** As a User, I want automatic detection of each prospect's technology stack, so that I can identify technology gaps and tailor my service pitch accordingly.

#### Acceptance Criteria

1. WHEN the Discovery_Pipeline reaches the technology analysis stage, THE Technology_Analyzer SHALL visit the company website and detect: CMS platform, frontend framework, analytics tools, marketing automation tools, CRM indicators, payment systems, booking systems, chatbot presence, and mobile app indicators
2. THE Technology_Analyzer SHALL detect the following platforms: WordPress, Shopify, Laravel, React, Next.js, WooCommerce, Wix, Squarespace, Magento, and custom-built indicators
3. THE Technology_Analyzer SHALL produce a Digital Score (0-100) representing overall digital maturity based on detected technology stack completeness, website quality signals, and integration sophistication
4. THE Technology_Analyzer SHALL produce a Website Score (0-100) based on page load indicators, mobile responsiveness signals, HTTPS status, and structured data presence
5. THE Technology_Analyzer SHALL produce an SEO Score (0-100) based on meta tag presence, heading structure, sitemap availability, and content quality indicators
6. IF a company website is unreachable or returns an error status, THEN THE Technology_Analyzer SHALL assign null scores and flag the company as "Website Unavailable"

### Requirement 7: AI Opportunity Scoring

**User Story:** As a User, I want every discovered company scored with an AI-generated opportunity rating including reasoning and evidence, so that I can instantly identify the highest-value prospects.

#### Acceptance Criteria

1. THE Opportunity_Scoring_Engine SHALL assign each Prospect_Result a star rating from 1 to 5 stars representing overall opportunity quality
2. THE Opportunity_Scoring_Engine SHALL provide for each company: reasoning text explaining the rating, evidence array with specific data points supporting the score, a suggested service offer, estimated revenue value, win probability percentage, and a recommended action (Contact Today, Research First, Monitor, Low Priority, Skip)
3. THE Opportunity_Scoring_Engine SHALL calculate the Opportunity Score (0-100) using weighted inputs: Digital Gap (25%), Revenue Potential (25%), Buying Intent signals (20%), Technology fit with User's services (15%), and Company Growth signals (15%)
4. THE Opportunity_Scoring_Engine SHALL calculate Buying Intent from signals including: recent hiring activity, funding events, technology adoption gaps, growth trajectory, and publicly stated business objectives
5. WHEN the User's company profile specifies services offered, THE Opportunity_Scoring_Engine SHALL weight technology gaps matching those services higher in the scoring algorithm

### Requirement 8: Company Card Display

**User Story:** As a User, I want each discovered company displayed as a rich information card with scores, signals, and action buttons, so that I can evaluate prospects at a glance and take immediate action.

#### Acceptance Criteria

1. THE Company_Card SHALL display the following data fields: Company Name, Website URL, Location (city and country), Industry, Employee count estimate, Estimated Revenue range, Technology Stack tags, Digital Score, Opportunity Score, Buying Intent level, Website Score, SEO Score, AI Readiness indicator, Growth Signals summary, Funding Signals summary, Hiring Signals summary, Recommended Services list, Estimated Deal Value range, and Confidence level
2. THE Company_Card SHALL display the AI Opportunity Rating as a star visualization (1-5 stars) with the rating reasoning visible on hover or expand
3. THE Company_Card SHALL provide action buttons: "Research" (opens full intelligence report), "Generate Proposal" (creates AI proposal), "Generate Email" (creates outreach email), "Generate WhatsApp" (creates WhatsApp message), "Save Lead" (saves to Workspace), and "Hide" (removes from current results)
4. THE Company_Card SHALL apply color-coded indicators to scores: green for values 75 and above, amber for values 50-74, red for values below 50
5. THE Company_Card SHALL render using glassmorphism design with gradient backgrounds and Framer Motion entrance animations

### Requirement 9: Result Sorting and Ranking

**User Story:** As a User, I want to sort discovery results by different criteria, so that I can view prospects from multiple strategic angles.

#### Acceptance Criteria

1. THE Prospect_Discovery_Engine SHALL support sorting results by: Highest Opportunity Score, Highest Estimated Revenue, Highest Buying Intent, Newest (most recently discovered), Closest Location (to User's company), Most Employees, Highest Digital Gap, and Highest AI Opportunity rating
2. THE Prospect_Discovery_Engine SHALL default to sorting by Highest Opportunity Score descending
3. WHEN a User changes the sort order, THE Prospect_Discovery_Engine SHALL re-order displayed results within 200 milliseconds without triggering a new search
4. THE Prospect_Discovery_Engine SHALL display the current sort criterion prominently above the results list

### Requirement 10: AI Insights Panel

**User Story:** As a User, I want an aggregated insights panel summarizing my discovery results, so that I can understand the overall market opportunity at a glance.

#### Acceptance Criteria

1. THE AI_Insights_Panel SHALL display: Total Companies Found count, Average Opportunity Score across all results, Total Potential Revenue (sum of estimated deal values), Average Deal Size, unique Industries represented count, Best Location (location with highest average opportunity), Most Promising Market segment, and a Suggested Campaign recommendation
2. THE AI_Insights_Panel SHALL recalculate metrics when Smart_Filters are applied, reflecting only the filtered result set
3. THE AI_Insights_Panel SHALL remain visible as a summary section above the results list or as a collapsible panel
4. WHEN fewer than 5 companies are found, THE AI_Insights_Panel SHALL display a message suggesting broader search terms or fewer filters

### Requirement 11: Search Progress Visualization

**User Story:** As a User, I want to see real-time progress of the discovery pipeline stages, so that I understand what the system is doing and how long it will take.

#### Acceptance Criteria

1. WHILE the Discovery_Pipeline is executing, THE Search_Progress_Indicator SHALL display a segmented progress bar showing completion percentage for each active pipeline stage
2. THE Search_Progress_Indicator SHALL label each segment with the current stage name: "Searching Google...", "Searching Company Directory...", "Analyzing Websites...", "Scoring Opportunities...", "Ranking Results..."
3. THE Search_Progress_Indicator SHALL use block-character progress visualization (e.g., ██████░░░░) and animated transitions between stages
4. THE Search_Progress_Indicator SHALL display the count of companies found so far, incrementing as results arrive from providers
5. THE Prospect_Discovery_Engine SHALL stream partial results to the UI as each pipeline stage completes, allowing users to browse early results while processing continues

### Requirement 12: Search History

**User Story:** As a User, I want my past searches stored with their results summary, so that I can revisit previous discoveries and rerun searches to find new companies.

#### Acceptance Criteria

1. WHEN a search completes, THE Prospect_Discovery_Engine SHALL store a search history record containing: search keyword, execution date and time, total companies found count, average opportunity score, and total potential revenue estimate
2. THE Prospect_Discovery_Engine SHALL display search history as a list ordered by most recent first, accessible from the Prospect Discovery page
3. WHEN a User selects a search history entry, THE Prospect_Discovery_Engine SHALL offer options to: view cached results from that search, or rerun the search to discover new companies
4. WHEN a User reruns a historical search, THE Prospect_Discovery_Engine SHALL execute a fresh Discovery_Pipeline and highlight newly discovered companies that were not present in the previous run

### Requirement 13: Save to Workspace

**User Story:** As a User, I want to save selected prospects to my Workspace, so that I can organize a shortlist of companies for active research and outreach without cluttering my CRM.

#### Acceptance Criteria

1. WHEN a User clicks "Save Lead" on a Company_Card, THE Prospect_Discovery_Engine SHALL save that company to the User's Workspace with all discovered data and scores
2. THE Workspace SHALL store saved companies separately from the existing Target_Companies table, as Workspace entries represent AI-discovered prospects pending qualification
3. THE Prospect_Discovery_Engine SHALL prevent duplicate Workspace entries by matching on company name and website domain; IF a duplicate is detected, THEN THE Prospect_Discovery_Engine SHALL notify the User that the company is already in their Workspace
4. WHEN a User views their Workspace, THE Prospect_Discovery_Engine SHALL display saved companies with their most recent scores and a status indicator (New, Researched, Contacted, Qualified)
5. THE Workspace SHALL support bulk actions: Research All, Generate Proposals, Export to CSV

### Requirement 14: Discovery Dashboard

**User Story:** As a User, I want a daily discovery dashboard showing today's opportunities and AI recommendations, so that I start each day knowing exactly which prospects to pursue.

#### Acceptance Criteria

1. THE Discovery_Dashboard SHALL display: Today's Total Revenue Opportunity (sum of estimated deal values from companies scored 4-5 stars in the last 24 hours), Companies Found Today count, High Intent Companies count (Buying Intent "High" from today's searches), Total Potential Revenue from all saved Workspace companies, Average Opportunity Score across today's results, and Today's AI Recommendation (a text summary suggesting the highest-value action)
2. THE Discovery_Dashboard SHALL refresh metrics each time the User navigates to it, reflecting the most current data
3. WHEN no searches have been performed today, THE Discovery_Dashboard SHALL display an empty state prompting the User to start a new discovery search
4. THE Discovery_Dashboard SHALL display a "Top 5 Prospects Today" list showing the highest-scoring companies from today's search results

### Requirement 15: Navigation and Layout

**User Story:** As a User, I want a clear navigation structure with Prospect Discovery as the primary feature, so that I can access all system capabilities from a consistent sidebar.

#### Acceptance Criteria

1. THE Prospect_Discovery_Engine SHALL display a left sidebar navigation containing: Home, Prospect Discovery (starred/highlighted as primary), AI Intelligence, Workspace, Proposal Studio, Outreach, Revenue Radar, and Settings
2. THE Prospect_Discovery_Engine SHALL highlight the Prospect Discovery item with a star icon or visual emphasis indicating it is the primary product feature
3. THE Prospect_Discovery_Engine SHALL render the sidebar as responsive: full sidebar on desktop viewports (1024px and above), collapsible icon-only sidebar on tablet viewports (768px-1023px), and bottom navigation bar on mobile viewports (below 768px)

### Requirement 16: UI Design System

**User Story:** As a User, I want a premium, enterprise-grade visual experience with modern design patterns, so that the product feels professional and trustworthy.

#### Acceptance Criteria

1. THE Prospect_Discovery_Engine frontend SHALL use a dark-first color palette as the default theme with sufficient contrast ratios meeting WCAG AA standards
2. THE Prospect_Discovery_Engine frontend SHALL apply glassmorphism effects (backdrop blur, semi-transparent backgrounds) to card components and modal overlays
3. THE Prospect_Discovery_Engine frontend SHALL use gradient backgrounds on Company_Card components and section headers
4. THE Prospect_Discovery_Engine frontend SHALL implement Framer Motion animations for: card entrance transitions, progress bar animations, filter panel open/close, and page transitions
5. THE Prospect_Discovery_Engine frontend SHALL use skeleton loading placeholders during data fetching states instead of empty content areas
6. THE Prospect_Discovery_Engine frontend SHALL stream result updates in real-time as the Discovery_Pipeline processes companies, appending new Company_Cards without full page reloads

### Requirement 17: Database Schema for Prospect Discovery

**User Story:** As a User, I want all discovery data persisted reliably, so that search history, prospect results, provider data, and analysis results are available across sessions.

#### Acceptance Criteria

1. THE Prospect_Discovery_Engine SHALL create and maintain the following database tables: search_history, prospect_results, provider_sources, provider_cache, company_signals, technology_analysis, and location_index
2. THE search_history table SHALL store: id, user_id, keyword, search_date, companies_found_count, average_opportunity_score, total_potential_revenue, filters_applied (JSONB), and status
3. THE prospect_results table SHALL store: id, user_id, search_id (foreign key to search_history), company_name, website, location_country, location_city, industry, employee_count, estimated_revenue_min, estimated_revenue_max, technology_stack (JSONB), scores (JSONB containing all computed scores), ai_rating_stars, ai_rating_action, recommended_services (JSONB), estimated_deal_value_min, estimated_deal_value_max, confidence, raw_provider_data (JSONB), created_at, and updated_at
4. THE Prospect_Discovery_Engine SHALL create performance indexes on: prospect_results(user_id, ai_rating_stars DESC), prospect_results(user_id, search_id), prospect_results(search_id, ai_rating_stars DESC), and search_history(user_id, search_date DESC)
5. WHEN a User account is deleted, THE Prospect_Discovery_Engine SHALL cascade-delete all associated search history, prospect results, workspace entries, provider cache entries, and technology analysis records

### Requirement 18: Modular Architecture

**User Story:** As a developer, I want the system built with independent, replaceable modules, so that each component can be developed, tested, and scaled independently.

#### Acceptance Criteria

1. THE Prospect_Discovery_Engine SHALL be architected as independent modules: Search Engine (query processing and provider orchestration), Provider Adapters (individual data source connectors), Scoring Engine (opportunity and intent calculation), AI Engine (LLM-based analysis), Technology Analyzer (website technology detection), Company Analyzer (business signal aggregation), and Result Presenter (UI rendering)
2. EACH module SHALL communicate through defined interfaces without direct coupling to other module internals
3. THE Provider Adapters module SHALL follow an adapter pattern where adding a new data source requires implementing the standard Search_Provider interface without modifying existing adapters or the Discovery_Pipeline
4. THE Scoring Engine SHALL accept configurable weights for each scoring factor, allowing adjustment without code changes
5. IF any single module fails, THEN THE Prospect_Discovery_Engine SHALL degrade gracefully by continuing operation with reduced functionality and notifying the User of limited results

