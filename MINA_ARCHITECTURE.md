# Mina V2 Architecture

**Single source of truth for Mina V2.**

Compiled from design sessions Sections 1–13 and cross-cutting decisions. No code. No invented requirements.

---

## Table of Contents

1. [Vision and Principles](#1-vision-and-principles)
2. [User Journey](#2-user-journey)
3. [Shared Intelligence Layers](#3-shared-intelligence-layers)
4. [Shared Entities](#4-shared-entities)
5. [Feature Modules](#5-feature-modules)
6. [Database Architecture](#6-database-architecture)
7. [Cross-Feature Communication](#7-cross-feature-communication)
8. [Guest-to-Signup Flow](#8-guest-to-signup-flow)
9. [V2 Scope](#9-v2-scope)
10. [V3 Deferred Features](#10-v3-deferred-features)
11. [Open Questions](#11-open-questions)
12. [Recommended Build Order](#12-recommended-build-order)

---

## 1. Vision and Principles

### Mission

Mina is **Financial Pressure Intelligence**.

Mina helps people facing debt, collectors, financial stress, lawsuits, and uncertainty stay calm, understand their situation, know their options, and recover control of their lives.

Mina does not replace attorneys, financial advisors, or debt counselors.

Mina helps users think clearly, organize information, communicate confidently, and make informed decisions.

### What Mina Is

Mina is a **Financial Pressure Operating System** — not a debt app, not a document app, not a legal app.

Every feature answers one question:

**"What helps this user regain clarity, confidence, and control right now?"**

### Core Identity

> Mina does not solve debt. Mina helps people think clearly under financial pressure so they can solve debt themselves.

### Primary Persona

A stressed consumer who receives a debt collection call, letter, or threat and does not know what to do next.

**Secondary personas:** people worried about lawsuits, negotiating settlements, creating recovery plans, rebuilding after debt.

**Not targeted in V2:** businesses, corporate debt, investment management, financial advisors, bankruptcy law services, complex legal representation.

### Transformation Loop

```
Fear → Clarity → Action → Recovery
```

### Core Loop

```
User experiences financial pressure
        ↓
User brings situation to Mina
        ↓
Mina analyzes it
        ↓
Mina explains what is happening
        ↓
Mina gives clear next actions
        ↓
User acts with confidence
        ↓
User returns when new situation appears
```

### Platform

- **Web first**, mobile responsive
- Native mobile app later
- Discovery: TikTok, Instagram, Facebook, Google Search, Referrals

### Architectural Principles

1. **Feature isolation (hard rule)** — Every feature has its own data, workflow, and history. No giant mixed chat history.
2. **Five shared intelligence layers** — User Profile, Debt Profile, Stress Profile, Recovery Status, Mina Memory. Features share intelligence through these layers — not through shared conversation logs.
3. **One shared entity model** — `debt_situations`, `collectors`, `creditors` referenced by all features.
4. **User is final authority** — Shared profiles do not update automatically without user confirmation where specified.
5. **Mina is proactive** — Mina actively recommends next best actions. Mina is never passive.
6. **Memory is understanding, not storage** — Mina Memory stores patterns and conclusions, not raw data.
7. **Timeline is a lens** — Aggregates significant events from feature histories. Does not own primary data.
8. **Dashboard is the command center** — Synthesizes cross-feature state. Does not own primary records.
9. **Legal Attention is the trigger; Legal Support is the destination** — System-wide legal urgency flows through `legal_attention_events`.
10. **Privacy first** — User data is never used to train AI models. Export and delete required from day one.

### Emotional Principles

Mina focuses on the human experiencing debt — not debt itself.

| Priority | Goal |
|----------|------|
| Primary | Reduce fear |
| Secondary | Increase confidence |
| Third | Create action |

Tone adapts to stress level:

| Stress | Tone |
|--------|------|
| High | Calm, reassuring, slow, grounding |
| Medium | Clear, structured |
| Low | Action-oriented, progress-focused |

Disclaimers appear before legal content, financial recommendations, and document generation — but never dominate the experience.

### Mina Coach (V2)

Mina Coach is **not** a separate launch feature. Coaching is embedded in Onboarding, Dashboard, Live Call Assistant, Decision Shield, and Recovery Planner. A dedicated Mina Coach area may ship in V3.

---

## 2. User Journey

### First Moment of Value

**Not document upload.** The first moment of value is: **"Mina understands me."**

User completes onboarding. Mina explains what pressure they carry, what causes stress, mistakes they may make, recommended recovery path, and what to expect next.

Success for first visit:

- User feels calmer
- User understands their situation better
- User sees a clear path forward
- User trusts Mina enough to create an account

### Value Before Signup (Guest)

Guests can:

- Complete onboarding
- Receive Mina's analysis
- See pressure profile
- See recovery path preview
- See recommended next actions

Guests cannot:

- Save data persistently (session storage only)
- Upload documents
- Generate letters
- Use Live Call Assistant
- Access Recovery tracking

Guests never see the real dashboard.

### After Signup

- Onboarding session becomes the **origin record**
- Dashboard begins (default page after login)
- Timeline seeded with **"Mina Journey Started"**
- Recovery Planner plan draft available for approval
- Recommended actions from onboarding become dashboard actions

### Feature Connection

Features are independent modules — each with own history, data, and workflow. Users choose freely. Mina actively recommends next best action.

Example:

```
Document uploaded → Mina analyzes → Recommends:
  Generate response letter | Live Call Assistant | Add deadline to Timeline
```

All modules share: User Profile, Mina Memory, Debt Profile, Stress Profile, Recovery Status.

### Return Triggers

Mina is both **crisis companion** and **long-term recovery companion**.

| User type | Expected return |
|-----------|-----------------|
| High pressure | Daily |
| Active | Several times per week |
| Recovery | Weekly |

Triggers: new collection call, new letter, settlement offer, lawsuit threat, approaching deadline, recovery plan reminder, progress tracking, financial pressure check-in.

### Recovery

Recovery means:

- User understands their situation
- User responds instead of avoiding
- User resolves debt or reaches manageable plan
- User regains confidence and control

### Escalation

When lawsuit served, court summons, wage garnishment, identity theft, bankruptcy questions, or complex legal disputes occur:

Mina must clearly state: **"This situation requires professional legal assistance."**

Then connect to legal aid, attorney directories, and state resources. Mina must never pretend to be a lawyer.

---

## 3. Shared Intelligence Layers

Five separate concepts. Each has distinct responsibility.

### User Profile — Facts

Examples: name, email, state, language, subscription.

State is mandatory (US-first; country defaults to United States).

### Debt Profile — Financial Situation

Examples: debt types, collector involvement, legal risk level, settlement status.

Onboarding writes high-level categories only. Detailed debt situations added later. Updates require user confirmation where specified (e.g., Document Analysis).

**Updated by:** Onboarding, Document Analysis (confirmed), Live Call, Call Through Mina (V3), Legal Support.

### Stress Profile — Current Emotional State

Examples: stress intensity, fear intensity, avoidance level, pressure level.

Directly influences Mina's tone everywhere.

**Updated by:** Onboarding, Live Call Assistant (post-call prompt), Decision Shield, Recovery Planner check-ins, Legal Support intake.

### Recovery Status — Current Stage

One primary stage per user in V2:

1. Stabilize
2. Understand
3. Protect
4. Act
5. Resolve
6. Recover

Advancement: Mina proposes → user confirms → feature completion contributes. Users can move backward (recovery is not always linear).

**Primary updater:** Recovery Planner. **Contributors:** Decision Shield, feature completions.

### Mina Memory — Patterns and Understanding

Memory stores what Mina learns about the **human** — not facts, not raw data.

| Category | Examples |
|----------|----------|
| Communication preferences | Step-by-step learner, wants short answers, responds to checklists |
| Fear patterns | Fear of lawsuits, collectors, mistakes, confrontation |
| Behavioral patterns | Avoids calls, delays decisions, researches excessively, acts impulsively |
| Coaching insights | Needs encouragement before action, better after reviewing options |
| Recurring situations | Same collector repeatedly, repeated settlement hesitation |
| Recommendation history | Recommendation + outcome + user response (accepted / rejected / completed / delayed) |

**Memory levels:**

- **User-level** (V2 primary): communication style, fear patterns, support preferences
- **Debt-situation-level** (structure supported; V2 light usage): e.g., avoids medical debt conversations

**Rules:**

- Memory begins empty; onboarding seeds first memory set at signup
- Reflects current understanding **and** evolution over time
- User can view **My Mina Profile**, edit, correct, or remove entries
- User always wins in conflicts; old conclusions become **inactive** (history remains)
- **Never stores:** full transcripts, full documents, raw uploads, entire chat histories, entire letters

**Memory Service:**

```
Feature → Memory Candidate → Memory Service → Memory Update (or reject)
```

All features may propose updates. Features do not write to Memory directly.

**Read model:** Every feature reads Memory via a **filtered view**:

| Feature | Reads |
|---------|-------|
| Live Call Assistant | Communication style, stress level, fear patterns |
| Document Analysis | Avoidance patterns, understanding level |
| Letter Generator | Communication preferences |
| Dashboard | Everything summarized |

### Recovery Score

Progress score — not credit score, not financial score. Range: **0–100**. Purpose: show momentum, not judgment.

**Positive inputs:** documents reviewed, letters sent (exported / user-confirmed), decisions completed, milestones achieved, check-ins completed.

**Negative impact:** missed deadlines, ignored legal alerts, abandoned plans.

Displayed on Dashboard. Updates immediately on feature events.

### Subscription (Freemium)

One paid tier. Do not overcomplicate pricing in V2.

| Tier | Includes |
|------|----------|
| **Free** | Onboarding, Mina analysis, basic dashboard, limited document analysis |
| **Premium** | Unlimited documents, Live Call Assistant, advanced letters, Decision Shield, Recovery Planner |

---

## 4. Shared Entities

One shared entity model. All features reference these records. Prevents duplicate collector records.

| Table | Purpose |
|-------|---------|
| `debt_situations` | Individual debt contexts (credit card, medical, collection account, etc.) |
| `collectors` | Collection agencies and contacts |
| `creditors` | Original creditors |

Onboarding identifies debt **categories** only. Detailed debt situations created in later features.

All features may link records via `debt_situation_id`, `collector_id`, `creditor_id`.

### Legal Attention Events

Standalone cross-cutting record — not mixed into feature tables.

| Field | Purpose |
|-------|---------|
| `source_feature` | Feature that triggered the event |
| `severity` | Urgency level |
| `status` | active / dismissed / resolved |
| `related_debt_situation_id` | Optional link |
| `created_at` | When triggered |
| `resolved_at` | When resolved |

Powers Dashboard alerts, Timeline events, and Legal Support workflows.

Legal Attention Required is the **trigger**. Legal Support is the **destination**.

Users can dismiss recommendations. Mina may remind later, especially as deadlines approach. Dismissals recorded on Timeline (and Decision Shield history when applicable).

---

## 5. Feature Modules

Each feature: own tables, own `{feature}_history`, own workflow. Features may link records across modules. Histories remain separate.

---

### 5.1 Onboarding Intelligence

**Purpose:** Structured situation discovery. First wow moment: "Mina understands me."

**Duration:** 5–8 minutes. Hybrid interaction — cards, chips, selectors, sliders with Mina coaching between sections. Not a financial form. Not a giant chat.

**Categories collected:**

| Category | Topics |
|----------|--------|
| Current situation | Why here, recent events, calls, letters, missed payments, lawsuit concern, multiple debts |
| Pressure sources | Collectors, letters, uncertainty, legal fear, family pressure, shame, money shortage |
| Emotional state | Overwhelm level, top worries |
| Behavior pattern | Avoid, freeze, research endlessly, act immediately, ask others, delay |
| Support preference | Step-by-step, direct, emotional first, educational, accountability |
| Recovery goals | Stop worrying, respond confidently, settle, avoid legal problems, create plan, rebuild |

**Not collected:** SSN, bank accounts, employer, exact account numbers, full financial statements.

**Outputs:**

| Output | Description |
|--------|-------------|
| Pressure Profile | Pressure sources, stress intensity (Low/Medium/High/Critical), behavior pattern (Avoider/Analyzer/Reactor/Freezer), support style (Coach/Educator/Guide/Accountability) |
| Recovery Path | Current stage + recommended next steps |
| Analysis | 6 cards + narrative: pressure, pattern, biggest risk, recovery stage, recommended actions, what Mina sees (why) |

User may edit or correct answers before signup.

**Writes to (at signup):** User Profile, Debt Profile, Stress Profile, Recovery Status, Mina Memory.

**Re-onboarding:** New session, history kept, no overwrite. Mina can compare over time.

**Never:** Promise outcomes, predict lawsuits, guarantee settlements, give legal conclusions, tell users they don't owe a debt.

**Access:** Guests (pre-signup) and signed-in users.

---

### 5.2 Mina Memory

See [Section 3 — Mina Memory](#mina-memory--patterns-and-understanding).

User-facing view: **My Mina Profile**. Included in export and delete (including historical/inactive entries).

---

### 5.3 Live Call Assistant

**Purpose:** Real-time coaching while user is on a phone call. User talks; Mina coaches.

**V2 model:** Phone call + Mina open side-by-side. Mina does NOT join, intercept, or make calls.

**Interaction:** User types what collector says. Mina responds with: what is happening, risk level, pressure tactic detection, suggested response script, coaching note. Voice listening is NOT required for V2.

**Session:** Start via "I'm on a call right now." Pre-select collector, debt situation, or "Not sure." End via "Call ended." Pause/resume supported.

**Pre-loads:** Debt Profile, Stress Profile, Memory, previous call history, related documents.

**Records:** Session metadata, user inputs, Mina responses, significant call events, post-call summary (no full transcript).

**Post-call:** Summary (editable, savable, discardable). Stress prompt updates Stress Profile. Recommends next features.

**Legal triggers:** Lawsuit, court, garnishment, summons, arrest threats → Legal Attention + Legal Support.

**Consent (first use):** Data storage, session storage, guidance disclaimer.

**Never:** Speak for user, pretend to be attorney, guarantee outcomes, tell user to lie, tell user to ignore legal obligations.

**Tier:** Premium. **V2 launch feature.**

---

### 5.4 Call Through Mina

**Purpose:** Mina communicates on user's behalf regarding specific objectives. User supervises.

**V2:** NOT shipped. V3 feature. Architecture designed now.

| Live Call Assistant | Call Through Mina |
|---------------------|-------------------|
| User speaks, Mina coaches | Mina communicates, user supervises |
| V2 | V3 |

**Future use cases:** Validation request, settlement info gathering, callback scheduling, contact verification, status inquiries, payment option inquiries.

**Not supported:** Legal representation, bankruptcy advice, litigation negotiation, court communication, settlement acceptance without approval.

**Future workflow:** Request → select collector/debt/goal → Call Brief → user approves → session proceeds.

**Never:** Accept settlements, approve payments, admit debt, sign agreements, provide legal advice.

Compliance requires legal review before implementation. Architecture only in V2.

---

### 5.5 Document Analysis

**Purpose:** Convert confusing documents into clear next actions.

**Supported (V2):** Collection letters, validation notices, settlement offers, medical debt notices, collection agency letters, account notices, creditor communications, email screenshots, payment demand letters.

**High alert (Legal Attention):** Court summons, lawsuit notices, garnishment notices, attorney letters.

**Out of scope:** Tax returns, bankruptcy filings, business contracts, mortgage closings, complex legal filings.

**Files:** PDF, JPG, PNG, HEIC, WEBP. Max 25 MB, 50 pages. One document at a time.

**Analysis output (6 cards):** Document type, plain language summary, key facts, risk level, recommended actions, what Mina sees.

**Confirmation required** before Debt Profile, Timeline, or Memory updates. User may edit all extracted values.

**Immediate legal attention documents** bypass normal flow — show "Legal Attention Required" and recommend Legal Support.

**Deletion:** Permanent (file, analysis, history removed).

**Never:** Determine legal truth, declare debt valid/invalid, guarantee outcomes, provide legal representation.

**Tier:** Free (limited) / Premium (unlimited). **V2 launch feature.**

---

### 5.6 Letter Generator

**Purpose:** Tool to move from fear to action. Letters are not the goal.

**V2 launch (Priority 1):** Debt validation request, debt dispute, cease communication request.

**Can wait:** Settlement inquiry, hardship, payment plan (Priority 2); goodwill, documentation request (Priority 3).

**Templates:** Federal-first for V2. Architecture supports state-specific content later. Template framework + AI personalization.

**Flow:** Choose purpose → Draft V1 → review/edit → Mina revise → finalize. Versioned drafts with compare/restore.

**V2 delivery:** Generate only. Export PDF and DOCX. No send/mail/email/fax. Status: Draft → Finalized → Exported → Sent (user-confirmed).

**Decision Shield:** High-risk letters strongly recommend review before finalization. Optional, not mandatory.

**Never:** Admit debt automatically, accept settlements, waive rights, auto-send, provide legal conclusions.

**Tier:** Premium. **V2 launch feature.**

---

### 5.7 Timeline

**Purpose:** "What has happened, what is happening now, and what should I pay attention to next?"

Dedicated navigation + Dashboard preview (both required). Grouped by month — life timeline, not system timeline.

**Structure:** Upcoming Deadlines (top) + Past Events.

**User interactions:** Filter, search, add notes, add manual events, mark deadlines complete. No snoozing legal deadlines. Cannot edit system events.

**Mostly read-only.** Does not update Debt Profile or Memory directly. User actions may create Memory Candidates.

**First event after signup:** "Mina Journey Started."

**Tier:** Free. **V2 launch feature.**

---

### 5.8 Decision Shield

**Purpose:** Help users choose their next action under pressure. Clarity, not analysis.

**Decisions (V2):** Pay now or wait, accept/reject settlement, send validation/dispute letter, enter payment plan, respond to collector, ignore communication, contact collector proactively. Any decision — no minimum severity.

**Review output (7 cards):** Situation summary, options, pros/cons, risks, unknowns, recommended next step, when Legal Support may help.

**User choices:** Proceed, Wait, Gather More Information, Seek Legal Support, Not Ready Yet. Reviews stay open until user closes. Outcome tracking in V2.

**Never blocks actions.** Informs only. Bridge between features (Document → Decision Shield → Letter → Timeline).

**Never:** Make decisions for users, guarantee outcomes, provide legal advice, predict court outcomes, declare debts valid/invalid.

**Tier:** Premium. **V2 launch feature.**

---

### 5.9 Recovery Planner

**Purpose:** Transform understanding into consistent action.

| Recovery Status | Recovery Planner |
|-----------------|------------------|
| "Where am I right now?" | "What should I do next?" |

One active plan per user. Optional — user can skip. Plans are collaborative: Mina proposes → user approves → user modifies.

**Contains:** Current stage, recovery goal, milestones, action items, deadlines, progress, feature deep links.

**Check-ins:** Weekly default (user-adjustable).

**Archive preferred over delete.**

**Never:** Guarantee debt resolution, predict timelines, promise outcomes, set payment amounts automatically.

**Tier:** Premium. After signup only — not for guests. **V2 launch feature.**

---

### 5.10 Legal Support

**Purpose:** "Your situation may require professional legal help. Here is how to prepare and where to go next."

**Does NOT:** Provide legal advice, interpret law, predict outcomes, replace attorneys, recommend individual attorneys.

**Workflows by issue type:** Summons, garnishment, general legal concern.

**Intake produces:** Summary, urgency assessment, preparation checklist, recommended resources, questions to ask.

**Resources (state-specific, curated, no external APIs):** Legal aid, state bar referrals, consumer protection, court self-help, educational content.

**Case packet:** In-app view (architecture ready). PDF download can wait.

**V2 day one:** Legal Attention Mode, intake, state resources, preparation checklist.

**Tier:** Free + Premium. **V2 launch feature.**

---

### 5.11 Dashboard Intelligence

**Purpose:** "What should I focus on right now?" — command center, calm home base, recovery guide.

Default page after login. Guests never see real dashboard.

**Widgets (day one):** Recovery stage, next best action (one primary), active alerts, upcoming deadlines, recovery progress + Recovery Score, quick actions, timeline preview (last 5 events), check-in widget.

**Recommendations:** One primary + up to three secondary. Ranking: legal risk → deadline risk → recovery progress → user goals → stress level. Always explain why.

**Refresh:** Event-driven. Display "Last updated" timestamp.

**Never:** Overwhelm, create fear, use aggressive language, pretend actions were completed.

**Tier:** Free (basic) / Premium (full). **V2 launch feature.**

---

## 6. Database Architecture

### Design Constraints

- **One database**, separate tables — not separate databases
- Launch: hundreds of users; target: thousands; supports tens of thousands
- Files in **object storage**; database stores metadata, analysis, links
- US-first; state mandatory; architecture supports future international expansion
- User data never used to train AI models

### User Model

- Auth: email + password, Google sign-in
- One account per person; multiple debt situations per account
- No household or shared accounts in V2
- Compliance day one: export my data, delete my account, delete my data
- Audit trail: user actions, Mina-generated content, important updates

### Layer Overview

```
Layer 0 — Core Platform (users, profiles, consents, preferences, subscriptions)
Layer 1 — Shared Entities (debt_situations, collectors, creditors)
Layer 2 — Shared Intelligence (profiles, recovery status, memory)
Layer 3 — Cross-Cutting (legal_attention_events)
Layer 4 — Feature Modules (each with own tables + history)
Layer 5 — Read Models (timeline_events, dashboard_snapshots)
```

### Core Platform Tables

| Table | Purpose |
|-------|---------|
| `users` | Account identity |
| `user_profiles` | Name, email, state, language, subscription tier |
| `user_consents` | Data storage, guidance disclaimers, feature consent |
| `user_preferences` | UI preferences, notification settings |
| `subscriptions` | Freemium tier tracking |

### Shared Intelligence Tables

| Table | Purpose |
|-------|---------|
| `debt_profiles` | Financial situation per user |
| `stress_profiles` | Emotional state per user |
| `recovery_status` | Current stage per user |
| `memory_entries` | Typed conclusions (active/inactive) |
| `memory_entry_sources` | Link to proposing feature + record |
| `memory_recommendations` | Recommendation + outcome + user response |
| `memory_history` | All memory changes |

### Cross-Cutting Tables

| Table | Purpose |
|-------|---------|
| `legal_attention_events` | System-wide legal urgency |

### Feature Tables

#### Onboarding

| Table | Purpose |
|-------|---------|
| `onboarding_sessions` | Session metadata, status, version |
| `onboarding_step_responses` | Structured answers |
| `onboarding_pressure_profiles` | Pressure profile output |
| `onboarding_recovery_paths` | Stage + recommended steps |
| `onboarding_analyses` | Card outputs + narrative |
| `onboarding_history` | Step completions, corrections, re-runs |

#### Live Call Assistant

| Table | Purpose |
|-------|---------|
| `live_call_sessions` | Metadata, collector/debt links |
| `live_call_user_inputs` | What user typed |
| `live_call_mina_responses` | Mina recommendations per input |
| `live_call_events` | Significant moments |
| `live_call_summaries` | Post-call summary |
| `live_call_history` | Session lifecycle |

#### Call Through Mina (V3-ready)

| Table | Purpose |
|-------|---------|
| `call_through_requests` | User intent, target, goal |
| `call_through_briefs` | Brief + approval status |
| `call_through_sessions` | Session metadata |
| `call_through_events` | Key structured events |
| `call_through_outcomes` | Results + follow-ups |
| `call_through_history` | Full lifecycle |

Never mixed with Live Call Assistant tables.

#### Document Analysis

| Table | Purpose |
|-------|---------|
| `document_uploads` | File metadata, storage ref, links |
| `document_analysis_runs` | Analysis attempts (versioned) |
| `document_extracted_fields` | Key-value extractions |
| `document_user_corrections` | User edits |
| `document_confirmed_values` | Final confirmed data |
| `document_deadlines` | Detected and confirmed deadlines |
| `document_analysis_history` | Lifecycle events |

#### Letter Generator

| Table | Purpose |
|-------|---------|
| `letter_requests` | Type, purpose, source links |
| `letter_drafts` | Versioned content |
| `letter_templates` | System-managed catalog |
| `letter_recipients` | Recipient snapshot |
| `letter_exports` | Export log |
| `letter_generator_history` | Lifecycle events |

#### Timeline

| Table | Purpose |
|-------|---------|
| `timeline_events` | Normalized events from feature histories |
| `timeline_event_details` | Optional structured payload |
| `timeline_user_notes` | User annotations |
| `timeline_manual_events` | User-created events |
| `timeline_deadline_completions` | User-marked completions |
| `timeline_interactions` | Notes, filters, completions |

#### Decision Shield

| Table | Purpose |
|-------|---------|
| `decision_reviews` | Decision type, status, links |
| `decision_options` | Structured options with pros/cons |
| `decision_risks` | Risk items |
| `decision_user_choices` | Choice + rationale (versioned) |
| `decision_outcomes` | Follow-up outcomes |
| `decision_shield_history` | Lifecycle events |

#### Recovery Planner

| Table | Purpose |
|-------|---------|
| `recovery_plans` | Plan versions, status |
| `recovery_plan_milestones` | Meaningful achievements |
| `recovery_plan_actions` | Tasks with feature deep links |
| `recovery_plan_checkins` | Scheduled and completed check-ins |
| `recovery_plan_versions` | Version history |
| `recovery_planner_history` | Lifecycle events |

#### Legal Support

| Table | Purpose |
|-------|---------|
| `legal_support_intakes` | Intake sessions |
| `legal_support_summaries` | Summary + checklist |
| `legal_support_case_packets` | Handoff package |
| `legal_support_resource_views` | Resource view/click tracking |
| `legal_support_user_responses` | Contacted attorney, declined, etc. |
| `legal_support_history` | Lifecycle events |

#### Dashboard Intelligence

| Table | Purpose |
|-------|---------|
| `dashboard_snapshots` | Event-driven computed state |
| `dashboard_recommendations` | Primary + secondary with source refs |
| `dashboard_alerts` | Active alerts with status |
| `dashboard_interactions` | User interaction log |

### History Model (All Features)

```
{feature}_history
  id
  user_id
  session_id
  event_type
  event_payload
  occurred_at
  actor               -- 'user' | 'mina' | 'system'
  memory_synced
  timeline_indexed
```

**Rules:** Mostly append-only. Significant events only. Corrections are new events. Feature history is source of truth if Timeline disagrees.

### Entity Relationship Summary

```
users
  ├── user_profiles, user_consents, user_preferences, subscriptions
  ├── debt_situations, collectors, creditors
  ├── debt_profiles, stress_profiles, recovery_status
  ├── memory_entries → memory_entry_sources, memory_recommendations, memory_history
  ├── legal_attention_events
  ├── onboarding_sessions → onboarding_history
  ├── live_call_sessions → live_call_history
  ├── call_through_* (V3-ready)
  ├── document_uploads → document_analysis_history
  ├── letter_requests → letter_generator_history
  ├── timeline_events → timeline_interactions
  ├── decision_reviews → decision_shield_history
  ├── recovery_plans → recovery_planner_history
  ├── legal_support_intakes → legal_support_history
  └── dashboard_snapshots → dashboard_interactions
```

---

## 7. Cross-Feature Communication

### Flow

```
Feature
  │
  ├─► Write own tables + {feature}_history
  │
  ├─► Propose Memory Candidate → Memory Service
  │
  ├─► Update shared layers (after user confirmation where required)
  │
  ├─► Create/link shared entities (debt_situations, collectors, creditors)
  │
  ├─► Trigger legal_attention_events (when applicable)
  │
  └─► Emit significant history event
           │
           ├──► Timeline Indexer → timeline_events
           └──► Dashboard Sync → dashboard_snapshots
```

### What Crosses Boundaries

| Data | Mechanism |
|------|-----------|
| Collector / creditor / debt | Shared entity tables |
| Confirmed financial facts | Debt Profile |
| Emotional state | Stress Profile |
| Recovery stage | Recovery Status |
| Behavioral patterns | Mina Memory (via Memory Service) |
| Legal urgency | legal_attention_events |
| Record relationships | Foreign keys / link tables between feature records |

### What Never Crosses Boundaries

| Data | Stays In |
|------|----------|
| Feature conversation / coaching | Feature history only |
| Raw documents | Document Analysis + object storage |
| Call inputs / responses | Live Call tables |
| Letter draft versions | Letter Generator tables |
| Full transcripts | Call Through tables (V3) |
| Giant mixed chat | **Nowhere — prohibited** |

Features do not read each other's history tables at runtime.

### Recommendation Engine

Dashboard is the **central** recommendation engine. Features also show inline recommendations. Every recommendation deep-links to target feature with context.

---

## 8. Guest-to-Signup Flow

| Phase | Storage | What User Can Do |
|-------|---------|------------------|
| **Guest** | Browser session storage only. No database record. | Onboarding, analysis, pressure profile, recovery preview, recommended actions |
| **Guest expiry** | 7 days if no signup | Data discarded |
| **Signup** | Session data transferred to database | Account created (email + password or Google) |
| **Post-signup** | Database | Full platform access per subscription tier |

### Data Transferred at Signup

- Onboarding answers
- Pressure profile
- Recovery profile
- Mina analysis

### Post-Signup Initialization

- Onboarding session = origin record
- Memory seeded from onboarding analysis
- Timeline first event: "Mina Journey Started"
- Dashboard begins
- Recovery Planner plan draft from onboarding recommendations (user reviews and approves)
- Onboarding recommended actions become dashboard actions

### Guest Session Stores

- Answers
- Progress
- Analysis

---

## 9. V2 Scope

### Launch Features

| Feature | Tier | Notes |
|---------|------|-------|
| Onboarding Intelligence | Free | Guest-accessible pre-signup |
| Mina Memory / My Mina Profile | Free | Seeded at signup |
| Document Analysis | Free (limited) / Premium (unlimited) | OCR, analysis, confirmation day one |
| Letter Generator | Premium | Validation, dispute, cease day one |
| Live Call Assistant | Premium | Typing-based coaching day one |
| Decision Shield | Premium | Full review flow day one |
| Recovery Planner | Premium | After signup only |
| Legal Support | Free + Premium | Legal Attention, intake, resources day one |
| Timeline | Free | Seeded at signup |
| Dashboard Intelligence | Free (basic) / Premium (full) | After signup |

### Per-Feature V2 Day-One Requirements

| Feature | Required Day One | Can Wait |
|---------|------------------|----------|
| Onboarding | Full flow, 6-card analysis, pressure profile | — |
| Document Analysis | Upload, OCR, analysis, key facts, risk, deadlines, confirmation | Multi-document packages, cross-document comparison |
| Letter Generator | Validation, dispute, cease communication | Priority 2/3 letter types |
| Live Call Assistant | Typing, tactic detection, scripts, summary, next actions | Voice transcription, recording |
| Decision Shield | Summary, options, risks, unknowns, recommendation, outcome tracking | Scenario simulations, scoring engine |
| Recovery Planner | Stage, plan creation, milestones, actions, progress, check-ins | Goal forecasting, calculators, multi-plan |
| Legal Support | Legal Attention Mode, intake, state resources, checklist | Case packet PDF, appointment tracking |
| Timeline | Event stream, source links, deadlines, filters, manual events | Advanced search, calendar, export |
| Dashboard | Stage, next action, alerts, deadlines, progress, quick actions, timeline preview | My Mina Profile widget, analytics, customization |

### System Requirements (V2)

- Web first, mobile responsive
- US-first, state mandatory
- One database, separate tables
- Object storage for files
- Export, delete, audit trail from day one
- Freemium with one paid tier
- No AI training on user data

---

## 10. V3 Deferred Features

Architecture supports these. Not shipped in V2.

| Feature / Capability | Notes |
|---------------------|-------|
| **Call Through Mina** | Full module — requests, briefs, sessions, outcomes. Requires legal/compliance review before implementation |
| **Mina Coach (dedicated area)** | Coaching embedded in V2 features; standalone area in V3 |
| **Voice transcription / audio listening** | Live Call Assistant enhancement |
| **Call recording** | Live Call / Call Through enhancement |
| **Letter sending** | Mail, email, fax, certified mail |
| **State-specific letter templates** | Architecture ready; V2 uses federal-first |
| **Case packet PDF** | In-app case packet in V2; PDF export deferred |
| **Attorney appointment tracking** | Legal Support enhancement |
| **Advanced resource matching** | Legal Support enhancement |
| **Advanced Decision Shield** | Scenario simulations, multi-step planning trees, scoring engine |
| **Multi-document packages** | Document Analysis enhancement |
| **Cross-document comparisons** | Document Analysis enhancement |
| **Timeline export / sharing / calendar view** | Timeline enhancements |
| **Dashboard customization / analytics / trend reports** | Dashboard enhancements |
| **Recovery Planner forecasting / calculators / multi-plan** | Recovery enhancements |
| **Native mobile app** | Platform expansion |
| **International expansion** | Architecture supports; V2 is US-first |

---

## 11. Open Questions

Items explicitly deferred or not decided during design. Do not assume answers.

| # | Question | Context |
|---|----------|---------|
| 1 | **Free tier document limit** | Document Analysis is "limited" on free tier — specific count not defined |
| 2 | **Premium pricing** | One paid tier confirmed; price not defined |
| 3 | **Call Through Mina compliance** | Requires legal review, state-specific analysis, and consent framework before V3 implementation |
| 4 | **Onboarding step adaptivity** | Categories defined; whether steps skip/adapt based on earlier answers not explicitly decided |
| 5 | **Legal Attention reminder cadence** | Mina may remind after dismissal — specific timing/rules not defined |
| 6 | **Recovery Score weighting** | Inputs defined; exact weight per input not defined |

---

## 12. Recommended Build Order

Phased implementation sequence. Each phase builds on prior phases. No code — sequencing only.

### Phase 1 — Authentication, User Profile, Dashboard Shell

- User authentication (email + password, Google sign-in)
- Core platform tables: `users`, `user_profiles`, `user_consents`, `user_preferences`, `subscriptions`
- Dashboard shell (layout, navigation, placeholder widgets)
- Export and delete account infrastructure
- Guest session storage mechanism (browser session — no database writes)

**Outcome:** Users can sign up, log in, and land on an empty dashboard shell.

---

### Phase 2 — Onboarding, Shared Layers, Memory Service

- Onboarding Intelligence (full guest-accessible flow)
- Shared intelligence tables: `debt_profiles`, `stress_profiles`, `recovery_status`
- Mina Memory tables + Memory Service (candidate → approve/reject flow)
- Guest-to-signup data transfer
- Onboarding writes to all five shared layers at signup
- Pressure profile, recovery path, 6-card analysis

**Outcome:** Guest completes onboarding, signs up, and account is seeded with full intelligence profile.

---

### Phase 3 — Document Analysis

- Shared entities: `debt_situations`, `collectors`, `creditors`
- Document upload, object storage integration
- OCR, analysis, 6-card output, confirmation flow
- `legal_attention_events` for high-alert documents
- Document → shared entity linking
- Feature history + Timeline indexer (initial events)

**Outcome:** Signed-in users can upload, analyze, confirm documents. Debt situations and collectors created from confirmed data.

---

### Phase 4 — Letter Generator

- Letter requests, versioned drafts, templates (federal-first)
- Priority 1 letters: validation, dispute, cease communication
- Export PDF and DOCX
- Links to Document Analysis records and shared entities
- Finalization review flow

**Outcome:** Users can generate, edit, finalize, and export letters linked to documents.

---

### Phase 5 — Live Call Assistant

- Live call sessions, user inputs, Mina responses
- Pressure tactic detection, suggested scripts
- Post-call summary, stress profile update
- Legal Attention triggers from call events
- Premium tier gating

**Outcome:** Premium users get real-time call coaching via typing interface.

---

### Phase 6 — Timeline

- `timeline_events` indexer consuming feature histories
- Upcoming deadlines section + past events grouped by month
- Source links, filters, manual events, notes
- Deadline completions
- Dashboard timeline preview (last 5 events)
- Seed "Mina Journey Started" from onboarding

**Outcome:** Users have full chronological view of their journey with deadline awareness.

---

### Phase 7 — Decision Shield

- Decision reviews, options, risks, choices, outcomes
- 7-card review flow
- Entry points from Document Analysis, Letter Generator, Live Call, Dashboard
- Bridge linking between features
- Premium tier gating

**Outcome:** Users can structuredly review decisions before acting.

---

### Phase 8 — Recovery Planner

- Recovery plans, milestones, actions, check-ins, versions
- Plan creation from onboarding recommendations
- Recovery Score calculation
- Stage advancement (Mina proposes, user confirms)
- Feature deep links with auto-complete
- Premium tier gating

**Outcome:** Premium users have actionable recovery plan with progress tracking.

---

### Phase 9 — Legal Support

- Legal Support intake, summaries, checklists
- State-specific curated resource catalog
- Workflows: summons, garnishment, general legal concern
- Case packet (in-app view)
- Legal Attention → Legal Support routing from all trigger features

**Outcome:** Users facing legal pressure get preparation support and state resources.

---

### Phase 10 — Dashboard Intelligence

- Event-driven dashboard sync
- Primary + secondary recommendations with ranking logic
- Alerts vs recommendations (legal alerts pinned top)
- Stress-adaptive layout and copy
- Recovery Score, progress bar, check-in widget
- Personalization from Memory patterns
- `dashboard_snapshots`, `dashboard_recommendations`, `dashboard_alerts`, `dashboard_interactions`
- Crisis / healthy / first-login dashboard states

**Outcome:** Dashboard becomes the fully intelligent command center — central recommendation engine for all features.

---

## Appendix: Intelligence Flow Example

**Scenario:** User receives a collection letter.

1. **Onboarding (prior)** — User signed up. Pressure profile shows high uncertainty. Recovery stage: Understand. Memory: user delays decisions until confident.

2. **Document Analysis** — User uploads letter. 6-card analysis. Deadline: 30 days. User confirms collector and amount → Debt Profile updated. Timeline: document uploaded, deadline detected.

3. **Dashboard** — Primary recommendation: "Generate validation letter — because your validation deadline is in 28 days."

4. **Decision Shield (optional)** — User reviews pay now vs. request validation. Chooses wait.

5. **Letter Generator** — Linked to document. Draft → finalize → export PDF. User marks sent. Debt Profile: validation requested.

6. **Live Call Assistant** — Collector calls back. Mina detects urgency pressure, suggests validation script. Post-call summary saved. Stress Profile updated.

7. **Recovery Planner** — Milestone completed. Recovery Score increases. Stage advancement proposed: Understand → Protect. User confirms.

8. **Legal Support** — Not triggered (standard collection letter).

At no point: giant mixed chat, duplicate collector records, or automatic profile updates without confirmation.

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| **Session** | One bounded interaction within a single feature |
| **History** | Append-only log of significant events for a feature |
| **Memory Candidate** | Pattern insight proposed by a feature to Memory Service |
| **Memory Entry** | Active or inactive conclusion in Mina Memory |
| **Pressure Profile** | Multi-dimensional onboarding output describing user's pressure |
| **Recovery Path** | Onboarding output: stage + recommended next steps |
| **Recovery Score** | 0–100 progress score showing momentum, not judgment |
| **Legal Attention Required** | System-wide legal urgency via `legal_attention_events` |
| **Debt Situation** | Shared entity representing one debt context |
| **Primary Recommendation** | Single most important dashboard action |
| **My Mina Profile** | User-facing view of what Mina has learned |
| **Mina Coach** | Embedded coaching in V2; dedicated module in V3 |
