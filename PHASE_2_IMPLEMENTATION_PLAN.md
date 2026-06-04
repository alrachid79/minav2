# Phase 2 Implementation Plan — Onboarding Intelligence

**Status:** Planning only — no code, migrations, or components yet  
**Prerequisites:** [PHASE_1_STATUS.md](./PHASE_1_STATUS.md) complete (auth, dashboard shell, profiles trigger verified)  
**Sources:** [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md), [MINA_DATABASE_MVP.md](./MINA_DATABASE_MVP.md), [PHASE_1_STATUS.md](./PHASE_1_STATUS.md)

> **Note on design system:** `MINA_DESIGN_SYSTEM.md` is referenced but **not present in the repo**. Visual and tone guidance below is derived from architecture emotional principles, Onboarding Intelligence UX spec, and Phase 1 minimal Tailwind patterns until a design system doc is added.

---

## Goal

Build the **complete guest onboarding experience** and **guest-to-signup handoff** so a visitor can:

1. Complete structured onboarding without an account  
2. Receive Mina analysis (6 cards), pressure profile, and recovery path  
3. Sign up and have all data transferred to the database  
4. Land on the dashboard with shared intelligence layers seeded  

**First moment of value:** *"Mina understands me."*

---

## 1. Scope

### Exactly what will be built in Phase 2

| Area | Deliverable |
|------|-------------|
| **Guest onboarding flow** | Full multi-step flow (5–8 minutes), session-storage only pre-signup |
| **Onboarding questions** | Six category groups per architecture (situation, pressure, emotional, behavior, support, goals) + US **state** capture |
| **Progress UX** | Step indicator, back navigation, answer persistence in guest session |
| **Analysis engine integration** | Server-side generation of pressure profile, recovery path, and 6-card analysis from answers |
| **Results screens** | Analysis results, pressure profile, recovery path (read-only preview for guests) |
| **Answer review** | User can go back and edit answers before signup handoff |
| **Signup handoff screen** | CTA to create account; preserves guest session through signup |
| **Guest → DB transfer** | On first authenticated session, write all Phase 2 tables listed below |
| **Profile completion** | Update `profiles.state`, `profiles.consents` from onboarding |
| **Shared layers seed** | Initialize `debt_profiles`, `stress_profiles`, `recovery_statuses` |
| **Memory Service (MVP)** | Onboarding proposes `memory_candidates`; app-layer service auto-accepts into `memory_entries` at transfer |
| **Dashboard recommendations seed** | 1 primary + up to 3 secondary `dashboard_recommendations` from onboarding actions |
| **Routing** | Guest entry at `/onboarding`; logged-out root may redirect to onboarding (TBD in build) |
| **Post-transfer dashboard** | Extend Phase 1 dashboard shell to show onboarding summary (minimal — not Phase 10 intelligence) |
| **Onboarding origin record** | `onboarding_sessions` row with `is_origin_session = true`, `session_number = 1` |
| **Expiry handling** | 7-day guest session TTL; expired session shows restart prompt |

### Exactly what will not be built in Phase 2

| Excluded | Reason / deferred to |
|----------|----------------------|
| Document Analysis, Letter Generator, Live Call, Decision Shield | Phase 3+ |
| Recovery Planner (plans, milestones, check-ins) | Phase 8 — only `recovery_statuses.current_stage` seeded here |
| Full Dashboard Intelligence (ranking engine, widgets, stress-adaptive layout) | Phase 10 |
| Timeline indexer and `timeline_events` seed ("Mina Journey Started") | Phase 6 (optional stretch: single timeline insert at transfer if approved during build) |
| `debt_situations`, `collectors`, `creditors` | Phase 3 — onboarding writes **categories only** to `debt_profiles` |
| `subscriptions` row creation / Stripe billing | Later — no payment in Phase 2 |
| Google OAuth | Phase 1 deferred item |
| Password reset | Phase 1 deferred item |
| Signed-in **re-onboarding** full flow | Phase 2 focuses guest path; re-onboarding UI may stub "coming soon" |
| My Mina Profile management UI | Phase 2 seeds memory; edit/remove UI deferred |
| Onboarding step **adaptivity** (skip logic) | Open question — use **fixed step order** for MVP unless decided otherwise |
| AI chat / giant mixed conversation | Architecture hard rule |
| Legal Attention events from onboarding | No legal conclusions in onboarding |
| Export / delete account | Compliance phase |
| Component library / design system package | Use inline Tailwind per Phase 1 until `MINA_DESIGN_SYSTEM.md` exists |
| Database migrations / schema changes | Schema already applied in Phase 1 |
| Premium tier gating during onboarding | Onboarding is free per architecture |

---

## 2. Database tables used

All tables exist in `supabase-schema.sql`. Phase 2 **writes** to these; guests never touch the DB directly.

### `onboarding_sessions`

| When | What |
|------|------|
| **At signup transfer** | Insert origin session: `session_number = 1`, `is_origin_session = true`, `status = completed` |
| **Columns populated** | `pressure_profile`, `recovery_path`, `analysis` (JSONB), `started_at`, `completed_at` |

Guest phase: equivalent data lives in session storage only.

### `onboarding_answers`

| When | What |
|------|------|
| **At signup transfer** | Bulk insert one row per completed step |
| **Columns** | `step_key`, `response_data` (JSONB), linked to session + user |

**Planned `step_key` values:**

| Step | `step_key` |
|------|------------|
| US state | `us_state` |
| Current situation | `current_situation` |
| Pressure sources | `pressure_sources` |
| Emotional state | `emotional_state` |
| Behavior pattern | `behavior_pattern` |
| Support preference | `support_preference` |
| Recovery goals | `recovery_goals` |

### `profiles`

| When | What |
|------|------|
| **At signup transfer** | **Update** existing row (created by auth trigger) — do not insert |
| **Fields set** | `state` (from onboarding), `consents` (guidance + data storage acknowledgments) |
| **Optional** | `first_name` if collected at handoff (not required for MVP) |

### `debt_profiles`

| When | What |
|------|------|
| **At signup transfer** | Insert one row per user (`UNIQUE user_id`) |
| **From onboarding** | `debt_categories` (high-level), `legal_risk_level` (inferred), `summary` (light JSON), `collector_involvement` if indicated |

No confirmed balances — categories only per architecture.

### `stress_profiles`

| When | What |
|------|------|
| **At signup transfer** | Insert one row per user |
| **From pressure profile** | `stress_intensity`, `fear_intensity`, `avoidance_level`, `pressure_level` |

### `recovery_statuses`

| When | What |
|------|------|
| **At signup transfer** | Insert one row per user |
| **From recovery path** | `current_stage` (`stabilize` \| `understand` \| `protect` \| `act` \| `resolve` \| `recover`), `recovery_score = 0` |

### `memory_candidates`

| When | What |
|------|------|
| **At signup transfer** | Insert proposals from onboarding analysis |
| **Fields** | `proposing_feature = 'onboarding'`, `category`, `proposed_content`, `source_record_id = onboarding_session.id`, `status` |

MVP: onboarding-generated candidates move to `accepted` immediately via Memory Service (no user approval UI for initial seed).

### `memory_entries`

| When | What |
|------|------|
| **At signup transfer** | Insert active entries from accepted candidates |
| **Fields** | `category`, `content`, `level = 'user'`, `status = active`, `memory_candidate_id` |

Typical seed categories: `communication_preference`, `fear_pattern`, `behavioral_pattern`, `coaching_insight`.

### `dashboard_recommendations`

| When | What |
|------|------|
| **At signup transfer** | Insert 1 primary + up to 3 secondary |
| **From analysis** | `title`, `reason`, `target_feature`, `priority`, `sort_order`, `status = active`, `source_feature = 'onboarding'` |

Deep links may point to features not yet built (e.g. `document_analysis`) — display-only on dashboard shell until Phase 3.

### Tables explicitly NOT written in Phase 2

`timeline_events`, `debt_situations`, `collectors`, `creditors`, `subscriptions`, `legal_attention_events`, `audit_events` (optional later).

---

## 3. User flow

```
Guest arrives (/, /onboarding, or marketing link)
        ↓
Welcome screen — what Mina does, time estimate, privacy note
        ↓
Onboarding questions (7 steps with progress indicator)
        ↓
[Server] Generate analysis from answers
        ↓
Analysis results — 6 cards + narrative
        ↓
Pressure profile summary
        ↓
Recovery path — stage + recommended next steps
        ↓
(Optional) Review / edit answers → regenerate analysis
        ↓
Signup handoff — "Save your progress" → /signup with guest session intact
        ↓
Signup (existing Phase 1 flow) + email verification
        ↓
First authenticated session (/auth/callback → /dashboard)
        ↓
[Server action] Transfer guest session → database (all tables above)
        ↓
Clear guest session storage
        ↓
Dashboard — shows seeded profile, stage, recommendations (minimal shell upgrade)
```

### Guest constraints (architecture)

- **Can:** complete onboarding, see analysis, pressure profile, recovery preview, recommended actions  
- **Cannot:** save to DB, upload documents, use features, see real dashboard  

### Signup transfer timing

Phase 1 requires **email confirmation**. Recommended approach:

1. Guest completes onboarding → data in `sessionStorage`  
2. User signs up → pending transfer flag in `localStorage` (survives tab close better than sessionStorage alone)  
3. After email verification + session established → authenticated **server action** runs transfer  
4. Idempotent: if transfer already completed, skip  

This avoids `service_role` key while respecting RLS.

---

## 4. Screens required

All under `/onboarding/*` unless noted. Style: calm, card-based, minimal Tailwind (Phase 1 continuity). Tone: high-stress users get shorter copy and reassuring language per architecture.

### Welcome

| Element | Detail |
|---------|--------|
| **Route** | `/onboarding` |
| **Content** | Mina mission (reduce fear → clarity → action), "5–8 minutes", no SSN/financial account collection |
| **CTA** | Start |
| **Secondary** | Log in (existing account) |

### Onboarding questions

| Element | Detail |
|---------|--------|
| **Route** | `/onboarding/steps/[stepKey]` or single page with step state |
| **Interaction** | Cards, chips, selectors, sliders — **not** a long form or chat |
| **Steps** | 7 steps (see `step_key` table above) |
| **Coaching** | Brief Mina interstitial copy between sections (static strings for MVP) |
| **Persistence** | Auto-save to guest session on each step |

### Progress indicator

| Element | Detail |
|---------|--------|
| **Placement** | Top of question screens |
| **Shows** | Step N of 7, section label, optional progress bar |
| **Behavior** | Back button preserves answers |

### Analysis results

| Element | Detail |
|---------|--------|
| **Route** | `/onboarding/results/analysis` |
| **Content** | 6 cards: pressure, pattern, biggest risk, recovery stage, recommended actions, what Mina sees |
| **Disclaimer** | Guidance disclaimer — visible, not dominant |
| **CTA** | Continue to pressure profile |

### Pressure profile

| Element | Detail |
|---------|--------|
| **Route** | `/onboarding/results/pressure` |
| **Content** | Sources, stress intensity, behavior pattern (Avoider/Analyzer/Reactor/Freezer), support style |
| **CTA** | Continue to recovery path |

### Recovery path

| Element | Detail |
|---------|--------|
| **Route** | `/onboarding/results/recovery` |
| **Content** | Current stage name + explanation, 3–5 recommended next steps |
| **CTA** | Continue to signup handoff |
| **Secondary** | Edit answers |

### Signup handoff

| Element | Detail |
|---------|--------|
| **Route** | `/onboarding/signup` |
| **Content** | Recap: "Your progress will be saved when you create an account", summary bullets |
| **CTA** | Create account → `/signup?from=onboarding` |
| **Consents** | Checkbox(es) for data storage + guidance disclaimer (stored in guest session, written to `profiles.consents` at transfer) |
| **Note** | Guests never see `/dashboard` until transfer completes |

---

## 5. API routes required

Route handlers only where server-side secrets or guest-accessible generation is needed.

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `POST` | `/api/onboarding/analyze` | Accept structured answers JSON → return `{ pressure_profile, recovery_path, analysis }` | None (guest) — **rate limit required** |
| `GET` | `/api/onboarding/session-check` | Optional: validate guest session shape server-side for debugging | None |

### `/api/onboarding/analyze` contract (planned)

**Request body:**
```json
{
  "answers": { "us_state": {}, "current_situation": {}, ... },
  "session_id": "client-uuid"
}
```

**Response:**
```json
{
  "pressure_profile": {},
  "recovery_path": {},
  "analysis": {
    "cards": [],
    "narrative": ""
  }
}
```

**Implementation notes:**
- Calls LLM provider with structured output schema (Zod validation)  
- No PII beyond what user entered in onboarding  
- No database writes  
- Returns errors safe for client display  

### Not API routes (use server actions instead)

- Guest → DB transfer  
- Profile update  
- Memory Service accept flow  

---

## 6. Server actions required

| Action | Trigger | Auth | Writes |
|--------|---------|------|--------|
| `transferOnboardingToDatabase` | First dashboard load or dedicated `/onboarding/complete` after session exists | **Required** (`auth.uid()`) | All Phase 2 tables |
| `regenerateOnboardingAnalysis` | Optional: signed-in user re-run (defer UI) | Required | None pre-signup |

### `transferOnboardingToDatabase` (primary)

**Input:** validated guest payload from client (`GuestOnboardingPayload` Zod schema)

**Steps (single transaction preferred — Supabase RPC or sequential with rollback on failure):**

1. Verify user authenticated  
2. Check idempotency key (`guest_session_id` or `onboarding_completed_at`) — skip if already transferred  
3. Update `profiles` — `state`, `consents`  
4. Insert `onboarding_sessions` (origin, completed)  
5. Insert `onboarding_answers` (batch)  
6. Insert `debt_profiles`, `stress_profiles`, `recovery_statuses`  
7. Insert `memory_candidates` → run Memory Service → insert `memory_entries`  
8. Insert `dashboard_recommendations` (1 primary + ≤3 secondary)  
9. Return `{ success: true, onboarding_session_id }`  

**On failure:** return structured error; keep guest payload in localStorage for retry  

### Memory Service (application layer — not a separate server action)

```
onboarding → memory_candidates (pending)
           → MemoryService.accept(candidate)
           → memory_entries (active) + candidate.status = accepted
```

MVP rule: **auto-accept all onboarding candidates** at transfer. Reject path exists for future features.

---

## 7. Validation rules

### Client-side (each step)

| Field / step | Rules |
|--------------|-------|
| `us_state` | Required; valid US state/territory code |
| `current_situation` | ≥1 selection or text; lawsuit concern flag allowed |
| `pressure_sources` | ≥1 source selected |
| `emotional_state` | Overwhelm level required (slider or enum) |
| `behavior_pattern` | Exactly one primary pattern |
| `support_preference` | ≥1 preference |
| `recovery_goals` | ≥1 goal, ≤5 |
| Consents (handoff) | Required checkboxes before signup CTA |

### Server-side (analyze + transfer)

| Rule | Enforcement |
|------|-------------|
| All `step_key` values present before analyze | 400 if missing |
| JSON schema match (Zod) | Reject malformed payloads |
| Enum values | Match DB documented values (`stress_intensity`, `current_stage`, etc.) |
| No prohibited content | Reject SSN, account numbers if detected in free text |
| `recovery_score` | Always `0` at transfer |
| `dashboard_recommendations` | Max 1 primary + 3 secondary |
| `user_id` on all inserts | Must equal `auth.uid()` |
| Idempotent transfer | Second call does not duplicate rows |
| Analysis output | Must not contain legal conclusions, outcome guarantees, or "you don't owe" statements |

### Content guardrails (architecture — "Never")

- Promise outcomes  
- Predict lawsuits  
- Guarantee settlements  
- Give legal conclusions  
- Tell users they don't owe a debt  

Enforce via LLM system prompt + post-generation validation filter.

---

## 8. Guest session storage strategy

### Storage mechanism

| Store | Key | Purpose |
|-------|-----|---------|
| `sessionStorage` | `mina_guest_onboarding_v1` | Primary active session (answers, progress) |
| `localStorage` | `mina_guest_onboarding_pending_transfer_v1` | Survives signup/verify flow until DB transfer |

### Payload shape (versioned)

```typescript
{
  version: 1,
  guest_session_id: string,      // client UUID
  created_at: ISO8601,
  expires_at: ISO8601,           // created_at + 7 days
  current_step: string,
  answers: Record<step_key, unknown>,
  pressure_profile: object | null,
  recovery_path: object | null,
  analysis: object | null,
  consents: { data_storage: boolean, guidance_disclaimer: boolean },
  transfer_status: "pending" | "completed" | null
}
```

### Lifecycle

| Event | Behavior |
|-------|----------|
| Welcome → Start | Initialize payload if missing or expired |
| Each step complete | Merge answer, update `current_step`, save |
| Analysis generated | Store outputs in payload |
| Signup clicked | Copy payload to `localStorage` pending transfer |
| Transfer success | Clear both keys; set `transfer_status = completed` |
| Expired session (>7 days) | Clear storage; show "Start over" on `/onboarding` |
| Invalid/corrupt JSON | Clear; restart onboarding |

### Security notes

- No secrets in guest storage  
- No database IDs pre-signup  
- Sanitize before sending to analyze API  
- Rate-limit analyze endpoint by IP/session  

---

## 9. Shared layer update strategy

Onboarding is the **first writer** to shared intelligence layers. Later features update with user confirmation where required.

| Layer | Phase 2 action | Source mapping |
|-------|----------------|----------------|
| **User Profile** (`profiles`) | UPDATE | `us_state` → `state`; handoff consents → `consents` |
| **Debt Profile** (`debt_profiles`) | INSERT | Situation + pressure answers → `debt_categories`, `legal_risk_level`, `collector_involvement`, `summary` |
| **Stress Profile** (`stress_profiles`) | INSERT | Emotional + pressure → intensity fields |
| **Recovery Status** (`recovery_statuses`) | INSERT | Analysis recovery stage → `current_stage`; score = 0 |
| **Mina Memory** | INSERT via service | Behavior, support, fear patterns → candidates → entries |
| **Dashboard** | INSERT recommendations | Analysis recommended actions → `dashboard_recommendations` |

### Update rules post-Phase 2

- Document Analysis may **update** debt profile after user confirmation — not during Phase 2  
- Stress profile updated by Live Call, Decision Shield — later phases  
- Recovery stage advancement — Recovery Planner (Phase 8); Phase 2 sets initial stage only  
- Memory: future features propose candidates; onboarding entries remain unless user corrects (Phase 2+ UI)  

### Mapping: analysis → memory candidates (example)

| Analysis signal | Memory category | Example content |
|-----------------|-----------------|-----------------|
| Support preference | `communication_preference` | "Prefers step-by-step guidance" |
| Fear of lawsuits | `fear_pattern` | "High anxiety about legal action" |
| Avoidance behavior | `behavioral_pattern` | "Tends to delay responding to collectors" |
| Coaching note | `coaching_insight` | "Needs reassurance before taking action" |

---

## 10. Acceptance criteria

### Guest flow

- [ ] Guest can start at `/onboarding` without login  
- [ ] All 7 question steps completable with validation errors shown inline  
- [ ] Progress indicator accurate; back navigation preserves answers  
- [ ] Guest session persists on browser refresh within same tab  
- [ ] Session expires after 7 days with clear restart message  
- [ ] Analysis generates within acceptable time (<30s target)  
- [ ] 6-card analysis displays all required cards + narrative  
- [ ] Pressure profile and recovery path screens match stored JSON  
- [ ] User can edit answers and regenerate analysis before signup  
- [ ] Guest cannot access `/dashboard` (middleware redirect to login)  
- [ ] Signup handoff reaches `/signup` with guest data intact  

### Signup + transfer

- [ ] After signup + email verify + login, transfer runs automatically once  
- [ ] Transfer is idempotent (no duplicate sessions/profiles on refresh)  
- [ ] `profiles.state` populated (no longer empty)  
- [ ] `profiles.consents` populated  
- [ ] `onboarding_sessions` origin row exists with all three JSON columns  
- [ ] `onboarding_answers` has 7 rows linked to session  
- [ ] `debt_profiles`, `stress_profiles`, `recovery_statuses` each have exactly one row  
- [ ] ≥1 `memory_candidates` accepted with matching `memory_entries`  
- [ ] 1 primary + ≤3 secondary `dashboard_recommendations` with `status = active`  
- [ ] Guest storage cleared after successful transfer  
- [ ] Dashboard shows onboarding summary (stage, primary recommendation minimum)  

### Quality + compliance

- [ ] No manual `profiles` INSERT (trigger still owns creation)  
- [ ] Analysis output passes content guardrails (no legal guarantees)  
- [ ] Guidance disclaimer shown before results and at handoff  
- [ ] `npm run build` passes  
- [ ] No `service_role` key in client bundle  
- [ ] RLS: user A cannot read user B's onboarding or profile data  

### Manual E2E (Phase 2)

1. Incognito → `/onboarding` → complete all steps  
2. View analysis, pressure, recovery screens  
3. Sign up + verify email  
4. Land on dashboard — confirm state set, recommendations visible  
5. Supabase Table Editor — verify all 9 tables populated  
6. Log out → log in — data persists, no re-transfer  
7. New incognito — confirm guest cannot see prior user's data  

---

## Suggested build order (when approved)

1. Guest session utilities + Zod schemas  
2. Question steps UI (static copy first)  
3. `/api/onboarding/analyze` + LLM integration  
4. Results screens (pressure, recovery, analysis)  
5. Signup handoff + localStorage pending transfer  
6. `transferOnboardingToDatabase` server action + Memory Service  
7. Dashboard shell upgrade (show seeded data)  
8. Middleware/routing updates (`/` → `/onboarding` for guests)  
9. Manual E2E + fix pass  

---

## Open decisions (resolve before coding)

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Onboarding step adaptivity | Fixed 7-step order for MVP |
| 2 | LLM provider + env var | Add `OPENAI_API_KEY` or equivalent to `.env.example` only when implementing |
| 3 | Root `/` for guests | Redirect to `/onboarding` instead of `/login` |
| 4 | Timeline seed at transfer | Defer to Phase 6 unless explicitly added |
| 5 | `subscriptions` free row | Defer — not required for onboarding completion |
| 6 | Create `MINA_DESIGN_SYSTEM.md` | Recommended before UI build for consistent tokens/components |

---

## References

| Document | Use in Phase 2 |
|----------|----------------|
| [MINA_ARCHITECTURE.md §5.1](./MINA_ARCHITECTURE.md) | Onboarding categories, outputs, guardrails |
| [MINA_ARCHITECTURE.md §8](./MINA_ARCHITECTURE.md) | Guest-to-signup flow |
| [MINA_ARCHITECTURE.md §3](./MINA_ARCHITECTURE.md) | Shared layer responsibilities |
| [MINA_DATABASE_MVP.md §4–6, §13.1](./MINA_DATABASE_MVP.md) | Table schemas |
| [PHASE_1_STATUS.md](./PHASE_1_STATUS.md) | Completed foundation, deferred items |
| [supabase-schema.sql](./supabase-schema.sql) | Applied schema (no changes planned) |

---

**Phase 2 plan complete. Awaiting approval before implementation.**
