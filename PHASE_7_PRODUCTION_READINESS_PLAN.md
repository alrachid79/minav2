# Phase 7 — Production Readiness Plan

**Status:** Planning only (no implementation in this document)  
**Goal:** Prepare Mina V2 for a controlled beta launch  
**Audience:** Founders, engineering, QA  
**Last updated:** May 2026

This plan assumes Phases 1–6 are implemented in the repo: auth, onboarding, dashboard command center, document analysis (upload → confirm → integrate), letter generator (draft → export → manage), live call assistant (text coaching + call insights integration), and dashboard/timeline/recommendation reads from existing MVP tables.

---

## 1. Full feature checklist

Use this as a beta sign-off matrix. Each row should be manually verified in **production-like** conditions (Vercel preview or production + Supabase project with schema applied).

### 1.1 Authentication

| Item | Built? | Beta verify |
|------|--------|-------------|
| Email + password signup | Yes | Create account; confirm email |
| Email verification + resend | Yes | Resend on `/verify-email` |
| Login with `?next=` redirect | Yes | Deep-link to `/documents`, `/letters`, `/live-call` after login |
| Auth callback (`/auth/callback`) | Yes | Email link lands session |
| Logout | Yes | Session cleared; protected routes redirect |
| Protected layout auth gate | Yes | `(protected)/layout` redirects unauthenticated users |
| Middleware session refresh | Yes | Matcher: `/dashboard`, `/documents`, `/letters`, `/live-call` |
| Password reset | **No** | Blocker for general public; acceptable for invite-only beta if documented |
| Google / OAuth | **No** | Deferred |
| Account deletion / data export UI | **No** | Schema exists; no user-facing flow |

### 1.2 Onboarding

| Item | Built? | Beta verify |
|------|--------|-------------|
| Guest onboarding UI (`/onboarding`) | Yes | Complete flow without account |
| Pressure profile + analysis cards | Yes | Six-card style analysis |
| Guest session storage (pre-signup) | Yes | Refresh mid-flow; data retained |
| Signup → transfer to database | Yes | `transfer-onboarding` seeds intelligence |
| Writes: `onboarding_sessions`, `onboarding_answers` | Yes | Rows visible in Supabase |
| Seeds: `debt_profiles`, `stress_profiles`, `recovery_statuses`, `memory_entries` | Yes | Post-transfer |
| Dashboard onboarding transfer banner | Yes | `OnboardingTransferStatus` on first login |
| Dashboard recommendation from onboarding | Yes | If transfer creates one |
| **Enforced** redirect: unonboarded user → `/onboarding` | **No** | User can reach dashboard with empty `profiles.state` |
| Onboarding in middleware matcher | **No** | Public route by design; confirm intentional |

### 1.3 Dashboard

| Item | Built? | Beta verify |
|------|--------|-------------|
| Command center layout (hero, recovery, recommendations) | Yes | Mobile + desktop |
| Recovery stage card + progress | Yes | From `recovery_statuses` / onboarding path |
| Primary + secondary recommendations | Yes | From `dashboard_recommendations` |
| Legal attention events card | Yes | From `legal_attention_events` |
| Recent documents / letters / timeline | Yes | Last 5 each |
| Empty states (no data) | Yes | New account UX |
| Quick actions: Documents, Letters | Yes | Hero CTAs |
| Quick action: Live Call | **No** | Route exists; no dashboard CTA |
| Recommendation deep-link for `live_call` | **Partial** | Call insights write recommendations; card may not link to `/live-call` |
| Dismiss / snooze recommendations | **No** | Read-only display |
| Subscription / premium UI | **No** | Not required for beta |

### 1.4 Document Analysis

| Item | Built? | Beta verify |
|------|--------|-------------|
| Upload UI (`/documents`) | Yes | PDF, JPG, PNG, HEIC |
| Storage upload (`documents` bucket, user folder) | Yes | RLS path `auth.uid()/…` |
| Text extraction (PDF + image OCR) | Yes | |
| HEIC handling | Partial | Browser-dependent; fallback messaging |
| Analysis run (`document_analysis_runs`) | Yes | Deterministic intelligence |
| Confirm extracted fields | Yes | User confirms before integration |
| Integrate document (entities, timeline, legal attention, dashboard intelligence) | Yes | Idempotent metadata in `confirmed_data` |
| Processing states + retry UI | Yes | Failed extraction / analysis |
| Document list / status on dashboard | Yes | Recent documents card |

### 1.5 Letter Generator

| Item | Built? | Beta verify |
|------|--------|-------------|
| Generator (`/letters`) | Yes | Types: validation, dispute, cease_communication, hardship |
| Context: documents, collectors, debt situations | Yes | |
| Persist `letters` + `letter_versions` | Yes | |
| Preview (`/letters/[id]`) | Yes | |
| Export PDF (`pdf-lib`) | Yes | `letter_exports` bucket |
| Export DOCX (`docx`) | Yes | |
| Signed download URL | Yes | Short-lived |
| My letters (`/letters/my`) | Yes | |
| Regenerate / edit → new version | Yes | No version delete |
| Educational disclaimers on drafts | Yes | |

### 1.6 Live Call Assistant

| Item | Built? | Beta verify |
|------|--------|-------------|
| Session list + start (`/live-call`) | Yes | Text-only MVP |
| Conversation input (what was said + notes) | Yes | |
| Mina guidance engine (deterministic) | Yes | Educational only |
| Conversation history | Yes | `live_call_messages` |
| End session + summary | Yes | `live_call_summaries` |
| Call insights → timeline + recommendations | Yes | Phase 6B (best-effort on end) |
| Voice / Twilio / transcription / streaming | **No** | Out of scope |
| Link collector/debt on session start | **Partial** | Schema supports; UI may not expose |
| Premium gating on session create | **No** | Schema allows; app does not enforce |

---

## 2. End-to-end test flows

Run each flow on a **clean beta test account** and again on an account with existing data. Record pass/fail and screenshots for failures.

### Flow A — New user onboarding

1. Open `/onboarding` (logged out).
2. Complete all onboarding steps; review analysis cards.
3. Sign up with new email; verify email via link.
4. Land on `/dashboard`; confirm onboarding transfer banner completes (or already transferred).
5. **Expect:** `profiles` row, `onboarding_sessions` + answers, seeded intelligence (`recovery_statuses`, `stress_profiles`, etc.), optional dashboard recommendation, recovery stage visible.

### Flow B — Upload document

1. Log in → `/documents` (or dashboard → Analyze a document).
2. Upload PDF under size limit; wait for processing.
3. **Expect:** `documents.upload_status` → ready; `document_analysis_runs` completed; UI shows analysis summary.

### Flow C — Confirm document

1. On same document, review extracted fields; correct if needed.
2. Confirm.
3. **Expect:** `confirmed_at` set; `confirmed_data` populated; user can proceed to integration.

### Flow D — Integrate document

1. Run integrate (UI action after confirm).
2. **Expect:** Collectors/creditors/debt situations upserted where applicable; `timeline_events` created; `legal_attention_events` if triggered; `dashboard_recommendations` / recovery update per rules; `confirmed_data.integration.*` timestamps.

### Flow E — Generate letter

1. `/letters` → choose type; optional document/collector context.
2. Generate → redirect to `/letters/[id]`.
3. **Expect:** `letters` row + `letter_versions` v1; disclaimer visible.

### Flow F — Export PDF and DOCX

1. On letter preview, export PDF; download via signed URL.
2. Export DOCX; download.
3. **Expect:** Objects in `letter_exports` bucket under user folder; metadata in `recipient_snapshot.export_metadata`; letter status/export fields updated.

### Flow G — Live call session

1. Navigate to `/live-call` (direct URL — no dashboard link yet).
2. Start session → enter collector language + optional notes → get guidance (repeat 2+ turns).
3. End session; review summary.
4. **Expect:** `live_call_sessions` completed; messages ordered by `sequence_number`; `live_call_summaries` saved.

### Flow H — Dashboard recommendations after activity

1. After Flow D and/or Flow G, open `/dashboard`.
2. **Expect:** Primary recommendation reflects document and/or call insights; timeline shows recent events (document + call started/completed/insights); legal attention card populated if applicable.

### Flow I — Session persistence

1. Refresh browser mid-flow (dashboard, document processing, live call).
2. Log out → log in.
3. **Expect:** Session intact; no cross-user data leakage.

---

## 3. Security checklist

### 3.1 Row Level Security (RLS)

| Check | Action |
|-------|--------|
| `supabase-schema.sql` applied once on production project | Confirm all 32 MVP tables + policies exist |
| User-owned tables use `user_id = auth.uid()` | Spot-check: `documents`, `letters`, `live_call_sessions`, `dashboard_recommendations` |
| Child tables via parent ownership | `live_call_messages`, `live_call_summaries`, `letter_versions` |
| `document_analysis_runs` checks document ownership | INSERT/UPDATE policies |
| No broad `authenticated` write without ownership | Review any custom policies added after MVP SQL |
| Service role not used in app | Grep repo: no `SUPABASE_SERVICE_ROLE` in client or server user routes |

### 3.2 Storage policies

| Bucket | Check |
|--------|--------|
| `documents` | SELECT/INSERT/UPDATE/DELETE only when `(foldername)[1] = auth.uid()` |
| `letter_exports` | Same user-folder pattern |
| `data_exports` | Present; unused until export feature ships |
| Buckets created in Supabase | `INSERT INTO storage.buckets` from schema or manual equivalent |
| No public buckets for user documents | `public = false` |

### 3.3 Route protection

| Route group | Protection |
|-------------|------------|
| `/dashboard`, `/documents`, `/letters`, `/live-call` | Middleware + `(protected)/layout` |
| `/login`, `/signup`, `/verify-email` | Public |
| `/onboarding` | Public (guest) — confirm acceptable for beta |
| `/auth/callback` | Public (required for email links) |
| API/server actions | Always `createClient()` + `getUser()`; never trust client `user_id` |

### 3.4 Environment variables

| Variable | Where | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Production project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Anon key only |
| **Never** expose service role | Vercel, git, client bundle | Build-time grep + Vercel env audit |
| `.env.local` gitignored | Repo | `.env.example` documents required vars only |

### 3.5 Auth configuration (Supabase Dashboard)

| Setting | Production value |
|---------|------------------|
| Site URL | `https://<production-domain>` |
| Redirect URLs | Production domain + Vercel preview URLs (if used) |
| Email templates | Branded, correct links to `/auth/callback` |
| Email confirmation | Required for beta? (decide — affects Flow A) |
| JWT expiry / refresh | Default OK; verify long sessions on mobile |

### 3.6 Data and compliance (beta minimum)

| Item | Status |
|------|--------|
| Educational disclaimers on letters + live call | In product copy |
| No legal advice / debt validation promises in generated content | Engine rules — spot-check samples |
| Audit log UI | **No** — `audit_events` table exists |
| Privacy policy + terms linked in app | **Verify** marketing/legal pages exist off-app or add links |

---

## 4. Error handling checklist

Verify user-visible errors (not silent failures) and safe recovery.

| Scenario | Expected UX | Verify |
|----------|-------------|--------|
| **Upload failure** (network, size, mime) | Clear message; retry upload | Break network; oversized file; unsupported type |
| **OCR / extraction failure** | Failed state + retry on document | Corrupt PDF or unreadable scan |
| **Analysis failure** | Failed run state + retry | Force or simulate failed run |
| **Export failure** (PDF/DOCX) | Error message; letter remains | Storage misconfig test on staging |
| **Auth failure** (wrong password, unverified email) | Inline error on login/signup | |
| **Expired session** | Redirect to login with `next=` | Wait for expiry or clear cookies |
| **Empty dashboard** | Empty states, no crash | New user post-signup without documents |
| **Failed document integration** | Action returns error message; document still confirmed | Partial DB failure on staging if possible |
| **Live call integration failure** | Session still ends (best-effort); user not blocked | Currently silent — **document as known gap** |
| **Missing profile row** | Dashboard warning (Phase 1 pattern) | Disable trigger on test project only |
| **HEIC unsupported browser** | Guidance to convert to JPG/PDF | iPhone Safari vs desktop |

---

## 5. Mobile QA checklist

Test on real devices where possible; simulators are secondary.

### 5.1 iPhone Safari

| Area | Checks |
|------|--------|
| Signup / verify email / login | Keyboard, viewport, no horizontal scroll |
| Onboarding | Long forms; card scroll; guest storage |
| Dashboard | Hero, cards, sticky header |
| Document upload | Camera roll / Files; HEIC path |
| Letter preview + export download | Safari download behavior |
| Live call | Textareas, submit, scroll long thread |

### 5.2 Android Chrome

| Area | Checks |
|------|--------|
| Same flows as Safari | Pay attention to file picker and download |
| Auth callback from Gmail app | Custom tabs / default browser |

### 5.3 Small screen (≤ 390px width)

| Checks |
|--------|
| Dashboard grid stacks; recommendation CTA full-width |
| Document and letter pages `max-w-[480px]` layouts |
| Live call message cards readable |
| Touch targets ≥ 44px on primary buttons |

### 5.4 Tablet

| Checks |
|--------|
| Dashboard `max-w-6xl` layout; two-column grid at `lg` |
| No excessive whitespace breaking readability |

### 5.5 Desktop

| Checks |
|--------|
| Chrome + Edge latest |
| `npm run build` production bundle |
| No console errors on happy paths |

---

## 6. Deployment checklist

### 6.1 Repository and CI

| Step | Done? |
|------|-------|
| All beta features merged to `main` (or release branch) | |
| `npm run build` passes locally and in CI (if configured) | |
| No secrets in git history | |
| `.env.example` matches required vars | |
| README or runbook points to this plan | |

### 6.2 GitHub → Vercel

| Step | Done? |
|------|-------|
| Push to GitHub | |
| Import project in Vercel; framework Next.js | |
| Production branch = `main` | |
| Environment variables set (Production + Preview) | |
| Build command: `npm run build` | |
| Node version aligned with local | |

### 6.3 Supabase production

| Step | Done? |
|------|-------|
| Production Supabase project created | |
| `supabase-schema.sql` applied **once** | |
| Storage buckets: `documents`, `letter_exports`, `data_exports` | |
| Seed data if any (`letter_templates`, etc.) | |
| Auth Site URL + Redirect URLs include Vercel domains | |
| Email SMTP / Supabase mail configured | |
| RLS enabled on all tables (verify Dashboard) | |

### 6.4 Vercel environment

| Variable | Environment |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview |

### 6.5 Production URLs

| URL | Purpose |
|-----|---------|
| `https://<domain>/auth/callback` | Email confirmation and OAuth (future) |
| `https://<domain>/login` | |
| `https://<domain>/dashboard` | Post-login default |
| Vercel preview URLs | Add to Supabase redirect allowlist if using preview QA |

### 6.6 Custom domain

| Step | Done? |
|------|-------|
| Domain purchased / DNS access | |
| Vercel domain attached + SSL active | |
| Supabase Auth Site URL updated to custom domain | |
| Remove or limit stale preview URLs in Supabase if needed | |

### 6.7 Production test account

| Step | Done? |
|------|-------|
| Dedicated `beta-test@…` account created in production | |
| Email confirmed | |
| Full Flow A–H executed on production | |
| Credentials stored in team password manager (not in repo) | |
| Account reset procedure documented (manual delete in Supabase if no UI) | |

### 6.8 Post-deploy smoke test (15 minutes)

1. Signup or login on production domain.  
2. Upload one PDF; confirm; integrate.  
3. Generate and export one letter.  
4. Complete one live call session.  
5. Confirm dashboard shows recommendation + timeline.  

---

## 7. Launch blockers

**Must fix or explicitly accept before inviting beta users.**

| # | Blocker | Severity | Notes |
|---|---------|----------|-------|
| 1 | Production Supabase schema + storage not applied | Critical | App will fail all writes |
| 2 | Supabase Auth redirect URLs / Site URL mismatch | Critical | Email login broken |
| 3 | Vercel env vars missing or wrong project | Critical | Blank auth or 500s |
| 4 | `npm run build` fails on release branch | Critical | Cannot deploy |
| 5 | Cross-user data visible (RLS bug) | Critical | Stop launch immediately |
| 6 | Service role key in client or public env | Critical | Security incident risk |
| 7 | Document upload or export completely broken in production | Critical | Core beta promise |
| 8 | Email confirmation broken | High | Blocks Flow A unless manual confirm in Dashboard |
| 9 | No path to Live Call from dashboard + recommendation CTA missing for `live_call` | High | Beta users won’t discover Phase 6; insights feel broken |
| 10 | Onboarding skippable with empty intelligence | Medium–High | Confusing empty dashboard; decide enforce vs. guided empty state |
| 11 | Password reset absent | Medium | Acceptable for invite-only beta with support channel |
| 12 | Live call insights integration fails silently | Medium | Document/support; add logging before scale |
| 13 | HEIC failures on common devices | Medium | Document “use PDF/JPG” if not fixed |
| 14 | No privacy/terms link in app | Medium | Legal/compliance for real users |
| 15 | Schema bootstrap not idempotent | Low (ops) | Document “one-time apply”; don’t re-run on prod |

**Explicitly out of scope for beta (not blockers):** voice calls, Twilio, Decision Shield UI, billing/Stripe, Recovery Planner, legal support intake UI, automated test suite, password reset (if waived in writing).

---

## 8. Nice-to-have later

Can ship after beta feedback; does not gate first cohort if blockers are resolved.

### Product features

- Decision Shield (reviews, options, outcomes)
- Recovery Planner and Recovery Score weighting
- Legal Support intake UI
- Premium subscription gating (`subscriptions.tier` enforcement)
- Google OAuth and password reset
- Account data export and deletion UI
- Dismiss / snooze dashboard recommendations
- Dashboard nav sidebar with all modules
- Live Call: link collector/debt at session start
- Recommendation deep-links for all `target_feature` values
- Document free-tier limits
- Memory candidate review → promote to `memory_entries`

### Technical

- Automated E2E (Playwright) for Flows A–H
- Structured logging / error reporting (Sentry)
- Idempotent migration strategy (Supabase migrations vs. monolithic SQL)
- Expand middleware matcher or move to Next.js `proxy` convention
- Monitor Supabase storage usage and signed URL TTL
- Retry queue for failed integrations (documents, live call)
- Preview/staging environment with anonymized seed data
- CI: lint, typecheck, build on every PR

### UX / polish

- Onboarding enforcement redirect
- “Forgot password” on login
- Profile edit page
- Push notifications / email reminders for deadlines
- Timeline event detail pages
- Letter send-tracking / certified mail integrations
- Real-time live call (audio, streaming AI) — post-MVP architecture

### Growth and ops

- Custom domain email (Resend / Postmark) for auth emails
- Beta waitlist + feature flags
- In-app feedback widget
- Analytics (privacy-preserving)
- Status page for outages

---

## Reference documents

| Document | Purpose |
|----------|---------|
| [PHASE_1_STATUS.md](./PHASE_1_STATUS.md) | Auth foundation verification |
| [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md) | Product scope and phase order |
| [MINA_DATABASE_MVP.md](./MINA_DATABASE_MVP.md) | Tables, RLS, storage |
| [supabase-schema.sql](./supabase-schema.sql) | Production bootstrap SQL |
| [.env.example](./.env.example) | Required environment variables |

---

## Suggested beta launch sequence

1. Complete **Section 3** (security) and **Section 6** (deployment) on staging.  
2. Run **Section 2** flows on staging; fix blockers in **Section 7**.  
3. Run **Section 5** on two physical phones.  
4. Production smoke test (**Section 6.8**).  
5. Invite 5–10 beta users with support email and known limitations (**Section 8**).  
6. Collect feedback; prioritize blockers vs. nice-to-haves for Phase 8+.

---

**Phase 7: Planning document only. No code changes included.**
