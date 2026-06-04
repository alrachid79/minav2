# Phase 3D Implementation Plan — Document Analysis Integration

**Status:** Planning only — no code, migrations, or components yet  
**Prerequisites:** Phase 3A (upload), 3B (text extraction), 3C (deterministic intelligence + analysis cards) complete  
**Sources:** [PHASE_3_IMPLEMENTATION_PLAN.md](./PHASE_3_IMPLEMENTATION_PLAN.md) §7–8, [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md) §5.5, [MINA_DATABASE_MVP.md](./MINA_DATABASE_MVP.md) §7–10, [MINA_DESIGN_SYSTEM.md](./MINA_DESIGN_SYSTEM.md)

---

## Goal

Connect **Document Analysis** to the rest of Mina so that, after a user **confirms** what Mina found, the product updates:

1. **Timeline** — past events and upcoming deadlines from the document  
2. **Dashboard** — recommendations, legal alert surfacing, document entry point  
3. **Shared Intelligence** — debt profile, recovery status proposals, memory candidates  
4. **Legal Attention** — persistent `legal_attention_events` (not just in-run flags)

**First moment of value after 3D:** *"Mina remembered this document — it shows up on my dashboard and timeline."*

**Hard rule (unchanged from architecture):** No writes to shared layers, entities, timeline, or legal attention until the user taps **Confirm**. Analysis cards from 3C are preview-only until confirmation.

---

## What exists today (Phase 3A–3C)

| Layer | Built | Not built |
|-------|-------|-----------|
| Upload + storage | ✅ `/documents`, drag/drop, mobile, progress | Document list, dashboard link |
| Text extraction | ✅ OCR/PDF pipeline, `extracted_text`, metadata fields | — |
| Intelligence | ✅ Classification, entity extraction, legal flag, 5 analysis cards | Confirmation, side effects |
| Persistence | ✅ `documents`, `document_analysis_runs`, `document_extracted_fields` | `confirmed_at`, `confirmed_data`, FK links |
| Legal Attention | ✅ In-run `legal_attention_required` field + UI banner | `legal_attention_events` rows |
| Dashboard | ✅ Onboarding transfer status shell | Recommendations, legal pin, document CTA |
| Timeline | — | Any `timeline_events` from documents |
| Shared layers | ✅ Seeded from onboarding (Phase 2) | Updates from document confirm |

---

## Scope

### In scope (Phase 3D)

| # | Deliverable |
|---|-------------|
| 1 | **Confirmation screen** — review/edit extracted fields before side effects |
| 2 | **Confirm server action** — single transactional orchestrator for all writes |
| 3 | **Entity linking** — `collectors`, `creditors`, `debt_situations`; update `documents` FKs |
| 4 | **Timeline writes** — `timeline_events` on confirm (deadlines + optional past events) |
| 5 | **Legal Attention writes** — `legal_attention_events` when confirmed indicators present |
| 6 | **Shared intelligence updates** — `debt_profiles`, optional `recovery_statuses` proposal, `memory_candidates` (pending only) |
| 7 | **Dashboard integration** — entry point, active recommendations, legal alert card, recent document summary |
| 8 | **Minimal timeline read** — upcoming deadline snippet on dashboard or documents flow (not full Timeline UI) |

### Out of scope (Phase 3D)

| Item | Deferred to |
|------|-------------|
| AI chat or LLM provider | Later phase |
| Full Timeline page (filters, manual events, notes) | Phase 6 |
| `legal_support_intakes` workflow | Phase 9 |
| Letter Generator deep links (functional) | Phase 4 — stub `target_feature` OK |
| `memory_entries` auto-creation | Never in MVP — candidates stay `pending` |
| Free-tier upload limits enforcement | When limit defined |
| Document delete + cascade cleanup | Phase 3E or separate checkpoint |
| Cross-document deadline deduplication | Phase 6+ |
| Re-processing / re-confirm after edit | Idempotent confirm only in 3D |

---

## 1. User flow (end-to-end with 3D)

```
Dashboard → Upload document (3A)
        ↓
Processing + extraction (3B)
        ↓
Classification + cards (3C)
        ↓
[NEW] Confirmation screen — edit fields, optional recovery stage opt-in
        ↓
User taps Confirm
        ↓
confirmDocument server action (3D)
        ↓
Side effects (entities → timeline → legal → shared layers → dashboard recs)
        ↓
Success state → Dashboard (updated) or Upload another
```

### Confirmation gate rules

- **Before confirm:** Only `documents`, `document_analysis_runs`, `document_extracted_fields`, and storage may be written (already true from 3A–3C).
- **On confirm:** Set `documents.confirmed_at`, `documents.confirmed_data`; then run integration writes.
- **After confirm:** Analysis cards become read-only snapshot; user may upload another document.
- **Re-confirm:** Same document with `confirmed_at` set → return `already_confirmed` (no duplicate side effects).

---

## 2. Confirmation screen (3D.1)

### Purpose

Let the user verify and correct Mina's extraction before anything updates their profile.

### UI requirements

| Element | Source |
|---------|--------|
| Document type | `documents.document_type` — editable dropdown (7 types + unknown) |
| Who sent it | `sender_name`, `collector_name`, `creditor_name`, contact fields |
| Amounts & references | `balance_amount`, `account_reference` — labeled "as stated on document" |
| Dates | `document_date`, `response_deadline`, `court_date` |
| Legal attention summary | Read-only if `legal_attention_required = true`; disclaimer visible |
| Recovery stage proposal | Optional opt-in checkbox when legal/court document (default **off**) |
| Primary CTA | **Confirm** — navy button |
| Secondary | Back to cards / Upload another (no side effects) |

### Edits persistence

| Where | What |
|-------|------|
| `documents.confirmed_data` | JSONB snapshot of all user-confirmed key facts |
| `document_extracted_fields` | Set `user_corrected = true` on changed fields |
| `documents.document_type` | Update if user overrides classification |

### Copy requirements

- Guidance disclaimer on confirm screen (same as analysis cards).
- Amount copy: *"The letter states…"* — never *"You owe…"* as fact.
- Legal copy: *"Consider speaking with a qualified professional — not legal advice."*

---

## 3. Confirm server action (3D.2)

### Surface

| Option | Recommendation |
|--------|----------------|
| `confirmDocument(documentId, confirmedPayload)` Server Action | **Preferred** — matches Phase 2 `transfer-onboarding` pattern |
| `POST /api/documents/[id]/confirm` | Alternative — pick one, not both |

Auth required. RLS via authenticated Supabase client only — **no `service_role` in client**.

### Input payload (app layer)

```typescript
{
  documentType: DocumentType;
  fields: {
    sender_name?: string;
    collector_name?: string;
    creditor_name?: string;
    balance_amount?: string;
    balance_currency?: string;
    account_reference?: string;
    document_date?: string;
    response_deadline?: string;
    court_date?: string;
    contact_phone?: string;
    contact_email?: string;
    contact_address?: string;
  };
  acceptRecoveryStageProposal?: boolean; // default false
}
```

### Orchestration order (strict)

Execute in this order so FKs exist before dependent rows:

```
1. Validate document + latest completed analysis run
2. Guard: reject if already confirmed (idempotent)
3. Persist confirmed_data + confirmed_at + field corrections
4. Upsert collectors / creditors (normalized name match)
5. Upsert debt_situation (link collector/creditor, category from document_type)
6. Update documents FKs (collector_id, creditor_id, debt_situation_id)
7. Insert timeline_events
8. Insert legal_attention_events (if applicable)
9. Update debt_profiles
10. Update recovery_statuses (only if user opted in)
11. Insert memory_candidates (pending)
12. Refresh dashboard_recommendations
13. Return success payload for UI
```

### Idempotency

| Check | Behavior |
|-------|----------|
| `documents.confirmed_at IS NOT NULL` | Return `{ status: 'already_confirmed' }` — no writes |
| Same collector name | Match `normalize(name) + user_id` before insert |
| Same deadline date + document | Optional: skip duplicate `timeline_events` with same `source_record_id` + title hash |
| Dashboard primary | Demote previous primary to `secondary` or `completed`; insert new primary |

### Failure handling

- If step 7+ fails after entities created: log error, return partial success message; do **not** roll back entity rows (MVP — manual cleanup acceptable).
- Prefer sequential writes with clear error messages over complex DB transactions (Supabase client limitation).

---

## 4. Entity linking (3D.3)

### Tables

| Table | Operation | When |
|-------|-----------|------|
| `collectors` | INSERT or match existing | Confirmed `collector_name` or `sender_name` when sender appears to be collector |
| `creditors` | INSERT or match existing | Confirmed `creditor_name` present and distinct |
| `debt_situations` | INSERT or match existing | Confirmed account/debt context exists |
| `documents` | UPDATE FKs | After entity upsert |

### Duplicate protection

```typescript
normalizeName(name) = trim → lowercase → collapse whitespace → strip punctuation
```

Match on `(user_id, normalizeName(name))` before INSERT.

### `debt_situations.category` mapping

| `document_type` | `category` |
|-----------------|------------|
| `collection_letter` | `collections` |
| `settlement_offer` | `collections` |
| `medical_billing_notice` | `medical` |
| `irs_notice` | `tax` |
| `court_lawsuit_notice` | `legal` |
| `debt_validation_response` | `collections` |
| `unknown` | `other` |

`label` — optional human string e.g. `"Account …1234"` from `account_reference`.

**Never** store confirmed balance as authoritative truth on `debt_profiles` — only in `confirmed_data` / situation context.

---

## 5. Timeline integration (3D.4)

Full Timeline UI remains Phase 6. Phase 3D **writes** events and **reads** a minimal subset for dashboard.

### Events created (on confirm only)

| Event | `event_category` | `source_feature` | Condition |
|-------|------------------|------------------|-----------|
| Document confirmed | `past_event` | `document_analysis` | Always on confirm |
| Response deadline | `upcoming_deadline` | `document_analysis` | Confirmed `response_deadline` parseable |
| Court / hearing date | `upcoming_deadline` | `document_analysis` | Confirmed `court_date` parseable |
| Legal attention flagged | `past_event` | `document_analysis` | `legal_attention_events` created; `is_legal_attention = true` |

**Not on upload or analysis complete** — confirm only (per [PHASE_3_IMPLEMENTATION_PLAN.md](./PHASE_3_IMPLEMENTATION_PLAN.md) open question #4 default).

### Field mapping

| Column | Source |
|--------|--------|
| `title` | e.g. `"Response deadline — [sender/collector]"` |
| `description` | Plain language from confirmed fields |
| `occurred_at` | Parsed ISO date for deadlines; `confirmed_at` for past events |
| `source_record_id` | `documents.id` |
| `severity` | Align with `documents.risk_level` |
| `collector_id` | From linked entity |
| `debt_situation_id` | From linked entity |
| `is_legal_attention` | `true` for legal flag event |

### Date parsing

- Accept common formats from 3C extraction: `MM/DD/YYYY`, `Month DD, YYYY`.
- Unparseable date → skip deadline event; show note in confirm success ("deadline not added to timeline").
- Store parsed dates in UTC noon local-safe or date-only + T12:00:00Z (pick one at build).

### Minimal read UI (3D.7)

- Dashboard widget: **next upcoming deadline** from `timeline_events` where `event_category = 'upcoming_deadline'` and `deadline_completed_at IS NULL`.
- Optional: same snippet on post-confirm success screen.
- No timeline page route in 3D.

---

## 6. Legal Attention integration (3D.5)

3C detects indicators in `document_extracted_fields.legal_attention_indicators` and sets `legal_attention_required`. Phase 3D creates **persistent events**.

### `legal_attention_events` insert rules

| Condition | Action |
|-----------|--------|
| Confirmed doc + `legal_attention_required = true` | INSERT active event |
| No indicators | No row |
| Already active event for same `source_record_id` | Skip duplicate |

### Field mapping

| Column | Source |
|--------|--------|
| `source_feature` | `'document_analysis'` |
| `source_record_id` | `documents.id` |
| `issue_type` | Highest-severity indicator from JSON (`lawsuit`, `summons`, etc.) |
| `severity` | See severity table below |
| `status` | `'active'` |
| `debt_situation_id` | Linked situation if created |

### Severity mapping (deterministic)

| Condition | `severity` |
|-----------|------------|
| `summons`, `court_date` within 30 days, `garnishment` | `high` |
| `lawsuit`, `judgment` without imminent date | `medium` |
| `irs_enforcement` | `high` |
| Ambiguous / low-confidence indicator only | `low` or skip event |

### UI (read-side)

| Surface | Pattern |
|---------|---------|
| Analysis / confirm | Existing amber banner (3C) — unchanged |
| Dashboard | Pinned **Legal Attention** card when `status = 'active'` events exist (design system §8) |
| Dismissal | `dismissed_at` via future action — **not in 3D** unless trivial; read-only pin OK for MVP |

### Boundaries

- No legal advice, outcome prediction, or statute interpretation.
- CTA may stub `"Prepare for Legal Support"` → `/legal-support` or `"Coming soon"`.
- **Do not** create `legal_support_intakes` in 3D.

---

## 7. Shared intelligence updates (3D.6)

All updates occur **on confirm only**. Follow Phase 2 patterns in `transfer-intelligence.ts`.

### `debt_profiles` (UPDATE)

| Field | Rule |
|-------|------|
| `debt_categories` | Merge category from document_type map if not already in JSONB array |
| `collector_involvement` | Upgrade to `"active"` if collection letter / settlement confirmed |
| `legal_risk_level` | Raise to `medium` / `high` / `legal_attention` based on confirmed legal severity; never downgrade |
| `summary` | Append `{ last_confirmed_document_id, confirmed_at }` note |

### `recovery_statuses` (UPDATE — opt-in only)

| Field | Rule |
|-------|------|
| `current_stage` | Propose `understand` → `protect` when court/lawsuit confirmed; apply **only** if `acceptRecoveryStageProposal = true` |
| `stage_changed_at` | Set when stage changes |
| `recovery_score` | Unchanged (still 0) |

Default: show proposal on confirm screen; **no automatic stage change**.

### `memory_candidates` (INSERT — pending only)

| Category | Example `proposed_content` |
|----------|----------------------------|
| `communication_preference` | `"Uploaded and confirmed a [document_type] from [sender]"` |
| `coaching_insight` | First bullet from `what_mina_sees` (truncated) |
| `behavioral_pattern` | Only if confirm flow adds optional "this caused me stress" prompt — **optional in 3D** |

Fields: `proposing_feature = 'document_analysis'`, `source_record_id = documents.id`, `status = 'pending'`.

**Never** insert `memory_entries` automatically.

---

## 8. Dashboard integration (3D.7)

### Entry points

| Element | Location |
|---------|----------|
| **Analyze a document** | Primary or secondary CTA on dashboard → `/documents` |
| Recent document row | Last confirmed (or last analyzed) document: filename, type, date |

### Recommendations refresh

On confirm, update `dashboard_recommendations`:

| Priority | Example title | `target_feature` | Condition |
|----------|---------------|------------------|-----------|
| Primary | Review your confirmed deadline | `document_analysis` | Deadline confirmed |
| Primary | Prepare for legal attention | `legal_support` | Legal event created (stub link) |
| Primary | Draft a validation letter | `letter_generator` | Collection letter confirmed (stub) |
| Secondary | Up to 3 from `recommended_actions` on latest run | varies | Always after confirm |

Rules:

- One active **primary** per user.
- Demote prior onboarding/document primary to `secondary` or `completed`.
- Idempotent titles — don't duplicate active rows with same `title + user_id`.

### Dashboard widgets (minimal)

| Widget | Data source |
|--------|-------------|
| Primary recommendation card | `dashboard_recommendations` WHERE `priority = 'primary' AND status = 'active'` |
| Secondary recommendations (≤3) | Same table, `priority = 'secondary'` |
| Legal attention pin | `legal_attention_events` WHERE `status = 'active'` |
| Next deadline | `timeline_events` upcoming_deadline, earliest `occurred_at` |
| Document analysis CTA | Static link + optional count of confirmed docs |

Design: [MINA_DESIGN_SYSTEM.md](./MINA_DESIGN_SYSTEM.md) — white cards, navy CTAs, amber legal alert (not full-screen red).

---

## 9. Database tables touched

| Table | Operation | Trigger |
|-------|-----------|---------|
| `documents` | UPDATE | Confirm — `confirmed_at`, `confirmed_data`, FKs, optional `document_type` |
| `document_extracted_fields` | UPDATE | Confirm — `user_corrected` |
| `collectors` | INSERT | Confirm |
| `creditors` | INSERT | Confirm |
| `debt_situations` | INSERT | Confirm |
| `timeline_events` | INSERT | Confirm |
| `legal_attention_events` | INSERT | Confirm + legal indicators |
| `debt_profiles` | UPDATE | Confirm |
| `recovery_statuses` | UPDATE | Confirm + opt-in |
| `memory_candidates` | INSERT | Confirm |
| `dashboard_recommendations` | INSERT, UPDATE | Confirm |

**Not written in 3D:** `memory_entries`, `legal_support_intakes`, `letters`, `audit_events` (optional future).

---

## 10. Suggested file structure (implementation reference)

```
src/
  app/
    actions/
      confirm-document.ts          # Main orchestrator
    (protected)/
      documents/
        [id]/
          confirm/page.tsx         # Confirmation screen (or inline step)
  components/
    documents/
      DocumentConfirmForm.tsx
      DocumentConfirmSuccess.tsx
    dashboard/
      DashboardRecommendations.tsx
      DashboardLegalAlert.tsx
      DashboardNextDeadline.tsx
      DocumentAnalysisEntry.tsx
  lib/
    documents/
      confirm/
        validate-confirm-payload.ts
        upsert-entities.ts
        write-timeline-events.ts
        write-legal-attention.ts
        update-shared-intelligence.ts
        refresh-dashboard-recommendations.ts
        normalize-name.ts
      intelligence/
        ... (existing 3C — read only from confirm)
```

---

## 11. Build order (checkpoints)

| Checkpoint | Deliverable | Depends on |
|------------|-------------|------------|
| **3D.1** | Confirmation screen + field editing UI | 3C cards |
| **3D.2** | `confirmDocument` action — persist `confirmed_at` / `confirmed_data` only | 3D.1 |
| **3D.3** | Entity upsert + `documents` FK linking | 3D.2 |
| **3D.4** | Timeline event writes + date parsing | 3D.3 |
| **3D.5** | `legal_attention_events` creation | 3D.3 |
| **3D.6** | Shared intelligence updates + `memory_candidates` | 3D.3 |
| **3D.7** | Dashboard recommendations refresh + dashboard widgets | 3D.4–3D.6 |
| **3D.8** | E2E smoke: upload → analyze → confirm → verify dashboard/timeline/legal rows | All |

Each checkpoint should pass `npm run build` before proceeding.

---

## 12. Acceptance criteria

Phase 3D is **complete** when:

### Confirmation

- [ ] User can review and edit extracted fields on a confirmation screen  
- [ ] User can override document type  
- [ ] Tapping Confirm sets `documents.confirmed_at` and `confirmed_data`  
- [ ] Confirming twice on same document is idempotent (no duplicate side effects)  
- [ ] Guidance disclaimer visible on confirm screen  

### Entity linking

- [ ] Confirmed collector/creditor creates or matches existing rows (no duplicates by normalized name)  
- [ ] `debt_situations` created with correct category from document type  
- [ ] `documents.collector_id`, `creditor_id`, `debt_situation_id` set after confirm  

### Timeline

- [ ] Confirmed response deadline creates `timeline_events` with `upcoming_deadline`  
- [ ] Confirmed court date creates `upcoming_deadline` event  
- [ ] Document confirmed creates `past_event`  
- [ ] Dashboard shows next upcoming deadline (minimal read)  

### Legal Attention

- [ ] Confirmed doc with legal indicators creates active `legal_attention_events`  
- [ ] Dashboard shows legal attention pin when active events exist  
- [ ] No legal advice in copy; stub CTA acceptable  

### Shared intelligence

- [ ] `debt_profiles` updated (categories, involvement, legal risk — no balance as truth)  
- [ ] Recovery stage changes **only** when user opts in  
- [ ] `memory_candidates` created as `pending` — no `memory_entries`  

### Dashboard

- [ ] Dashboard links to `/documents`  
- [ ] Primary + ≤3 secondary recommendations refreshed after confirm  
- [ ] Prior primary demoted appropriately  

### Boundaries

- [ ] No shared layer writes before confirm  
- [ ] No AI chat, no Legal Support intake workflow  
- [ ] `npm run build` passes  

### E2E smoke path

1. Log in → upload collection letter PDF → wait for analysis  
2. Open confirm → edit sender name → Confirm  
3. Verify `documents.confirmed_at` set  
4. Verify `collectors` row + `timeline_events` if deadline present  
5. Verify `dashboard_recommendations` primary updated  
6. Upload second doc from same collector → confirm → verify no duplicate collector  

---

## 13. Mapping to original Phase 3 plan

| Original checkpoint | Phase 3D mapping |
|--------------------|------------------|
| 3.4 Confirmation screen | 3D.1 |
| 3.5 Confirm action — entities + timeline + legal | 3D.2–3D.5 |
| 3.6 Shared layer + dashboard recs | 3D.6–3D.7 |
| 3.7 Dashboard entry + document list | 3D.7 (minimal list; full list optional) |
| 3.8 E2E | 3D.8 |

---

## 14. Open questions (resolve during build)

| # | Question | Default if unresolved |
|---|----------|------------------------|
| 1 | Confirm as separate route (`/documents/[id]/confirm`) vs inline step after cards | **Inline step** on same page — simpler MVP |
| 2 | Parse deadline dates in local timezone vs UTC noon | UTC noon on parsed calendar date |
| 3 | Create timeline event for `document_date` (past) | **No** — only confirmed deadline + court + confirm past_event |
| 4 | Dashboard document list: confirmed only or include unconfirmed | Show last analyzed; mark unconfirmed as "Review pending" |
| 5 | Dismiss legal attention from dashboard in 3D | **No** — read-only pin; dismissal in later phase |
| 6 | `audit_events` on confirm | Skip in 3D |

---

## 15. Related documents

| Document | Relationship |
|----------|--------------|
| [PHASE_3_IMPLEMENTATION_PLAN.md](./PHASE_3_IMPLEMENTATION_PLAN.md) | Parent plan — §7 Timeline, §8 Shared layers |
| [PHASE_2_IMPLEMENTATION_PLAN.md](./PHASE_2_IMPLEMENTATION_PLAN.md) | Onboarding seed + transfer patterns |
| [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md) | §5.5 Document Analysis behavioral rules |
| [MINA_DATABASE_MVP.md](./MINA_DATABASE_MVP.md) | Table specs |
| [MINA_DESIGN_SYSTEM.md](./MINA_DESIGN_SYSTEM.md) | Cards, legal alert, dashboard |

---

**Phase 3D Implementation Plan — v1.0 (integration planning).**  
Update when confirmation UX, date parsing, or dashboard scope changes.
