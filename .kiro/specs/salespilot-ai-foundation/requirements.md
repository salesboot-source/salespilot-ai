# Requirements Document

## Introduction

SalesPilot AI is an enterprise-grade SaaS platform that automates the B2B sales lifecycle using AI. This requirements document covers **Phase 1 only** — the architectural foundation. Phase 1 establishes the project structure, technology stack, clean architecture patterns, module scaffolding, coding standards, security foundation, and development documentation. No application logic, AI modules, UI screens, or business workflows are included in this phase.

## Glossary

- **Foundation**: The project scaffolding, configuration, architecture patterns, and standards that enable future feature development
- **Frontend_App**: The Next.js 14+ application using TypeScript, React, and Tailwind CSS, deployed to Vercel
- **Backend_App**: The Laravel 12 application using PHP 8.4, deployed to Railway via Docker
- **Module**: A self-contained domain boundary within the Backend_App representing a business capability (e.g., Authentication, Workspace, CRM)
- **Clean_Architecture**: A layered architecture separating Domain, Application, Infrastructure, and Presentation concerns
- **Domain_Layer**: Contains entities, value objects, repository interfaces, and domain events — no framework dependencies
- **Application_Layer**: Contains use cases, DTOs, command/query handlers, and service interfaces
- **Infrastructure_Layer**: Contains concrete implementations of repository interfaces, external service integrations, and framework-specific code
- **Presentation_Layer**: Contains controllers, API resources, requests, and middleware
- **Scaffold_Generator**: A CLI tool or script that generates empty module structures following the defined architecture
- **RBAC**: Role-Based Access Control — an authorization model where permissions are assigned to roles, and roles are assigned to users
- **Multi_Tenant**: An architecture where a single application instance serves multiple isolated customer workspaces
- **Docker_Environment**: The containerized development and deployment environment using Docker Compose for local development and Docker images for production

## Requirements

### Requirement 1: Enterprise Folder Structure

**User Story:** As a developer, I want a scalable enterprise folder structure, so that the codebase remains maintainable as the platform grows to support multiple AI modules and multi-tenant SaaS features.

#### Acceptance Criteria

1. THE Foundation SHALL define a Backend_App folder structure containing separate directories for each architectural layer: Domain_Layer, Application_Layer, Infrastructure_Layer, and Presentation_Layer
2. THE Foundation SHALL define a Frontend_App folder structure using a feature-based organization with top-level directories for: features (containing per-feature subdirectories), components (shared UI components), hooks (shared custom hooks), utilities (shared helper functions), types (shared TypeScript type definitions), and services (API client and external service integrations)
3. THE Foundation SHALL organize modules within the Backend_App so that each Module has its own Domain_Layer, Application_Layer, Infrastructure_Layer, and Presentation_Layer subdirectories, isolated from other Module directories
4. THE Foundation SHALL include a top-level directory structure with at minimum the following directories: backend (Backend_App), frontend (Frontend_App), infrastructure (Docker and deployment configurations), and docs (project documentation)
5. WHEN a new Module is added, THE Foundation SHALL accommodate the Module by allowing a new Module directory to be placed alongside existing Module directories without modifying any files or directories within existing Modules
6. THE Foundation SHALL define that each Frontend_App feature directory contains subdirectories for: components, hooks, types, and services scoped to that feature

### Requirement 2: Technology Stack Configuration

**User Story:** As a developer, I want the technology stack properly configured with all dependencies, so that I can begin building features immediately on a stable foundation.

#### Acceptance Criteria

1. THE Backend_App SHALL be initialized as a Laravel 12 project using PHP 8.4 with Composer dependency management
2. THE Frontend_App SHALL be initialized as a Next.js project using TypeScript with strict mode enabled, React, and Tailwind CSS
3. THE Foundation SHALL configure PostgreSQL as the primary database with connection settings defined in environment variables
4. THE Foundation SHALL configure Redis as the caching and session driver with connection settings defined in environment variables
5. THE Foundation SHALL configure Laravel Queue with Redis as the default queue connection
6. THE Foundation SHALL configure S3-compatible storage as the default filesystem disk for file uploads
7. THE Foundation SHALL configure Laravel Reverb as the WebSocket broadcasting driver for real-time communication
8. THE Foundation SHALL configure Laravel Sanctum as the API authentication mechanism
9. THE Foundation SHALL include a Docker Compose configuration providing PostgreSQL, Redis, and the Backend_App services for local development

### Requirement 3: Clean Architecture Implementation

**User Story:** As a developer, I want clean architecture enforced across the codebase, so that business logic remains independent of framework concerns and the system stays testable.

#### Acceptance Criteria

1. THE Domain_Layer SHALL contain only entities, value objects, repository interfaces, domain events, and enumerations with zero dependencies on Laravel framework packages, Eloquent, or any third-party Composer packages — only PHP-native language constructs and interfaces defined within the Domain_Layer or shared kernel are permitted
2. THE Application_Layer SHALL contain use cases, DTOs, command handlers, query handlers, and service interfaces that reference only classes and interfaces from the Domain_Layer or the shared kernel via PHP use statements — no references to Infrastructure_Layer or Presentation_Layer namespaces are permitted
3. THE Infrastructure_Layer SHALL contain concrete implementations of repository interfaces, Eloquent models, external API clients, and framework service providers that depend on the Application_Layer and Domain_Layer
4. THE Presentation_Layer SHALL contain controllers, form requests, API resources, and middleware that reference only Application_Layer classes (use cases, DTOs, service interfaces) — direct references to Domain_Layer entities or Infrastructure_Layer implementations are not permitted
5. THE Foundation SHALL enforce dependency direction by providing an automated architectural test (PHPUnit or static analysis rule) that scans PHP use statements in each layer and fails if an inner layer imports from an outer layer (Domain imports nothing external, Application imports only Domain, Infrastructure imports Application and Domain, Presentation imports only Application)
6. THE Foundation SHALL provide base abstract classes for Entity and Value_Object, and base interfaces for Repository, Use_Case, and DTO in a shared kernel directory accessible to all layers
7. IF an architectural dependency violation is detected during test execution, THEN THE Foundation SHALL report the violating file path, the disallowed import, and the layer boundary that was crossed

### Requirement 4: Module Architecture Scaffolding

**User Story:** As a developer, I want empty module scaffolds for all planned business capabilities, so that future development has a consistent structure to follow.

#### Acceptance Criteria

1. THE Foundation SHALL create module directories for each of the following: Authentication, Workspace, Users, Companies, Leads, CRM, Proposal, Outreach, AI_Agents, Billing, Settings, Analytics, and Notification, where each directory contains only the defined subdirectory structure and .gitkeep placeholder files to preserve empty directories in version control
2. WHEN a Module directory is created, THE Foundation SHALL include subdirectories for Domain (Entities, ValueObjects, Repositories, Events, Enums), Application (UseCases, DTOs, Services, Commands, Queries), Infrastructure (Repositories, Models, Providers), and Presentation (Controllers, Requests, Resources, Middleware)
3. THE Foundation SHALL include a module registration configuration file that lists all modules, where each module entry can be set to enabled or disabled, and WHEN a module is disabled, THE Foundation SHALL exclude that module's service provider from loading and exclude that module's routes from registration
4. THE Foundation SHALL NOT include business logic, concrete implementations, or functional code within Module scaffolds, with the exception of an empty service provider class per module required for the module registration mechanism
5. IF a module is referenced in application code but is set to disabled in the module registration configuration, THEN THE Foundation SHALL raise a runtime error indicating the module is not available

### Requirement 5: Coding Standards Definition

**User Story:** As a development team, we want explicit coding standards documented and enforced, so that all contributors produce consistent, readable, and maintainable code.

#### Acceptance Criteria

1. THE Foundation SHALL define naming conventions specifying: PascalCase for classes and interfaces, camelCase for methods and variables, snake_case for database columns and configuration keys, kebab-case for URLs and file names
2. THE Foundation SHALL define interface naming using a descriptive suffix pattern (e.g., Repository, Service, Handler) without an "I" prefix
3. THE Foundation SHALL define DTO naming using the pattern: {Action}{Entity}DTO (e.g., CreateCompanyDTO)
4. THE Foundation SHALL define repository rules requiring: one repository per aggregate root, repository interfaces in the Domain_Layer, and concrete implementations in the Infrastructure_Layer
5. THE Foundation SHALL define service rules requiring: single responsibility per service class, constructor injection for dependencies, and interface-based contracts
6. THE Foundation SHALL define a standardized API response format containing: a boolean "success" field indicating request outcome, a string "message" field for human-readable context, a nullable "data" field for response payload, a nullable "errors" array field for validation or processing error details, and a nullable "meta" field for pagination and request metadata
7. THE Foundation SHALL configure Laravel Pint for Backend_App code style enforcement, with a configuration file that fails the CI pipeline when code style violations are detected
8. THE Foundation SHALL configure ESLint and Prettier for Frontend_App code style enforcement, with configurations that fail the CI pipeline when code style violations are detected
9. THE Foundation SHALL define validation rules requiring: form request classes for all API input validation in the Backend_App, and Zod schemas for Frontend_App input validation
10. IF a code style check detects violations during local development, THEN THE Foundation SHALL provide a single command to automatically fix all auto-fixable violations for both Backend_App and Frontend_App

### Requirement 6: Git Strategy and Version Control

**User Story:** As a team lead, I want a defined Git branching strategy and commit conventions, so that the team collaborates efficiently with a clean, traceable history.

#### Acceptance Criteria

1. THE Foundation SHALL define a Git branching strategy with the following branches: main (production), develop (integration), feature/* (new features), bugfix/* (bug fixes), hotfix/* (emergency production fixes), and release/* (release preparation), where branch names after the prefix follow the pattern: ticket-id/short-description using lowercase and hyphens (e.g., feature/SP-42/user-authentication)
2. THE Foundation SHALL define branch merge direction rules specifying: feature/* and bugfix/* merge into develop, release/* branches from develop and merges into both main and develop, and hotfix/* branches from main and merges into both main and develop
3. THE Foundation SHALL define commit message conventions following Conventional Commits format: type(scope): description, where type is one of feat, fix, docs, style, refactor, test, chore, ci, perf, scope corresponds to a Module name or shared concern (e.g., auth, crm, infra, docs), and the description line is limited to a maximum of 72 characters
4. THE Foundation SHALL define release versioning following Semantic Versioning (MAJOR.MINOR.PATCH) where MAJOR increments for breaking API changes, MINOR increments for backward-compatible feature additions, and PATCH increments for backward-compatible bug fixes
5. THE Foundation SHALL include a .gitignore file excluding vendor directories, environment files (.env, .env.*), build artifacts, IDE configurations, and operating system files for both Backend_App and Frontend_App
6. THE Foundation SHALL define a merge strategy requiring squash merges for feature/* and bugfix/* into develop, and merge commits (no-fast-forward) for release/* and hotfix/* into main to preserve release history

### Requirement 7: Environment Configuration

**User Story:** As a developer, I want a well-documented environment configuration template, so that I can set up local and production environments without guessing at required variables.

#### Acceptance Criteria

1. THE Foundation SHALL provide a .env.example file for the Backend_App containing all required environment variables with descriptive comments explaining each variable's purpose
2. THE Foundation SHALL organize environment variables into logical groups: Application, Database, Cache, Queue, Storage, Mail, Broadcasting, Authentication, and Third-Party Services
3. THE Foundation SHALL provide a .env.example file for the Frontend_App containing API base URL, WebSocket URL, and feature flag variables with descriptive comments
4. IF a required environment variable is missing at application startup, THEN THE Backend_App SHALL fail with a descriptive error message identifying the missing variable

### Requirement 8: Security Foundation

**User Story:** As a security engineer, I want security controls embedded in the foundation, so that all future features inherit secure defaults without requiring additional configuration.

#### Acceptance Criteria

1. THE Foundation SHALL configure Laravel Sanctum for stateless API token authentication with a default token expiration of 24 hours, configurable via environment variable
2. THE Foundation SHALL define an RBAC structure supporting roles (Super Admin, Admin, Manager, Member, Viewer) and granular permissions assignable at the module-action level (e.g., companies.create, leads.delete)
3. THE Foundation SHALL configure API rate limiting with configurable limits per endpoint group (authentication: 5 requests/minute, general API: 60 requests/minute, heavy operations: 10 requests/minute), and WHEN a rate limit is exceeded, THE Foundation SHALL return an HTTP 429 response with a Retry-After header indicating seconds until the limit resets
4. THE Foundation SHALL configure CSRF protection for all state-changing requests originating from web sessions
5. THE Foundation SHALL configure XSS protection through automatic output escaping in both Backend_App responses and Frontend_App rendering
6. THE Foundation SHALL configure SQL injection protection by enforcing parameterized queries through the ORM and prohibiting raw query strings in application code
7. THE Foundation SHALL define an audit log structure capturing: actor (user_id), action (string), resource type (string), resource ID (UUID), timestamp (ISO 8601), IP address, and metadata (JSON) for all state-changing operations, and IF the audit log write fails, THEN the primary operation SHALL still complete and the failure SHALL be logged to the application error log
8. THE Foundation SHALL configure secret management using environment variables with documentation prohibiting secrets in source code or configuration files
9. THE Foundation SHALL configure CORS with an explicit allowlist of permitted origins, methods, and headers defined via environment variables

### Requirement 9: Development Standards Documentation

**User Story:** As a new team member, I want development principles and patterns documented, so that I can contribute code that aligns with the team's architectural decisions.

#### Acceptance Criteria

1. THE Foundation SHALL document adherence to each of the five SOLID principles with at least one code example per principle demonstrating correct application within the Clean_Architecture layers, identifying which layer each example applies to
2. THE Foundation SHALL document the DRY principle with decision criteria specifying when to extract shared code into the shared kernel versus tolerate duplication across Modules, including at least one example of justified extraction and one example of justified duplication
3. THE Foundation SHALL document the KISS principle with decision criteria for identifying premature abstraction, including at least one example of an over-engineered approach contrasted with a simpler alternative within the Module architecture
4. THE Foundation SHALL document Domain-Driven Design patterns including: Entities, Value Objects, Aggregates, Repositories, and Domain Events, where each pattern's documentation contains a definition, the layer it belongs to, rules for when to use it, and its relationships to other patterns within the Module architecture
5. THE Foundation SHALL document error handling patterns specifying: custom exception classes per Module, exception-to-HTTP-status mapping, exception propagation rules across Clean_Architecture layers (Domain exceptions wrapped at Application layer, Infrastructure exceptions not leaking to Presentation), and structured error response format consistent with the standardized API response format defined in Requirement 5
6. THE Foundation SHALL document layer interaction patterns specifying: allowed dependencies between layers, how data crosses layer boundaries (via DTOs and interfaces), and the dependency injection approach used to connect interfaces in inner layers to implementations in outer layers

### Requirement 10: Project Documentation

**User Story:** As a developer or stakeholder, I want comprehensive project documentation, so that I can understand the architecture, contribute effectively, and track project progress.

#### Acceptance Criteria

1. THE Foundation SHALL include a README.md file containing: project overview, technology stack summary, prerequisites (listing required tool names and minimum versions), setup instructions with a verification step confirming successful setup, and links to other documentation files
2. THE Foundation SHALL include an Architecture.md file documenting: system overview diagram description, layer responsibilities, module boundaries, data flow patterns, and infrastructure topology
3. THE Foundation SHALL include a Contributing.md file documenting: development environment setup, branch workflow, commit conventions, pull request process, and code review guidelines
4. THE Foundation SHALL include a CodingStandards.md file documenting: naming conventions, folder conventions, class patterns, API conventions, and linting configuration
5. THE Foundation SHALL include a Roadmap.md file documenting: phased delivery plan with at minimum 4 phases, Phase 1 (Foundation) marked as current, and subsequent phases listed with titles and one-sentence descriptions
6. THE Foundation SHALL include a ProjectStructure.md file documenting: the complete directory tree to a depth of 3 levels with annotations explaining the purpose of each top-level directory and module
7. THE Foundation SHALL ensure that all documentation files reference the same directory structure, module names, and technology choices consistently — any change to project structure must be reflected in all relevant documentation files

### Requirement 11: Docker Development Environment

**User Story:** As a developer, I want a containerized development environment, so that I can run the full stack locally with a single command regardless of host operating system.

#### Acceptance Criteria

1. THE Docker_Environment SHALL provide a docker-compose.yml file defining services for: Backend_App (PHP 8.4 with extensions: pdo_pgsql, redis, mbstring, openssl, tokenizer, xml, ctype, bcmath, and pcntl), PostgreSQL 16, Redis 7, and a queue worker
2. THE Docker_Environment SHALL include a Dockerfile for the Backend_App using multi-stage builds that separates dependency installation from application code, runs the application process as a non-root user, and produces a final image based on a minimal base (e.g., Alpine or slim variant)
3. THE Docker_Environment SHALL expose configurable ports for all services via environment variables with default values of 8000 for Backend_App, 5432 for PostgreSQL, and 6379 for Redis
4. THE Docker_Environment SHALL mount application source code as a volume for hot-reload during development
5. WHEN `docker compose up` is executed, THE Docker_Environment SHALL start all services in dependency order (PostgreSQL and Redis before Backend_App and queue worker) with the Backend_App returning an HTTP 200 response on its health endpoint and connected to PostgreSQL and Redis within 60 seconds
6. THE Docker_Environment SHALL define health checks for PostgreSQL, Redis, and Backend_App services so that dependent services wait until their dependencies report healthy before starting
7. THE Docker_Environment SHALL persist PostgreSQL data using a named Docker volume so that database state is retained across container restarts
8. IF a service fails its health check after 30 seconds, THEN THE Docker_Environment SHALL mark that service as unhealthy and prevent dependent services from starting

### Requirement 12: Multi-Tenant Data Architecture Foundation

**User Story:** As an architect, I want the multi-tenant data isolation strategy defined at the foundation level, so that all future modules implement consistent tenant boundaries.

#### Acceptance Criteria

1. THE Foundation SHALL define a workspace-based tenancy model where each tenant is identified by a unique workspace_id of type UUID
2. THE Foundation SHALL define a base model trait or scope that resolves the current workspace_id from the authenticated user's session or token context and automatically filters all database queries by that workspace_id
3. THE Foundation SHALL define database migration conventions requiring a workspace_id foreign key column with a database index on all tenant-scoped tables
4. THE Foundation SHALL document which data is global (shared across tenants) and which data is tenant-scoped in the Architecture documentation
5. IF a database query is executed on a tenant-scoped table without a workspace_id context being set, THEN THE Foundation SHALL reject the query and return an error indicating that workspace context is required

### Requirement 13: Testing Foundation

**User Story:** As a developer, I want testing infrastructure configured, so that I can write and run unit, integration, and feature tests from the start of development.

#### Acceptance Criteria

1. THE Backend_App SHALL be configured with PHPUnit for unit and feature testing, with a phpunit.xml configuration that defines a separate database connection (distinct from the development database) used exclusively during test execution
2. THE Frontend_App SHALL be configured with Vitest for unit and component testing with TypeScript support and a jsdom or happy-dom environment for component rendering
3. THE Foundation SHALL define a test directory structure mirroring the module structure: each Module SHALL have Tests/Unit, Tests/Feature, and Tests/Integration subdirectories
4. THE Foundation SHALL include a base test case class providing helper methods for: creating authenticated users with a specified role, setting workspace context to a given workspace_id, and resetting database state between tests using transaction rollback so each test begins with a clean state
5. THE Foundation SHALL configure code coverage reporting with a minimum threshold of 80% for lines added or modified in a changeset, and IF the coverage of changed lines falls below 80%, THEN the test suite SHALL report a failure
6. THE Foundation SHALL define documented test execution commands that run the full Backend_App test suite via a single command and the full Frontend_App test suite via a single command
