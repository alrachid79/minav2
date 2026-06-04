# Mina V2 Database MVP

**Launch database for a 4–7 day V2 build.**

Derived from [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md). Long-term design lives in [MINA_DATABASE_ARCHITECTURE.md](./MINA_DATABASE_ARCHITECTURE.md).

No SQL. No migrations. No code.

---

## MVP Database Approval Checklist

Final review before any SQL is written.

### 1. What is included in MVP

| Area | Tables | Count |
|------|--------|-------|
| Core | `profiles`, `subscriptions` | 2 |
| Onboarding | `onboarding_sessions`, `onboarding_answers` | 2 |
| Shared entities | `debt_situations`, `collectors`, `creditors` | 3 |
| Shared intelligence | `debt_profiles`, `stress_profiles`, `recovery_statuses`, `memory_candidates`, `memory_entries` | 5 |
| Document Analysis | `documents`, `document_analysis_runs`, `document_extracted_fields` | 3 |
| Letter Generator | `letters`, `letter_versions` | 2 |
| Live Call Assistant | `live_call_sessions`, `live_call_messages`, `live_call_summaries` | 3 |
| Timeline | `timeline_events` | 1 |
| Decision Shield | `decision_reviews`, `decision_options`, `decision_outcomes` | 3 |
| Legal | `legal_attention_events`, `legal_support_intakes` | 2 |
| Dashboard | `dashboard_recommendations` | 1 |
| Compliance | `audit_events`, `data_export_requests`, `account_deletion_requests` | 3 |
| Catalog | `letter_templates`, `legal_support_resources` | 2 |
| **Total** | | **32** |

**Storage buckets:** `documents`, `letter_exports`, `data_exports`

**Launch scope covered:** Authentication/profile, onboarding, shared entities, shared intelligence, document analysis, letter generator, basic live call, timeline, basic decision shield, legal attention, dashboard recommendations, subscription placeholder, compliance basics.

---

### 2. What is intentionally deferred

| Deferred | Full-architecture reference |
|----------|----------------------------|
| Call Through Mina (6 tables) | `call_through_*` |
| Recovery Planner (6 tables) | `recovery_plans`, milestones, actions, checkins, versions, history |
| Separate `{feature}_history` tables (8) | Per-feature append-only history |
| Dashboard snapshots and alerts | `dashboard_snapshots`, `dashboard_alerts`, `dashboard_interactions` |
| Advanced memory tables | `memory_history`, `memory_entry_sources`, `memory_recommendations` |
| Legal case packets and resource view tracking | `legal_support_case_packets`, `legal_support_resource_views` |
| Timeline interaction tables | `timeline_user_notes`, `timeline_manual_events`, `timeline_deadline_completions`, `timeline_interactions` |
| Separate core tables | `users`, `user_consents`, `user_preferences` |
| Onboarding output tables | `onboarding_pressure_profiles`, `onboarding_recovery_paths`, `onboarding_analyses` |
| Document correction/deadline tables | `document_user_corrections`, `document_deadlines` |
| Letter recipient/export tables | `letter_recipients`, `letter_exports` |
| Decision risks and versioned choices | `decision_risks`, `decision_user_choices` |
| `case_packets` storage bucket | Legal Support PDF export |
| Guest database tables | Guest data remains browser session only |

---

### 3. User-owned tables requiring RLS

All tables below include `user_id` (or `id` = auth user for `profiles`) and require row-level security: **own rows only**.

| # | Table |
|---|-------|
| 1 | `profiles` |
| 2 | `subscriptions` |
| 3 | `onboarding_sessions` |
| 4 | `onboarding_answers` |
| 5 | `debt_situations` |
| 6 | `collectors` |
| 7 | `creditors` |
| 8 | `debt_profiles` |
| 9 | `stress_profiles` |
| 10 | `recovery_statuses` |
| 11 | `memory_candidates` |
| 12 | `memory_entries` |
| 13 | `documents` |
| 14 | `document_analysis_runs` |
| 15 | `document_extracted_fields` *(via document ownership chain)* |
| 16 | `letters` |
| 17 | `letter_versions` *(via letter ownership chain)* |
| 18 | `live_call_sessions` |
| 19 | `live_call_messages` *(via session ownership chain)* |
| 20 | `live_call_summaries` *(via session ownership chain)* |
| 21 | `timeline_events` |
| 22 | `decision_reviews` |
| 23 | `decision_options` *(via review ownership chain)* |
| 24 | `decision_outcomes` *(via review ownership chain)* |
| 25 | `legal_attention_events` |
| 26 | `legal_support_intakes` |
| 27 | `dashboard_recommendations` |
| 28 | `audit_events` |
| 29 | `data_export_requests` |
| 30 | `account_deletion_requests` |

**Total user-owned: 30 tables**

**RLS note:** Child tables without direct `user_id` (`document_extracted_fields`, `letter_versions`, `live_call_messages`, `live_call_summaries`, `decision_options`, `decision_outcomes`) are protected via parent FK ownership or join policies in implementation.

---

### 4. System / catalog tables

No `user_id`. Read-only for authenticated users. Managed by Mina (service role writes).

| Table | Purpose |
|-------|---------|
| `letter_templates` | Federal-first letter frameworks |
| `legal_support_resources` | State-specific legal aid, bar referrals, education |

**Total catalog: 2 tables**

---

### 5. Tables using JSON fields temporarily

JSON is used in MVP to reduce table count. Split when traffic or query needs require it.

| Table | JSON columns | What they hold temporarily |
|-------|--------------|------------------------------|
| `profiles` | `consents`, `preferences` | Consent flags, UI/notification prefs |
| `onboarding_sessions` | `pressure_profile`, `recovery_path`, `analysis` | Full onboarding outputs (6 cards + narrative) |
| `onboarding_answers` | `response_data` | Structured step answers |
| `debt_profiles` | `debt_categories`, `summary` | Categories, confirmed balance summary |
| `documents` | `confirmed_data` | User-confirmed extractions |
| `document_analysis_runs` | `recommended_actions` | Post-analysis action list |
| `letters` | `recipient_snapshot` | Recipient at draft time |
| `live_call_messages` | `content` | User input text; Mina structured response payload |
| `live_call_summaries` | `important_points`, `risks`, `recommended_actions` | Post-call structured summary |
| `decision_reviews` | `risks`, `unknowns` | Decision Shield cards 4–5 |
| `legal_support_intakes` | `intake_data`, `preparation_checklist`, `questions_to_ask`, `recommended_resource_ids` | Intake, checklist, resources |
| `audit_events` | `event_payload` | Audit detail |

---

### 6. Tables that must later be split when Mina grows

| MVP table / pattern | Split into (full architecture) | Trigger to split |
|---------------------|-------------------------------|-------------------|
| `profiles.consents` | `user_consents` | Compliance audit needs per-consent versioning |
| `profiles.preferences` | `user_preferences` | Notification complexity grows |
| `onboarding_sessions` JSON outputs | `onboarding_pressure_profiles`, `onboarding_recovery_paths`, `onboarding_analyses` | Re-onboarding comparison, analytics |
| `documents.confirmed_data` | `document_confirmed_values`, `document_user_corrections` | Correction history required |
| Deadlines on `timeline_events` | `document_deadlines`, `timeline_deadline_completions` | Deadline management complexity |
| `letters` export columns | `letter_exports`, `letter_recipients` | Multiple exports per letter |
| `live_call_messages` | `live_call_user_inputs`, `live_call_mina_responses` | Analytics on coaching patterns |
| `decision_reviews` risks/unknowns JSON | `decision_risks`, `decision_user_choices` | Versioned choice history |
| `legal_support_intakes` JSON | `legal_support_summaries`, `legal_support_case_packets` | Case packet PDF, attorney handoff |
| `timeline_events` manual/deadline columns | `timeline_manual_events`, `timeline_user_notes` | Rich timeline interactions |
| No history tables | 8 `{feature}_history` tables | Compliance, debugging, indexer decoupling |
| `dashboard_recommendations` only | `dashboard_snapshots`, `dashboard_alerts` | Performance, crisis/healthy state caching |
| `memory_entries` only | `memory_history`, `memory_entry_sources`, `memory_recommendations` | Memory evolution audit, recommendation tracking |
| `recovery_statuses` only | Full Recovery Planner (6 tables) | Milestones, check-ins, plan versions |

---

### 7. Confirmation: no giant mixed chat history

**Confirmed.**

- There is **no** global `messages`, `chat`, or `conversations` table.
- `live_call_messages` is scoped exclusively to `live_call_sessions` via FK.
- `onboarding_answers` stores structured step responses — not a conversation log.
- Feature coaching stays within feature-scoped tables only.

---

### 8. Confirmation: feature histories remain separate

**Confirmed.**

- MVP does **not** merge feature events into one history table.
- Each feature writes significant events to:
  - **`timeline_events`** — user-visible chronological record (with `source_feature` + `source_record_id`)
  - **`audit_events`** — compliance and system audit trail
- Feature primary tables remain isolated (`documents`, `letters`, `live_call_sessions`, etc.).
- When Mina grows, dedicated `{feature}_history` tables will be added per [MINA_DATABASE_ARCHITECTURE.md](./MINA_DATABASE_ARCHITECTURE.md) without replacing feature primary tables.

---

### 9. Confirmation: Call Through Mina excluded from MVP

**Confirmed.**

- Zero `call_through_*` tables in MVP.
- No telephony, brief approval, or Mina-initiated call data in launch database.
- V3 tables remain documented in full architecture only.

---

### 10. Confirmation: Recovery Planner advanced tables excluded from MVP

**Confirmed.**

- No `recovery_plans`, `recovery_plan_milestones`, `recovery_plan_actions`, `recovery_plan_checkins`, or `recovery_plan_versions` in MVP.
- **`recovery_statuses`** holds current stage and recovery score only.
- Recovery Planner is a post-MVP premium feature per architecture.

---

**Checklist status:** Ready for SQL review. Awaiting approval before migrations.

---

## Purpose

Ship the minimum database to launch Mina V2 with:

1. Authentication / Profile  
2. Onboarding  
3. Shared entities  
4. Shared intelligence layers  
5. Document Analysis  
6. Letter Generator  
7. Basic Live Call Assistant  
8. Timeline  
9. Basic Decision Shield  
10. Legal Attention  
11. Dashboard recommendations  
12. Subscription placeholder  
13. Compliance basics  

**Total tables: 32** (max 35)

---

## MVP Principles

| Keep | Defer |
|------|-------|
| Feature isolation | Separate `{feature}_history` tables |
| Shared entities + intelligence layers | Recovery Planner tables |
| Memory candidates → entries pipeline | Memory history, sources, recommendations |
| Timeline as read model | Timeline notes, manual events, deadline completion tables |
| Legal attention + basic intake | Case packets, resource view tracking |
| One recommendation row per action | Dashboard snapshots, alerts tables |
| Catalog tables (seed data) | Call Through Mina (all 6 tables) |

**Hard rules preserved:**

- No giant mixed chat table  
- `live_call_messages` is scoped to Live Call only  
- Features link via FKs; they do not share history tables  
- Guest data stays in browser session — **no guest tables**  

---

## Table of Contents

1. [Overview Diagram](#1-overview-diagram)
2. [Conventions](#2-conventions)
3. [Core (2)](#3-core)
4. [Onboarding (2)](#4-onboarding)
5. [Shared Entities (3)](#5-shared-entities)
6. [Shared Intelligence (5)](#6-shared-intelligence)
7. [Document Analysis (3)](#7-document-analysis)
8. [Letter Generator (2)](#8-letter-generator)
9. [Live Call Assistant (3)](#9-live-call-assistant)
10. [Timeline (1)](#10-timeline)
11. [Decision Shield (3)](#11-decision-shield)
12. [Legal (2)](#12-legal)
13. [Dashboard (1)](#13-dashboard)
14. [Compliance (3)](#14-compliance)
15. [Catalog (2)](#15-catalog)
16. [Object Storage](#16-object-storage)
17. [Indexes](#17-indexes)
18. [Row Level Security](#18-row-level-security)
19. [Deferred to Post-MVP](#19-deferred-to-post-mvp)
20. [Table Inventory](#20-table-inventory)

---

## 1. Overview Diagram

```
auth.users (identity provider — external)
    │
    └── profiles ── subscriptions
            │
            ├── onboarding_sessions ── onboarding_answers
            │
            ├── debt_situations ──┬── collectors
            │                     └── creditors
            │
            ├── debt_profiles
            ├── stress_profiles
            ├── recovery_statuses
            ├── memory_candidates → memory_entries
            │
            ├── documents ── document_analysis_runs ── document_extracted_fields
            │
            ├── letters ── letter_versions
            │
            ├── live_call_sessions ──┬── live_call_messages
            │                        └── live_call_summaries
            │
            ├── decision_reviews ──┬── decision_options
            │                      └── decision_outcomes
            │
            ├── legal_attention_events ── legal_support_intakes
            │
            ├── timeline_events
            ├── dashboard_recommendations
            │
            └── audit_events, data_export_requests, account_deletion_requests

letter_templates (catalog)
legal_support_resources (catalog)
```

---

## 2. Conventions

| Rule | MVP approach |
|------|--------------|
| Primary key | `id` UUID on every table |
| User reference | `user_id` UUID → `profiles.id` (= auth user ID) |
| Timestamps | `created_at` required; `updated_at` on mutable rows |
| Enums | TEXT with documented values |
| Feature history | **No separate history tables** — write significant events to `timeline_events` + `audit_events` |
| JSON | Used to avoid extra tables (onboarding outputs, intake checklists, Mina response payloads) |

---

## 3. Core

### 3.1 `profiles`

Single user record. Replaces separate `users`, `user_profiles`, `user_consents`, and `user_preferences` tables for MVP.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK.** Same as auth provider user ID |
| `email` | TEXT | NO | |
| `first_name` | TEXT | YES | |
| `last_name` | TEXT | YES | |
| `state` | TEXT | NO | US state code (mandatory) |
| `country` | TEXT | NO | Default `US` |
| `language` | TEXT | NO | Default `en` |
| `consents` | JSONB | NO | `{ data_storage, guidance_disclaimer, live_call_storage, ... }` |
| `preferences` | JSONB | NO | Notifications, UI prefs. Default `{}` |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**FK:** None (root)  
**Indexes:** `UNIQUE (email)`

---

### 3.2 `subscriptions`

Freemium placeholder. One paid tier.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `tier` | TEXT | NO | `free` \| `premium` |
| `status` | TEXT | NO | `active` \| `cancelled` \| `expired` |
| `started_at` | TIMESTAMPTZ | NO | |
| `expires_at` | TIMESTAMPTZ | YES | |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**FK:** `user_id → profiles.id` ON DELETE CASCADE  
**Indexes:** `(user_id)` — one active row per user enforced in application layer for MVP

---

## 4. Onboarding

### 4.1 `onboarding_sessions`

Consolidates pressure profile, recovery path, and 6-card analysis into JSON columns for MVP.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `session_number` | INTEGER | NO | 1 = origin session |
| `is_origin_session` | BOOLEAN | NO | First session at signup |
| `status` | TEXT | NO | `in_progress` \| `completed` |
| `pressure_profile` | JSONB | YES | Sources, stress intensity, behavior pattern, support style |
| `recovery_path` | JSONB | YES | Assigned stage + recommended steps |
| `analysis` | JSONB | YES | 6 cards + narrative |
| `started_at` | TIMESTAMPTZ | NO | |
| `completed_at` | TIMESTAMPTZ | YES | |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**FK:** `user_id → profiles.id` ON DELETE CASCADE  
**Indexes:** `(user_id, completed_at DESC)`

**MVP note:** Guest onboarding stays in session storage until signup; first DB row created at signup transfer.

---

### 4.2 `onboarding_answers`

Structured step answers. Not a chat log.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `onboarding_session_id` | UUID | NO | **FK → onboarding_sessions.id** |
| `step_key` | TEXT | NO | e.g. `current_situation`, `pressure_sources` |
| `response_data` | JSONB | NO | Structured answer |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**FK:** session CASCADE, user CASCADE  
**Indexes:** `(onboarding_session_id, step_key)`

---

## 5. Shared Entities

### 5.1 `debt_situations`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `category` | TEXT | NO | `credit_card`, `medical`, `collection_account`, etc. |
| `label` | TEXT | YES | |
| `status` | TEXT | NO | `active` \| `resolved` \| `archived` |
| `collector_id` | UUID | YES | **FK → collectors.id** |
| `creditor_id` | UUID | YES | **FK → creditors.id** |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id, status)`

---

### 5.2 `collectors`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `name` | TEXT | NO | |
| `phone` | TEXT | YES | |
| `address` | TEXT | YES | |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id)`

---

### 5.3 `creditors`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `name` | TEXT | NO | |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id)`

---

## 6. Shared Intelligence

### 6.1 `debt_profiles`

One row per user.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `debt_categories` | JSONB | NO | High-level categories |
| `collector_involvement` | TEXT | YES | |
| `legal_risk_level` | TEXT | YES | `low` \| `medium` \| `high` \| `legal_attention` |
| `settlement_status` | TEXT | YES | |
| `summary` | JSONB | YES | Confirmed balances, notes |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `UNIQUE (user_id)`

---

### 6.2 `stress_profiles`

One row per user.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `stress_intensity` | TEXT | NO | `low` \| `medium` \| `high` \| `critical` |
| `fear_intensity` | TEXT | YES | |
| `avoidance_level` | TEXT | YES | |
| `pressure_level` | TEXT | YES | |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `UNIQUE (user_id)`

---

### 6.3 `recovery_statuses`

One primary stage per user. Recovery Planner deferred — stage only, no plan tables.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `current_stage` | TEXT | NO | `stabilize` \| `understand` \| `protect` \| `act` \| `resolve` \| `recover` |
| `recovery_score` | INTEGER | NO | 0–100, default 0 |
| `stage_changed_at` | TIMESTAMPTZ | YES | |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `UNIQUE (user_id)`

---

### 6.4 `memory_candidates`

Features propose; Memory Service (application layer) accepts or rejects.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `proposing_feature` | TEXT | NO | e.g. `onboarding`, `live_call`, `document_analysis` |
| `source_record_id` | UUID | YES | Feature record ID |
| `category` | TEXT | NO | `communication_preference` \| `fear_pattern` \| `behavioral_pattern` \| `coaching_insight` |
| `proposed_content` | TEXT | NO | |
| `debt_situation_id` | UUID | YES | **FK → debt_situations.id** |
| `status` | TEXT | NO | `pending` \| `accepted` \| `rejected` |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id, status)`

---

### 6.5 `memory_entries`

Active/inactive conclusions. No separate history table in MVP.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `memory_candidate_id` | UUID | YES | **FK → memory_candidates.id** |
| `category` | TEXT | NO | |
| `content` | TEXT | NO | |
| `level` | TEXT | NO | `user` \| `debt_situation` |
| `debt_situation_id` | UUID | YES | **FK → debt_situations.id** |
| `status` | TEXT | NO | `active` \| `inactive` |
| `user_corrected` | BOOLEAN | NO | Default false |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id, status)` WHERE status = `active`

---

## 7. Document Analysis

### 7.1 `documents`

Replaces `document_uploads`. Confirmation fields live here for MVP.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `debt_situation_id` | UUID | YES | **FK → debt_situations.id** |
| `collector_id` | UUID | YES | **FK → collectors.id** |
| `creditor_id` | UUID | YES | **FK → creditors.id** |
| `original_filename` | TEXT | NO | |
| `mime_type` | TEXT | NO | |
| `file_size_bytes` | BIGINT | NO | Max 25 MB |
| `page_count` | INTEGER | YES | Max 50 |
| `storage_bucket` | TEXT | NO | `documents` |
| `storage_path` | TEXT | NO | |
| `upload_status` | TEXT | NO | `uploading` \| `ready` \| `failed` |
| `document_type` | TEXT | YES | Set after analysis |
| `risk_level` | TEXT | YES | Includes `legal_attention_required` |
| `confirmed_at` | TIMESTAMPTZ | YES | User confirmed extractions |
| `confirmed_data` | JSONB | YES | Final confirmed key facts |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id, created_at DESC)`

---

### 7.2 `document_analysis_runs`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `document_id` | UUID | NO | **FK → documents.id** |
| `run_number` | INTEGER | NO | Default 1 |
| `status` | TEXT | NO | `pending` \| `completed` \| `failed` |
| `plain_language_summary` | TEXT | YES | |
| `recommended_actions` | JSONB | YES | |
| `what_mina_sees` | TEXT | YES | Transparency card |
| `extracted_text` | TEXT | YES | When available |
| `completed_at` | TIMESTAMPTZ | YES | |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**FK:** `document_id → documents.id` ON DELETE CASCADE  
**Indexes:** `(document_id, run_number DESC)`

---

### 7.3 `document_extracted_fields`

Corrections overwrite field values in MVP (or store latest in `confirmed_data` on `documents`). No separate corrections table.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `document_analysis_run_id` | UUID | NO | **FK → document_analysis_runs.id** |
| `field_key` | TEXT | NO | e.g. `collector`, `amount`, `deadline_date` |
| `field_value` | TEXT | YES | |
| `confidence_score` | NUMERIC(3,2) | YES | |
| `user_corrected` | BOOLEAN | NO | Default false |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(document_analysis_run_id, field_key)`

**MVP note:** Confirmed deadlines become `timeline_events` with `event_category = upcoming_deadline`.

---

## 8. Letter Generator

### 8.1 `letters`

Replaces `letter_requests` + export metadata.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `letter_type` | TEXT | NO | `validation` \| `dispute` \| `cease_communication` |
| `status` | TEXT | NO | `draft` \| `finalized` \| `exported` \| `sent` |
| `document_id` | UUID | YES | **FK → documents.id** |
| `debt_situation_id` | UUID | YES | **FK → debt_situations.id** |
| `collector_id` | UUID | YES | **FK → collectors.id** |
| `live_call_session_id` | UUID | YES | **FK → live_call_sessions.id** |
| `letter_template_id` | UUID | YES | **FK → letter_templates.id** |
| `recipient_snapshot` | JSONB | YES | Name, address at draft time |
| `current_version` | INTEGER | NO | Latest version number |
| `export_storage_path` | TEXT | YES | Latest PDF/DOCX in `letter_exports` bucket |
| `export_format` | TEXT | YES | `pdf` \| `docx` |
| `finalized_at` | TIMESTAMPTZ | YES | |
| `sent_confirmed_at` | TIMESTAMPTZ | YES | User confirmed sent |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id, status)`

---

### 8.2 `letter_versions`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `letter_id` | UUID | NO | **FK → letters.id** |
| `version_number` | INTEGER | NO | |
| `content` | TEXT | NO | |
| `change_reason` | TEXT | YES | `generated`, `edited`, `revised`, `finalized` |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**FK:** `letter_id → letters.id` ON DELETE CASCADE  
**Indexes:** `(letter_id, version_number DESC)`

---

## 9. Live Call Assistant

### 9.1 `live_call_sessions`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `collector_id` | UUID | YES | **FK → collectors.id** |
| `debt_situation_id` | UUID | YES | **FK → debt_situations.id** |
| `status` | TEXT | NO | `active` \| `paused` \| `completed` \| `discarded` |
| `started_at` | TIMESTAMPTZ | NO | |
| `ended_at` | TIMESTAMPTZ | YES | |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id, started_at DESC)`

---

### 9.2 `live_call_messages`

Scoped to Live Call only. Combines user inputs and Mina responses — **not** a global chat table.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `live_call_session_id` | UUID | NO | **FK → live_call_sessions.id** |
| `sequence_number` | INTEGER | NO | Order within session |
| `role` | TEXT | NO | `user` \| `mina` |
| `message_type` | TEXT | NO | `collector_input` \| `mina_response` \| `coaching` |
| `content` | JSONB | NO | User: `{ text }`. Mina: `{ what_is_happening, risk_level, pressure_tactic, suggested_response, coaching_note }` |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**FK:** session CASCADE  
**Indexes:** `(live_call_session_id, sequence_number)`

---

### 9.3 `live_call_summaries`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `live_call_session_id` | UUID | NO | **FK → live_call_sessions.id** |
| `what_happened` | TEXT | NO | |
| `important_points` | JSONB | YES | |
| `risks` | JSONB | YES | |
| `recommended_actions` | JSONB | YES | |
| `next_step` | TEXT | YES | |
| `post_call_stress_level` | TEXT | YES | Updates `stress_profiles` |
| `saved` | BOOLEAN | NO | false if user discarded |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `UNIQUE (live_call_session_id)`

---

## 10. Timeline

### 10.1 `timeline_events`

Single timeline table for MVP. Absorbs deadlines, manual events (via `is_manual`), and indexed feature events.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `title` | TEXT | NO | |
| `description` | TEXT | YES | |
| `occurred_at` | TIMESTAMPTZ | NO | |
| `event_category` | TEXT | NO | `past_event` \| `upcoming_deadline` |
| `source_feature` | TEXT | NO | e.g. `onboarding`, `document_analysis`, `timeline_manual` |
| `source_record_id` | UUID | YES | Link to feature record |
| `severity` | TEXT | YES | |
| `debt_situation_id` | UUID | YES | **FK → debt_situations.id** |
| `collector_id` | UUID | YES | **FK → collectors.id** |
| `is_manual` | BOOLEAN | NO | Default false |
| `is_legal_attention` | BOOLEAN | NO | Default false |
| `source_available` | BOOLEAN | NO | false when source deleted |
| `deadline_completed_at` | TIMESTAMPTZ | YES | User marked complete |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id, occurred_at DESC)`; `(user_id, event_category, occurred_at)` WHERE event_category = `upcoming_deadline`

**MVP seed event:** `"Mina Journey Started"` on signup from onboarding.

---

## 11. Decision Shield

Basic review flow. Risks and unknowns stored as JSON on review for MVP.

### 11.1 `decision_reviews`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `decision_type` | TEXT | YES | Predefined type |
| `free_text_description` | TEXT | YES | |
| `status` | TEXT | NO | `open` \| `closed` \| `discarded` |
| `document_id` | UUID | YES | **FK → documents.id** |
| `letter_id` | UUID | YES | **FK → letters.id** |
| `live_call_session_id` | UUID | YES | **FK → live_call_sessions.id** |
| `debt_situation_id` | UUID | YES | **FK → debt_situations.id** |
| `situation_summary` | TEXT | YES | Card 1 |
| `risks` | JSONB | YES | Card 4 — array of risk items |
| `unknowns` | JSONB | YES | Card 5 |
| `recommended_next_step` | TEXT | YES | Card 6 |
| `legal_support_note` | TEXT | YES | Card 7 |
| `current_choice` | TEXT | YES | Latest choice (denormalized for dashboard) |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |
| `closed_at` | TIMESTAMPTZ | YES | |

**PK:** `id`  
**Indexes:** `(user_id, status)`

---

### 11.2 `decision_options`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `decision_review_id` | UUID | NO | **FK → decision_reviews.id** |
| `option_label` | TEXT | NO | |
| `pros` | JSONB | YES | |
| `cons` | JSONB | YES | |
| `sort_order` | INTEGER | NO | |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**FK:** review CASCADE

---

### 11.3 `decision_outcomes`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `decision_review_id` | UUID | NO | **FK → decision_reviews.id** |
| `choice` | TEXT | NO | `proceed` \| `wait` \| `gather_info` \| `seek_legal_support` \| `not_ready` |
| `outcome_description` | TEXT | YES | |
| `recorded_at` | TIMESTAMPTZ | NO | |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**FK:** review CASCADE  
**Indexes:** `(decision_review_id, recorded_at DESC)`

---

## 12. Legal

### 12.1 `legal_attention_events`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `source_feature` | TEXT | NO | |
| `source_record_id` | UUID | YES | |
| `severity` | TEXT | NO | |
| `issue_type` | TEXT | YES | `summons`, `garnishment`, `lawsuit`, etc. |
| `status` | TEXT | NO | `active` \| `dismissed` \| `resolved` |
| `debt_situation_id` | UUID | YES | **FK → debt_situations.id** |
| `dismissed_at` | TIMESTAMPTZ | YES | |
| `created_at` | TIMESTAMPTZ | NO | |
| `resolved_at` | TIMESTAMPTZ | YES | |

**PK:** `id`  
**Indexes:** `(user_id, status)` WHERE status = `active`

---

### 12.2 `legal_support_intakes`

Summary, checklist, and resources stored as JSON. No case packet table in MVP.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `legal_attention_event_id` | UUID | YES | **FK → legal_attention_events.id** |
| `workflow_type` | TEXT | NO | `summons` \| `garnishment` \| `general` |
| `issue_type` | TEXT | NO | |
| `state` | TEXT | NO | |
| `court_date` | DATE | YES | |
| `urgency` | TEXT | NO | |
| `intake_data` | JSONB | NO | Documents available, current status, etc. |
| `summary` | TEXT | YES | |
| `preparation_checklist` | JSONB | YES | |
| `questions_to_ask` | JSONB | YES | |
| `recommended_resource_ids` | JSONB | YES | Array of `legal_support_resources.id` |
| `user_response` | TEXT | YES | `contacted_attorney` \| `contacted_legal_aid` \| `declined` \| null |
| `status` | TEXT | NO | `started` \| `completed` \| `abandoned` |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |
| `completed_at` | TIMESTAMPTZ | YES | |

**PK:** `id`  
**Indexes:** `(user_id, status)`

---

## 13. Dashboard

### 13.1 `dashboard_recommendations`

No snapshots or alerts tables in MVP. Legal urgency reads from `legal_attention_events`. Deadlines read from `timeline_events`.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `priority` | TEXT | NO | `primary` \| `secondary` |
| `sort_order` | INTEGER | NO | 1 = primary; 2–4 = secondary |
| `title` | TEXT | NO | |
| `reason` | TEXT | NO | Why this recommendation exists |
| `target_feature` | TEXT | NO | Deep link target |
| `target_record_id` | UUID | YES | |
| `source_feature` | TEXT | YES | |
| `status` | TEXT | NO | `active` \| `dismissed` \| `snoozed` \| `completed` |
| `snoozed_until` | TIMESTAMPTZ | YES | Non-legal only |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id, status)` WHERE status = `active`

**MVP note:** Application recomputes recommendations on feature events. No `dashboard_snapshots` table. `recovery_statuses.recovery_score` and shared profiles supply dashboard widgets.

---

## 14. Compliance

### 14.1 `audit_events`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | YES | **FK → profiles.id** |
| `event_category` | TEXT | NO | `user_action` \| `mina_generated` \| `important_update` |
| `event_type` | TEXT | NO | |
| `event_payload` | JSONB | NO | |
| `actor` | TEXT | NO | `user` \| `mina` \| `system` |
| `occurred_at` | TIMESTAMPTZ | NO | |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(user_id, occurred_at DESC)`

---

### 14.2 `data_export_requests`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `status` | TEXT | NO | `pending` \| `processing` \| `completed` \| `failed` |
| `storage_bucket` | TEXT | YES | `data_exports` |
| `storage_path` | TEXT | YES | |
| `requested_at` | TIMESTAMPTZ | NO | |
| `completed_at` | TIMESTAMPTZ | YES | |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`

---

### 14.3 `account_deletion_requests`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `user_id` | UUID | NO | **FK → profiles.id** |
| `status` | TEXT | NO | `pending` \| `processing` \| `completed` |
| `requested_at` | TIMESTAMPTZ | NO | |
| `completed_at` | TIMESTAMPTZ | YES | |
| `created_at` | TIMESTAMPTZ | NO | |

**PK:** `id`

Deletion cascades all user-owned rows and removes storage objects.

---

## 15. Catalog

No `user_id`. Seed data managed by Mina.

### 15.1 `letter_templates`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `letter_type` | TEXT | NO | |
| `name` | TEXT | NO | |
| `jurisdiction_scope` | TEXT | NO | `federal` (V2 default) |
| `template_body` | TEXT | NO | |
| `is_active` | BOOLEAN | NO | |
| `version` | INTEGER | NO | |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(letter_type, is_active)`

---

### 15.2 `legal_support_resources`

| Column | Type | Null | Description |
|--------|------|------|-------------|
| `id` | UUID | NO | **PK** |
| `resource_type` | TEXT | NO | `legal_aid` \| `state_bar` \| `consumer_protection` \| `court_self_help` \| `education` |
| `state_code` | TEXT | NO | |
| `title` | TEXT | NO | |
| `description` | TEXT | YES | |
| `url` | TEXT | YES | |
| `phone` | TEXT | YES | |
| `content_body` | TEXT | YES | Educational content |
| `is_active` | BOOLEAN | NO | |
| `created_at` | TIMESTAMPTZ | NO | |
| `updated_at` | TIMESTAMPTZ | NO | |

**PK:** `id`  
**Indexes:** `(state_code, resource_type, is_active)`

---

## 16. Object Storage

| Bucket | Used by | MVP |
|--------|---------|-----|
| `documents` | `documents.storage_path` | Yes |
| `letter_exports` | `letters.export_storage_path` | Yes |
| `data_exports` | `data_export_requests.storage_path` | Yes |

**Path convention:** `{bucket}/{user_id}/{feature}/{record_id}/{filename}`

**Not in MVP:** `case_packets` bucket (deferred with case packet feature)

---

## 17. Indexes

### Required indexes (MVP)

| Table | Index | Purpose |
|-------|-------|---------|
| All user-owned tables | `(user_id)` | RLS + scoping |
| `documents` | `(user_id, created_at DESC)` | Recent uploads |
| `timeline_events` | `(user_id, occurred_at DESC)` | Timeline view |
| `timeline_events` | partial upcoming deadlines | Deadline section |
| `dashboard_recommendations` | partial active | Home screen |
| `legal_attention_events` | partial active | Legal banner |
| `memory_entries` | partial active | My Mina Profile |
| `live_call_messages` | `(live_call_session_id, sequence_number)` | Call replay |
| `letter_versions` | `(letter_id, version_number DESC)` | Draft history |
| `legal_support_resources` | `(state_code, resource_type)` | Intake resources |

---

## 18. Row Level Security

### Default policy

| Role | Access |
|------|--------|
| Authenticated user | CRUD on rows where `user_id = auth.uid()` |
| Anonymous | No access |
| Service role | Export, deletion, batch jobs |

### Exceptions

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `letter_templates` | All authenticated | — | — | — |
| `legal_support_resources` | All authenticated | — | — | — |
| `memory_candidates` | Own | Own | Service/app accepts | — |
| `timeline_events` | Own | Own + app indexer | Own (deadline complete only) | — |
| `dashboard_recommendations` | Own | App | Own (dismiss/snooze/complete) | — |
| `audit_events` | Own | App | — | — |

### Premium gating (application layer)

Before INSERT on: `live_call_sessions`, `letters`, `decision_reviews` — check `subscriptions.tier = premium`.

Free tier: limited `documents` count (limit TBD per architecture open question).

---

## 19. Deferred to Post-MVP

Maps to [MINA_DATABASE_ARCHITECTURE.md](./MINA_DATABASE_ARCHITECTURE.md).

| Deferred | MVP replacement |
|----------|-----------------|
| 6 Call Through Mina tables | Not shipped |
| 8 `{feature}_history` tables | `timeline_events` + `audit_events` |
| `dashboard_snapshots`, `dashboard_alerts` | Query profiles + `legal_attention_events` + `timeline_events` + `dashboard_recommendations` |
| `memory_history`, `memory_entry_sources`, `memory_recommendations` | Simpler `memory_entries` + `memory_candidates` |
| Recovery Planner (6 tables) | `recovery_statuses` only |
| `legal_support_case_packets`, `legal_support_resource_views` | JSON on `legal_support_intakes` |
| `document_user_corrections`, `document_deadlines` | Fields on `documents` / `timeline_events` |
| `timeline_user_notes`, `timeline_manual_events`, `timeline_deadline_completions` | Columns/flags on `timeline_events` |
| `decision_risks`, `decision_user_choices` (versioned) | JSON on `decision_reviews` + `decision_outcomes` |
| Separate `users`, `user_consents`, `user_preferences` | Merged into `profiles` |
| `onboarding_pressure_profiles`, `onboarding_analyses`, etc. | JSON on `onboarding_sessions` |
| `letter_recipients`, `letter_exports` tables | `recipient_snapshot` + export columns on `letters` |
| `case_packets` storage bucket | In-app intake only |

**When to migrate:** Split JSON blobs and add history tables when feature traffic or compliance needs justify it — per full architecture doc.

---

## 20. Table Inventory

| # | Table | Layer |
|---|-------|-------|
| 1 | `profiles` | Core |
| 2 | `subscriptions` | Core |
| 3 | `onboarding_sessions` | Onboarding |
| 4 | `onboarding_answers` | Onboarding |
| 5 | `debt_situations` | Shared Entity |
| 6 | `collectors` | Shared Entity |
| 7 | `creditors` | Shared Entity |
| 8 | `debt_profiles` | Shared Intelligence |
| 9 | `stress_profiles` | Shared Intelligence |
| 10 | `recovery_statuses` | Shared Intelligence |
| 11 | `memory_candidates` | Memory Service |
| 12 | `memory_entries` | Memory Service |
| 13 | `documents` | Document Analysis |
| 14 | `document_analysis_runs` | Document Analysis |
| 15 | `document_extracted_fields` | Document Analysis |
| 16 | `letters` | Letter Generator |
| 17 | `letter_versions` | Letter Generator |
| 18 | `live_call_sessions` | Live Call |
| 19 | `live_call_messages` | Live Call |
| 20 | `live_call_summaries` | Live Call |
| 21 | `timeline_events` | Timeline |
| 22 | `decision_reviews` | Decision Shield |
| 23 | `decision_options` | Decision Shield |
| 24 | `decision_outcomes` | Decision Shield |
| 25 | `legal_attention_events` | Legal |
| 26 | `legal_support_intakes` | Legal |
| 27 | `dashboard_recommendations` | Dashboard |
| 28 | `audit_events` | Compliance |
| 29 | `data_export_requests` | Compliance |
| 30 | `account_deletion_requests` | Compliance |
| 31 | `letter_templates` | Catalog |
| 32 | `legal_support_resources` | Catalog |

**Total: 32 tables**

---

*MVP launch database. Full 80-table map: [MINA_DATABASE_ARCHITECTURE.md](./MINA_DATABASE_ARCHITECTURE.md)*
