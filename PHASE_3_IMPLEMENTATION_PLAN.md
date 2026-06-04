# Phase 3 Implementation Plan — Document Analysis MVP

**Status:** Planning only — no code, migrations, or components yet  
**Prerequisites:** [PHASE_1_STATUS.md](./PHASE_1_STATUS.md) complete; [PHASE_2_IMPLEMENTATION_PLAN.md](./PHASE_2_IMPLEMENTATION_PLAN.md) complete (onboarding + guest transfer + shared intelligence seed)  
**Sources:** [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md) §5.5, [MINA_DATABASE_MVP.md](./MINA_DATABASE_MVP.md) §7, [MINA_DESIGN_SYSTEM.md](./MINA_DESIGN_SYSTEM.md)

---

## Goal

Build **Document Analysis MVP** so a signed-in user can:

1. Upload a financial-pressure document (letter, notice, or image)  
2. Receive a calm, structured analysis in plain language  
3. Review extracted facts, deadlines, and risk indicators  
4. **Confirm** what Mina found before anything updates their profile  
5. See recommended next actions and (when applicable) Legal Attention guidance  

**First moment of value:** *"I finally understand what this letter means."*

Document Analysis is a **V2 launch feature** (Free tier limited / Premium unlimited — limit TBD per architecture open question).

---

## 1. Supported uploads

### File types (MVP)

| Format | Support | Notes |
|--------|---------|-------|
| **PDF** | Required | Primary use case — scanned and digital letters |
| **JPG / JPEG** | Required | Photo of letter, screenshot |
| **PNG** | Required | Screenshot, scan export |
| **HEIC** | Best-effort | Accept if browser/device can read; **server-side convert to JPEG/PNG** before OCR if native HEIC OCR is unreliable. If conversion fails, show friendly error: "Try saving as JPG or PDF." |
| **WEBP** | Optional | Architecture mentions WEBP; include if zero extra cost in upload pipeline |

**Out of scope (MVP):** DOCX, TXT, multi-file ZIP, email `.eml` import, video.

### Constraints (from architecture)

| Constraint | Value |
|------------|-------|
| Max file size | **25 MB** |
| Max pages | **50 pages** |
| Documents per analysis | **One at a time** |
| Storage | Supabase Storage bucket `documents` |
| Tier limit | Free: limited uploads/month (count TBD); Premium: unlimited |

### Upload UX

| Pattern | Requirement |
|---------|-------------|
| **Drag and drop** | Desktop/tablet — drop zone on upload screen |
| **File picker** | `accept` attribute matching allowed MIME types |
| **Mobile upload** | Camera capture + photo library via native file input; touch-friendly 44px+ targets |
| **Progress** | Upload progress indicator (real bytes — not fake analysis progress) |
| **Errors** | Plain language: too large, wrong type, upload failed, page limit exceeded |

**Design:** Mobile-first per [MINA_DESIGN_SYSTEM.md](./MINA_DESIGN_SYSTEM.md) — navy primary actions, white cards, calm copy. No bank-portal or legal-docket aesthetic.

---

## 2. User flow

Signed-in users only. No guest document upload.

```
Dashboard or nav entry → Document Analysis
        ↓
Upload (drag/drop, pick file, mobile camera)
        ↓
Processing (upload + OCR + analysis — calm interstitial)
        ↓
Results — scrollable card stack:
        1. Document Summary
        2. Key Findings
        3. Deadlines
        4. Risk Review
        5. Recommended Next Actions
        ↓
[If legal attention detected]
        → Legal Attention banner (amber/red per design system)
        → Optional fast-path to Legal Support prep (Phase 9 — link may stub "coming soon" in early checkpoints)
        ↓
Confirmation step (required before DB side-effects beyond document tables)
        → User reviews / edits extracted fields
        → User confirms accuracy
        ↓
Post-confirmation updates:
        → Shared entities (debt_situations, collectors, creditors) as applicable
        → Shared intelligence layer proposals
        → Timeline events
        → Dashboard recommendations refresh
        ↓
Return to dashboard or upload another document
```

### Processing screen rules

- Copy: "Mina is reading your document" — **not** fake percentage bars  
- Minimum display time: ~2s (avoid flash of empty state); max timeout with retry  
- Never block on AI — MVP may use OCR + deterministic/heuristic extraction + optional LLM API in server route (implementation choice at build time; architecture allows structured extraction)

### Confirmation gate (architecture hard rule)

**No updates** to `debt_profiles`, `recovery_statuses`, `memory_candidates`, `dashboard_recommendations`, or shared entities until user taps **Confirm**.

`documents.confirmed_at` and `documents.confirmed_data` are set at confirmation.

---

## 3. Document types (V2 launch)

Mina classifies each document into one primary type. User may override during confirmation.

| Type key | User-facing label | Examples |
|----------|-------------------|----------|
| `collection_letter` | Collection letter | Payment demand from collector or agency |
| `debt_validation_response` | Debt validation response | Response to validation request, verification notice |
| `settlement_offer` | Settlement offer | Offer to settle for less than full balance |
| `medical_billing_notice` | Medical billing notice | Hospital bill, provider statement, medical collections |
| `irs_notice` | IRS / tax notice | IRS or state tax agency correspondence |
| `court_lawsuit_notice` | Court / lawsuit notice | Summons, complaint, court scheduling |
| `unknown` | Unknown document | Unclassified — Mina still summarizes what it sees |

**MVP:** Single primary type per document. Secondary tags deferred.

**Maps to:** `documents.document_type` (TEXT, documented enum values in app layer).

---

## 4. Extraction

### Fields to extract (MVP)

Stored in `document_extracted_fields` (per analysis run) and copied to `documents.confirmed_data` on confirmation.

| Field key | Description | Required? |
|-----------|-------------|-----------|
| `sender_name` | Who sent it (collector, creditor, court, IRS) | Best-effort |
| `collector_name` | Collection agency if distinct from sender | If detected |
| `creditor_name` | Original creditor if stated | If detected |
| `account_reference` | Account number, reference ID, case number | If detected |
| `balance_amount` | Amount claimed (as printed — **not validated**) | If detected |
| `balance_currency` | Default USD | If amount present |
| `document_date` | Date on letter | If detected |
| `response_deadline` | Deadline to respond | If detected |
| `court_date` | Hearing/trial date | If detected |
| `contact_phone` | Phone on letter | If detected |
| `contact_address` | Mailing address | If detected |
| `contact_email` | Email if present | If detected |
| `legal_attention_indicators` | JSON array of matched phrases/categories | If any |
| `plain_language_summary` | Also on `document_analysis_runs` | Required for completed run |

Each field includes optional `confidence_score` (0.00–1.00).

### Extraction pipeline (logical)

1. **Upload** → Storage `documents/{user_id}/{document_id}/{filename}`  
2. **OCR / text extract** → `document_analysis_runs.extracted_text`  
3. **Classify** document type  
4. **Extract** structured fields (regex + LLM-assisted — server-side only)  
5. **Assess** risk level and legal attention triggers  
6. **Generate** card content + recommended actions  
7. **Persist** run with `status = completed` or `failed`

### User corrections

- User may edit any extracted value on confirmation screen  
- MVP: corrections stored in `documents.confirmed_data`; `document_extracted_fields.user_corrected = true` where applicable  
- No separate `document_user_corrections` table in MVP (per [MINA_DATABASE_MVP.md](./MINA_DATABASE_MVP.md))

---

## 5. Legal Attention rules

### Purpose

Flag documents that **may** need professional legal help. Mina **does not** provide legal advice, interpret law, or predict outcomes.

### Trigger categories (MVP)

Create or update `legal_attention_events` when analysis detects **high-confidence indicators** in extracted text:

| Issue type (`issue_type`) | Example language / signals |
|---------------------------|----------------------------|
| `lawsuit` | Lawsuit, civil action, complaint filed |
| `summons` | Summons, served, appear in court |
| `garnishment` | Wage garnishment, bank levy, attachment |
| `court_date` | Hearing date, trial date, appearance required |
| `judgment` | Judgment entered, default judgment |
| `irs_enforcement` | Levy, lien, seizure, final notice (IRS/state tax) |

### Severity mapping

| Condition | `legal_attention_events.severity` | UX |
|-----------|-----------------------------------|-----|
| Summons, court date within 30 days, garnishment language | `high` | Red-accent alert card + Legal Support CTA |
| Lawsuit/judgment language without clear date | `medium` | Amber alert + preparation guidance |
| Ambiguous legal terms | `low` or no event | Mention in Risk Review only — no event until user confirms |

### Flow when triggered

1. **During results:** Show Legal Attention banner on Risk Review card — calm headline + one sentence + action  
2. **On confirmation:** If user confirms document with legal indicators → insert `legal_attention_events` (`status = active`, `source_feature = document_analysis`, `source_record_id = document.id`)  
3. **Dashboard:** Pinned legal alert when active events exist (design system §8)  
4. **Copy disclaimer:** "This is guidance to help you prepare — not legal advice. Consider speaking with a qualified professional in your state."

### Dismissal

- User may dismiss non-deadline legal attention per architecture (stored in `legal_attention_events.dismissed_at`)  
- **Do not** allow snooze/dismiss of imminent court dates without explicit acknowledgment copy

---

## 6. Output cards

Results UI uses **structured cards** (not chat). Aligns with onboarding results pattern and design system card spec.

| # | Card | Content |
|---|------|---------|
| 1 | **Document Summary** | Plain-language overview: what this document appears to be, 2–4 sentences. Source: `document_analysis_runs.plain_language_summary` |
| 2 | **Who sent it** | Sender, collector, creditor names; contact info if extracted. Editable on confirm |
| 3 | **What it appears to be** | Document type label + confidence note ("Mina thinks this is…") |
| 4 | **Important dates** | Document date, response deadline, court date — clearly labeled; "Not found" if absent |
| 5 | **What Mina noticed** | Transparency bullets — patterns, urgency language, missing info. Source: `what_mina_sees` |
| 6 | **Recommended next step** | One primary action + up to 2 supporting actions. Source: `recommended_actions` JSON |

**Risk Review** may combine cards 4–5 with legal attention callout when applicable.

**Risk levels** on `documents.risk_level`:

- `low`, `medium`, `high`, `legal_attention_required`

Copy must explain *why* in plain language — never red-only panic UI.

---

## 7. Timeline integration

Phase 3 creates **initial timeline events** directly (full Timeline UI is Phase 6; indexer pattern may evolve).

### Events created (on user confirmation)

| Event | `event_category` | `source_feature` | When |
|-------|------------------|------------------|------|
| Document uploaded | `past_event` | `document_analysis` | On successful upload (optional — or on confirm only; **recommend on confirm** to avoid orphan events) |
| Document analyzed | `past_event` | `document_analysis` | On analysis complete (optional preview) or on confirm |
| **Deadline detected** | `upcoming_deadline` | `document_analysis` | When `response_deadline` or `court_date` confirmed |
| Legal attention flagged | `past_event` | `document_analysis` | When legal attention event created; `is_legal_attention = true` |

### Field mapping

| Timeline column | Source |
|-----------------|--------|
| `title` | e.g. "Response deadline — [sender]" |
| `description` | Plain language from extraction |
| `occurred_at` | Deadline date (future) or upload time (past) |
| `source_record_id` | `documents.id` |
| `severity` | Align with document `risk_level` |
| `collector_id` | If linked after entity creation |
| `debt_situation_id` | If linked after entity creation |

### Not in Phase 3

- Timeline page UI, filters, manual events, notes (Phase 6)  
- `deadline_completed_at` interactions (Phase 6)  
- Cross-document deadline deduplication

---

## 8. Shared layer updates

All updates below occur **after user confirmation** only.

### `debt_situations`, `collectors`, `creditors` (Layer 1 — Phase 3 introduces)

| Entity | Created when | MVP fields |
|--------|--------------|------------|
| `collectors` | Confirmed collector name | Name, phone, address from extraction; link to user |
| `creditors` | Confirmed original creditor | Name if distinct |
| `debt_situations` | Confirmed account/debt context | Category inferred from document type; link collector/creditor; **no confirmed balance required** |

**Duplicate protection:** Match by normalized name + user_id before insert.

`documents` FKs updated: `collector_id`, `creditor_id`, `debt_situation_id`.

### `debt_profiles` (UPDATE — not insert)

| Field | Update rule |
|-------|-------------|
| `debt_categories` | Merge new category if document type maps to debt category not already listed |
| `collector_involvement` | Upgrade if collection letter confirmed |
| `legal_risk_level` | Raise if document warrants (never above confirmed legal attention severity without event) |
| `summary` | Append lightweight JSON note: last confirmed document id, date |

**Never** write confirmed dollar amounts as "truth" — store in `debt_situations` / document confirmed_data only.

### `recovery_statuses` (UPDATE — rare)

| Field | Update rule |
|-------|-------------|
| `current_stage` | Mina **may propose** stage shift (e.g. Understand → Protect) when legal document confirmed; user must accept on confirmation screen |
| `stage_changed_at` | Set if stage changes |
| `recovery_score` | Unchanged in Phase 3 (still 0 until Recovery Planner) |

Default: **no automatic stage change** — show proposal; user opts in.

### `memory_candidates` (INSERT — pending only)

Propose only; **no automatic `memory_entries`** in Phase 3 MVP (user rule from Phase 2 checkpoint).

| Category | Example content |
|----------|-----------------|
| `communication_preference` | "Responded to collector letter via document upload" |
| `fear_pattern` | If user marks high fear on confirm |
| `behavioral_pattern` | If avoidance detected in follow-up prompt |
| `coaching_insight` | Key insight from `what_mina_sees` |

`proposing_feature = document_analysis`, `source_record_id = documents.id`, `status = pending`.

### `dashboard_recommendations` (INSERT / UPDATE)

| Action | Rule |
|--------|------|
| New primary | After confirm — e.g. "Review your confirmed deadline", "Prepare Legal Support checklist", "Draft validation letter" (links to Letter Generator when Phase 4 exists) |
| Demote old primary | Mark previous onboarding primary as `secondary` or `completed` if superseded |
| Secondary | Up to 3 active secondaries from `recommended_actions` |
| `source_feature` | `document_analysis` |
| `target_feature` | `letter_generator`, `legal_support`, `decision_shield`, `document_analysis` |

**Idempotent:** One active primary recommendation chain per user; refresh on new document confirm, don't duplicate identical titles.

---

## 9. V2 boundaries — what Mina never does

Document Analysis MVP must **never**:

| Never | Instead |
|-------|---------|
| **Validate debt** as legally owed or accurate | "The letter states you owe $X" — user confirms what the document says |
| **Predict lawsuits** or court outcomes | "This document mentions a court date" — not "you will lose" |
| **Interpret law** or cite statutes as advice | Plain language summary of what the document appears to request |
| **Tell users what will happen in court** | Suggest preparing questions for a qualified professional |
| **Declare debt valid/invalid** | Present extracted claims; recommend validation/dispute paths |
| **Guarantee outcomes** | Calm, conditional language |
| **Provide legal representation** | Route to Legal Support preparation (Phase 9) |
| **Auto-update profiles** without confirmation | Confirmation gate on every side-effect |
| **Auto-send letters** or payments | Recommend Letter Generator (Phase 4) |
| **Multi-document packages** | One document per analysis |
| **Cross-document comparison** | Deferred |

**Guidance disclaimer** on every results and confirmation screen.

---

## 10. Database tables used

All tables exist in `supabase-schema.sql`. Phase 3 **writes** as follows:

| Table | Operation | When |
|-------|-----------|------|
| `documents` | INSERT, UPDATE | Upload; update type, risk, confirmed_data, FKs |
| `document_analysis_runs` | INSERT, UPDATE | Each analysis attempt |
| `document_extracted_fields` | INSERT | Per run |
| `debt_situations` | INSERT | On confirm (if new) |
| `collectors` | INSERT | On confirm (if new) |
| `creditors` | INSERT | On confirm (if new) |
| `legal_attention_events` | INSERT | On confirm when triggers met |
| `timeline_events` | INSERT | On confirm (deadlines, optional past events) |
| `debt_profiles` | UPDATE | On confirm |
| `recovery_statuses` | UPDATE | On confirm (optional user-accepted stage change) |
| `memory_candidates` | INSERT | On confirm (pending) |
| `dashboard_recommendations` | INSERT, UPDATE | On confirm |

**Storage:** Supabase bucket `documents` — RLS policies per user folder.

**Not written in Phase 3:** `letters`, `live_call_sessions`, `decision_reviews`, `memory_entries`, `recovery_plans`, `subscriptions` billing.

---

## 11. API / server surface (planning)

| Endpoint / action | Auth | Purpose |
|-------------------|------|---------|
| `POST /api/documents/upload` | Required | Signed URL or direct upload; create `documents` row |
| `POST /api/documents/[id]/analyze` | Required | Run OCR + extraction + analysis |
| `GET /api/documents/[id]` | Required | Document + latest run + fields |
| `POST /api/documents/[id]/confirm` | Required | Apply user edits, trigger shared layer updates |
| `DELETE /api/documents/[id]` | Required | Permanent delete (file + DB cascade) |

Alternative: Next.js Server Actions mirroring above — choose one pattern at implementation.

**No `service_role`** in client. All writes via authenticated Supabase client + RLS.

---

## 12. Suggested build order (checkpoints)

| Checkpoint | Deliverable |
|------------|-------------|
| **3.1** | Upload UI + storage + `documents` row; drag/drop + mobile |
| **3.2** | Processing screen + analysis run pipeline (OCR + stub cards) |
| **3.3** | Results card UI (6 cards) + risk/legal attention display |
| **3.4** | Confirmation screen + field editing |
| **3.5** | Confirm server action — entities + timeline + legal attention |
| **3.6** | Shared layer updates + dashboard recommendations refresh |
| **3.7** | Dashboard entry point + document list (minimal) |
| **3.8** | E2E acceptance testing |

---

## 13. Acceptance criteria

Phase 3 MVP is **complete** when:

### Upload & processing

- [ ] Signed-in user can upload PDF, JPG, PNG via drag/drop and file picker on mobile  
- [ ] HEIC handled with convert-or-fallback message  
- [ ] Files over 25 MB or 50 pages rejected with clear error  
- [ ] File stored in `documents` bucket with RLS; metadata in `documents` table  
- [ ] Processing screen shows calm interstitial (no fake progress %)  
- [ ] Failed uploads/analysis show recoverable error state  

### Analysis results

- [ ] User sees all 6 output cards with plain-language copy  
- [ ] Document type classified into one of 7 launch types (user can override on confirm)  
- [ ] Extracted fields populated in `document_extracted_fields` for completed run  
- [ ] Legal Attention banner appears for high-trigger documents — calm, contextual, not full-screen red  
- [ ] Guidance disclaimer visible on results and confirm screens  

### Confirmation & side effects

- [ ] User must confirm before any shared layer or entity write  
- [ ] User can edit extracted values; edits persist to `confirmed_data`  
- [ ] On confirm: `collectors` / `creditors` / `debt_situations` created when applicable (no duplicates)  
- [ ] On confirm: confirmed deadlines create `timeline_events` with `upcoming_deadline`  
- [ ] On confirm: legal documents create active `legal_attention_events`  
- [ ] On confirm: `debt_profiles` updated (categories, involvement, risk — no false balance truth)  
- [ ] On confirm: `memory_candidates` created as **pending** (no `memory_entries`)  
- [ ] On confirm: `dashboard_recommendations` refreshed (1 primary + ≤3 secondary)  

### Boundaries

- [ ] No debt validation, legal interpretation, or outcome prediction in copy or logic  
- [ ] Document delete removes file, analysis, and related feature data (per architecture)  
- [ ] Free tier upload limit enforced when limit is defined  
- [ ] `npm run build` passes; no Supabase service role in client bundle  

### E2E smoke path

1. Log in → upload collection letter PDF  
2. Wait for analysis → review 6 cards  
3. Edit sender name → confirm  
4. Verify `documents.confirmed_at` set  
5. Verify `timeline_events` deadline row if date extracted  
6. Verify dashboard shows new primary recommendation  
7. Upload second doc → idempotent entity matching (same collector not duplicated)  

---

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md) | §5.5 Document Analysis — behavioral rules |
| [MINA_DATABASE_MVP.md](./MINA_DATABASE_MVP.md) | §7 Document Analysis tables |
| [MINA_DESIGN_SYSTEM.md](./MINA_DESIGN_SYSTEM.md) | Cards, alerts, mobile-first, legal alert pattern |
| [PHASE_2_IMPLEMENTATION_PLAN.md](./PHASE_2_IMPLEMENTATION_PLAN.md) | Onboarding seed — Phase 3 extends shared layers |
| [PHASE_1_STATUS.md](./PHASE_1_STATUS.md) | Auth + dashboard shell prerequisites |

---

## 15. Open questions (resolve during build)

| # | Question | Default if unresolved |
|---|----------|------------------------|
| 1 | Free tier monthly document limit | 3 uploads/month |
| 2 | LLM provider for extraction vs heuristic-only MVP | Server-side LLM with structured JSON output + fallback heuristics |
| 3 | OCR provider (Supabase Edge, external API, pdf-parse) | TBD at 3.2 |
| 4 | Create timeline event on upload vs only on confirm | **On confirm only** |
| 5 | Auto proposal for recovery stage change | Show opt-in; default no change |
| 6 | Legal Support deep link in Phase 3 | Stub CTA until Phase 9 if needed |

---

**Phase 3 Implementation Plan — v1.0 (MVP planning).**  
Update when free tier limits, OCR vendor, or checkpoint scope changes.
