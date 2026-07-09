# MVP Implementation Plan — SalesPilot AI

## North Star

Within 60 seconds of signing up, a user inputs a company name and watches AI research it, understand the business, generate a proposal, write a personalized email, and craft a WhatsApp message. The user says: "I can use this for my business."

Everything in this plan serves that single moment.

---

## Design DNA

- **Look:** Stripe, Linear, Notion, Vercel, OpenAI
- **Feel:** Simple, modern, fast, premium, minimal
- **Rule:** One primary action per page. If it doesn't help close deals, postpone it.
- **Copy:** Human, friction-reducing. "Research Company" not "Generate". "Continue" not "Submit".
- **Errors:** Never blame the user. "We couldn't complete the research. Let's try again."
- **Wins:** Celebrate them. Micro-animations, positive language, confetti on first proposal.

---

## Phase 1: Project Bootstrap + Design System (Day 1)

**Emotion:** Confidence — "This feels professional"

### Backend
- `laravel new` with PHP 8.4, PostgreSQL connection
- Install Sanctum for API tokens
- Create JSON response helper (`successResponse`, `errorResponse`)
- `GET /api/v1/health` endpoint
- Configure `.env.example` with DB + `OPENAI_API_KEY`

### Frontend
- Next.js + TypeScript + Tailwind CSS
- Define design tokens: color palette (dark sidebar, white content, blue accents), Inter/Geist font, rounded-xl corners, shadow-sm cards, 8px spacing grid
- Build core UI kit: Button (primary/secondary/ghost, loading state), Input (with label + error + focus ring), Card, Toast (success/error, 5s auto-dismiss), Skeleton loader, Modal
- Build app shell: dark sidebar (collapsible), top header, mobile hamburger menu
- Create `lib/api.ts` — fetch wrapper with token injection, 401 redirect, error normalization
- Empty state component: illustration + headline + single CTA

### Done when
- Both apps run locally, connected via health endpoint
- Design system renders a demo page showing all components
- Mobile layout works at 320px

---

## Phase 2: Authentication + Onboarding Wizard (Day 2–3)

**Emotion:** Excitement — "Let's go!"

### Backend
- `users` migration (UUID PK, name, email unique, password bcrypt, timestamps)
- `POST /api/v1/register` — name, email, password → create user → return Sanctum token + user
- `POST /api/v1/login` — validate → return token + user
- `POST /api/v1/logout` — revoke token
- `GET /api/v1/user` — return authenticated user
- `auth:sanctum` middleware on all routes except register/login

### Frontend — Auth Pages
- Register page: clean, minimal — name, email, password. CTA: "Get Started"
- Login page: email + password. CTA: "Sign In". Link to register.
- Auth context (`useAuth`) with token persistence in localStorage
- Protected layout redirect for unauthenticated users

### Frontend — Welcome Wizard (triggered on first login)
- **Step 1:** "Tell us about your business" — company name, industry, short description, one product/service. Headline: "Let's set up your sales engine." CTA: "Continue"
- **Step 2:** "Who's your first target?" — company name + optional website URL. Headline: "Let's find your first opportunity." CTA: "Research Company"
- **Step 3:** AI in action — show progressive status messages:
  - "Researching company..."
  - "Analyzing website..."
  - "Finding opportunities..."
  - "Writing proposal..."
  - "Preparing email..."
  - "Almost done..."
  - ✓ "Your sales materials are ready!"
- Step 3 auto-triggers: research → proposal → email → WhatsApp in sequence (backend calls chained)
- On completion: navigate to the target company page showing all generated content with celebration animation

### Demo Mode
- On login page: "Try Demo" link
- Loads pre-generated content for sample company "ABC Travel"
- Shows research, proposal, email, WhatsApp — user understands product without entering data
- Banner: "This is a demo. Sign up to generate your own." CTA: "Get Started"

### Done when
- New user registers → wizard launches → completes Step 1 in under 30 seconds
- Steps 2+3 execute (with mocked AI for now) and land on content page
- Demo mode accessible without login

---

## Phase 3: Company Profile + Target Companies (Day 4–5)

**Emotion:** Control — "I've configured my tool"

### Backend
- `company_profiles` migration (UUID PK, user_id FK unique cascade, company_name, industry, description TEXT, products_services JSONB, target_market TEXT nullable, value_propositions TEXT nullable, timestamps)
- `PUT /api/v1/company-profile` — upsert with validation
- `GET /api/v1/company-profile` — return profile or null
- `target_companies` migration (UUID PK, user_id FK cascade, company_name VARCHAR 200, website_url nullable, notes TEXT nullable, unique(user_id, company_name), timestamps)
- Full CRUD: `GET/POST /api/v1/target-companies`, `GET/PUT/DELETE /api/v1/target-companies/{id}`
- All queries scoped to authenticated user

### Frontend — Company Profile Page
- Settings-style page, accessible from sidebar
- Form: company name, industry selector, description textarea, dynamic products list (add/remove), target market, value propositions
- Auto-saves or explicit "Save Changes" with success toast
- If profile incomplete: gentle banner in nav "Complete your profile for better results"

### Frontend — Target Companies Page
- Card grid or list of target companies
- Each card: company name, website, "Researched" badge if report exists
- Add company: modal with name + optional website + notes. CTA: "Add Company"
- Click card → navigate to company detail page (empty content sections for now with "Generate Research" CTA)
- Delete: confirmation dialog with warm language "Remove this company? Generated content will be deleted too."
- Empty state: "Let's find your first client." + Add Company button
- Duplicate name → friendly error "You've already added this company"

### Done when
- Profile saves and persists
- Can add/edit/delete target companies
- Detail page ready for research content

---

## Phase 4: AI Company Research (Day 6–8)

**Emotion:** Curiosity — "What will AI find?"

### Backend
- `research_reports` migration (UUID PK, user_id FK cascade, target_company_id FK cascade, company_overview TEXT, industry_position TEXT, recent_news TEXT, pain_points TEXT, estimated_size TEXT, raw_response TEXT, generated_at TIMESTAMP, timestamps)
- Create `AIService` class:
  - Wraps OpenAI GPT-4 API
  - Method: `generate(string $systemPrompt, string $userPrompt): string`
  - 30-second timeout, catches errors → throws `AIServiceException` with user-friendly message
- `POST /api/v1/target-companies/{id}/research` — build research prompt (company name + website if available), call AIService, parse structured response into sections, store (replace previous)
- `GET /api/v1/target-companies/{id}/research` — return report or null
- Check: company must exist and belong to user

### Frontend — Research Generation
- On target company detail page, top section: "Company Research"
- If no report: card with "Research Company" button + subtitle "AI will analyze public information about this company"
- On click: button enters loading state, show progressive messages:
  - "Researching [Company Name]..."
  - "Analyzing their business..."
  - "Finding opportunities..."
  - "Preparing your report..."
- On success: fade in report sections (overview, industry, news, pain points, size) with subtle animation
- Success toast: "Research complete! ✓"
- Regenerate button: "Refresh Research" with confirmation "This will replace the current report"
- Error: "We couldn't research this company right now. Try again." + retry button

### Wire up Welcome Wizard
- Step 3 now calls real AI research endpoint
- After research completes in wizard, chain to proposal generation (Phase 5)

### Done when
- Real GPT-4 research generates useful company insights
- Report displays beautifully with clear sections
- Progressive loading messages make the wait feel intentional
- Error handling feels supportive, not frustrating

---

## Phase 5: AI Proposal Generator (Day 9–10)

**Emotion:** Relief — "I don't have to write this myself"

### Backend
- `proposals` migration (UUID PK, user_id FK cascade, target_company_id FK cascade, executive_summary TEXT, problem_statement TEXT, proposed_solution TEXT, key_benefits TEXT, next_steps TEXT, full_content TEXT, additional_context TEXT nullable, timestamps)
- `POST /api/v1/target-companies/{id}/proposals` — prerequisites: company profile exists + research exists. Build prompt combining profile + research + optional context. Call AIService. Parse into 5 sections + combined full_content. Store.
- `GET /api/v1/target-companies/{id}/proposals` — list all, newest first
- Prerequisite errors return clear messages: "Complete your company profile first" / "Research this company first"

### Frontend — Proposal Section
- On target company detail page, below research: "Sales Proposal" section
- If prerequisites missing: show which step is needed with link/button to complete it
- If ready: "Generate Proposal" button + optional "Add context" textarea (max 2000 chars, placeholder: "Any specific angle or notes for this proposal?")
- Loading: progressive messages ("Crafting your proposal...", "Personalizing for [Company]...", "Almost ready...")
- Display: beautiful card layout with sections (executive summary, problem, solution, benefits, next steps)
- "Copy Proposal" button (copies full_content) with success animation "Copied! ✓"
- Previous versions: collapsible list showing date + first line of each
- "Generate New Version" button for fresh generation

### Wire up Welcome Wizard
- Step 3 now chains: research → proposal → email (Phase 6)

### Done when
- Proposals reference real company profile and research data
- Output is professional enough to send to a client
- Copy-to-clipboard works flawlessly
- Multiple versions accumulate without losing previous ones

---

## Phase 6: AI Email + WhatsApp Generators (Day 11–12)

**Emotion:** Motivation (email) — "I'm ready to reach out" | Ready to send (WhatsApp)

### Backend
- `outreach_emails` migration (UUID PK, user_id FK cascade, target_company_id FK cascade, subject_line VARCHAR 100, body TEXT, tone VARCHAR 20, contact_name VARCHAR 100 nullable, contact_role VARCHAR 100 nullable, timestamps)
- `whatsapp_messages` migration (UUID PK, user_id FK cascade, target_company_id FK cascade, message VARCHAR 500, contact_name VARCHAR 100 nullable, timestamps)
- `POST /api/v1/target-companies/{id}/emails` — tone (formal/friendly/direct), optional contact name+role. Prerequisites. Build prompt. Parse subject + body. Store.
- `GET /api/v1/target-companies/{id}/emails` — list all, newest first
- `POST /api/v1/target-companies/{id}/whatsapp` — optional contact name. Prerequisites. Build prompt with 500-char constraint. Validate length. Store.
- `GET /api/v1/target-companies/{id}/whatsapp` — list all, newest first

### Frontend — Email Section
- On target company detail page: "Outreach Email" section
- Tone selector: three cards/chips (Formal, Friendly, Direct) — default Formal
- Optional: contact name + role fields
- "Write Email" button → progressive loading ("Writing your email...", "Personalizing the pitch...")
- Display: subject line (bold) + body in email-style card
- Actions: "Copy Subject" | "Copy Body" | "Copy Both" — each with ✓ feedback
- Previous emails list (tone badge + date + first line)
- Generate another with different tone

### Frontend — WhatsApp Section
- On target company detail page: "WhatsApp Message" section
- Optional: contact name field
- "Write Message" button → loading ("Crafting your message...")
- Display: message in WhatsApp-style bubble (green background, rounded)
- Character count shown: "347/500 characters"
- "Copy Message" button with ✓ feedback
- Previous messages list

### Wire up Welcome Wizard
- Step 3 complete chain: research → proposal → email → WhatsApp → celebrate!
- All four pieces shown on completion page

### Done when
- Email generation produces subject + body with clear tone differences
- WhatsApp stays under 500 chars, feels conversational
- Copy actions work perfectly
- Welcome wizard completes full chain with real AI

---

## Phase 7: Polish, Deploy, Demo-Ready (Day 13–14)

**Emotion:** Pride — "This is ready to show"

### UI Polish
- Verify consistent design system across all pages (spacing, typography, colors, shadows)
- Add smooth page transitions (fade or slide)
- Loading skeletons on all data-fetching pages
- All empty states have illustration + friendly copy + single CTA
- Mobile responsive: test 320px, 375px, 768px, 1024px, 1440px
- Sidebar collapses cleanly on mobile with hamburger menu
- Touch targets ≥44px on mobile
- Focus rings and keyboard navigation for accessibility

### Content & Copy Audit
- Review every button label, heading, error message, toast
- Ensure all copy is human, warm, action-oriented
- Check AI loading messages are varied and alive
- Verify error messages never blame the user

### Demo Mode Finalization
- Hard-code sample research, proposal, email, WhatsApp for "ABC Travel"
- Accessible from login page via "Try Demo" button
- Read-only mode with clear "Sign up for free" CTA throughout
- Demo data demonstrates quality of AI output

### Deployment
- Deploy backend to Railway:
  - Connect PostgreSQL add-on
  - Set environment variables (APP_KEY, DB, OPENAI_API_KEY, FRONTEND_URL for CORS)
  - Verify health endpoint responds
- Deploy frontend to Vercel:
  - Set `NEXT_PUBLIC_API_URL` to Railway URL
  - Verify build succeeds
- Configure CORS to allow Vercel origin
- Set up custom domain if available

### Final Validation Checklist
- [ ] Register new account → wizard starts immediately
- [ ] Complete wizard → all 4 AI outputs generated within 90 seconds
- [ ] Demo mode shows pre-generated content without login
- [ ] Company profile saves and updates correctly
- [ ] Can add 3+ target companies without issues
- [ ] Research generates useful, different content per company
- [ ] Proposals reference actual company data
- [ ] Emails have distinct tones (formal vs friendly vs direct)
- [ ] WhatsApp messages are under 500 chars
- [ ] All copy-to-clipboard actions work
- [ ] Mobile layout works (no horizontal scroll, readable text, tappable buttons)
- [ ] Loading states never show blank screens
- [ ] Errors are friendly and recoverable
- [ ] Page loads feel fast (< 2 second perceived)
- [ ] Overall impression: "I would pay for this"

### Done when
- Live URL works end-to-end
- A new user hits the WOW moment in under 60 seconds
- Can demo to a customer in under 5 minutes
- You'd be proud to share the link

---

## Timeline Summary

| Phase | Days | Delivers |
|-------|------|----------|
| 1. Bootstrap + Design System | 1 | App shell, UI kit, connected apps |
| 2. Auth + Onboarding Wizard | 2–3 | Register, login, wizard flow, demo mode |
| 3. Company Profile + Companies | 4–5 | Profile setup, target company management |
| 4. AI Company Research | 6–8 | GPT-4 research with progressive UX |
| 5. AI Proposals | 9–10 | Proposal generation + copy |
| 6. AI Email + WhatsApp | 11–12 | Outreach generation + copy |
| 7. Polish + Deploy | 13–14 | Production-ready, demo-ready |

---

## Success Metric

> Would a real customer be excited enough to recommend SalesPilot AI after using it for five minutes?

If the answer is no at any point, improve the experience before adding more features.
