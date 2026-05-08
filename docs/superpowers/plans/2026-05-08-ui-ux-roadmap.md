# ReadyCV UI/UX Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full UI/UX upgrade across Design System → Marketing → Editor → Dashboard with a QA gate after each phase before advancing.

**Architecture:** Design System tokens established first in `globals.css`, then consumed by all subsequent phases. Editor monolith (`TemplateSwitcher.tsx` 3039L) decomposed into focused files under `components/editor/template-switcher/`. Business logic extracted into custom hooks. Dashboard navigation converted from top-bar to left sidebar.

**Tech Stack:** Next.js 15, Tailwind CSS v4, shadcn/ui (CVA), Plus Jakarta Sans, next-intl, Lucide icons, Zustand (resumeStore), readycvv-qa-senior agent for QA gates.

**Spec:** `docs/superpowers/specs/2026-05-08-ui-ux-roadmap-design.md`

**Branch:** `feature/UI_UX_New`

---

## File Map

### Phase 0 — Design System
| Action | File |
|--------|------|
| Modify | `app/globals.css` |
| Modify | `components/ui/button.tsx` |
| Modify | `components/ui/card.tsx` |
| Modify | `components/ui/badge.tsx` |
| Modify | `components/ui/input.tsx` |
| Modify | `components/ui/textarea.tsx` |

### Phase 1 — Marketing
| Action | File |
|--------|------|
| Create | `app/api/stats/users-count/route.ts` |
| Modify | `components/marketing/Navbar.tsx` |
| Modify | `components/marketing/Hero.tsx` |
| Modify | `components/marketing/FeatureCards.tsx` |
| Modify | `components/marketing/AIFeatures.tsx` |
| Modify | `app/[locale]/pricing/page.tsx` |
| Modify | `components/marketing/Footer.tsx` |
| Modify | `messages/es.json` |
| Modify | `messages/en.json` |

### Phase 2 — Editor Architecture + UI
| Action | File |
|--------|------|
| Create | `components/editor/template-switcher/template-data.ts` |
| Create | `components/editor/template-switcher/hooks/useTemplateSwitcher.ts` |
| Create | `components/editor/template-switcher/hooks/useTemplatePreview.ts` |
| Create | `components/editor/template-switcher/TemplateCard.tsx` |
| Create | `components/editor/template-switcher/TemplateFilter.tsx` |
| Create | `components/editor/template-switcher/TemplateGrid.tsx` |
| Create | `components/editor/template-switcher/TemplateSwitcher.tsx` |
| Create | `components/editor/template-switcher/index.ts` |
| Delete | `components/editor/TemplateSwitcher.tsx` |
| Create | `components/editor/hooks/useAIProfileFill.ts` |
| Create | `components/editor/hooks/useATSScore.ts` |
| Create | `components/editor/hooks/useCVReview.ts` |
| Modify | `components/editor/AIProfileFillPanel.tsx` |
| Modify | `components/editor/ATSScorePanel.tsx` |
| Modify | `components/editor/CVReviewPanel.tsx` |
| Modify | `components/editor/EditorLayout.tsx` |
| Modify | `components/editor/EditorTopBar.tsx` |
| Modify | `components/editor/UpgradeModal.tsx` |
| Modify | `app/[locale]/templates/page.tsx` |

### Phase 3 — Dashboard
| Action | File |
|--------|------|
| Modify | `components/dashboard/DashboardNav.tsx` |
| Modify | `app/[locale]/(dashboard)/layout.tsx` |
| Modify | `components/dashboard/ResumesDashboard.tsx` |
| Modify | `components/dashboard/CoverLettersDashboard.tsx` |
| Modify | `components/kanban/Board.tsx` (or equivalent) |
| Modify | `components/dashboard/SettingsForm.tsx` |
| Modify | `components/dashboard/ReferralCard.tsx` |

---

## PHASE 0 — Design System Foundation

---

### Task 0.1: Update Design Tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Read current globals.css to understand existing token structure**

Run: `head -120 app/globals.css`

- [ ] **Step 2: Replace `:root` color block with new design tokens**

In `app/globals.css`, replace the `:root { ... }` block variables with:

```css
:root {
  --background: oklch(0.985 0.005 220);
  --foreground: oklch(0.145 0 0);

  /* Brand */
  --brand: #2563EB;
  --brand-50: #EFF6FF;
  --brand-100: #DBEAFE;
  --brand-600: #2563EB;
  --brand-700: #1D4ED8;
  --brand-900: #1E3A8A;

  /* Neutrals */
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

  /* Shadcn tokens — map to new neutrals */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.45 0.2 264);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.45 0.2 264);
  --radius: 0.625rem;

  /* Shadows tinted with brand */
  --shadow-xs: 0 1px 2px rgba(37,99,235,0.04);
  --shadow-sm: 0 1px 3px rgba(37,99,235,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px rgba(37,99,235,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px rgba(37,99,235,0.08), 0 4px 6px rgba(0,0,0,0.05);

  /* Sidebar */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.45 0.2 264);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}
```

- [ ] **Step 3: Add utility classes after the `:root` block**

```css
/* Utility: brand shadows */
.shadow-brand-xs { box-shadow: var(--shadow-xs); }
.shadow-brand-sm { box-shadow: var(--shadow-sm); }
.shadow-brand-md { box-shadow: var(--shadow-md); }
.shadow-brand-lg { box-shadow: var(--shadow-lg); }
```

- [ ] **Step 4: Verify dev server starts without errors**

Run: `npm run dev`
Expected: no CSS parse errors in terminal.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "style: update design tokens — brand #2563EB, tinted shadows, neutral scale"
```

---

### Task 0.2: Add Loading State to Button

**Files:**
- Modify: `components/ui/button.tsx`

- [ ] **Step 1: Read current button.tsx**

Run: `cat components/ui/button.tsx`

- [ ] **Step 2: Add `isLoading` prop and spinner**

Replace the `ButtonProps` interface and `Button` component:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none cursor-pointer focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-brand-sm hover:bg-primary/90 hover:shadow-brand-md hover:-translate-y-px",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground hover:shadow-brand-xs",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-md px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-6 text-base",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            {children}
          </>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors related to button.tsx.

- [ ] **Step 4: Commit**

```bash
git add components/ui/button.tsx
git commit -m "feat(ui): add isLoading state and lift hover animation to Button"
```

---

### Task 0.3: Add Variants to Card

**Files:**
- Modify: `components/ui/card.tsx`

- [ ] **Step 1: Read current card.tsx**

Run: `cat components/ui/card.tsx`

- [ ] **Step 2: Add `variant` prop to Card**

Find the `Card` function and add variant support:

```tsx
type CardVariant = "default" | "elevated" | "interactive"

function Card({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  variant?: CardVariant
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        variant === "default" && "ring-1 ring-foreground/10",
        variant === "elevated" && "shadow-brand-sm border border-neutral-100",
        variant === "interactive" && "ring-1 ring-foreground/10 cursor-pointer transition-all duration-200 hover:shadow-brand-md hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/card.tsx
git commit -m "feat(ui): add elevated and interactive variants to Card"
```

---

### Task 0.4: Add Semantic Colors to Badge

**Files:**
- Modify: `components/ui/badge.tsx`

- [ ] **Step 1: Read current badge.tsx**

Run: `cat components/ui/badge.tsx`

- [ ] **Step 2: Add semantic variants to `badgeVariants`**

In the `variants.variant` object, add:

```tsx
variants: {
  variant: {
    default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
    destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive/20",
    outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
    ghost: "hover:bg-muted hover:text-muted-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    // Semantic additions
    success: "bg-green-50 text-green-700 border border-green-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    brand: "bg-blue-50 text-blue-700 border border-blue-200",
    info: "bg-blue-50 text-blue-600 border border-blue-100",
  },
},
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/badge.tsx
git commit -m "feat(ui): add success/warning/brand/info semantic variants to Badge"
```

---

### Task 0.5: Upgrade Input and Textarea Focus States

**Files:**
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/textarea.tsx`

- [ ] **Step 1: Read current input.tsx**

Run: `cat components/ui/input.tsx`

- [ ] **Step 2: Update Input className for brand focus ring**

Find the `className` in the `<input>` element and ensure it includes:

```tsx
className={cn(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  "focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB]",
  "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
  className
)}
```

- [ ] **Step 3: Apply same pattern to textarea.tsx**

Run: `cat components/ui/textarea.tsx`

Apply identical focus and error classes to the `<textarea>` element.

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/ui/input.tsx components/ui/textarea.tsx
git commit -m "feat(ui): brand-colored focus ring and error state for Input/Textarea"
```

---

### Task 0.6: QA Gate 1 — Design System Audit

- [ ] **Step 1: Spawn readycvv-qa-senior agent**

Dispatch `readycvv-qa-senior` agent with this prompt:

> "Audit Phase 0 Design System changes on branch `feature/UI_UX_New`. Checklist:
> 1. Verify all CSS tokens in `app/globals.css` are consistent — no hardcoded colors elsewhere in `components/ui/`
> 2. Test Button component: all variants render, isLoading shows spinner, disabled state works
> 3. Test Card variants: default/elevated/interactive render correctly
> 4. Test Badge semantic variants: success/warning/brand/info render with correct colors
> 5. Test Input/Textarea: focus ring is brand blue (#2563EB), error state shows red
> 6. Check contrast ratios — primary button text must pass WCAG AA (4.5:1)
> 7. Verify no TypeScript errors: `npx tsc --noEmit`
> Report: PASS or list of BLOCKERs."

- [ ] **Step 2: If PASS → proceed to Phase 1**

- [ ] **Step 3: If BLOCKER → fix reported issue, re-run audit**

---

## PHASE 1 — Marketing Redesign

---

### Task 1.1: Create Users Count API Endpoint

**Files:**
- Create: `app/api/stats/users-count/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const revalidate = 3600 // cache 1 hour

export async function GET() {
  try {
    const count = await prisma.user.count({
      where: { deletedAt: null },
    })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 1200 }) // static fallback
  }
}
```

- [ ] **Step 2: Verify route responds**

Run: `curl http://localhost:3000/api/stats/users-count`
Expected: `{"count": <number>}`

- [ ] **Step 3: Commit**

```bash
git add app/api/stats/users-count/route.ts
git commit -m "feat(api): add /api/stats/users-count endpoint with static fallback"
```

---

### Task 1.2: Redesign Navbar

**Files:**
- Modify: `components/marketing/Navbar.tsx`

- [ ] **Step 1: Read current Navbar.tsx**

Run: `cat components/marketing/Navbar.tsx`

- [ ] **Step 2: Update header element for backdrop-blur premium look**

Replace the `<header>` opening tag:

```tsx
// Before:
<header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">

// After:
<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 shadow-brand-xs">
```

- [ ] **Step 3: Update logo mark**

```tsx
// Replace logo Link:
<Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
  <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
    <FileText className="h-4 w-4 text-white" />
  </div>
  <span>ReadyCV</span>
</Link>
```

- [ ] **Step 4: Update desktop nav active state**

Replace the active link pattern to use a cleaner indicator:

```tsx
className={cn(
  "relative py-1 text-sm font-medium transition-colors hover:text-foreground",
  isActive(href)
    ? "text-foreground after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
    : "text-muted-foreground"
)}
```

- [ ] **Step 5: Update CTA buttons**

```tsx
// Ghost login button stays ghost
// Register button: add shadow
<Button asChild className="shadow-brand-sm">
  <Link href="/register">{t("register")}</Link>
</Button>
```

- [ ] **Step 6: Verify Navbar renders at http://localhost:3000**

Check: backdrop blur visible on scroll, logo updated, CTA has shadow.

- [ ] **Step 7: Commit**

```bash
git add components/marketing/Navbar.tsx
git commit -m "feat(marketing): premium Navbar — backdrop-blur, updated logo, brand CTA"
```

---

### Task 1.3: Redesign Hero

**Files:**
- Modify: `components/marketing/Hero.tsx`

- [ ] **Step 1: Read current Hero.tsx**

Run: `cat components/marketing/Hero.tsx`

- [ ] **Step 2: Replace Hero with split 2-col layout**

```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function Hero() {
  const t = await getTranslations("hero")

  // Fetch user count with fallback
  let userCount = 1200
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/stats/users-count`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      userCount = data.count
    }
  } catch { /* use fallback */ }

  const proofPoints = [
    t("proof_ats"),
    t("proof_pdf"),
    t("proof_ai"),
  ]

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Mesh gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 70% -10%, #EFF6FF 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-[55%_45%] items-center gap-12">
        {/* Left — copy */}
        <div>
          {/* Social proof pill */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-sm text-blue-700 font-medium mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            {userCount.toLocaleString()}+ {t("users_trust")}
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            {t("title")}{" "}
            <span className="text-primary">{t("title_highlight")}</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
            {t("subtitle")}
          </p>

          {/* Proof points */}
          <ul className="space-y-2 mb-10">
            {proofPoints.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {point}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gap-2 shadow-brand-md" asChild>
              <Link href="/register">
                {t("cta_primary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/templates">{t("cta_secondary")}</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">{t("cancel_anytime")}</p>
        </div>

        {/* Right — product visual */}
        <div className="relative hidden md:block">
          <div className="bg-white rounded-2xl shadow-brand-lg border border-neutral-100 overflow-hidden">
            <div className="bg-primary h-20 flex items-end px-6 pb-3">
              <div>
                <div className="h-4 bg-white/90 rounded w-40 mb-1.5" />
                <div className="h-2.5 bg-white/60 rounded w-24" />
              </div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-5">
              <div className="col-span-2 space-y-4">
                {[80, 100, 65].map((w, i) => (
                  <div key={i}>
                    <div className="h-2.5 bg-neutral-200 rounded mb-2" style={{ width: "35%" }} />
                    <div className="h-2 bg-neutral-100 rounded mb-1 w-full" />
                    <div className="h-2 bg-neutral-100 rounded" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[100, 80, 90, 70].map((w, i) => (
                  <div key={i} className="h-2 bg-neutral-100 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
          {/* Floating ATS badge */}
          <div className="absolute -left-6 bottom-8 bg-white shadow-brand-md border border-neutral-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-green-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ATS Score: 94%
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Add missing i18n keys to messages/es.json**

Add under `"hero"`:
```json
"users_trust": "profesionales confían en ReadyCV",
"proof_ats": "Compatible con sistemas ATS",
"proof_pdf": "Exporta a PDF en un clic",
"proof_ai": "Mejora tu CV con IA"
```

- [ ] **Step 4: Add same keys to messages/en.json**

```json
"users_trust": "professionals trust ReadyCV",
"proof_ats": "ATS-compatible templates",
"proof_pdf": "Export to PDF in one click",
"proof_ai": "Improve your CV with AI"
```

- [ ] **Step 5: Verify Hero at http://localhost:3000**

Check: split layout visible on desktop, gradient background present, social proof pill shows.

- [ ] **Step 6: Commit**

```bash
git add components/marketing/Hero.tsx messages/es.json messages/en.json
git commit -m "feat(marketing): Hero split 2-col layout with social proof and ATS badge"
```

---

### Task 1.4: Redesign FeatureCards

**Files:**
- Modify: `components/marketing/FeatureCards.tsx`

- [ ] **Step 1: Read current FeatureCards.tsx**

Run: `cat components/marketing/FeatureCards.tsx`

- [ ] **Step 2: Extract features data to constant and upgrade card layout**

```tsx
import { useTranslations } from "next-intl"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, FileDown, Target, Briefcase, FileText, Share2 } from "lucide-react"

const FEATURE_ICONS = [Sparkles, FileDown, Target, Briefcase, FileText, Share2]

export default function FeatureCards() {
  const t = useTranslations("features")

  // Keys must exist in messages/es.json and messages/en.json under "features"
  const featureKeys = ["ai_improve", "pdf_export", "ats_score", "kanban", "cover_letter", "public_cv"]

  return (
    <section className="py-24 px-4 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((key, i) => {
            const Icon = FEATURE_ICONS[i]
            return (
              <Card key={key} variant="interactive" className="p-6">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base text-foreground mb-2">{t(`${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`${key}.description`)}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Verify feature keys exist in messages/es.json under `"features"`**

Run: `grep -A 2 '"features"' messages/es.json | head -10`

Add any missing keys. Structure needed:
```json
"features": {
  "title": "Todo lo que necesitas",
  "subtitle": "...",
  "ai_improve": { "title": "IA para mejorar bullets", "description": "..." },
  "pdf_export": { "title": "Exporta a PDF", "description": "..." },
  ...
}
```

- [ ] **Step 4: Verify renders at http://localhost:3000**

- [ ] **Step 5: Commit**

```bash
git add components/marketing/FeatureCards.tsx messages/es.json messages/en.json
git commit -m "feat(marketing): FeatureCards — interactive cards, extracted data, icon grid"
```

---

### Task 1.5: Redesign AIFeatures

**Files:**
- Modify: `components/marketing/AIFeatures.tsx`

- [ ] **Step 1: Read current AIFeatures.tsx**

Run: `cat components/marketing/AIFeatures.tsx`

- [ ] **Step 2: Replace with alternating layout**

```tsx
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { Sparkles, Target, MessageSquare } from "lucide-react"

const AI_FEATURES = [
  { icon: Sparkles, key: "improve_bullet", flip: false },
  { icon: Target, key: "ats_score", flip: true },
  { icon: MessageSquare, key: "cover_letter", flip: false },
]

export default function AIFeatures() {
  const t = useTranslations("ai_features")

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto space-y-24">
        <div className="text-center mb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>

        {AI_FEATURES.map(({ icon: Icon, key, flip }) => (
          <div
            key={key}
            className={`grid md:grid-cols-2 gap-12 items-center ${flip ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            {/* Copy */}
            <div>
              <Badge variant="brand" className="mb-4 gap-1.5">
                <Icon className="h-3 w-3" />
                IA
              </Badge>
              <h3 className="text-2xl font-bold text-foreground mb-4">{t(`${key}.title`)}</h3>
              <p className="text-muted-foreground leading-relaxed">{t(`${key}.description`)}</p>
            </div>

            {/* Visual placeholder — real screenshot TBD */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl h-56 flex items-center justify-center text-muted-foreground text-sm">
              {t(`${key}.screenshot_alt`)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Add i18n keys under `"ai_features"` in both message files**

```json
"ai_features": {
  "title": "IA que trabaja contigo",
  "subtitle": "...",
  "improve_bullet": { "title": "...", "description": "...", "screenshot_alt": "Panel de mejora de bullets" },
  "ats_score": { "title": "...", "description": "...", "screenshot_alt": "Panel ATS Score" },
  "cover_letter": { "title": "...", "description": "...", "screenshot_alt": "Editor de carta" }
}
```

- [ ] **Step 4: Commit**

```bash
git add components/marketing/AIFeatures.tsx messages/es.json messages/en.json
git commit -m "feat(marketing): AIFeatures alternating layout with brand Badge"
```

---

### Task 1.6: Redesign Pricing Page

**Files:**
- Modify: `app/[locale]/pricing/page.tsx`

- [ ] **Step 1: Read current pricing page**

Run: `cat app/[locale]/pricing/page.tsx`

- [ ] **Step 2: Replace pricing card with premium single-card layout**

The key visual pattern (add to the existing page structure, keeping server-side logic intact):

```tsx
{/* Monthly/Annual toggle */}
<div className="flex items-center justify-center gap-3 mb-10">
  <span className={cn("text-sm font-medium", !annual && "text-foreground", annual && "text-muted-foreground")}>
    {t("monthly")}
  </span>
  <button
    onClick={() => setAnnual(!annual)}
    className={cn(
      "relative h-6 w-11 rounded-full transition-colors duration-200",
      annual ? "bg-primary" : "bg-neutral-300"
    )}
  >
    <span className={cn(
      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
      annual && "translate-x-5"
    )} />
  </button>
  <span className={cn("text-sm font-medium flex items-center gap-1.5", annual && "text-foreground", !annual && "text-muted-foreground")}>
    {t("annual")}
    <Badge variant="success" className="text-xs">{t("save_percent")}</Badge>
  </span>
</div>

{/* Pro card */}
<div className="max-w-md mx-auto">
  <div className="bg-white rounded-2xl shadow-brand-lg border border-neutral-200 overflow-hidden">
    <div className="bg-primary px-8 py-6 text-white">
      <div className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-1">Pro</div>
      <div className="flex items-end gap-1">
        <span className="text-5xl font-bold">${annual ? "12" : "15"}</span>
        <span className="text-lg opacity-70 mb-1">/mes</span>
      </div>
      {annual && <p className="text-sm opacity-70 mt-1">{t("billed_annual", { total: "144" })}</p>}
    </div>
    <div className="px-8 py-6">
      <ul className="space-y-3 mb-8">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <PricingButtons plan={annual ? "annual" : "monthly"} />
      <p className="text-center text-xs text-muted-foreground mt-4">{t("cancel_anytime")}</p>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add i18n keys for new strings**

- [ ] **Step 4: Verify toggle works and pricing renders**

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/pricing/page.tsx messages/es.json messages/en.json
git commit -m "feat(marketing): Pricing page — premium card, animated toggle, Pro header"
```

---

### Task 1.7: Redesign Footer

**Files:**
- Modify: `components/marketing/Footer.tsx`

- [ ] **Step 1: Read current Footer.tsx**

Run: `cat components/marketing/Footer.tsx`

- [ ] **Step 2: Replace with clean 3-col footer**

```tsx
import Link from "next/link"
import { FileText } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import LocaleSwitcher from "./LocaleSwitcher"

export default function Footer() {
  const t = useTranslations("footer")
  const locale = useLocale()

  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-foreground mb-3">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              ReadyCV
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("tagline")}</p>
          </div>

          {/* Producto */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">{t("product")}</h4>
            <ul className="space-y-3">
              {[
                { label: t("templates"), href: `/${locale}/templates` },
                { label: t("pricing"), href: `/${locale}/pricing` },
                { label: t("blog"), href: `/${locale}/blog` },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">{t("legal")}</h4>
            <ul className="space-y-3">
              {[
                { label: t("privacy"), href: `/${locale}/privacy` },
                { label: t("terms"), href: `/${locale}/terms` },
                { label: t("cookies"), href: `/${locale}/cookie-policy` },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{t("copyright", { year: new Date().getFullYear() })}</p>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Add footer i18n keys to both message files**

- [ ] **Step 4: Commit**

```bash
git add components/marketing/Footer.tsx messages/es.json messages/en.json
git commit -m "feat(marketing): Footer 3-col layout with brand logo and locale switcher"
```

---

### Task 1.8: QA Gate 2 — Marketing Audit

- [ ] **Step 1: Spawn readycvv-qa-senior agent**

> "Audit Phase 1 Marketing Redesign on branch `feature/UI_UX_New`. Checklist:
> 1. Verify Navbar: sticky, backdrop-blur visible, CTA routes to /register, mobile hamburger works
> 2. Verify Hero: 2-col split on desktop, social proof pill shows user count, both CTAs route correctly
> 3. Verify FeatureCards: 3-col grid desktop, 1-col mobile, interactive hover works
> 4. Verify AIFeatures: alternating layout, Badge shows, renders on mobile
> 5. Verify Pricing: toggle switches monthly/annual price, CTA buttons work
> 6. Verify Footer: 3 cols, all links route correctly, LocaleSwitcher present
> 7. i18n: switch locale via LocaleSwitcher — all text translates, no missing keys
> 8. Run Lighthouse on / and /pricing — Performance ≥ 85, Accessibility ≥ 90
> 9. No console errors in browser devtools
> Report: PASS or list of BLOCKERs."

- [ ] **Step 2: If PASS → proceed to Phase 2**

- [ ] **Step 3: If BLOCKER → fix, re-run audit**

---

## PHASE 2 — Editor Architecture + UI

---

### Task 2.1: Extract template-data.ts

**Files:**
- Create: `components/editor/template-switcher/template-data.ts`

- [ ] **Step 1: Read TemplateSwitcher.tsx to find PRO_IDS and template metadata**

Run: `grep -n "PRO_IDS\|const TEMPLATES\|templateId\|export" components/editor/TemplateSwitcher.tsx | head -40`

- [ ] **Step 2: Create template-data.ts with extracted data**

Create `components/editor/template-switcher/template-data.ts`:

```typescript
// Single source of truth for template IDs and Pro access.
// Previously duplicated in: TemplateSwitcher.tsx + app/[locale]/templates/page.tsx

// Copy the exact PRO_IDS array from TemplateSwitcher.tsx line ~2533
export const PRO_IDS: string[] = [
  // paste exact array from TemplateSwitcher.tsx
]

export type TemplateCategory =
  | "classic"
  | "modern"
  | "creative"
  | "minimal"
  | "executive"
  | "tech"
  | "academic"
  | "legal"
  | "health"
  | "hospitality"

export interface TemplateMetadata {
  id: string
  category: TemplateCategory
  layout: "single-column" | "sidebar-left" | "sidebar-right"
}

// Extract TEMPLATES metadata array from TemplateSwitcher.tsx
// (id, category, layout fields only — no render code)
export const TEMPLATE_METADATA: TemplateMetadata[] = [
  // paste/derive from existing data in TemplateSwitcher.tsx
]

export function isProTemplate(templateId: string): boolean {
  return PRO_IDS.includes(templateId)
}
```

- [ ] **Step 3: Verify PRO_IDS matches source**

Run: `grep -c "PRO_IDS" components/editor/TemplateSwitcher.tsx`
Compare count in template-data.ts vs original.

- [ ] **Step 4: Commit**

```bash
git add components/editor/template-switcher/template-data.ts
git commit -m "refactor(editor): extract PRO_IDS and template metadata to template-data.ts"
```

---

### Task 2.2: Create useTemplateSwitcher Hook

**Files:**
- Create: `components/editor/template-switcher/hooks/useTemplateSwitcher.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client"

import { useState, useCallback } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { isProTemplate } from "../template-data"
import { useEditorPro } from "@/components/editor/EditorContext"

export function useTemplateSwitcher() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [confirmTemplate, setConfirmTemplate] = useState<string | null>(null)

  const currentTemplateId = useResumeStore((s) => s.config.templateId)
  const setTemplateWithAdapt = useResumeStore((s) => s.setTemplateWithAdapt)
  const { isPro, openUpgrade } = useEditorPro()

  const handleSelectTemplate = useCallback((templateId: string) => {
    if (isProTemplate(templateId) && !isPro) {
      openUpgrade()
      return
    }
    if (templateId === currentTemplateId) return
    setConfirmTemplate(templateId)
  }, [isPro, openUpgrade, currentTemplateId])

  const confirmSwitch = useCallback(() => {
    if (!confirmTemplate) return
    setTemplateWithAdapt(confirmTemplate)
    setConfirmTemplate(null)
  }, [confirmTemplate, setTemplateWithAdapt])

  const cancelSwitch = useCallback(() => {
    setConfirmTemplate(null)
  }, [])

  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    currentTemplateId,
    confirmTemplate,
    handleSelectTemplate,
    confirmSwitch,
    cancelSwitch,
  }
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep "template-switcher"` 
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/editor/template-switcher/hooks/useTemplateSwitcher.ts
git commit -m "refactor(editor): extract useTemplateSwitcher hook with selection + Pro gate logic"
```

---

### Task 2.3: Create useTemplatePreview Hook

**Files:**
- Create: `components/editor/template-switcher/hooks/useTemplatePreview.ts`

- [ ] **Step 1: Identify preview logic in TemplateSwitcher.tsx**

Run: `grep -n "preview\|adapt\|section" components/editor/TemplateSwitcher.tsx | head -30`

- [ ] **Step 2: Create the hook**

```typescript
"use client"

import { useMemo } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { TEMPLATE_METADATA } from "../template-data"

export function useTemplatePreview(templateId: string) {
  const sectionData = useResumeStore((s) => s.sectionData)
  const config = useResumeStore((s) => s.config)

  const metadata = useMemo(
    () => TEMPLATE_METADATA.find((t) => t.id === templateId),
    [templateId]
  )

  const layout = metadata?.layout ?? "single-column"
  const category = metadata?.category ?? "classic"

  return { layout, category, sectionData, config }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/editor/template-switcher/hooks/useTemplatePreview.ts
git commit -m "refactor(editor): extract useTemplatePreview hook"
```

---

### Task 2.4: Create TemplateCard Component

**Files:**
- Create: `components/editor/template-switcher/TemplateCard.tsx`

- [ ] **Step 1: Extract the template card UI from TemplateSwitcher.tsx**

Run: `grep -n "TemplateCard\|templateCard\|card.*template\|template.*card" components/editor/TemplateSwitcher.tsx | head -20`

- [ ] **Step 2: Create TemplateCard.tsx**

```tsx
"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Crown, Check } from "lucide-react"
import { isProTemplate } from "./template-data"

interface TemplateCardProps {
  templateId: string
  label: string
  isSelected: boolean
  isPro: boolean
  thumbnail: React.ReactNode
  onSelect: (templateId: string) => void
}

export function TemplateCard({ templateId, label, isSelected, isPro, thumbnail, onSelect }: TemplateCardProps) {
  const requiresPro = isProTemplate(templateId)
  const locked = requiresPro && !isPro

  return (
    <button
      onClick={() => onSelect(templateId)}
      className={cn(
        "group relative w-full rounded-xl border-2 overflow-hidden transition-all duration-200 text-left",
        isSelected
          ? "border-primary shadow-brand-md"
          : "border-transparent hover:border-neutral-300 hover:shadow-brand-sm"
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-neutral-50 overflow-hidden relative">
        {thumbnail}
        {locked && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <Crown className="h-6 w-6 text-primary" />
          </div>
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Label */}
      <div className="px-2 py-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground truncate">{label}</span>
        {requiresPro && (
          <Badge variant="brand" className="text-[10px] h-4 px-1">Pro</Badge>
        )}
      </div>
    </button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/editor/template-switcher/TemplateCard.tsx
git commit -m "refactor(editor): create TemplateCard — pure UI, Pro lock overlay"
```

---

### Task 2.5: Create TemplateFilter Component

**Files:**
- Create: `components/editor/template-switcher/TemplateFilter.tsx`

- [ ] **Step 1: Create TemplateFilter.tsx**

```tsx
"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import type { TemplateCategory } from "./template-data"

const CATEGORIES: Array<{ value: "all" | TemplateCategory; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "classic", label: "Clásico" },
  { value: "modern", label: "Moderno" },
  { value: "creative", label: "Creativo" },
  { value: "minimal", label: "Minimalista" },
  { value: "executive", label: "Ejecutivo" },
  { value: "tech", label: "Tech" },
  { value: "academic", label: "Académico" },
]

interface TemplateFilterProps {
  search: string
  selectedCategory: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
}

export function TemplateFilter({ search, selectedCategory, onSearchChange, onCategoryChange }: TemplateFilterProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar plantilla..."
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onCategoryChange(value)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              selectedCategory === value
                ? "bg-primary text-primary-foreground"
                : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/editor/template-switcher/TemplateFilter.tsx
git commit -m "refactor(editor): create TemplateFilter — search + category pills"
```

---

### Task 2.6: Create TemplateGrid Component

**Files:**
- Create: `components/editor/template-switcher/TemplateGrid.tsx`

- [ ] **Step 1: Create TemplateGrid.tsx**

```tsx
"use client"

import { useMemo } from "react"
import { TemplateCard } from "./TemplateCard"
import { TEMPLATE_METADATA, isProTemplate } from "./template-data"

interface TemplateGridProps {
  search: string
  selectedCategory: string
  currentTemplateId: string
  isPro: boolean
  onSelect: (templateId: string) => void
  renderThumbnail: (templateId: string) => React.ReactNode
}

export function TemplateGrid({
  search,
  selectedCategory,
  currentTemplateId,
  isPro,
  onSelect,
  renderThumbnail,
}: TemplateGridProps) {
  const filtered = useMemo(() => {
    return TEMPLATE_METADATA.filter((t) => {
      const matchesSearch = search.length < 2 || t.id.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory === "all" || t.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory])

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        No hay plantillas con esos filtros.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {filtered.map((t) => (
        <TemplateCard
          key={t.id}
          templateId={t.id}
          label={t.id}
          isSelected={t.id === currentTemplateId}
          isPro={isPro}
          thumbnail={renderThumbnail(t.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/editor/template-switcher/TemplateGrid.tsx
git commit -m "refactor(editor): create TemplateGrid with search/category filtering"
```

---

### Task 2.7: Create TemplateSwitcher Orchestrator

**Files:**
- Create: `components/editor/template-switcher/TemplateSwitcher.tsx`

- [ ] **Step 1: Read original TemplateSwitcher to understand the render thumbnail logic**

Run: `grep -n "renderThumb\|svgThumb\|SingleColumn\|SidebarResume" components/editor/TemplateSwitcher.tsx | head -20`

- [ ] **Step 2: Create thin orchestrator**

```tsx
"use client"

import { useTemplateSwitcher } from "./hooks/useTemplateSwitcher"
import { TemplateFilter } from "./TemplateFilter"
import { TemplateGrid } from "./TemplateGrid"
import { TemplateSwitchModal } from "@/components/editor/TemplateSwitchModal"
import { useEditorPro } from "@/components/editor/EditorContext"

// Import thumbnail renderers from original file until full migration
// These are the SVG thumbnail functions extracted from TemplateSwitcher.tsx
import { renderTemplateThumbnail } from "./template-data"

export default function TemplateSwitcher() {
  const { isPro } = useEditorPro()
  const {
    search, setSearch,
    selectedCategory, setSelectedCategory,
    currentTemplateId,
    confirmTemplate,
    handleSelectTemplate,
    confirmSwitch,
    cancelSwitch,
  } = useTemplateSwitcher()

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-hidden">
      <TemplateFilter
        search={search}
        selectedCategory={selectedCategory}
        onSearchChange={setSearch}
        onCategoryChange={setSelectedCategory}
      />

      <div className="flex-1 overflow-y-auto">
        <TemplateGrid
          search={search}
          selectedCategory={selectedCategory}
          currentTemplateId={currentTemplateId}
          isPro={isPro}
          onSelect={handleSelectTemplate}
          renderThumbnail={renderTemplateThumbnail}
        />
      </div>

      {confirmTemplate && (
        <TemplateSwitchModal
          templateId={confirmTemplate}
          onConfirm={confirmSwitch}
          onCancel={cancelSwitch}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add `renderTemplateThumbnail` export to template-data.ts**

In `template-data.ts`, add:
```typescript
// Thumbnail renderer — maps templateId to SVG thumbnail ReactNode
// Extract the SVG thumbnail components from the original TemplateSwitcher.tsx
export function renderTemplateThumbnail(templateId: string): React.ReactNode {
  // Implementation: move SVG thumb components here from TemplateSwitcher.tsx
  // Return appropriate SVG based on templateId pattern
}
```

- [ ] **Step 4: Commit**

```bash
git add components/editor/template-switcher/TemplateSwitcher.tsx
git commit -m "refactor(editor): create thin TemplateSwitcher orchestrator (~80L)"
```

---

### Task 2.8: Create index.ts and Wire Up

**Files:**
- Create: `components/editor/template-switcher/index.ts`

- [ ] **Step 1: Create barrel export**

```typescript
export { default } from "./TemplateSwitcher"
export { PRO_IDS, isProTemplate, TEMPLATE_METADATA } from "./template-data"
```

- [ ] **Step 2: Update all imports that referenced the old TemplateSwitcher**

Run: `grep -rn "editor/TemplateSwitcher" --include="*.tsx" --include="*.ts" .`

Update each import to use: `@/components/editor/template-switcher`

- [ ] **Step 3: Update app/[locale]/templates/page.tsx to import PRO_IDS from template-data**

```typescript
// Before:
// const PRO_IDS = [...] // local duplicate

// After:
import { PRO_IDS } from "@/components/editor/template-switcher"
```

- [ ] **Step 4: Delete old TemplateSwitcher.tsx**

```bash
rm components/editor/TemplateSwitcher.tsx
```

- [ ] **Step 5: Verify TypeScript — no import errors**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: no errors.

- [ ] **Step 6: Verify editor loads and templates display**

Open editor, open template switcher → all templates visible, Pro lock works.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(editor): complete TemplateSwitcher decomposition — 3039L → 6 focused files"
```

---

### Task 2.9: Extract useAIProfileFill + Refactor Panel

**Files:**
- Create: `components/editor/hooks/useAIProfileFill.ts`
- Modify: `components/editor/AIProfileFillPanel.tsx`

- [ ] **Step 1: Read current AIProfileFillPanel.tsx to identify state and API calls**

Run: `grep -n "useState\|useCallback\|fetch\|api\|async" components/editor/AIProfileFillPanel.tsx | head -30`

- [ ] **Step 2: Create hook with all state + API logic**

```typescript
"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { checkRateLimit } from "@/lib/rate-limit-client"

interface AIProfileFillResult {
  summary?: string
  jobTitle?: string
  suggestedSkills?: string[]
  workExperienceUpdates?: unknown[]
  workExperienceNew?: unknown[]
  educationUpdates?: unknown[]
}

export function useAIProfileFill(resumeId: string) {
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIProfileFillResult | null>(null)

  const generate = useCallback(async () => {
    if (!description.trim() || description.length < 20) {
      toast.error("Describe tu perfil con al menos 20 caracteres.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/ai/fill-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, description }),
      })
      if (res.status === 422) {
        toast.error("El texto no parece estar relacionado con tu perfil profesional.")
        return
      }
      if (!res.ok) throw new Error("API error")
      const data = await res.json()
      setResult(data)
    } catch {
      toast.error("Error generando sugerencias. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [description, resumeId])

  const reset = useCallback(() => {
    setResult(null)
    setDescription("")
  }, [])

  return { description, setDescription, loading, result, generate, reset }
}
```

- [ ] **Step 3: Refactor AIProfileFillPanel.tsx to consume the hook**

Replace all local `useState`/`useCallback`/`fetch` in the panel with:
```tsx
const { description, setDescription, loading, result, generate, reset } = useAIProfileFill(resumeId)
```

Target: AIProfileFillPanel.tsx ≤ 200 lines.

- [ ] **Step 4: Verify panel still works end-to-end**

Open editor → AI tab → "Ayúdate con la IA" → enter text → Generate.

- [ ] **Step 5: Commit**

```bash
git add components/editor/hooks/useAIProfileFill.ts components/editor/AIProfileFillPanel.tsx
git commit -m "refactor(editor): extract useAIProfileFill hook, AIProfileFillPanel → pure UI"
```

---

### Task 2.10: Extract useATSScore + Refactor Panel

**Files:**
- Create: `components/editor/hooks/useATSScore.ts`
- Modify: `components/editor/ATSScorePanel.tsx`

- [ ] **Step 1: Read ATSScorePanel.tsx to identify state and API calls**

Run: `grep -n "useState\|useCallback\|fetch\|api\|async" components/editor/ATSScorePanel.tsx | head -30`

- [ ] **Step 2: Create hook**

```typescript
"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface ATSScoreResult {
  label: string
  score?: number
  matches?: string[]
  missing?: string[]
  suggestions?: string[]
}

export function useATSScore(resumeId: string) {
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ATSScoreResult | null>(null)

  const analyze = useCallback(async () => {
    if (!jobDescription.trim()) {
      toast.error("Pega la descripción completa del puesto.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/ai/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobDescription }),
      })
      if (res.status === 422) {
        toast.error("El texto no parece ser una oferta de trabajo.")
        return
      }
      if (!res.ok) throw new Error("API error")
      const data = await res.json()
      if (data.label === "off_topic") {
        toast.error("El texto no parece ser una oferta de trabajo.")
        return
      }
      setResult(data)
    } catch {
      toast.error("Error analizando. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [jobDescription, resumeId])

  const reset = useCallback(() => {
    setResult(null)
    setJobDescription("")
  }, [])

  return { jobDescription, setJobDescription, loading, result, analyze, reset }
}
```

- [ ] **Step 3: Refactor ATSScorePanel.tsx**

Replace local state/API calls with `useATSScore(resumeId)`.
Target: ATSScorePanel.tsx ≤ 200 lines.

- [ ] **Step 4: Verify ATS panel works**

Open editor → ATS tab → paste job description → Analyze.

- [ ] **Step 5: Commit**

```bash
git add components/editor/hooks/useATSScore.ts components/editor/ATSScorePanel.tsx
git commit -m "refactor(editor): extract useATSScore hook, ATSScorePanel → pure UI"
```

---

### Task 2.11: Extract useCVReview + Refactor Panel

**Files:**
- Create: `components/editor/hooks/useCVReview.ts`
- Modify: `components/editor/CVReviewPanel.tsx`

- [ ] **Step 1: Identify state/API in CVReviewPanel.tsx**

Run: `grep -n "useState\|useCallback\|fetch\|api\|async" components/editor/CVReviewPanel.tsx | head -20`

- [ ] **Step 2: Create hook**

```typescript
"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface CVReviewResult {
  summary: string
  strengths: Array<{ text: string; suggestion?: string }>
  improvements: Array<{ text: string; suggestion?: string }>
  answer: string
}

export function useCVReview(resumeId: string) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CVReviewResult | null>(null)

  const review = useCallback(async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/ai/review-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, question }),
      })
      if (res.status === 422) {
        toast.error("Pregunta sobre tu CV o carrera profesional.")
        return
      }
      if (!res.ok) throw new Error("API error")
      const data = await res.json()
      if (data.answer === "off_topic") {
        toast.error("Pregunta sobre tu CV o carrera profesional.")
        return
      }
      setResult(data)
    } catch {
      toast.error("Error revisando CV. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [question, resumeId])

  const reset = useCallback(() => {
    setResult(null)
    setQuestion("")
  }, [])

  return { question, setQuestion, loading, result, review, reset }
}
```

- [ ] **Step 3: Refactor CVReviewPanel.tsx to ≤150 lines**

- [ ] **Step 4: Verify CV review works end-to-end**

- [ ] **Step 5: Commit**

```bash
git add components/editor/hooks/useCVReview.ts components/editor/CVReviewPanel.tsx
git commit -m "refactor(editor): extract useCVReview hook, CVReviewPanel → pure UI"
```

---

### Task 2.12: Redesign EditorLayout — 3-Panel + Nav Sidebar

**Files:**
- Modify: `components/editor/EditorLayout.tsx`

- [ ] **Step 1: Read current EditorLayout.tsx**

Run: `cat components/editor/EditorLayout.tsx`

- [ ] **Step 2: Add EditorNavSidebar component inline (or as new small file)**

Create `components/editor/EditorNavSidebar.tsx`:

```tsx
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { FileText, Palette, Sparkles, Target, Mail, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

const NAV_ITEMS = [
  { id: "content", icon: FileText, labelKey: "content" },
  { id: "design", icon: Palette, labelKey: "design" },
  { id: "ai", icon: Sparkles, labelKey: "ai" },
  { id: "ats", icon: Target, labelKey: "ats" },
  { id: "cover", icon: Mail, labelKey: "cover" },
]

interface EditorNavSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function EditorNavSidebar({ activeTab, onTabChange }: EditorNavSidebarProps) {
  const [expanded, setExpanded] = useState(true)
  const t = useTranslations("editor.nav")

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-neutral-200 bg-white transition-all duration-200 shrink-0",
        expanded ? "w-44" : "w-14"
      )}
    >
      <div className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ id, icon: Icon, labelKey }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === id
                ? "bg-blue-50 text-primary"
                : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {expanded && <span className="truncate">{t(labelKey)}</span>}
          </button>
        ))}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="p-3 border-t border-neutral-100 text-muted-foreground hover:text-foreground flex justify-center"
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
      </button>
    </aside>
  )
}
```

- [ ] **Step 3: Update EditorLayout.tsx to use 3-panel structure**

```tsx
export default function EditorLayout({ ... }: Props) {
  const [activeTab, setActiveTab] = useState("content")
  // ... existing init logic unchanged ...

  return (
    <EditorProvider isPro={hasAccess}>
      <div className="h-screen flex flex-col overflow-hidden bg-neutral-50">
        <EditorTopBar hasAccess={hasAccess} />
        <div className="flex flex-1 overflow-hidden">
          <EditorNavSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <FormPanel activeTab={activeTab} />
          <PreviewPanel
            plan={plan}
            subscriptionStatus={subscriptionStatus}
            subscriptionEndsAt={subscriptionEndsAt}
            role={role}
          />
        </div>
      </div>
    </EditorProvider>
  )
}
```

- [ ] **Step 4: Update FormPanel to accept activeTab prop**

```tsx
// In FormPanel.tsx, add:
interface FormPanelProps { activeTab?: string }
export default function FormPanel({ activeTab = "content" }: FormPanelProps) { ... }
```

- [ ] **Step 5: Add i18n keys under `"editor.nav"` in both message files**

```json
"editor": {
  "nav": {
    "content": "Contenido",
    "design": "Diseño",
    "ai": "IA",
    "ats": "ATS",
    "cover": "Carta"
  }
}
```

- [ ] **Step 6: Verify editor loads with 3-panel layout**

Open editor: left sidebar with nav, center form, right preview.

- [ ] **Step 7: Commit**

```bash
git add components/editor/EditorLayout.tsx components/editor/EditorNavSidebar.tsx components/editor/FormPanel.tsx messages/es.json messages/en.json
git commit -m "feat(editor): 3-panel layout with collapsible EditorNavSidebar"
```

---

### Task 2.13: Redesign EditorTopBar

**Files:**
- Modify: `components/editor/EditorTopBar.tsx`

- [ ] **Step 1: Read current EditorTopBar.tsx**

Run: `cat components/editor/EditorTopBar.tsx`

- [ ] **Step 2: Update TopBar to premium layout**

Key changes:
- Height: ensure `h-14` (56px)
- Background: `bg-white border-b border-neutral-200`
- Left: breadcrumb `Dashboard › {title}`
- Center: editable title (keep existing logic)
- Right: Download + Share + Template buttons with shadow on primary CTA

```tsx
// Update the outer element:
<div className="h-14 bg-white border-b border-neutral-200 flex items-center px-4 gap-4 shrink-0">

  {/* Left: breadcrumb */}
  <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
    <Link href="/dashboard/resumes" className="hover:text-foreground transition-colors">
      Dashboard
    </Link>
    <span>/</span>
    {/* existing title edit logic here */}
  </div>

  <div className="flex-1" />

  {/* Right: actions */}
  <div className="flex items-center gap-2">
    {/* keep existing download menu, share button */}
    {/* ensure primary button uses shadow-brand-sm */}
  </div>
</div>
```

- [ ] **Step 3: Verify TopBar renders correctly**

- [ ] **Step 4: Commit**

```bash
git add components/editor/EditorTopBar.tsx
git commit -m "feat(editor): EditorTopBar — breadcrumb, premium layout, h-14"
```

---

### Task 2.14: Redesign UpgradeModal

**Files:**
- Modify: `components/editor/UpgradeModal.tsx`

- [ ] **Step 1: Read current UpgradeModal.tsx**

Run: `cat components/editor/UpgradeModal.tsx`

- [ ] **Step 2: Update modal to premium feel**

```tsx
// Key changes to the Dialog content:
<DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
  {/* Gradient header */}
  <div className="bg-gradient-to-br from-primary to-[#1D4ED8] px-8 py-8 text-white">
    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
      <Crown className="h-5 w-5 text-white" />
    </div>
    <h2 className="text-2xl font-bold mb-1">{t("title")}</h2>
    <p className="text-blue-100 text-sm">{t("subtitle")}</p>
  </div>

  {/* Features + CTA */}
  <div className="px-8 py-6">
    <div className="text-3xl font-bold text-foreground mb-1">
      $15<span className="text-lg font-normal text-muted-foreground">/mes</span>
    </div>
    <p className="text-xs text-muted-foreground mb-6">{t("or_annual")}</p>

    <ul className="space-y-2.5 mb-6">
      {UPGRADE_FEATURES.map((f) => (
        <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          {f}
        </li>
      ))}
    </ul>

    <Button className="w-full shadow-brand-md" size="lg" asChild>
      <Link href="/checkout?plan=monthly">{t("cta")}</Link>
    </Button>
    <p className="text-center text-xs text-muted-foreground mt-3">{t("cancel_anytime")}</p>
  </div>
</DialogContent>
```

- [ ] **Step 3: Verify modal opens via openUpgrade() and routes to checkout**

- [ ] **Step 4: Commit**

```bash
git add components/editor/UpgradeModal.tsx
git commit -m "feat(editor): UpgradeModal — gradient header, premium price display"
```

---

### Task 2.15: QA Gate 3 — Editor Audit

- [ ] **Step 1: Spawn readycvv-qa-senior agent**

> "Audit Phase 2 Editor Architecture + UI on branch `feature/UI_UX_New`. Checklist:
> 1. TemplateSwitcher: all templates render, Pro templates show Crown lock for free users, selecting a template shows TemplateSwitchModal, confirming applies the template
> 2. PRO_IDS: verify `template-data.ts` is imported by `app/[locale]/templates/page.tsx` — no duplicate array
> 3. AI panels: AIProfileFillPanel — fill profile generates results; ATSScorePanel — paste job desc gets score; CVReviewPanel — question gets review
> 4. All AI panels: off-topic input returns toast error (422 handling)
> 5. Rate limiting: 21st AI request in same hour returns error toast
> 6. Editor 3-panel layout: EditorNavSidebar visible, tabs switch content in FormPanel
> 7. EditorNavSidebar collapse/expand toggle works
> 8. Autosave: edit a field, wait 2s — check network tab for save request
> 9. Version history: save multiple versions, restore one — content changes
> 10. PDF export: download PDF — check it renders correctly (no regression)
> 11. UpgradeModal: trigger as free user → modal shows, CTA routes to /checkout
> 12. `npx tsc --noEmit` — zero errors
> Report: PASS or list of BLOCKERs."

- [ ] **Step 2: If PASS → proceed to Phase 3**

- [ ] **Step 3: If BLOCKER → fix, re-run audit**

---

## PHASE 3 — Dashboard Refactor + UI

---

### Task 3.1: Redesign DashboardNav — Left Sidebar

**Files:**
- Modify: `components/dashboard/DashboardNav.tsx`
- Modify: `app/[locale]/(dashboard)/layout.tsx`

- [ ] **Step 1: Read current DashboardNav.tsx and dashboard layout**

Run: `cat components/dashboard/DashboardNav.tsx && cat app/[locale]/\(dashboard\)/layout.tsx`

- [ ] **Step 2: Replace top-nav with left sidebar in DashboardNav.tsx**

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { FileText, Mail, Briefcase, Settings, LogOut, Shield, ChevronLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
}

export default function DashboardNav({ user }: Props) {
  const pathname = usePathname()
  const t = useTranslations("dashboard.nav")
  const locale = useLocale()

  const tabs = [
    { label: t("cvs"),     href: `/${locale}/dashboard/resumes`,       icon: FileText },
    { label: t("letters"), href: `/${locale}/dashboard/cover-letters`, icon: Mail },
    { label: t("jobs"),    href: `/${locale}/dashboard/applications`,  icon: Briefcase },
    ...(user.role === "SUPER_ADMIN"
      ? [{ label: t("admin"), href: `/${locale}/dashboard/admin`, icon: Shield }]
      : []),
  ]

  const isActive = (href: string) =>
    pathname.startsWith(`/${locale}/dashboard/${href.split("/dashboard/")[1]}`)

  return (
    <aside className="w-56 shrink-0 h-full bg-white border-r border-neutral-200 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-neutral-100">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <Link href={`/${locale}`} className="font-bold text-foreground">ReadyCV</Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {tabs.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-blue-50 text-primary"
                : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-neutral-100 p-3 space-y-1">
        <Link
          href={`/${locale}/dashboard/settings`}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          {t("settings")}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </button>
        <div className="flex items-center gap-2.5 px-3 pt-2 mt-1 border-t border-neutral-100">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-xs">{user.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Update dashboard layout to flex-row**

In `app/[locale]/(dashboard)/layout.tsx`, ensure layout is:
```tsx
<div className="h-screen flex overflow-hidden">
  <DashboardNav user={...} />
  <main className="flex-1 overflow-y-auto bg-neutral-50">
    {children}
  </main>
</div>
```

- [ ] **Step 4: Add missing i18n keys: `"jobs"`, `"settings"`, `"logout"` under `"dashboard.nav"`**

- [ ] **Step 5: Verify dashboard layout at /dashboard/resumes**

Left sidebar visible, active item highlighted, routes work.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/DashboardNav.tsx app/[locale]/\(dashboard\)/layout.tsx messages/es.json messages/en.json
git commit -m "feat(dashboard): DashboardNav converted to left sidebar with user footer"
```

---

### Task 3.2: Redesign ResumesDashboard — Card Grid

**Files:**
- Modify: `components/dashboard/ResumesDashboard.tsx`

- [ ] **Step 1: Read current ResumesDashboard.tsx**

Run: `cat components/dashboard/ResumesDashboard.tsx`

- [ ] **Step 2: Replace list with card grid — keep all existing logic, only change UI**

Replace the resume list rendering with:

```tsx
{/* Welcome banner (keep existing logic) */}

{/* Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
  {/* Create new card */}
  <button
    onClick={handleCreate}
    disabled={creating}
    className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white hover:border-primary hover:bg-blue-50 transition-all duration-200 aspect-[3/4] text-muted-foreground hover:text-primary"
  >
    {creating ? (
      <Loader2 className="h-6 w-6 animate-spin" />
    ) : (
      <>
        <Plus className="h-8 w-8 mb-2" />
        <span className="text-sm font-medium">{t("new_cv")}</span>
      </>
    )}
  </button>

  {/* CV cards */}
  {resumes.map((resume) => (
    <div
      key={resume.id}
      className="group relative bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-brand-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Thumbnail — scaled ResumePreview */}
      <Link href={`/${locale}/editor/${resume.id}`} className="block aspect-[3/4] relative overflow-hidden bg-neutral-50">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transform: "scale(0.25)", transformOrigin: "top left", width: "400%", height: "400%" }}
        >
          {/* Placeholder — add ResumePreview here if perf allows, else static thumbnail */}
          <div className="bg-white h-full w-full" />
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white font-medium text-sm">{t("edit")}</span>
        </div>
      </Link>

      {/* Card footer */}
      <div className="p-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{resume.title}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(resume.updatedAt), "d MMM yyyy", { locale: dateLocale })}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-lg text-muted-foreground hover:bg-neutral-100 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/${locale}/editor/${resume.id}`)}>
              <Pencil className="h-4 w-4 mr-2" />{t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(resume.id)}>
              <Copy className="h-4 w-4 mr-2" />{t("duplicate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteId(resume.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />{t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  ))}
</div>
```

- [ ] **Step 3: Verify grid renders — create, edit, duplicate, delete all work**

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/ResumesDashboard.tsx
git commit -m "feat(dashboard): ResumesDashboard card grid with thumbnail hover overlay"
```

---

### Task 3.3: Redesign CoverLettersDashboard

**Files:**
- Modify: `components/dashboard/CoverLettersDashboard.tsx`

- [ ] **Step 1: Read current CoverLettersDashboard.tsx**

Run: `cat components/dashboard/CoverLettersDashboard.tsx`

- [ ] **Step 2: Apply same card grid pattern as ResumesDashboard**

Replace the list/grid rendering with the same card pattern:
- `aspect-[3/4]` card
- Preview: first 100 chars of cover letter body as preview text (not iframe)
- Same DropdownMenu actions: Edit | Duplicate | Delete
- Same hover overlay: "Editar"

- [ ] **Step 3: Verify CRUD operations work**

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/CoverLettersDashboard.tsx
git commit -m "feat(dashboard): CoverLettersDashboard card grid matching CV card pattern"
```

---

### Task 3.4: Redesign Kanban Board

**Files:**
- Modify: `components/kanban/Board.tsx` (or the main kanban component)

- [ ] **Step 1: Find main kanban file**

Run: `ls components/kanban/`

- [ ] **Step 2: Update column headers with color-coded left border**

```tsx
const COLUMN_STYLES: Record<string, string> = {
  WISHLIST:  "border-l-blue-400",
  APPLIED:   "border-l-yellow-400",
  INTERVIEW: "border-l-purple-400",
  OFFER:     "border-l-green-400",
  REJECTED:  "border-l-red-400",
}

// Column header:
<div className={cn("border-l-4 pl-3 flex items-center justify-between mb-4", COLUMN_STYLES[column.status])}>
  <h3 className="font-semibold text-sm text-foreground">{t(`status.${column.status.toLowerCase()}`)}</h3>
  <span className="text-xs bg-neutral-100 text-muted-foreground px-2 py-0.5 rounded-full font-medium">
    {column.cards.length}
  </span>
</div>
```

- [ ] **Step 3: Update kanban cards to clean style**

```tsx
<div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-brand-xs hover:shadow-brand-sm transition-all cursor-grab active:cursor-grabbing">
  <p className="font-medium text-sm text-foreground">{card.position}</p>
  <p className="text-xs text-muted-foreground mt-0.5">{card.company}</p>
  {card.appliedAt && (
    <p className="text-[10px] text-muted-foreground/70 mt-2">
      {format(new Date(card.appliedAt), "d MMM", { locale: dateLocale })}
    </p>
  )}
</div>
```

- [ ] **Step 4: Verify drag-and-drop still persists to DB**

Drag a card to a different column → reload page → card still in new column.

- [ ] **Step 5: Commit**

```bash
git add components/kanban/
git commit -m "feat(dashboard): Kanban — color-coded column borders, clean card style"
```

---

### Task 3.5: Refactor SettingsForm — Sectioned Layout

**Files:**
- Modify: `components/dashboard/SettingsForm.tsx`

- [ ] **Step 1: Read current SettingsForm.tsx structure**

Run: `grep -n "section\|<div\|<form\|<h" components/dashboard/SettingsForm.tsx | head -40`

- [ ] **Step 2: Wrap each logical group in Card sections**

Maintain all existing form logic (validation, submit handlers). Only change the wrapping structure:

```tsx
// Profile section
<Card variant="default" className="p-6">
  <h2 className="text-base font-semibold text-foreground mb-6 pb-4 border-b border-neutral-100">
    {t("profile.title")}
  </h2>
  {/* existing profile fields */}
</Card>

// Security section
<Card variant="default" className="p-6">
  <h2 className="text-base font-semibold text-foreground mb-6 pb-4 border-b border-neutral-100">
    {t("security.title")}
  </h2>
  {/* existing password fields */}
</Card>

// Subscription section
<Card variant="default" className="p-6">
  <h2 className="text-base font-semibold text-foreground mb-6 pb-4 border-b border-neutral-100">
    {t("subscription.title")}
  </h2>
  {/* existing subscription info */}
</Card>
```

Wrap all sections in: `<div className="max-w-2xl mx-auto px-6 py-8 space-y-6">`

- [ ] **Step 3: Verify all form submissions still work**

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/SettingsForm.tsx
git commit -m "feat(dashboard): SettingsForm sectioned into Card components"
```

---

### Task 3.6: Redesign ReferralCard

**Files:**
- Modify: `components/dashboard/ReferralCard.tsx`

- [ ] **Step 1: Read current ReferralCard.tsx**

Run: `cat components/dashboard/ReferralCard.tsx`

- [ ] **Step 2: Update progress visualization**

```tsx
const TIERS = [
  { threshold: 3,  reward: "30% comisión", label: "Bronce" },
  { threshold: 5,  reward: "50% comisión", label: "Plata" },
  { threshold: 10, reward: "100% comisión", label: "Oro" },
]

// Progress bar toward next tier:
const nextTier = TIERS.find((t) => referralCount < t.threshold)
const prevThreshold = nextTier
  ? TIERS[TIERS.indexOf(nextTier) - 1]?.threshold ?? 0
  : TIERS[TIERS.length - 1].threshold
const progress = nextTier
  ? ((referralCount - prevThreshold) / (nextTier.threshold - prevThreshold)) * 100
  : 100

// Visual:
<div>
  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
    <span>{referralCount} referidos</span>
    <span>{nextTier ? `${nextTier.threshold - referralCount} para ${nextTier.label}` : "¡Tier máximo!"}</span>
  </div>
  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
    <div
      className="h-full bg-primary rounded-full transition-all duration-500"
      style={{ width: `${Math.min(progress, 100)}%` }}
    />
  </div>
</div>

{/* Tier milestones */}
<div className="flex justify-between mt-4">
  {TIERS.map((tier) => (
    <div
      key={tier.threshold}
      className={cn(
        "flex flex-col items-center gap-1 text-xs",
        referralCount >= tier.threshold ? "text-primary font-semibold" : "text-muted-foreground"
      )}
    >
      <div className={cn(
        "h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
        referralCount >= tier.threshold
          ? "border-primary bg-primary text-white"
          : "border-neutral-300 bg-white"
      )}>
        {tier.threshold}
      </div>
      <span>{tier.label}</span>
      <span className="text-[10px]">{tier.reward}</span>
    </div>
  ))}
</div>
```

- [ ] **Step 3: Verify copy-link button still works**

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/ReferralCard.tsx
git commit -m "feat(dashboard): ReferralCard — progress bar, tier milestones, visual journey"
```

---

### Task 3.7: QA Gate 4 — Dashboard Audit

- [ ] **Step 1: Spawn readycvv-qa-senior agent**

> "Audit Phase 3 Dashboard Refactor + UI on branch `feature/UI_UX_New`. Checklist:
> 1. DashboardNav: left sidebar visible, active state highlights correct tab, all routes navigate correctly, settings and logout work, user avatar shows
> 2. ResumesDashboard: grid renders, Create new CV works, Edit opens editor, Duplicate creates copy, Delete shows confirmation then deletes, empty state shows when no CVs
> 3. CoverLettersDashboard: same CRUD operations as resumes
> 4. Kanban: drag card to different column → page reload → card persists in new column; column count badges update; color-coded borders visible
> 5. SettingsForm: profile save works, password change works, subscription section shows plan info
> 6. ReferralCard: copy-link button copies to clipboard, progress bar reflects actual referral count, tiers highlighted correctly
> 7. Responsive: dashboard works at 768px (sidebar may collapse), 1280px, 1440px
> 8. Auth: /dashboard routes redirect to login when unauthenticated
> 9. No console errors in browser devtools
> 10. `npx tsc --noEmit` — zero errors
> Report: PASS or list of BLOCKERs."

- [ ] **Step 2: If PASS → proceed to Final Report**

- [ ] **Step 3: If BLOCKER → fix, re-run audit**

---

## PHASE FINAL — Professional Report

---

### Task 4.1: Generate Final Report

- [ ] **Step 1: Collect metrics from all phases**

Run these commands and save output:

```bash
# Line count comparison
echo "=== EDITOR LINE COUNTS ===" && wc -l \
  components/editor/template-switcher/*.tsx \
  components/editor/template-switcher/hooks/*.ts \
  components/editor/hooks/*.ts \
  components/editor/AIProfileFillPanel.tsx \
  components/editor/ATSScorePanel.tsx \
  components/editor/CVReviewPanel.tsx

# Files created vs deleted
git diff --stat feature/UI_UX_New..origin/develop 2>/dev/null || git diff --stat HEAD~20..HEAD --name-only

# Commit count
git log --oneline feature/UI_UX_New ^origin/develop 2>/dev/null | wc -l
```

- [ ] **Step 2: Write report to `docs/superpowers/reports/2026-05-08-ui-ux-roadmap-report.md`**

Report structure:
```markdown
# ReadyCV UI/UX Roadmap — Final Report
Date: 2026-05-08

## Executive Summary
[What changed and why. 3-5 sentences.]

## Phase 0 — Design System
- Tokens: [list what was added/changed]
- Components upgraded: Button (isLoading), Card (3 variants), Badge (4 semantic), Input/Textarea
- Impact: consistent visual language across all subsequent phases

## Phase 1 — Marketing
- Components redesigned: [list]
- Key improvements: [list]
- i18n keys added: [count]

## Phase 2 — Editor Architecture
| Metric | Before | After |
|--------|--------|-------|
| TemplateSwitcher.tsx | 3039L | ~90L orchestrator |
| Total editor files | N | N+8 |
| AI panel avg lines | ~450L | <200L |
| Custom hooks created | 0 | 5 |

## Phase 3 — Dashboard
- DashboardNav: top-bar → left sidebar
- Components refactored: [list]

## QA Results
### Gate 1 — Design System
[PASS / issues found + fixed]

### Gate 2 — Marketing
[PASS / issues found + fixed]

### Gate 3 — Editor
[PASS / issues found + fixed]

### Gate 4 — Dashboard
[PASS / issues found + fixed]

## Architecture Decisions
- Design System First: [rationale]
- Single PRO_IDS source: [rationale]
- Custom hooks for AI panels: [rationale]
- Left sidebar dashboard: [rationale]

## Remaining Risks
- [anything deferred or needing monitoring]
```

- [ ] **Step 3: Commit report**

```bash
git add -f docs/superpowers/reports/2026-05-08-ui-ux-roadmap-report.md
git commit -m "docs: add UI/UX roadmap final report"
```

- [ ] **Step 4: Create PR to develop branch**

```bash
gh pr create \
  --title "feat: UI/UX Premium Roadmap — Design System + Marketing + Editor + Dashboard" \
  --base develop \
  --body "$(cat <<'EOF'
## Summary
- Phase 0: Design System tokens, upgraded Button/Card/Badge/Input
- Phase 1: Marketing redesign — Hero split layout, Navbar blur, Pricing card, Footer
- Phase 2: Editor architecture — TemplateSwitcher 3039L → 6 files, 5 custom hooks, 3-panel layout
- Phase 3: Dashboard — left sidebar nav, card grids, Kanban visual, sectioned Settings

## QA
4 readycvv-qa-senior audits passed — one per phase.

## Test plan
- [ ] Smoke test editor: create CV, switch template, use AI panel, export PDF
- [ ] Smoke test marketing: visit /, /pricing, /templates — all render
- [ ] Smoke test dashboard: create/edit/delete CV, drag kanban card, save settings

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Constraints Reminder

- Zero hardcoded strings — always `useTranslations()` or `getTranslations()`
- Never call `getOpenAI()` outside `lib/ai-client.ts`
- CSRF on any new POST/PATCH/DELETE endpoint
- `fmtDesc()` always for job descriptions in templates
- No `prisma db push` — only migration files
- `PrintLayout.tsx` and `print-resume.css` — do not touch
- PRO_IDS: single source in `template-data.ts` only
