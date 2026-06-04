# Mina V2 Onboarding Experience

**World-class onboarding design for Mina V2.**

This document defines the emotional arc, screen flow, copy direction, and intelligence outputs for Onboarding Intelligence. It complements [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md), [MINA_DESIGN_SYSTEM.md](./MINA_DESIGN_SYSTEM.md), and [PHASE_2_IMPLEMENTATION_PLAN.md](./PHASE_2_IMPLEMENTATION_PLAN.md).

**No code.** Experience and copy direction only.

---

## North star outcomes

When a user finishes onboarding, they should feel:

| Feeling | What it means |
|---------|----------------|
| **"I feel understood."** | Mina named their situation without judgment and reflected it back accurately |
| **"I know my next step."** | One clear, doable action — not a list of ten tasks |
| **"I am less overwhelmed."** | Fear reduced; complexity ordered into a path forward |

**Transformation loop:** Fear → Clarity → Action → Recovery

---

## Experience principles

| Principle | In practice |
|-----------|-------------|
| **Human first** | Speak to the person, not the debt |
| **Coach-like** | Warm, direct, encouraging — never lecturing |
| **One question at a time** | Single focus per screen; no multi-field forms |
| **Never feel like a form** | Cards, chips, sliders — not IRS paperwork |
| **Mobile-first** | Thumb-friendly, short copy, generous whitespace |
| **Premium but human** | Calm confidence — not bank app, not legal portal, not generic AI |

### Tone rules

- Premium, calm, human, supportive  
- Never dramatic, never judgmental, never legal advice  
- Never promise outcomes, predict lawsuits, or say what someone legally owes  
- Legal seriousness when needed — with context and warmth, not panic  

### What we never collect in onboarding

SSN, bank account numbers, employer details, exact account numbers, full financial statements.

---

## Section 1: Emotional Journey

Onboarding is a **guided conversation**, not a data harvest. Each phase shifts how Mina speaks and how much visual density the screen carries.

```
Arrival → Relief → Understanding → Clarity → Recovery Path → Commitment
```

### Arrival

| | |
|---|---|
| **User state** | Anxious, possibly ashamed, searching for help at 11pm |
| **Design** | Soft welcome, Mina mark, one line of safety: "You're in the right place." |
| **Mina's voice** | Slow, welcoming, zero urgency. Short sentences. No product jargon. |
| **Example** | "Financial pressure is exhausting. Let's take this one step at a time — about five minutes, at your pace." |
| **Avoid** | "Let's get started!", exclamation marks, feature lists |

### Relief

| | |
|---|---|
| **User state** | First answer tapped — slightly more willing to continue |
| **Design** | After Screen 1 selection, Mina reflects back before the next question |
| **Mina's voice** | Validating. Names the feeling behind the choice. Normalizes the experience. |
| **Example** | "That's more common than you might think. You're not alone in this — and you don't have to figure it out tonight." |
| **Avoid** | Statistics that feel cold, "don't worry" without substance |

### Understanding

| | |
|---|---|
| **User state** | Sharing situation type, severity, and stress — building trust |
| **Design** | One question per screen, progress bar, optional "Why we ask" in muted text |
| **Mina's voice** | Curious and respectful. Explains *why* a question matters in one line. |
| **Example** | "This helps me understand what kind of pressure you're under — not to judge, but to point you in the right direction." |
| **Avoid** | Clinical intake language ("Please specify"), long paragraphs |

### Clarity

| | |
|---|---|
| **User state** | Has answered enough — ready to see themselves reflected |
| **Design** | Brief transition screen: "Give me a moment to put this together for you." |
| **Mina's voice** | Confident but humble. "Here's what I'm seeing." Not "I've analyzed your data." |
| **Example** | "Based on what you shared, here's a clear picture of where you are — and what matters most right now." |
| **Avoid** | AI buzzwords ("processing", "algorithm", "GPT") |

### Recovery Path

| | |
|---|---|
| **User state** | Sees stage + next steps — hope mixed with caution |
| **Design** | Stage badge (teal/gold), 3–5 numbered steps, one highlighted as primary |
| **Mina's voice** | Forward-looking, achievable. Recovery is non-linear — say so. |
| **Example** | "You're in the **Understand** stage. That's a good place to start — clarity comes before big decisions." |
| **Avoid** | Timelines ("you'll be debt-free in 6 months"), score judgment |

### Commitment

| | |
|---|---|
| **User state** | Deciding whether to create an account |
| **Design** | Signup handoff — recap value, no countdown timers, no guilt |
| **Mina's voice** | Invitation, not pressure. Emphasize saving progress and continuing the path. |
| **Example** | "Create a free account to save your profile and pick up where you left off. Your answers stay private — and you can change anything later." |
| **Avoid** | "Don't lose your progress!", red urgency, paywalls |

---

## Section 2: Onboarding Flow — Screen 1

### Welcome (pre-screen)

**Headline:** Welcome to Mina  
**Subline:** Understand your situation. See your options. Take one step at a time.  
**Meta:** About 5–8 minutes · Private · No account required to start  
**Primary CTA:** Let's begin  

---

### Screen 1: What brought you here today?

**Prompt:** What brought you here today?  
**Helper:** Choose what feels closest. You can change this later.  
**Interaction:** Single-select cards (large tap targets)

| Option | Mina's reflection (shown immediately after selection, before continuing) |
|--------|--------------------------------------------------------------------------|
| **A collector contacted me** | "Contact from a collector can feel intrusive and stressful — even when you want to handle things the right way. We'll help you understand what's happening and what you can do next." |
| **I received a letter or notice** | "Letters can be confusing on purpose. You're doing the right thing by pausing to understand it instead of reacting from fear." |
| **I'm worried about debt** | "Worry often comes before anything 'official' happens — and that's okay. Getting clarity early is one of the smartest moves you can make." |
| **I'm behind on payments** | "Falling behind doesn't define you. Many people hit this point and recover with a clear plan. Let's figure out where you stand." |
| **I'm facing legal action** | "Legal pressure is serious — and you deserve calm, structured support. Mina can help you prepare and understand your options. This is guidance, not legal advice." |
| **I'm not sure where to start** | "Not knowing where to start is one of the hardest parts. You don't need to have it figured out — we'll map it together, one step at a time." |

**Primary CTA after reflection:** Continue  

**Maps to:** `onboarding_answers.step_key = current_situation`

---

## Section 3: Situation Type

### Screen 2: What type of situation are you dealing with?

**Prompt:** What type of situation are you dealing with?  
**Helper:** Select all that apply, or choose the one that feels most pressing.  
**Interaction:** Multi-select chips (or single-select if user prefers simplicity in MVP — multi-select preferred)

| Option | Follow-up question(s) |
|--------|----------------------|
| **Credit card debt** | "Roughly how many credit accounts are involved?" → One / Two to three / Four or more / Not sure |
| **Medical bills** | "Are any bills in collections, or still with the provider?" → With provider / In collections / Both / Not sure |
| **Personal loan** | "Is the loan current, behind, or in collections?" → Current / Behind / Collections / Not sure |
| **Auto loan** | "Are you worried about repossession, or mostly keeping up?" → Keeping up / Behind on payments / Repossession concern / Not sure |
| **Student loans** | "Federal, private, or both?" → Federal / Private / Both / Not sure |
| **Mortgage** | "Are you current, behind, or facing foreclosure concern?" → Current / Behind / Foreclosure concern / Not sure |
| **IRS / Tax debt** | "Have you received a notice from the IRS or state tax agency?" → Yes / No / Not sure |
| **Utilities** | "Are services at risk of shutoff, or already disconnected?" → At risk / Disconnected / Caught up / Not sure |
| **Collections (unknown)** | "Do you know who is contacting you, or is it unclear?" → I know who / Unclear / Mixed / Not sure |
| **Multiple debts** | "Which feels most urgent right now?" → Re-use chip list (single select) |
| **Not sure** | "That's okay. We'll focus on what's causing the most stress first." → Skip to Screen 4 severity with extra reassurance interstitial |

**Mina reflection (after this section):**  
"You've named the types of pressure you're carrying. That alone takes courage — and it gives us a clearer place to start."

**Maps to:** `debt_categories` (high-level) in analysis → `debt_profiles.debt_categories` at signup

---

## Section 4: Severity

### Purpose

Understand **urgency and legal exposure** without interrogating the user. Drives risk category and recovery stage bias.

Ask one question per screen. Yes / No / Not sure for each (Not sure is always valid).

---

### Screen 3a: Have you received a letter?

**If Yes — follow-up:** "Do you remember what it was about?"  
→ Payment demand / Court or legal / Verification or validation / Not sure / Haven't opened it yet

**Mina note (if haven't opened):** "That's okay. When you're ready, you can upload it in Mina and we'll help you understand it — plain language, no jargon."

---

### Screen 3b: Have you been contacted by a collector?

**If Yes — follow-up:** "How often?" → Once / A few times / Frequently / Not sure

---

### Screen 3c: Are you currently being sued?

**If Yes — follow-up:** "Have you been served papers or received a court date?" → Served / Court date known / Heard about it, not sure / Not sure

**Mina reflection (if Yes or Not sure on lawsuit):**  
"This sounds like a situation where professional legal help may be important. Mina can help you prepare questions and find resources — but we're not a law firm, and this isn't legal advice."

---

### Screen 3d: Have wages or bank accounts been affected?

**Options:** Yes, garnishment or levy / Yes, but not sure what type / No / Not sure

---

### Screen 3e: Are there upcoming deadlines?

**If Yes — follow-up:** "Do you know roughly when?" → Within 2 weeks / Within 30 days / More than 30 days / Not sure

---

### Screen 3f: Are you unsure about any of this?

**Prompt:** Is there anything you're uncertain about right now?  
**Options (multi-select):** Who is contacting me / Whether I owe this / What happens if I ignore it / Whether this is legitimate / What I should do first / None of these — I mostly understand

**Mina reflection (end of severity section):**  
"Uncertainty is normal — especially when the stakes feel high. Part of our job is to turn 'I don't know' into 'I know my next step.'"

---

### Risk categories

Composite score from severity answers. Used for `debt_profiles.legal_risk_level` and stress profile — **not shown as a scary label to the user** during onboarding. User sees plain-language summary instead.

| Category | Internal signals | User-facing framing (example) |
|----------|------------------|-------------------------------|
| **Low** | No collector contact, no letters, worry-only, no legal flags | "Your situation looks manageable with the right information and a steady plan." |
| **Medium** | Collector contact or letters, not sued, no garnishment, some uncertainty | "There's active pressure, but you have room to respond thoughtfully — timing matters." |
| **High** | Lawsuit concern, deadlines within 30 days, repeated collector contact, multiple debts urgent | "There are time-sensitive pieces here. Let's prioritize what protects you first." |
| **Critical** | Served papers, garnishment/levy, court date within 14 days | "This needs careful attention soon. Mina will help you prepare — and we'll point you toward professional legal support when appropriate." |

**Critical rule:** Critical does not mean red full-screen panic. Use calm copy + clear next step + legal support pathway language per architecture.

**Maps to:** `debt_profiles.legal_risk_level` → `low` \| `medium` \| `high` \| `legal_attention`

---

## Section 5: Financial Snapshot

Keep simple, non-invasive, ranges only — never exact dollars required.

One or two questions per screen.

---

### Screen 4a: What state do you live in?

**Prompt:** What state do you live in?  
**Helper:** Some guidance depends on where you live. We don't share this with collectors.  
**Interaction:** Searchable US state dropdown  

**Maps to:** `profiles.state` at signup transfer

---

### Screen 4b: Income range (optional feel, required for MVP)

**Prompt:** Roughly, what's your monthly household income?  
**Helper:** A range is fine — this helps us understand flexibility, not to judge you.  
**Options:** Under $2,000 / $2,000–$4,000 / $4,000–$6,000 / $6,000–$10,000 / Over $10,000 / Prefer not to say  

---

### Screen 4c: Expenses range

**Prompt:** Roughly, what are your essential monthly expenses?  
**Helper:** Rent, utilities, food, transport — ballpark is enough.  
**Options:** Under $2,000 / $2,000–$4,000 / $4,000–$6,000 / Over $6,000 / Prefer not to say  

---

### Screen 4d: Emergency savings

**Prompt:** If an unexpected $500 expense came up, how would that feel?  
**Options:** Very difficult / Manageable but tight / Comfortable / Prefer not to say  

*Framed as stress proxy — not a balance question.*

---

### Screen 4e: Number of debt situations

**Prompt:** How many separate debt situations are you juggling?  
**Options:** One / Two to three / Four or more / Not sure  

**Mina reflection (end of financial snapshot):**  
"Thank you. This isn't about perfect numbers — it's about understanding your room to breathe while you work through this."

---

## Section 6: Stress Profile

Four dimensions, one slider per screen (1–5) or labeled chip anchors. Sliders use calm labels at endpoints — not numbers alone.

---

### Screen 5a: Emotional pressure

**Prompt:** How much is this affecting you emotionally day to day?  
**Scale:** 1 = Mostly manageable → 5 = Overwhelming most days  

---

### Screen 5b: Financial pressure

**Prompt:** How tight does money feel right now?  
**Scale:** 1 = Some concern → 5 = Constant stress about bills  

---

### Screen 5c: Legal pressure

**Prompt:** How much are legal consequences on your mind?  
**Scale:** 1 = Barely / not applicable → 5 = It's my biggest fear  

---

### Screen 5d: Confidence level

**Prompt:** How confident do you feel handling this on your own?  
**Scale:** 1 = Not confident at all → 5 = I mostly know what to do  

*Note: Low confidence is not failure — it drives support style.*

---

### Score definitions

Compute dimension scores (1–5 average or weighted). Map to architecture stress intensity for `stress_profiles`.

| Composite stress intensity | Score range | User-facing label | Mina tone for results |
|----------------------------|-------------|-------------------|------------------------|
| **Low** | 1.0 – 2.0 | Steady | Action-oriented, progress-focused |
| **Medium** | 2.1 – 3.0 | Stretched | Clear, structured |
| **High** | 3.1 – 4.0 | Heavy | Calm, reassuring, slower pacing |
| **Critical** | 4.1 – 5.0 | Overwhelming | Grounding first; one step only |

**Additional outputs (internal + pressure profile):**

| Dimension | Maps to |
|-----------|---------|
| Emotional pressure | `stress_profiles.stress_intensity`, `fear_intensity` |
| Financial pressure | `stress_profiles.pressure_level` |
| Legal pressure | Influences `debt_profiles.legal_risk_level` |
| Confidence (inverse) | Influences support style + memory seeds |

---

### Screen 5e: Behavior pattern (architecture requirement)

**Prompt:** When financial pressure hits, what do you usually do first?  
**Options (single select):**

| Choice | Pattern label |
|--------|---------------|
| Put it aside and hope it resolves | **Avoider** |
| Research for hours before acting | **Analyzer** |
| React quickly — call, pay, or respond | **Reactor** |
| Feel stuck and struggle to decide | **Freezer** |

---

### Screen 5f: Support preference (architecture requirement)

**Prompt:** How do you prefer to receive guidance?  
**Options (single select):** Step-by-step coach / Straight facts / Emotional support first / Teach me how it works / Keep me accountable  

**Maps to:** Coach / Direct (Educator) / Guide / Educator / Accountability support styles

---

### Screen 5g: Recovery goals (architecture requirement)

**Prompt:** What would feel like progress for you right now?  
**Helper:** Choose up to three.  
**Options:** Stop worrying · Respond confidently · Settle or negotiate · Avoid legal problems · Create a plan · Rebuild stability  

**Mina reflection (before analysis):**  
"I have what I need. Let me put together a clear picture for you."

**Maps to:** `onboarding_answers.step_key = recovery_goals` + recommended actions in analysis

---

## Section 7: Recovery Stage Assignment

One primary stage per user at onboarding. Stages align with [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md):

1. **Stabilize** — reduce immediate chaos and emotional overload  
2. **Understand** — gather facts, clarify what is happening  
3. **Protect** — preserve rights, respond to deadlines, avoid harmful mistakes  
4. **Act** — execute decisions (letters, calls, payments, negotiations)  
5. **Resolve** — close out situations, settlements, plans in motion  
6. **Recover** — rebuild confidence and financial stability  

Recovery is **non-linear**. Mina may assign an earlier stage even for complex situations — clarity before action.

---

### Assignment logic (conceptual)

Evaluate in order; **first strong match wins**, with overrides for legal criticality.

| Priority | Condition | Stage assigned |
|----------|-----------|----------------|
| 1 | Stress composite ≥ Critical (4.1+) OR user selects "I'm not sure where to start" + High emotional pressure | **Stabilize** |
| 2 | Risk Critical (served, garnishment, court ≤14 days) OR lawsuit Yes + deadline ≤30 days | **Protect** |
| 3 | Risk High OR collector + letter + uncertainty flags OR Screen 1 = legal action | **Protect** |
| 4 | User mostly Understands situation (low uncertainty, no active legal) but needs mapping | **Understand** |
| 5 | User behind on payments, knows situation type, medium risk, wants plan | **Understand** or **Act** (if confidence ≥4) |
| 6 | User in late resolution (goals = rebuild, low pressure, few active threats) | **Recover** |
| 7 | Default for worry-only, low severity | **Understand** |

**Stage + risk matrix (simplified):**

| Risk \ Stress | Low–Medium stress | High–Critical stress |
|---------------|-------------------|----------------------|
| Low | Understand | Stabilize → Understand |
| Medium | Understand | Understand |
| High | Protect | Stabilize → Protect |
| Critical | Protect | Protect |

**Output:** `recovery_statuses.current_stage`, `recovery_score = 0`, recovery path JSON with 3–5 steps tailored to stage + goals.

---

## Section 8: Mina Understanding — Final Analysis Experience

After a brief loading interstitial (2–4 seconds minimum — never instant, never >30s), present results as **scrollable structured cards** + short narrative. Not a chat thread.

### Screen flow (results sequence)

1. **Narrative summary** (hero card)  
2. **Pressure profile** (labeled rows)  
3. **Recovery stage** (badge + explanation)  
4. **Biggest risk** (one card — calm, specific)  
5. **Biggest opportunity** (one card — hope-forward)  
6. **Recommended next step** (primary CTA card)  
7. **What Mina sees** (transparency — why these conclusions)  
8. Optional: **Review or edit answers** link  

---

### Card content definitions

| Element | Purpose | Copy pattern |
|---------|---------|--------------|
| **Narrative summary** | Emotional mirror — the "understood" moment | 3–5 sentences, second person, names their situation + feeling + direction |
| **Pressure profile** | Structured reflection | Sources · Stress level · Pattern · Support style |
| **Recovery stage** | Orientation | Stage name + 1 sentence what it means + "This can change as you progress" |
| **Biggest risk** | Honest without panic | One specific risk from their answers — not generic doom |
| **Biggest opportunity** | Agency | One lever they still have (time, rights, clarity, options) |
| **Recommended next step** | Action | One primary action with feature deep link when signed in |
| **What Mina sees** | Trust / transparency | Bulleted "because you said X…" — no black box |

---

### Recommended next steps by stage (examples)

| Stage | Example primary next step |
|-------|---------------------------|
| Stabilize | "Take 10 minutes to list what's coming in and what's due this month — we'll build from there." |
| Understand | "Upload a letter or notice you received — Mina will explain it in plain language." |
| Protect | "If you have a deadline, let's identify it first — then choose a response that protects your rights." |
| Act | "Prepare for your next collector contact with a simple script and checklist." |
| Resolve | "Review your open situations and mark one you'd like to move toward closure." |
| Recover | "Set one small weekly check-in to track progress — momentum matters more than perfection." |

**Disclaimer (footer, all results screens):**  
*Mina provides educational guidance to help you think clearly under financial pressure. Mina is not a law firm, financial advisor, or debt settlement company.*

---

## Section 9: Wow Moment

This is the **exact example** a user in a common scenario should see. Copy may personalize names/types; structure stays consistent.

---

### Scenario inputs (example)

- Screen 1: **I received a letter or notice**  
- Situation: **Collections (unknown)** + **Credit card debt**  
- Severity: Letter yes (haven't opened it), collector contact a few times, not sued, unsure who is contacting them  
- State: **Ohio**  
- Stress: Emotional 4, Financial 3, Legal 3, Confidence 2  
- Pattern: **Freezer**  
- Support: **Step-by-step coach**  
- Goal: **Respond confidently**, **Avoid legal problems**  

---

### Example wow moment text

**Narrative summary (hero card):**

> You're dealing with collection pressure on credit debt — and you received a letter you haven't fully opened yet. That combination is unsettling, especially when you're not sure who is contacting you or what happens if you wait.
>
> You're not failing by feeling stuck. Many people freeze when the letters stack up. What you need first isn't a perfect plan — it's clarity about what that letter actually means and what you're allowed to do next.
>
> Based on what you shared, your most important move is to understand the notice before you respond to anyone.

---

**Pressure profile:**

| | |
|---|---|
| **What's weighing on you** | Unknown collector contact, unopened letter, credit debt |
| **Stress level** | High |
| **How you tend to respond** | Freezer — you pause when things feel unclear |
| **How Mina should coach you** | Step-by-step, calm pace, one action at a time |

---

**Recovery stage:** **Understand**

> You're in the **Understand** stage. Right now, information is protection — especially when you're not sure who is contacting you or what the letter requires.

---

**Biggest risk:**

> Time can matter once a formal notice arrives — even if you're not ready to open it yet. Waiting without knowing what's inside sometimes means missing a response window you didn't know existed.

*Not legal advice — Mina helps you see why timing may matter so you can decide your next move.*

---

**Biggest opportunity:**

> You reached out before reacting under pressure. That gives you a chance to read the letter carefully, verify whether the debt is being handled correctly, and respond from clarity — not fear.

---

**Recommended next step:**

> **Upload or photograph the letter when you're ready.** Mina will summarize it in plain language and flag anything time-sensitive — so you know exactly what you're facing.

**Primary CTA:** Save my profile and continue  
**Secondary:** Edit my answers  

---

**What Mina sees:**

- You received a letter but haven't opened it — uncertainty is driving stress  
- Collector contact has happened more than once — active pressure, not just worry  
- You're unsure who is contacting you — verification matters before payment or promises  
- You prefer step-by-step guidance — we'll keep actions small and clear  
- Your confidence is low right now — that's normal; clarity builds confidence  

---

**Intended user reaction:**  
*"She didn't judge me for not opening the letter. She told me exactly what to do next."*

---

## Section 10: Signup Handoff

Guests complete the full onboarding value **before** account creation. Signup saves progress — it does not gate the wow moment.

---

### Handoff screen structure

**Headline:** Save your Mina profile  
**Subline:** Create a free account to keep your analysis, recovery stage, and next steps — and continue when you're ready.

**Value recap (3 bullets max):**

- Your personalized pressure profile and recovery stage  
- Your recommended next step, saved to your dashboard  
- Private storage — edit or update anytime  

**Consents (required checkboxes):**

- I understand Mina provides guidance, not legal or financial advice  
- I agree to store my onboarding answers securely in my account  

**Primary CTA:** Create free account  
**Secondary:** Continue without account — *not offered in MVP; guest data expires in 7 days. Show muted note instead:* "Your progress is saved on this device for 7 days."

**Tertiary:** Already have an account? Log in  

---

### Encouragement without pressure

| Do | Don't |
|----|-------|
| Frame signup as **continuity** | "Sign up now or lose everything!" |
| Emphasize **free** and **private** | Imply payment is next |
| Allow **edit answers** before signup | Block results behind paywall |
| Mention **7-day guest expiry** calmly | Countdown timers |
| Connect to **one next step** on dashboard | Promise outcomes |

---

### Example handoff copy

> You've done the hard part — naming what's going on.  
>  
> A free account lets Mina remember your situation so you don't have to retell your story. Your dashboard will show your recovery stage and the one step we'd take first.  
>  
> No credit card. No obligation. You stay in control.

**Primary CTA:** Create my account  

---

### Post-signup (experience note)

1. Existing Phase 1 signup + email verification  
2. Guest payload transfers on first authenticated session  
3. Dashboard shows recovery stage + primary recommendation — not empty shell  
4. `profiles.state` populated; empty-state trigger default replaced  

---

## Flow summary (all screens)

| # | Screen | Section |
|---|--------|---------|
| 0 | Welcome | Pre-flow |
| 1 | What brought you here? | §2 |
| 2 | Situation type (+ follow-ups) | §3 |
| 3a–f | Severity questions | §4 |
| 4a–e | Financial snapshot | §5 |
| 5a–g | Stress + behavior + support + goals | §6 |
| — | Analysis loading interstitial | §8 |
| 6 | Narrative + results cards | §8 |
| 7 | Signup handoff | §10 |

**Estimated duration:** 5–8 minutes  
**Total question screens:** ~18–22 (one question at a time; follow-ups conditional)

---

## Alignment with architecture outputs

| Experience output | Database / layer |
|-------------------|------------------|
| All step answers | `onboarding_answers` |
| Pressure profile JSON | `onboarding_sessions.pressure_profile` → `stress_profiles` |
| Recovery path JSON | `onboarding_sessions.recovery_path` → `recovery_statuses` |
| Analysis JSON | `onboarding_sessions.analysis` |
| Debt categories + legal risk | `debt_profiles` |
| Behavior + support + goals | `memory_entries` (via Memory Service) |
| Primary next step | `dashboard_recommendations` |
| US state | `profiles.state` |

---

## Related documents

| Document | Role |
|----------|------|
| [MINA_ARCHITECTURE.md §5.1](./MINA_ARCHITECTURE.md) | Feature rules, guardrails, outputs |
| [MINA_DESIGN_SYSTEM.md §7](./MINA_DESIGN_SYSTEM.md) | Visual and interaction patterns |
| [PHASE_2_IMPLEMENTATION_PLAN.md](./PHASE_2_IMPLEMENTATION_PLAN.md) | Engineering scope and transfer |
| [FOUNDER_NOTES.md](./FOUNDER_NOTES.md) | Fear → Clarity → Action → Recovery |

---

**Mina V2 Onboarding Experience — v1.0.**  
Planning document only. Ready for Phase 2 implementation when approved.
