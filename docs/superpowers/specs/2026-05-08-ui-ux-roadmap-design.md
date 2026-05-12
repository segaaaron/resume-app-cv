# ReadyCV — UI/UX Roadmap Design Spec

**Date:** 2026-05-08  
**Author:** Miguel Angel Saravia + Claude  
**Status:** Approved  

---

## Overview

Full UI/UX upgrade for ReadyCV SaaS. Strategy: Design System First → Marketing → Editor → Dashboard. Each phase gated by `readycvv-qa-senior` agent audit before advancing. No dark mode. Light mode only.

**Aesthetic:** Clean minimal premium — white/light-gray base + `#2563EB` bold accent for CTAs and AI moments. Reference: Stripe/Linear visual language. Plus Jakarta Sans (already installed).

**Scope:** Visual redesign + full architectural refactor (business logic separation, custom hooks, atomic components) across all areas.

---

## QA Gate Protocol

After each phase:
1. Spawn `readycvv-qa-senior` agent with phase-specific audit checklist
2. If **PASS** → proceed to next phase
3. If **BLOCKER found** → fix, re-audit, then proceed
4. Final report consolidates all 4 phase audits

---

## Phase 0 — Design System Foundation

### Goal
Establish single source of truth for all visual decisions. Every subsequent phase consumes these tokens — no phase re-invents them.

### Design Tokens (`app/globals.css`)

**Colors:**
```css
--brand: #2563EB;          /* Primary CTA, AI accents, active states */
--brand-50: #EFF6FF;
--brand-100: #DBEAFE;
--brand-600: #2563EB;
--brand-700: #1D4ED8;
--brand-900: #1E3A8A;

/* Neutrals — 9-level oklch scale */
--neutral-50:  oklch(0.985 0 0);
--neutral-100: oklch(0.960 0 0);
--neutral-200: oklch(0.922 0 0);
--neutral-300: oklch(0.870 0 0);
--neutral-400: oklch(0.708 0 0);
--neutral-500: oklch(0.556 0 0);
--neutral-600: oklch(0.439 0 0);
--neutral-700: oklch(0.371 0 0);
--neutral-800: oklch(0.269 0 0);
--neutral-900: oklch(0.145 0 0);

/* Semantic */
--success: #16A34A;
--warning: #D97706;
--error:   #DC2626;
--info:    #2563EB;
```

**Shadows (tinted, not gray):**
```css
--shadow-xs: 0 1px 2px rgba(37,99,235,0.04);
--shadow-sm: 0 1px 3px rgba(37,99,235,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 6px rgba(37,99,235,0.07), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg: 0 10px 15px rgba(37,99,235,0.08), 0 4px 6px rgba(0,0,0,0.05);
```

**Radius (fixed scale):**
```css
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
```

**Typography scale (Plus Jakarta Sans):**
- xs: 12px / 16px
- sm: 14px / 20px
- base: 16px / 24px
- lg: 18px / 28px
- xl: 20px / 28px
- 2xl: 24px / 32px
- 3xl: 32px / 40px
- 4xl: 40px / 48px
- 5xl: 48px / 56px

### Atomic Components to Upgrade (`components/ui/`)

**Button:**
- Variants: `primary` | `secondary` | `ghost` | `destructive` | `outline`
- Sizes: `sm` (32px) | `md` (40px) | `lg` (48px)
- States: default, hover (lift + shadow-sm), active, loading (spinner), disabled
- Loading state: replace text with spinner, keep width fixed

**Card:**
- Variants: `default` (white + border) | `elevated` (white + shadow-sm) | `interactive` (hover → shadow-md + slight translate-y)
- No border-radius changes mid-component

**Badge:**
- Variants: `filled` | `outline`
- Colors: brand | success | warning | error | neutral

**Input / Textarea:**
- Focus ring: `ring-2 ring-brand/20 border-brand`
- Error state: `border-error ring-error/20`
- Helper text slot below

### QA Gate 1 Checklist
- [ ] All tokens consistent across components
- [ ] Button loading states work
- [ ] No hardcoded color values outside globals.css
- [ ] Contrast ratios pass WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Components render identically in Chrome + Firefox + Safari

---

## Phase 1 — Marketing Redesign

### Goal
Premium first impression. Maximize conversion. Every section communicates value clearly.

### Navbar (`components/marketing/Navbar.tsx`)
- Sticky: `position: sticky top-0 z-50`
- Background: `bg-white/80 backdrop-blur-md border-b border-neutral-100`
- Layout: logo left | nav links center | locale switcher + CTA right
- CTA button: `primary` variant, "Empezar ahora" → `/register`
- Mobile: hamburger → full-screen drawer (Sheet component)
- No changes to locale switching logic

### Hero (`components/marketing/Hero.tsx`)
- Layout: 2-col split (copy left 55% | visual right 45%)
- Background: subtle mesh gradient (`radial-gradient` at top-right, brand-50 tint)
- Headline: 5xl font, bold, high contrast — no gradient text
- Subheadline: lg, neutral-500, max-w-prose
- CTAs: primary "Crear mi CV gratis" + ghost "Ver plantillas →"
- Visual right: static screenshot of editor (real product, not mockup)
- Social proof strip below fold: número real de usuarios desde DB vía `/api/stats/users-count`, fallback a número estático si falla

### FeatureCards (`components/marketing/FeatureCards.tsx`)
- Grid: 3-col desktop, 1-col mobile
- Each card: icon (brand-colored, 24px) + title + description
- Card variant: `interactive` (hover lift)
- Extract feature data to constant array — no inline data in JSX

### AIFeatures (`components/marketing/AIFeatures.tsx`)
- Alternating layout: feature left + screenshot right, next: screenshot left + feature right
- AI badge: `<Badge variant="filled" color="brand">IA</Badge>` on each
- Screenshot: real UI screenshots, not illustrations

### Pricing (`components/marketing/` or `app/[locale]/pricing/`)
- Single Pro card centered, max-w-md
- Toggle: mensual ($15) / anual ($144 = $12/mo, save 20%) — animated with CSS transition
- Feature list: checkmark icons (green), 8-10 items
- CTA: primary button full-width
- Guarantee text below: "Cancela cuando quieras"

### Footer (`components/marketing/Footer.tsx`)
- 3 columns: Producto | Legal | Empresa
- Bottom bar: copyright + locale switcher
- No heavy design — neutral-100 background, neutral-500 text

### File Structure (no merges, no new files unless needed)
All components keep their current file. Only internal restructure: extract data arrays to top of file as constants.

### QA Gate 2 Checklist
- [ ] Lighthouse Performance ≥ 85 on marketing pages
- [ ] Lighthouse Accessibility ≥ 90
- [ ] All CTAs route correctly
- [ ] Responsive: 375px / 768px / 1280px / 1440px
- [ ] No layout shift on scroll (sticky navbar)
- [ ] Toggle pricing works for both plans
- [ ] i18n: all strings in messages/es.json + messages/en.json

---

## Phase 2 — Editor Architecture + UI

### Goal
Break the 3039-line monolith. Separate concerns. Premium editor experience.

### TemplateSwitcher Decomposition

Current: `components/editor/TemplateSwitcher.tsx` (3039 lines — all logic + UI + data)

Target structure:
```
components/editor/template-switcher/
  ├── index.ts                      (re-exports TemplateSwitcher)
  ├── TemplateSwitcher.tsx          (~80-100L, orchestrator only)
  ├── TemplateCard.tsx              (single template card UI)
  ├── TemplateGrid.tsx              (grid layout + virtual scroll if needed)
  ├── TemplateFilter.tsx            (search input + category filter tabs)
  ├── template-data.ts             (PRO_IDS array + template metadata — source of truth)
  └── hooks/
      ├── useTemplateSwitcher.ts    (selection state, apply logic, modal state)
      └── useTemplatePreview.ts    (preview generation, adapt sections logic)
```

**Rules:**
- `TemplateSwitcher.tsx` only composes sub-components — no business logic
- `template-data.ts` is the single source of truth for `PRO_IDS` (remove duplicate in `templates/page.tsx`, import from here)
- Hooks handle all state + side effects — components are pure UI

### AI Panels — Hook Extraction

| Panel | New Hook | Responsibility |
|-------|----------|----------------|
| `AIProfileFillPanel.tsx` (521L) | `hooks/useAIProfileFill.ts` | API call, state, error |
| `ATSScorePanel.tsx` (530L) | `hooks/useATSScore.ts` | API call, score state, job desc |
| `CVReviewPanel.tsx` (297L) | `hooks/useCVReview.ts` | API call, suggestions state |

Each panel after extraction: pure UI consuming hook. Target ≤200L per panel.

### EditorLayout (`components/editor/EditorLayout.tsx`)

Current: 58L thin wrapper — needs to orchestrate the 3-panel layout properly.

New layout:
```
┌─────────────────────────────────────────────────┐
│  EditorTopBar (sticky)                          │
├──────┬──────────────────────┬───────────────────┤
│ Nav  │   FormPanel          │   PreviewPanel    │
│ Side │   (scrollable)       │   (sticky)        │
│ bar  │                      │                   │
│ (64px│   Content tabs:      │   CV preview      │
│ wide)│   Contenido/Diseño/  │   real-time       │
│      │   IA/ATS/Carta       │                   │
└──────┴──────────────────────┴───────────────────┘
```

- Nav sidebar: icon + label, 64px collapsed / 180px expanded (toggle)
- Preview panel: sticky, real-time, zoom controls
- Mobile: preview → FAB button → full-screen modal

### EditorTopBar (`components/editor/EditorTopBar.tsx`)

- Left: breadcrumb (Dashboard › CV Name)
- Center: CV title (editable inline — click to edit)
- Right: Download menu | Share button | Template switcher button
- Height: 56px
- Background: white + `border-b border-neutral-200`

### UpgradeModal (`components/editor/UpgradeModal.tsx`)
- Premium feel: large modal, gradient header (brand-600 → brand-700)
- Feature list with icons
- Price prominent: "$15/mes"
- CTA: "Activar Pro" → checkout flow

### QA Gate 3 Checklist
- [ ] TemplateSwitcher renders all templates correctly
- [ ] PRO_IDS sync: template-data.ts === templates/page.tsx (now imported, not duplicated)
- [ ] All AI panels: API calls work, error states show, off-topic returns 422 toast
- [ ] Editor 3-panel layout responsive (mobile preview modal works)
- [ ] Autosave still works after refactor
- [ ] Version history still works
- [ ] No regression in PDF export (PrintLayout untouched)
- [ ] No regression in Word export
- [ ] EditorContext hooks: all consumers still get correct values

---

## Phase 3 — Dashboard Refactor + UI

### Goal
Coherent, premium dashboard. Clear navigation. Data-first cards.

### DashboardNav (`components/dashboard/DashboardNav.tsx`)

Replace current navigation with left sidebar:
```
┌─────────────────────────────────────────────────┐
│  Logo                                           │
├─────┬───────────────────────────────────────────┤
│ Nav │  Content                                  │
│Side │                                           │
│     │                                           │
│CVs  │                                           │
│Cartas│                                          │
│Jobs │                                           │
│⚙️   │                                           │
└─────┴───────────────────────────────────────────┘
```
- Width: 240px desktop, collapsible to icons-only (48px) on tablet
- Active item: brand-50 background + brand-colored icon + bold text
- User avatar + name at bottom with settings link

### ResumesDashboard (`components/dashboard/ResumesDashboard.tsx`)

- Card grid: 3-col desktop, 2-col tablet, 1-col mobile
- Each CV card:
  - Thumbnail: miniature iframe usando el `ResumePreview` existente con `transform: scale(0.25)` + `pointer-events-none` (no screenshot — iframe ya funciona)
  - Template name badge
  - Last edited date
  - Action buttons: Edit | Duplicate | Delete (kebab menu)
  - Hover: card lifts + "Editar" overlay
- Empty state: illustration + CTA "Crear primer CV"

### CoverLettersDashboard (`components/dashboard/CoverLettersDashboard.tsx`)
- Same card pattern as Resumes for consistency
- Badge: carta template name
- Preview: first line of carta as preview text

### Kanban Board (`components/kanban/`)
- Columns: WISHLIST | APPLIED | INTERVIEW | OFFER | REJECTED
- Column header: color-coded left border + count badge
- Cards: company + role + date + status
- Drag-and-drop: smooth with visual placeholder
- Add card: inline at bottom of column

### SettingsForm (`components/dashboard/SettingsForm.tsx`)
Split 524L file into sections with clear visual hierarchy:
- Section: Perfil (nombre, foto, email)
- Section: Seguridad (cambiar contraseña)
- Section: Suscripción (plan actual, fecha renovación, manage)
- Section: Referidos (link, tier progress)
Each section: `<Card variant="default">` with `<h2>` heading

### ReferralCard (`components/dashboard/ReferralCard.tsx`)
- Progress bar: visual journey 0 → 3 → 5 → 10 referidos
- Current tier highlighted
- Copy link button prominent
- Reward at each tier clearly labeled

### QA Gate 4 Checklist
- [ ] DashboardNav: all routes work, active state correct
- [ ] ResumesDashboard: create/edit/delete/duplicate CVs work
- [ ] CoverLettersDashboard: same CRUD operations
- [ ] Kanban: drag-and-drop persists to DB
- [ ] SettingsForm: all form submissions work, no regressions
- [ ] ReferralCard: link copy works, tier display correct
- [ ] Responsive: all dashboard views work on 768px+
- [ ] Auth: protected routes still gated correctly

---

## Final Report Structure

After QA Gate 4 passes, generate professional report covering:

1. **Executive Summary** — what changed and why
2. **Design System** — tokens established, components upgraded
3. **Marketing** — sections redesigned, before/after delta
4. **Editor** — files created/removed, line count reduction, hooks extracted
5. **Dashboard** — components refactored, UX improvements
6. **QA Results** — all 4 gate audits: pass/fail items, fixes applied
7. **Architecture decisions** — key choices and rationale
8. **Remaining risks** — anything deferred or needing monitoring

---

## Constraints & Rules

- Zero hardcoded strings in components — all text via i18n (`messages/es.json` + `messages/en.json`)
- Zero dark mode code — light only
- Never duplicate `PRO_IDS` — single source in `template-data.ts`
- Never call `getOpenAI()` outside `lib/ai-client.ts`
- CSRF check on all new POST/PATCH/DELETE endpoints
- `fmtDesc()` always for job descriptions in templates
- No `prisma db push` — only migration files
- PDF/Print layout files (`PrintLayout.tsx`, `print-resume.css`) — do not touch unless explicitly scoped
