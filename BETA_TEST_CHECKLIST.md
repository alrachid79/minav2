# Mina V2 — Beta Test Checklist

**Status:** Planning only (no code)  
**Goal:** Validate Mina V2 before public beta  
**Companion:** [PHASE_7_PRODUCTION_READINESS_PLAN.md](./PHASE_7_PRODUCTION_READINESS_PLAN.md)  
**Last updated:** May 2026

---

## How to use this document

1. Run tests on **production** (or a staging environment that mirrors production: Vercel + Supabase with schema applied).
2. Use a **dedicated beta test account** plus one **fresh account** per full pass.
3. Record **Pass** or **Fail** for each journey; link bugs to severity (Section 4).
4. Complete **production smoke tests** (Section 5) immediately before opening beta.
5. Calculate **launch readiness score** (Section 6) before inviting public beta users.

**Test environment record**

| Field | Value |
|-------|--------|
| Environment URL | |
| Supabase project | |
| Build / deploy ID | |
| Tester name | |
| Test date | |
| Device(s) used | |

---

## Pass / fail tracking (summary)

| Journey ID | Journey name | Pass / Fail | Tester | Date | Bug ID(s) |
|------------|--------------|-------------|--------|------|-----------|
| J01 | Guest onboarding complete | | | | |
| J02 | Signup and email verification | | | | |
| J03 | Login and deep-link redirect | | | | |
| J04 | Onboarding transfer on first dashboard visit | | | | |
| J05 | Empty dashboard (new user) | | | | |
| J06 | Upload and analyze PDF document | | | | |
| J07 | Confirm document fields | | | | |
| J08 | Integrate document into intelligence | | | | |
| J09 | Dashboard after document integration | | | | |
| J10 | Generate validation letter | | | | |
| J11 | Export letter PDF | | | | |
| J12 | Export letter DOCX | | | | |
| J13 | Edit letter and view version history | | | | |
| J14 | Start live call session | | | | |
| J15 | Live call guidance turn | | | | |
| J16 | End live call and view summary | | | | |
| J17 | Dashboard after live call insights | | | | |
| J18 | Session persistence (refresh and re-login) | | | | |
| J19 | Logout and protected route guard | | | | |
| J20 | Mobile critical path (one device) | | | | |

**Journey pass rate:** _____ / 20  
**Required for launch:** ≥ 18 Pass, **zero** open P0 bugs, ≤ 2 open P1 bugs with documented workaround

---

## 20 core user journeys

Each journey lists **steps (summary)**, **expected result**, and a **per-journey** pass/fail line.

---

### J01 — Guest onboarding complete

**Steps (summary)**  
1. Open `/onboarding` while logged out.  
2. Complete all onboarding steps.  
3. Review analysis / result cards.  
4. Refresh the page mid-flow once; confirm progress is retained.

**Expected result**  
- Flow completes without error.  
- Analysis cards render with educational copy (no crash).  
- Guest session data survives refresh (local storage).

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J02 — Signup and email verification

**Steps (summary)**  
1. From onboarding (or `/signup`), create account with new email + password (≥ 8 chars).  
2. Land on `/verify-email`.  
3. Open confirmation link from email.  
4. Arrive at `/auth/callback` then authenticated destination.

**Expected result**  
- User created in Supabase Auth.  
- `profiles` row exists (trigger).  
- Session active after confirmation; no infinite redirect loop.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J03 — Login and deep-link redirect

**Steps (summary)**  
1. Log out.  
2. Visit `/documents` (or `/letters`, `/live-call`) while logged out.  
3. Log in from redirect.  
4. Confirm landing on the originally requested path (or documented default).

**Expected result**  
- Redirect to `/login?next=…`.  
- After login, user reaches intended feature route.  
- No exposure of another user’s data.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J04 — Onboarding transfer on first dashboard visit

**Steps (summary)**  
1. After J02, open `/dashboard`.  
2. If transfer banner appears, wait for completion.  
3. Refresh dashboard.

**Expected result**  
- Transfer succeeds or shows clear error with retry path.  
- `onboarding_sessions` / `onboarding_answers` populated in DB.  
- Seeded rows: `recovery_statuses`, `stress_profiles`, `debt_profiles`, `memory_entries` (as applicable).  
- Recovery stage or explanation visible on dashboard.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J05 — Empty dashboard (new user)

**Steps (summary)**  
1. Use account with no documents, letters, or live calls (or new test user skipping heavy flows).  
2. Open `/dashboard`.

**Expected result**  
- Page loads without error.  
- Empty states shown (recommendations, legal attention, recent activity).  
- Hero and CTAs for Documents / Letters work.  
- No misleading “broken” UI.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J06 — Upload and analyze PDF document

**Steps (summary)**  
1. Go to `/documents`.  
2. Upload a readable PDF (collection letter or sample notice).  
3. Wait for processing to finish.

**Expected result**  
- Upload succeeds; file in `documents` + storage under user folder.  
- `document_analysis_runs` completes.  
- UI shows analysis summary / processing complete state.  
- Failure shows clear message + retry if forced failure tested separately.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J07 — Confirm document fields

**Steps (summary)**  
1. On the same document as J06, review extracted fields.  
2. Edit at least one field if offered.  
3. Confirm.

**Expected result**  
- `confirmed_at` set.  
- `confirmed_data` stored.  
- User can proceed to integration; no data loss on refresh before integrate.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J08 — Integrate document into intelligence

**Steps (summary)**  
1. Run integrate on confirmed document.  
2. Re-run integrate once (idempotency check).

**Expected result**  
- Success message; entities/timeline/legal/dashboard side effects per document type.  
- `confirmed_data.integration` metadata updated with timestamps.  
- Second run does not duplicate timeline events or recommendations (idempotent).  
- Clear error if integration fails (document still confirmed).

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J09 — Dashboard after document integration

**Steps (summary)**  
1. Open `/dashboard` after J08.  
2. Check recommendations, legal attention, recent documents, timeline.

**Expected result**  
- Recent document appears with sensible status label.  
- Primary or secondary recommendation may appear (document-driven).  
- Timeline shows document-related events.  
- Legal attention card populated if document triggered legal flags.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J10 — Generate validation letter

**Steps (summary)**  
1. Go to `/letters`.  
2. Select **validation** (or another type).  
3. Optionally link document/collector from J08.  
4. Generate.

**Expected result**  
- Redirect to `/letters/[id]`.  
- Letter body includes disclaimer.  
- `letters` + `letter_versions` (v1) in DB.  
- Educational tone; no legal advice guarantees.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J11 — Export letter PDF

**Steps (summary)**  
1. On letter preview from J10, export PDF.  
2. Download via provided link.

**Expected result**  
- Download starts; file opens as valid PDF.  
- Object in `letter_exports` bucket under user path.  
- Export metadata recorded; no cross-user URL access.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J12 — Export letter DOCX

**Steps (summary)**  
1. Same letter, export DOCX.  
2. Download and open in Word / Google Docs.

**Expected result**  
- Valid DOCX with readable content.  
- Separate storage path from PDF; metadata updated.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J13 — Edit letter and view version history

**Steps (summary)**  
1. Open `/letters/my`.  
2. Edit letter body or regenerate.  
3. Confirm new version exists.

**Expected result**  
- New `letter_versions` row with higher version number.  
- Preview reflects latest version.  
- Older versions not deleted.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J14 — Start live call session

**Steps (summary)**  
1. Navigate to `/live-call` (direct URL if no dashboard link).  
2. Start a new session.  
3. Confirm session page loads.

**Expected result**  
- `live_call_sessions` row with `status: active`.  
- Timeline event **Call started** (after integration runs).  
- Input form visible; educational disclaimer shown.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J15 — Live call guidance turn

**Steps (summary)**  
1. Enter sample collector language (include urgency or payment pressure phrase).  
2. Add optional notes.  
3. Submit for guidance.  
4. Repeat for a second turn.

**Expected result**  
- User + Mina messages in history, ordered correctly.  
- Guidance includes: suggested response, clarifying questions, things to understand, communication guidance, disclaimers.  
- No legal advice / settlement promises / debt validation language in guidance.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J16 — End live call and view summary

**Steps (summary)**  
1. End session from session header.  
2. Review saved summary on same page.

**Expected result**  
- Session `status: completed`, `ended_at` set.  
- `live_call_summaries` populated.  
- Input disabled after end; history still visible.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J17 — Dashboard after live call insights

**Steps (summary)**  
1. Open `/dashboard` after J16 (use language that triggers urgency or deadline in J15).  
2. Check recommendations and timeline.

**Expected result**  
- Timeline: **Call completed** and **Important call insight detected** (if insights fired).  
- Active dashboard recommendation when insights detected (wording matches product rules).  
- Known gap: `live_call` recommendation may lack CTA link — record as P2/P3, not automatic Fail unless product requires link.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J18 — Session persistence (refresh and re-login)

**Steps (summary)**  
1. Hard refresh on `/dashboard`, `/documents/[flow]`, `/live-call/[sessionId]`.  
2. Log out → log in again.  
3. Re-open same document and live call session URLs.

**Expected result**  
- User stays authenticated across refresh.  
- Data unchanged and owned by same user.  
- No stale auth or blank protected pages.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J19 — Logout and protected route guard

**Steps (summary)**  
1. Log out from dashboard.  
2. Visit `/dashboard`, `/documents`, `/letters`, `/live-call`.

**Expected result**  
- Redirect to login.  
- No cached private data shown while logged out.  
- Back button does not bypass auth without re-login.

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | |

---

### J20 — Mobile critical path (one device)

**Steps (summary)**  
On **iPhone Safari** or **Android Chrome**, run a shortened path:  
login → dashboard → upload **or** pick existing doc → confirm OR skip to live call → one guidance turn → logout.

**Expected result**  
- Layout usable on small screen; no horizontal scroll on main flows.  
- Tap targets workable; keyboards do not hide primary actions permanently.  
- Upload/download acceptable on device (note HEIC limitations in notes if applicable).

| Pass / Fail | Tester | Date | Notes |
|-------------|--------|------|-------|
| | | | Device: |

---

## Bug severity definitions

Use these when logging issues found during journeys. One bug can block multiple journeys — tag all affected IDs.

| Severity | Name | Definition | Examples | Beta launch rule |
|----------|------|------------|----------|------------------|
| **P0** | Critical | Security, data loss, or total failure of a core beta promise | Cross-user data visible; RLS bypass; auth broken for all users; cannot upload or login at all | **Block launch** — fix before any public beta |
| **P1** | High | Core journey broken with no workaround | Confirm always fails; integrate always fails; export always 500; email confirm broken | **Block launch** unless exec accepts risk + support plan |
| **P2** | Medium | Feature degraded but workaround exists | HEIC fails (use PDF); live call insights missing on dashboard but data in DB; recommendation missing link | Launch allowed with documented known issues |
| **P3** | Low | Cosmetic, copy, or edge case | Typo, minor misalignment, rare retry needed | Launch allowed; fix in first beta patch |

**Bug log template**

| Bug ID | Severity | Journey ID(s) | Summary | Steps to reproduce | Status |
|--------|----------|---------------|---------|-------------------|--------|
| | | | | | Open / Fixed / Won’t fix |

---

## Production smoke tests

Run **on production domain** within 24 hours of launch. Each item is Pass/Fail. All must Pass.

| # | Smoke test | Expected result | Pass / Fail | Time |
|---|------------|-----------------|-------------|------|
| S1 | Homepage `/` redirects correctly | Logged out → login; logged in → dashboard | | |
| S2 | Signup + email confirm (new alias) | Session works on production URL | | |
| S3 | Login existing beta account | Dashboard loads < 5s perceived | | |
| S4 | Upload one PDF on production | Analysis completes | | |
| S5 | Confirm + integrate one document | Dashboard updates | | |
| S6 | Generate one letter | Preview loads | | |
| S7 | Download PDF export | File valid | | |
| S8 | Complete one live call session | Summary saved | | |
| S9 | Dashboard shows timeline + recommendation | At least one event from S4 or S8 | | |
| S10 | Logout + hit `/dashboard` | Redirects to login | | |
| S11 | Supabase Auth Site URL matches production domain | Email links use correct host | | |
| S12 | Vercel env vars present | No runtime “missing Supabase” errors | | |
| S13 | SSL / custom domain valid | Browser shows secure connection | | |
| S14 | Mobile: login + dashboard only | Usable on one phone | | |

**Smoke pass rate:** _____ / 14  
**Required for launch:** 14 / 14 Pass

---

## Launch readiness score

Use after journeys, bugs, and smoke tests are recorded.

### Scoring components

| Component | Weight | How to score |
|-----------|--------|----------------|
| **A. Core journeys** | 40% | (Pass count ÷ 20) × 100 |
| **B. Production smoke** | 25% | (Pass count ÷ 14) × 100 |
| **C. Open bugs** | 25% | Start at 100; −100 for each open P0; −40 for each open P1; −10 for each open P2; −2 for each open P3 (floor 0) |
| **D. Security & deploy gates** | 10% | 100 if all gates Pass; 0 if any gate Fail |

**Security & deploy gates (all must Pass for D = 100)**

| Gate | Pass / Fail |
|------|-------------|
| `supabase-schema.sql` applied to production | |
| Storage buckets + RLS verified | |
| No service role in client or public env | |
| Auth redirect URLs include production domain | |
| `npm run build` succeeded on release deploy | |

### Formula

```
Readiness % = (A × 0.40) + (B × 0.25) + (C × 0.25) + (D × 0.10)
```

Round to nearest whole number.

### Readiness bands

| Score | Band | Recommendation |
|-------|------|----------------|
| **90–100** | Ready | Proceed with public beta; monitor P2/P3 |
| **75–89** | Conditional | Fix P1s or document waivers; limited beta cohort only |
| **60–74** | Not ready | Address failures in journeys J06–J12 and smoke S4–S7 |
| **< 60** | Stop | Do not launch; security or auth likely broken |

### Launch decision worksheet

| Metric | Value |
|--------|--------|
| Journey pass rate (A) | ___ / 20 = ___% |
| Smoke pass rate (B) | ___ / 14 = ___% |
| Bug penalty score (C) | ___% |
| Deploy gates (D) | ___% |
| **Launch readiness score** | **___%** |
| Open P0 count | |
| Open P1 count | |
| **Decision** | Go / No-go |
| Sign-off (name + date) | |

### Hard stops (override score)

Do **not** launch public beta if any of the following are true, regardless of score:

- Any open **P0** bug  
- More than **two** open **P1** bugs without approved workaround  
- Journey pass rate **< 18 / 20**  
- Any **security & deploy gate** Fail  
- Smoke test **S2, S3, S4, S6, or S10** Fail  

---

## Sign-off

| Role | Name | Date | Go / No-go |
|------|------|------|------------|
| Product | | | |
| Engineering | | | |
| QA / Tester | | | |

---

**Planning document only. No code changes included.**
