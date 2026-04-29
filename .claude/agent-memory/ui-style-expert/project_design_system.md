---
name: Design system tokens — READY CV
description: Color tokens, typography, spacing, and border radius from globals.css and pricing page patterns
type: project
---

## Color tokens (CSS custom properties, light mode)

- `--primary`: `oklch(0.45 0.18 255)` — indigo/violeta (botones principales, acentos)
- `--primary-foreground`: `oklch(0.985 0 0)` — blanco sobre primary
- `--background`: `oklch(0.985 0.005 220)` — fondo general (blanco azulado suave)
- `--foreground`: `oklch(0.145 0 0)` — texto principal
- `--muted-foreground`: `oklch(0.556 0 0)` — texto secundario/gris
- `--muted`: `oklch(0.97 0 0)` — fondos sutiles
- `--border`: `oklch(0.922 0 0)` — bordes de tarjeta
- `--card`: `oklch(1 0 0)` — fondo blanco puro en tarjetas
- `--destructive`: `oklch(0.577 0.245 27.325)` — rojo de error
- `--brand`: `#2a72d7` (azul branding secundario, no es --primary)

## Typography

- Font family: Plus Jakarta Sans (`--font-jakarta`) via `--font-sans` y `--font-heading`
- Monospace: ui-monospace / Cascadia Code / Source Code Pro

## Spacing & radius

- Base radius: `0.625rem` (10px)
- Tailwind radius scale via calc: `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`
- Spacing implícito: 8pt grid (multiples of 4 or 8 → clases de Tailwind: gap-4, gap-6, p-6, p-8, etc.)

## CSS framework

- Tailwind v4 con `@import "tailwindcss"` — **sin tailwind.config.ts/js**
- `@import "tw-animate-css"` — animaciones utilitarias disponibles
- `@import "shadcn/tailwind.css"` — shadcn tokens
- Dark mode via `@custom-variant dark (&:is(.dark *))`

## Patterns de pricing page

- Tarjetas con `rounded-2xl`, `border-2 border-border`, `p-8`
- Plan activo/destacado: fondo `bg-primary text-white`
- Badges: `text-xs px-2 py-0.5 rounded-full font-medium`
- Botones CTA: `rounded-xl px-5 py-2.5 text-sm font-medium`

**Why:** Proyecto Real READY CV (readycvv.com) — SaaS de CVs/cartas. Necesitamos coherencia visual entre checkout, pricing y dashboard.
**How to apply:** Siempre referenciar estos tokens antes de introducir colores o radios nuevos. El proyecto NO tiene shadcn `cn()` utility importado directamente — usar template literals o clsx si es necesario.
