# Requirements Document

## Introduction

SalesPilot MVP is a production-ready SaaS application that helps individual sales professionals and small teams generate AI-powered sales content. The platform enables users to research target companies, then generate personalized proposals, outreach emails, and WhatsApp messages using AI. The MVP focuses on delivering immediate value through AI content generation with minimal setup, backed by a simple lead pipeline to track deal progress. The architecture is modular to support future billing, analytics, and enterprise features without refactoring.

## Glossary

- **Platform**: The SalesPilot MVP application consisting of the Frontend_App and Backend_App working together
- **Frontend_App**: The Next.js application using TypeScript, React, and Tailwind CSS, deployed to Vercel
- **Backend_App**: The Laravel 12 application using PHP 8.4, deployed to Railway via Docker
- **User**: A registered individual who uses the Platform to generate sales content and manage leads
- **Company_Profile**: The User's own company details (name, industry, products, value propositions) that feed into AI content generation
- **Target_Company**: A prospective customer company that the User wants to sell to
- **Research_Report**: An AI-generated summary of publicly available information about a Target_Company
- **Proposal**: An AI-generated sales proposal document tailored to a Target_Company based on the Company_Profile and Research_Report
- **Outreach_Email**: An AI-generated personalized email intended for a contact at a Target_Company
- **WhatsApp_Message**: An AI-generated short-form message suitable for WhatsApp communication with a contact at a Target_Company
- **Lead**: A Target_Company entry tracked in the User's pipeline with an associated stage
- **Pipeline**: A four-stage workflow (Prospect, Proposal_Sent, Won, Lost) used to track Lead progress
- **AI_Service**: The backend subsystem that communicates with the OpenAI GPT-4 API to generate content
- **Session**: An authenticated user's active login period managed via Laravel Sanctum tokens

## Requirements

### Requirement 1: User Registration

**User Story:** As a prospective user, I want to register for SalesPilot with my email and password, so that I can create an account and start using the AI sales tools.

#### Acceptance Criteria

1. WHEN a prospective user submits a registration form with email (maximum 255 characters), full name (1 to 100 characters), and password (8 to 128 characters), THE Platform SHALL create a user account and send an email verification link within 60 seconds
2. WHEN the user clicks the email verification link within 24 hours, THE Platform SHALL activate the account and redirect the user to the login page
3. IF the submitted email is already associated with an existing account, THEN THE Platform SHALL reject the registration and display an error indicating the email is already in use
4. IF the email verification link expires after 24 hours, THEN THE Platform SHALL allow the user to request a new verification link from the login page
5. THE Platform SHALL enforce password requirements of minimum 8 characters and maximum 128 characters including at least one uppercase letter, one lowercase letter, and one number
6. THE Backend_App SHALL store passwords using bcrypt hashing with a minimum cost factor of 12
7. IF the registration form is submitted with an invalid email format, a full name that is empty or exceeds 100 characters, or a password that does not meet the password requirements, THEN THE Platform SHALL reject the submission and display field-level error messages indicating each validation failure
8. IF the email verification link delivery fails, THEN THE Platform SHALL display a message allowing the user to request a new verification link from the login page

### Requirement 2: User Login and Session Management

**User Story:** As a registered user, I want to log in securely and maintain an active session, so that I can access my data without re-authenticating on every request.

#### Acceptance Criteria

1. WHEN a user submits valid email and password credentials for a verified account, THE Platform SHALL authenticate the user, issue a Sanctum API token with a default expiration of 7 days, and return the token along with the user's name and email in the response
2. IF the submitted credentials are invalid, THEN THE Platform SHALL return a generic authentication error without revealing whether the email or password was incorrect
3. WHILE a user holds a valid Session token, THE Platform SHALL authorize API requests from that user without requiring re-authentication
4. WHEN a session token expires, THE Platform SHALL return an HTTP 401 response and the Frontend_App SHALL redirect the user to the login page
5. WHEN a user triggers the logout action, THE Platform SHALL invalidate the current session token within the same request-response cycle
6. IF a user submits 5 consecutive failed login attempts within 5 minutes, THEN THE Platform SHALL lock the account for 15 minutes and return an error message indicating the lockout duration and remaining wait time
7. WHILE an account is locked due to exceeded login attempts, IF the user submits another login request, THEN THE Platform SHALL reject the request and return an error message indicating the remaining lockout duration without resetting the lockout timer
8. IF a user with an unverified email attempts to log in with valid credentials, THEN THE Platform SHALL reject the login and return an error message indicating that email verification is required

### Requirement 3: Password Reset

**User Story:** As a user who has forgotten my password, I want to request a password reset, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user submits a password reset request with their registered email, THE Platform SHALL send a password reset link to that email within 60 seconds
2. WHEN the user clicks the reset link and submits a new password meeting the password requirements, THE Platform SHALL update the password, invalidate all existing session tokens, and redirect the user to the login page
3. IF the password reset link is older than 60 minutes, THEN THE Platform SHALL reject the reset attempt and instruct the user to request a new reset link
4. IF the submitted email does not match any existing account, THEN THE Platform SHALL respond with the same success message as a valid request to prevent email enumeration
5. THE Platform SHALL invalidate a password reset link after it has been used once

### Requirement 4: Company Profile Management

**User Story:** As a user, I want to set up and update my company profile, so that the AI can use accurate information about my business when generating sales content.

#### Acceptance Criteria

1. THE Platform SHALL provide a Company_Profile form capturing: company name, industry, company description, products or services offered (as a list with name and description per item), target market description, and key value propositions
2. WHEN a user submits the Company_Profile form with all required fields (company name, industry, company description, and at least one product or service), THE Backend_App SHALL save the Company_Profile data associated with the authenticated user
3. WHEN a user navigates to the Company_Profile page, THE Platform SHALL display the current saved Company_Profile data pre-populated in the form
4. WHEN a user updates Company_Profile fields and submits the form, THE Backend_App SHALL overwrite the existing Company_Profile data with the new values
5. IF required fields are missing from the Company_Profile submission, THEN THE Platform SHALL reject the submission and indicate which fields are required
6. WHILE a user has not completed the Company_Profile, THE Platform SHALL display a prompt on the dashboard recommending profile completion before generating AI content

### Requirement 5: AI Company Research

**User Story:** As a user, I want the AI to research a target company using publicly available information, so that I have useful context for crafting personalized sales outreach.

#### Acceptance Criteria

1. WHEN a user submits a Target_Company name (between 2 and 200 characters) and optionally a website URL, THE AI_Service SHALL generate a Research_Report containing: company overview, industry and market position, recent news or developments, potential pain points, and estimated company size
2. THE AI_Service SHALL send the Target_Company information as a structured prompt to the OpenAI GPT-4 API and parse the response into the Research_Report format
3. WHEN the Research_Report is successfully generated, THE Backend_App SHALL store the Research_Report associated with the Target_Company and the authenticated user
4. IF the OpenAI API returns an error, times out after 30 seconds, or returns a response that cannot be parsed into the Research_Report format, THEN THE AI_Service SHALL return an error message to the user indicating the research could not be completed and suggesting a retry
5. WHEN a user views a previously researched Target_Company, THE Platform SHALL display the stored Research_Report with the date the research was generated
6. WHEN a user requests regeneration of a Research_Report for an existing Target_Company, THE Backend_App SHALL replace the previous Research_Report with the newly generated result
7. IF the user has provided a Target_Company website URL, THEN THE AI_Service SHALL include the website URL in the prompt context sent to the OpenAI GPT-4 API
8. IF the submitted Target_Company name is fewer than 2 characters or exceeds 200 characters, THEN THE Platform SHALL reject the submission and display an error indicating the name length requirements

### Requirement 6: AI Proposal Generation

**User Story:** As a user, I want the AI to generate a tailored sales proposal for a target company, so that I can quickly produce professional proposals without writing from scratch.

#### Acceptance Criteria

1. WHEN a user requests a Proposal for a Target_Company, THE AI_Service SHALL generate the Proposal using the Company_Profile, the Research_Report for that Target_Company, and any additional context provided by the user in a free-text field (maximum 2000 characters)
2. THE Proposal SHALL contain the following sections: executive summary, problem statement tailored to the Target_Company, proposed solution mapped to Company_Profile products, key benefits, and a suggested next steps section
3. THE AI_Service SHALL send the combined context (Company_Profile, Research_Report, user-provided notes) as a structured prompt to the OpenAI GPT-4 API
4. WHEN the Proposal is successfully generated, THE Backend_App SHALL store the Proposal associated with the Target_Company and authenticated user
5. IF the Company_Profile has not been completed, THEN THE Platform SHALL block Proposal generation and display a message directing the user to complete the Company_Profile first
6. IF no Research_Report exists for the Target_Company, THEN THE Platform SHALL block Proposal generation and display a message directing the user to run company research first
7. THE Platform SHALL allow the user to copy the full Proposal text to clipboard with a single action
8. THE Platform SHALL allow a user to regenerate a Proposal, storing the new version alongside previous versions with timestamps
9. IF the OpenAI API returns an error or times out after 30 seconds, THEN THE AI_Service SHALL return an error message to the user indicating the proposal could not be generated and suggesting a retry
10. WHEN a user views a Target_Company detail page, THE Platform SHALL display all stored Proposals for that Target_Company ordered by creation date descending

### Requirement 7: AI Outreach Email Generation

**User Story:** As a user, I want the AI to generate personalized outreach emails for a target company contact, so that I can initiate professional communication efficiently.

#### Acceptance Criteria

1. WHEN a user requests an Outreach_Email for a Target_Company, THE AI_Service SHALL generate the email using the Company_Profile, the Research_Report, the contact's name and role (if provided), and the selected email tone (formal, friendly, or direct), defaulting to formal if no tone is selected
2. THE Outreach_Email SHALL contain: a subject line of no more than 100 characters, a greeting, a body referencing the Target_Company's situation, a value proposition paragraph linking to Company_Profile offerings, and a single actionable sentence as a call-to-action
3. THE AI_Service SHALL send the combined context as a structured prompt to the OpenAI GPT-4 API with instructions to generate a professional sales email
4. WHEN the Outreach_Email is successfully generated, THE Backend_App SHALL store the email associated with the Target_Company and authenticated user
5. THE Platform SHALL allow the user to copy the Outreach_Email subject and body to clipboard separately or together
6. THE Platform SHALL allow a user to regenerate an Outreach_Email with different tone or context inputs without losing previously generated emails
7. IF the Company_Profile has not been completed, THEN THE Platform SHALL block email generation and display a message directing the user to complete the Company_Profile first
8. IF no Research_Report exists for the Target_Company, THEN THE Platform SHALL block email generation and display a message directing the user to run company research first
9. IF the OpenAI API returns an error or times out after 30 seconds, THEN THE AI_Service SHALL return a descriptive error to the user indicating the email could not be generated and suggesting a retry

### Requirement 8: AI WhatsApp Message Generation

**User Story:** As a user, I want the AI to generate WhatsApp-appropriate sales messages, so that I can reach contacts on WhatsApp with concise, engaging content.

#### Acceptance Criteria

1. WHEN a user requests a WhatsApp_Message for a Target_Company, THE AI_Service SHALL generate a concise message suitable for WhatsApp using the Company_Profile, the Research_Report, and the contact's name (if provided)
2. THE WhatsApp_Message SHALL be limited to a maximum of 500 characters to respect WhatsApp messaging conventions
3. THE WhatsApp_Message SHALL use a conversational tone, include a brief value hook, and end with a question or soft call-to-action
4. THE AI_Service SHALL send the combined context as a structured prompt to the OpenAI GPT-4 API with instructions specifying WhatsApp message format constraints
5. WHEN the WhatsApp_Message is successfully generated, THE Backend_App SHALL store the message associated with the Target_Company and authenticated user
6. THE Platform SHALL allow the user to copy the WhatsApp_Message to clipboard with a single action
7. THE Platform SHALL allow a user to regenerate a WhatsApp_Message without losing previously generated messages
8. IF the Company_Profile has not been completed, THEN THE Platform SHALL block message generation and display a message directing the user to complete the Company_Profile first
9. IF no Research_Report exists for the Target_Company, THEN THE Platform SHALL block message generation and display a message directing the user to run company research first
10. IF the OpenAI API returns an error or times out after 30 seconds, THEN THE AI_Service SHALL return a descriptive error to the user indicating the message could not be generated and suggesting a retry

### Requirement 9: Lead Pipeline Management

**User Story:** As a user, I want to track my sales leads through a simple pipeline, so that I can visualize where each deal stands and maintain focus on progressing opportunities.

#### Acceptance Criteria

1. THE Platform SHALL display a Pipeline view with exactly four stages: Prospect, Proposal_Sent, Won, and Lost
2. WHEN a user adds a new Lead with a Target_Company name, THE Backend_App SHALL create the Lead in the Prospect stage by default
3. WHEN a user moves a Lead from one stage to another, THE Backend_App SHALL update the Lead's stage and record the transition timestamp
4. THE Platform SHALL display each Lead as a card within its current stage showing: Target_Company name, date added, and days in current stage, ordered by most recently updated first within each stage
5. THE Platform SHALL allow a user to move a Lead to any other stage (forward or backward) via drag-and-drop interaction or a stage selection control
6. WHEN a user clicks a Lead card, THE Platform SHALL display a detail view showing: all generated content (Research_Reports, Proposals, Outreach_Emails, WhatsApp_Messages) associated with that Lead's Target_Company ordered by creation date descending, current stage, and stage history with timestamps
7. WHEN a user confirms a Lead deletion, THE Backend_App SHALL remove the Lead record and its stage history while retaining all generated content (Research_Reports, Proposals, Outreach_Emails, WhatsApp_Messages) associated with the Target_Company, accessible from the Target_Company detail view
8. THE Platform SHALL allow a user to filter the Pipeline by stage and search Leads by Target_Company name using case-insensitive substring matching, returning results within 500 milliseconds
9. IF a user attempts to create a Lead for a Target_Company that already has an active Lead in the Pipeline, THEN THE Platform SHALL reject the creation and display an error indicating a Lead already exists for that Target_Company
10. THE Platform SHALL display a confirmation prompt before deleting a Lead, indicating that the Lead record and stage history will be permanently removed

### Requirement 10: Target Company Management

**User Story:** As a user, I want to manage a list of target companies, so that I can organize my sales targets and associate AI-generated content with each company.

#### Acceptance Criteria

1. THE Platform SHALL display a list of all Target_Companies created by the authenticated user, showing company name, website URL, date added, and whether a Research_Report exists
2. WHEN a user submits the add Target_Company form with at minimum a company name, THE Backend_App SHALL create a Target_Company record associated with the authenticated user
3. THE Platform SHALL allow a user to edit a Target_Company's name, website URL, and notes field
4. WHEN a user views a Target_Company detail page, THE Platform SHALL display all associated content: Research_Reports, Proposals, Outreach_Emails, and WhatsApp_Messages, ordered by creation date descending
5. THE Platform SHALL allow a user to delete a Target_Company, and WHEN a Target_Company is deleted, THE Backend_App SHALL also remove all associated Leads, Research_Reports, Proposals, Outreach_Emails, and WhatsApp_Messages through cascading deletion
6. IF a user attempts to create a Target_Company with a name identical to an existing Target_Company belonging to the same user, THEN THE Platform SHALL reject the submission and display an error indicating a duplicate exists

### Requirement 11: Responsive User Interface

**User Story:** As a user, I want a modern, responsive interface that works well on desktop and mobile devices, so that I can manage my sales activities from any device.

#### Acceptance Criteria

1. THE Frontend_App SHALL render all pages responsively across viewport widths from 320px (mobile) to 1920px (desktop) without horizontal scrolling or content overflow
2. THE Frontend_App SHALL implement a collapsible sidebar navigation on desktop that collapses to a hamburger menu on viewports below 768px width
3. THE Frontend_App SHALL apply a consistent design system using Tailwind CSS with a defined color palette, typography scale, spacing system, and component patterns documented in a shared UI component library directory
4. WHEN an API request exceeds 200 milliseconds, THE Frontend_App SHALL display a loading state (skeleton screen or spinner) for the affected content area
5. THE Frontend_App SHALL display toast notifications for success actions (content generated, lead moved, profile saved) and error states (API failures, validation errors), where each toast remains visible for 5 seconds and can be dismissed manually
6. THE Frontend_App SHALL implement accessible form controls with visible labels, focus indicators, error messages associated with fields via aria-describedby, and keyboard navigability for all interactive elements
7. WHILE the Platform is performing an AI content generation request, THE Frontend_App SHALL display a progress indicator and disable the generation button to prevent duplicate submissions, and IF the request exceeds 30 seconds, THE Frontend_App SHALL display a timeout message and re-enable the button

### Requirement 12: Dashboard

**User Story:** As a user, I want a dashboard that gives me a quick overview of my sales activity, so that I can immediately see what needs attention when I log in.

#### Acceptance Criteria

1. WHEN a user navigates to the dashboard, THE Platform SHALL display: total number of Leads per pipeline stage, number of Target_Companies, count of Proposals generated this month, and count of Outreach_Emails generated this month
2. THE Platform SHALL display a list of the 5 most recently updated Leads with their current stage and last activity date
3. THE Platform SHALL display a quick-action section with links to: add a new Target_Company, generate a Research_Report, and create a new Lead
4. WHILE the Company_Profile is incomplete, THE Platform SHALL display a prominent banner on the dashboard prompting the user to complete the profile setup
5. THE Frontend_App SHALL load the dashboard data within a single API call returning all summary counts and recent activity to minimize load time

### Requirement 13: API Architecture and Error Handling

**User Story:** As a developer, I want a consistent API architecture with standardized error handling, so that the frontend can reliably communicate with the backend and handle all response scenarios.

#### Acceptance Criteria

1. THE Backend_App SHALL expose a RESTful API with versioned URL prefix (api/v1/) for all endpoints
2. THE Backend_App SHALL return all successful API responses in a standardized JSON format containing: a boolean "success" field set to true, a string "message" field, and a "data" field for response payloads
3. THE Backend_App SHALL return all error API responses in a standardized JSON format containing: a boolean "success" field set to false, a string "message" field describing the error, and a nullable "errors" field for field-level validation details
4. THE Backend_App SHALL validate all incoming request data using Laravel Form Request classes and return HTTP 422 with field-level error details when validation fails
5. IF an unhandled exception occurs during API request processing, THEN THE Backend_App SHALL return an HTTP 500 response with a generic error message in production and log the full exception with stack trace
6. THE Backend_App SHALL implement API rate limiting of 60 requests per minute per authenticated user, and WHEN the limit is exceeded, THE Backend_App SHALL return an HTTP 429 response with a Retry-After header
7. THE Backend_App SHALL require authentication via Sanctum token for all API endpoints except registration, login, password reset, and email verification
8. IF an authenticated user requests a resource that does not exist, THEN THE Backend_App SHALL return an HTTP 404 response with a descriptive message
9. IF an unauthenticated request is made to a protected endpoint, THEN THE Backend_App SHALL return an HTTP 401 response with a message indicating authentication is required

### Requirement 14: Data Privacy and User Isolation

**User Story:** As a user, I want my data to be isolated from other users, so that my company information, leads, and generated content remain private and secure.

#### Acceptance Criteria

1. THE Backend_App SHALL scope all database queries for Company_Profiles, Target_Companies, Leads, Research_Reports, Proposals, Outreach_Emails, and WhatsApp_Messages to the authenticated user's ID
2. IF a user attempts to access a resource belonging to another user via direct URL or API manipulation, THEN THE Backend_App SHALL return an HTTP 403 response
3. THE Backend_App SHALL apply the user-scoping filter automatically via a query scope or middleware applied to all relevant models, without relying on manual filtering in each controller method
4. WHEN a user deletes their account, THE Backend_App SHALL permanently delete all data associated with that user including Company_Profile, Target_Companies, Leads, and all generated content within 30 days

### Requirement 15: Modular Backend Architecture

**User Story:** As a developer, I want the backend organized into modular domain boundaries, so that future features (billing, analytics, enterprise workflows) can be added without modifying existing modules.

#### Acceptance Criteria

1. THE Backend_App SHALL organize code into the following modules: Auth (authentication and password management), CompanyProfile (user's company data), Research (AI company research), Proposal (AI proposal generation), Outreach (AI email and WhatsApp generation), Pipeline (lead and stage management), and User (user account management)
2. WHEN a new module is added, THE Backend_App SHALL accommodate the module by registering a new service provider without modifying files in existing modules
3. THE Backend_App SHALL define clear boundaries between modules where inter-module communication occurs only through defined service interfaces or events, not through direct model access across module boundaries
4. THE Backend_App SHALL use dependency injection via Laravel's service container to bind interfaces to concrete implementations within each module
5. THE Backend_App SHALL configure the OpenAI API integration as a shared service in the AI_Service layer, reusable by Research, Proposal, and Outreach modules through a common interface
6. THE Backend_App SHALL define each module within its own directory containing routes, controllers, services, models, and form requests scoped to that module

### Requirement 16: Database Design

**User Story:** As a developer, I want a well-structured database schema, so that data relationships are clear, queries are efficient, and the schema supports future extension.

#### Acceptance Criteria

1. THE Backend_App SHALL use UUID primary keys for all database tables to support future distributed architecture
2. THE Backend_App SHALL define database migrations for the following tables at minimum: users, company_profiles, target_companies, research_reports, proposals, outreach_emails, whatsapp_messages, leads, and lead_stage_history
3. THE Backend_App SHALL define foreign key constraints with cascading deletion rules: user deletion cascades to all owned records (company_profiles, target_companies, leads, research_reports, proposals, outreach_emails, whatsapp_messages), target_company deletion cascades to research_reports, proposals, outreach_emails, whatsapp_messages, and leads, and lead deletion cascades to lead_stage_history
4. THE Backend_App SHALL include created_at and updated_at timestamp columns on all tables
5. THE Backend_App SHALL add database indexes on: user_id columns for all user-scoped tables (company_profiles, target_companies, leads, research_reports, proposals, outreach_emails, whatsapp_messages), target_company_id columns on research_reports, proposals, outreach_emails, whatsapp_messages, and leads tables, and the stage column on the leads table
6. THE Backend_App SHALL use database enumerations or check constraints for the Lead stage field restricting values to: prospect, proposal_sent, won, and lost
7. THE Backend_App SHALL define the lead_stage_history table with columns: id (UUID primary key), lead_id (foreign key to leads), from_stage, to_stage, and transitioned_at (timestamp recording when the stage transition occurred)
