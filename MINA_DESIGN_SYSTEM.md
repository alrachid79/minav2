# Mina V2 Design System

**Official design direction for Mina V2.**

This document defines brand identity, visual language, and UI principles for all product surfaces. It complements [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md) (product behavior) and will guide Phase 2 onboarding and beyond.

**Status:** MVP foundation  
**Scope:** Web-first, mobile responsive  
**Do not treat this as a component library spec** — implementation uses these tokens and rules inline until a shared UI package is justified.

---

## 1. Brand identity

### Mission (design lens)

Mina helps people under financial pressure regain **clarity, confidence, and control**. Every screen should reduce fear before it asks for action.

Design supports the transformation loop:

```
Fear → Clarity → Action → Recovery
```

### Logo direction

**Logo Concept #1 — Hidden-path M**

| Attribute | Direction |
|-----------|-----------|
| **Symbol** | An “M” formed by a path that opens toward light — not a literal road, not a dollar sign |
| **Meaning** | Guidance, clarity, recovery — a way forward that was always there |
| **Usage** | Wordmark + symbol for app header; symbol alone for favicon and compact mobile |
| **Avoid** | Scales of justice, bank columns, chat bubbles, robot motifs, aggressive arrows |

The mark should feel **steady and human**, not corporate or clinical.

### Brand feeling

| We are | We are not |
|--------|------------|
| Calm confidence | Alarmist or urgent-by-default |
| Premium but human | Cold fintech or luxury bank |
| Warm and grounded | Generic AI assistant |
| Clear and supportive | Dense legal portal |
| Respectful of stress | Judgmental about debt |

**One-line test:** Would a stressed person feel *safer* after looking at this screen for five seconds?

---

## 2. Color system

All colors are semantic — use tokens by purpose, not decoration.

### Core palette

| Token | Hex | Role |
|-------|-----|------|
| **Primary — Midnight Navy** | `#0F172A` | Headers, primary buttons, key text on light backgrounds, app chrome |
| **Accent — Warm Gold** | `#D4A017` | Highlights, progress completion, positive emphasis, logo accent (sparingly) |
| **Accent — Soft Teal** | `#14B8A6` | Secondary actions, links, success-adjacent states, calm interactive focus |
| **Background** | `#F8FAFC` | Page background |
| **Surface — White** | `#FFFFFF` | Cards, modals, input fields |
| **Text — Dark** | `#111827` | Primary body and headings |
| **Text — Muted** | `#6B7280` | Secondary copy, labels, helper text |

### Semantic palette

| Token | Hex | Role |
|-------|-----|------|
| **Warning — Amber** | `#F59E0B` | Deadlines approaching, incomplete steps, non-legal cautions |
| **Critical — Red** | `#DC2626` | Legal attention, high-severity alerts — use rarely and with context |

### Color usage rules

1. **Midnight Navy** is the default primary — not pure black (`#000`).
2. **Warm Gold** never competes with critical red; gold = progress and warmth, not danger.
3. **Soft Teal** for links and secondary CTAs — avoids “bank blue” cliché.
4. **Background + white cards** create depth; avoid gray page + gray cards (flat, institutional).
5. **Critical Red** always appears with explanatory copy — never red-only panic UI.
6. **Warning Amber** for “pay attention” without “something is wrong with you.”
7. Dark mode is **not MVP** — design light-first; structure tokens so dark theme can be added later.

### CSS custom properties (reference)

```css
:root {
  --mina-navy: #0F172A;
  --mina-gold: #D4A017;
  --mina-teal: #14B8A6;
  --mina-amber: #F59E0B;
  --mina-red: #DC2626;
  --mina-bg: #F8FAFC;
  --mina-text: #111827;
  --mina-text-muted: #6B7280;
  --mina-white: #FFFFFF;
}
```

---

## 3. Typography

### MVP stack

| Use | Font | Fallback |
|-----|------|----------|
| **All UI** | [Inter](https://fonts.google.com/specimen/Inter) | system-ui, sans-serif |

Inter is loaded in the Next.js app via `next/font/google`. Use weights **400** (body), **500** (labels, buttons), **600** (headings), **700** (sparingly — hero only).

### Future (optional)

**Plus Jakarta Sans** may replace or pair with Inter for marketing and display headings post-MVP. Do not introduce until brand and logo assets are final.

### Type scale (mobile-first)

| Name | Size | Weight | Line height | Use |
|------|------|--------|-------------|-----|
| **Display** | 28px / 1.75rem | 600 | 1.25 | Welcome, major milestones |
| **Heading 1** | 24px / 1.5rem | 600 | 1.3 | Screen titles |
| **Heading 2** | 20px / 1.25rem | 600 | 1.35 | Section titles, card headers |
| **Heading 3** | 16px / 1rem | 600 | 1.4 | Subsections |
| **Body** | 16px / 1rem | 400 | 1.5 | Default copy — never below 16px on mobile |
| **Body small** | 14px / 0.875rem | 400 | 1.5 | Helper text, metadata |
| **Label** | 14px / 0.875rem | 500 | 1.4 | Form labels, chips |
| **Caption** | 12px / 0.75rem | 400 | 1.4 | Timestamps, legal footnotes |

### Typography rules

- **Sentence case** for headings and buttons — not ALL CAPS (except tiny legal labels if required).
- **Short line length** — max ~65 characters for body paragraphs on onboarding screens.
- **Calm copy** — plain language; avoid jargon (“creditor”, “validation”) without a brief explanation nearby.
- **No scary legal language without context** — if legal terms appear, pair with what it means for *this user right now*.

---

## 4. Layout and spacing

### Grid and breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| **Mobile** | < 640px | Single column, full-width cards, 16px horizontal padding |
| **Tablet** | 640–1024px | Single column, max content width 480px centered for onboarding |
| **Desktop** | > 1024px | Onboarding stays narrow (~480px); dashboard may use wider command center (~960px max) |

**Mobile-first:** Design and build for 375px width first, then scale up.

### Spacing scale (4px base)

| Token | Value | Use |
|-------|-------|-----|
| `xs` | 4px | Tight chip padding |
| `sm` | 8px | Icon gaps |
| `md` | 16px | Card padding (mobile), stack gaps |
| `lg` | 24px | Section separation |
| `xl` | 32px | Screen vertical rhythm |
| `2xl` | 48px | Welcome / hero breathing room |

### Containers

- **Onboarding:** centered column, `max-width: 480px`
- **Auth (login/signup):** same as onboarding — consistent narrow focus
- **Dashboard:** `max-width: 960px`, comfortable scanning width

---

## 5. UI principles

These apply to every screen in Mina V2.

### Core principles

| # | Principle | Implementation |
|---|-----------|----------------|
| 1 | **One clear primary action per screen** | One filled button (navy); secondary actions are outline or text |
| 2 | **Calm copy** | Reassuring, direct, never blame the user for their situation |
| 3 | **No scary legal language without context** | Explain impact before procedure |
| 4 | **No overwhelming dashboards** | Progressive disclosure; one primary recommendation |
| 5 | **Legal alerts visible but not panic-inducing** | Amber/red with icon + title + one sentence + action — no flashing, no full-screen red |
| 6 | **Mobile-first** | Touch targets ≥ 44px; thumb-reachable primary actions |
| 7 | **Rounded cards** | Consistent border radius (see Components) |
| 8 | **Soft shadows** | Elevation for cards, not harsh borders everywhere |
| 9 | **Clear hierarchy** | Size, weight, and color — not decoration — establish importance |

### Emotional tone by stress level

Aligns with architecture stress-adaptive copy (implementation in Phase 10; design for it now):

| User stress | Visual tone | Copy tone |
|-------------|-------------|-----------|
| **High** | More whitespace, fewer elements, slower progression | Short sentences, grounding language |
| **Medium** | Structured cards, clear steps | Organized, explanatory |
| **Low** | Action-oriented layout, progress visible | Forward-looking, milestone-focused |

### Accessibility baseline (MVP)

- Color contrast: WCAG AA minimum for text on backgrounds
- Never convey meaning by color alone — pair with icon or label
- Focus rings visible (teal or navy outline) on interactive elements
- Form errors: text + border, not color only

---

## 6. Components (visual spec — not code)

### Cards

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border radius | `12px` (`rounded-xl`) |
| Shadow | Soft: `0 1px 3px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)` |
| Border | Optional `1px solid rgba(15, 23, 42, 0.06)` on background `#F8FAFC` |
| Padding | 16px mobile / 20px desktop |

Use cards for: onboarding options, analysis results, dashboard widgets, alerts.

### Buttons

| Variant | Background | Text | Use |
|---------|------------|------|-----|
| **Primary** | `#0F172A` | `#FFFFFF` | One per screen — main forward action |
| **Secondary** | `#FFFFFF` border `#0F172A` | `#0F172A` | Alternate path |
| **Ghost / text** | transparent | `#14B8A6` or `#0F172A` | Back, skip, tertiary |
| **Destructive** | `#DC2626` | `#FFFFFF` | Rare — delete account, dismiss legal alert permanently |

| Property | Value |
|----------|-------|
| Height | 44px minimum |
| Border radius | `8px` |
| Font | 14–16px, weight 500 |

Disabled: 60% opacity, no pointer — never hide without explanation.

### Chips / selectors (onboarding)

| State | Style |
|-------|-------|
| Default | White card, muted border, dark text |
| Selected | Navy border or soft teal fill (`#14B8A6` at 10% opacity), navy text |
| Multi-select | Check indicator in teal |

Touch-friendly: min height 44px, generous horizontal padding.

### Progress bar (onboarding)

| Property | Value |
|----------|-------|
| Track | `#E5E7EB` or navy at 8% opacity |
| Fill | `#D4A017` (warm gold — progress feels achievement, not clinical) |
| Height | 4–6px |
| Label | “Step 3 of 7” in muted text above bar |

### Inputs

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border | `1px solid #E5E7EB`; focus `#14B8A6` |
| Border radius | `8px` |
| Height | 44px |
| Error | Amber border + red/amber helper text below |

### Alerts

| Severity | Background | Border | Icon color |
|----------|------------|--------|------------|
| **Info** | white | teal left border 3px | teal |
| **Warning** | `#FFFBEB` | amber | amber |
| **Legal attention** | `#FEF2F2` | red | red — always with calm headline |

Alert anatomy: **icon + title + one sentence + optional action link**. Never block the entire screen for non-blocking information.

---

## 7. Onboarding style

Onboarding is the **first moment of value** — coach-like, not form-like.

### Interaction model

| Rule | Detail |
|------|--------|
| **One question at a time** | Single focus per step; no multi-column forms |
| **Card/chip selections** | Prefer taps over typing; sliders for intensity |
| **Progress bar** | Always visible during questions |
| **Mina reflections** | Short interstitial copy between sections — warm, validating, 1–3 sentences |
| **Not a chat** | No message thread UI; structured steps only |
| **Duration** | Design for 5–8 minutes; show time estimate on welcome |

### Screen patterns

| Screen | Layout |
|--------|--------|
| **Welcome** | Display heading, short paragraph, single primary CTA, subtle Mina mark |
| **Question step** | Progress bar → H1 question → helper line → chips/cards → primary “Continue” |
| **Reflection** | Centered copy, soft card, single “Continue” — breathing room |
| **Results — analysis** | 6 structured cards in vertical stack; short narrative below |
| **Results — pressure** | Summary card with labeled rows (sources, intensity, pattern, support style) |
| **Results — recovery** | Stage badge (teal/gold accent) + numbered next steps |
| **Signup handoff** | Recap bullets, consent checkboxes, primary “Create account” |

### Onboarding color emphasis

- **Navy** for trust and primary actions  
- **Gold** for progress and completion moments  
- **Teal** for selected states and “Mina understands you” highlights  
- **Avoid red** during onboarding unless user explicitly flags legal crisis — even then, amber first  

### Copy voice (onboarding)

- “You’re not alone in this.”  
- “Here’s what we heard.”  
- “This is a common situation.”  
- Never: “You must act immediately.” without explaining why  

---

## 8. Dashboard style

The dashboard is a **command center** — calm home base, not a data dump.

### Layout principles

| Element | Rule |
|---------|------|
| **Primary next action** | One prominent card at top — title, reason, single CTA |
| **Legal alerts** | Pinned top only when active `legal_attention_events` exist — amber/red alert pattern, dismissible where architecture allows |
| **Recovery stage** | Visible badge or slim banner — current stage name, not a complex chart |
| **Quick actions** | Minimal — 3–4 icon+label max; no feature grid overload |
| **Secondary recommendations** | Below primary; visually quieter (smaller cards, muted headers) |
| **Timeline preview** | Optional strip — last few events, link to full timeline (Phase 6+) |

### Dashboard hierarchy (top to bottom)

1. Legal alert (conditional — only if needed)  
2. Greeting + recovery stage  
3. Primary recommendation  
4. Secondary recommendations (≤3)  
5. Quick actions  
6. Timeline preview / check-in (when built)  

### What the dashboard must not do

- Show every feature at once  
- Use red without a specific legal/deadline reason  
- Feel like a bank account overview (no fake balances, no credit-score aesthetic)  
- Feel like a legal case management portal (no docket numbers, no court dressings)  

### Phase 1 → Phase 2 shell transition

Phase 1 debug shell (email, profile id) will be replaced incrementally with design-system-aligned cards. Until Phase 10 intelligence ships, dashboard stays **sparse by design**.

---

## 9. Auth screens

Align login, signup, and verify-email with onboarding narrow column:

- Same max-width (480px), centered  
- Navy primary buttons  
- Mina wordmark or symbol at top  
- Muted helper text; errors in amber/red boxes with plain language  
- Consistent with Phase 1 implementation — refactor visuals when touching auth, not required before onboarding  

---

## 10. Iconography and imagery

### Icons

- Simple line icons (stroke 1.5–2px), rounded caps  
- Navy default; teal for interactive; semantic colors for alerts  
- Avoid: gavels, handcuffs, broken piggy banks, sad faces  

### Photography / illustration

- MVP: **minimal** — prefer typography and abstract mark  
- If illustrations added later: diverse, dignified, never depicting shame or poverty stereotypes  

---

## 11. Motion

Keep motion **subtle** — stressed users need stability.

| Use | Guideline |
|-----|-----------|
| Page transitions | None or simple fade 150–200ms |
| Progress bar | Smooth fill, no bounce |
| Card appear | Optional fade-up 200ms — never stagger more than 3 items |
| Avoid | Parallax, auto-playing animation, confetti, shake effects |

---

## 12. Logo and brand assets (checklist)

Assets to produce before marketing launch (not blocking MVP code):

- [ ] Hidden-path M symbol (SVG)  
- [ ] Mina wordmark + symbol (horizontal)  
- [ ] Favicon (symbol only)  
- [ ] OG image for sharing  

MVP may use text “Mina” in Inter 600 until logo SVG is ready.

---

## 13. Implementation notes for developers

When building UI (Phase 2+):

1. **Reference tokens** from Section 2 — avoid hardcoding one-off hex values.  
2. **Tailwind:** extend theme with Mina colors when centralizing config; until then, use CSS variables or documented hex consistently.  
3. **One primary button** — audit every screen before merge.  
4. **Onboarding and dashboard** follow Sections 7 and 8 — not generic admin templates.  
5. **Stress-adaptive layout** — structure components so copy/density can change later without redesign.  
6. **Do not** copy patterns from bank apps, legal SaaS, or ChatGPT-style chat UIs.  

---

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [MINA_ARCHITECTURE.md](./MINA_ARCHITECTURE.md) | Product behavior, emotional principles, feature rules |
| [PHASE_2_IMPLEMENTATION_PLAN.md](./PHASE_2_IMPLEMENTATION_PLAN.md) | Onboarding screens — apply this design system |
| [PHASE_1_STATUS.md](./PHASE_1_STATUS.md) | Current app uses minimal Tailwind — visual upgrade aligns here |
| [FOUNDER_NOTES.md](./FOUNDER_NOTES.md) | Fear → Clarity → Action → Recovery |

---

**Mina V2 Design System — v1.0 (MVP foundation).**  
Update this document when logo assets ship or Plus Jakarta Sans is adopted.
