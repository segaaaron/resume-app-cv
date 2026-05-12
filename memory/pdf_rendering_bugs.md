---
name: PDF Rendering State
description: Estado del sistema de PDF (Puppeteer), bugs resueltos y arquitectura del renderer
type: project
---

# PDF Rendering — Estado post-fix 2026-05-01

**Why:** Spike profundo reveló 3 bugs críticos + mejoras de seguridad/robustez. Todos implementados.

**How to apply:** Antes de tocar cualquier archivo PDF, leer este documento para no reintroducir bugs.

---

## Archivos clave

- `lib/pdf/renderers/resume.ts` — renderer principal (Puppeteer evaluate)
- `lib/pdf/print-helpers.ts` — viewport, fonts, goto helpers
- `lib/pdf/cookie-forwarder.ts` — forward sesión NextAuth a Chrome headless
- `lib/pdf/constants.ts` — constantes A4, timeouts
- `styles/print-resume.css` — CSS print global
- `app/api/resumes/[id]/pdf/route.ts` — endpoint con rate-limit

---

## Bugs resueltos (2026-05-01)

### Bug 1 — Padding/espacio arriba en página 2+
**Fix:** CSS: añadido `break-after: avoid` en `.resume-section-title` + `orphans: 3; widows: 3` en párrafos. JS: margin-top reset en elementos que caen en los primeros 8px de una página nueva (batch collect → batch apply para minimizar reflow).

### Bug 2 — Espacio blanco al final de la última hoja
**Fix:** Threshold bajado de 33% → 15%. Cuando NO se recorta, se fija la altura a exactamente `numPages * pagePx` (no `auto`) para que el sidebar llegue al borde. `FUDGE_PX = 4` absorbe redondeo subpíxel de zoom.

### Bug 3 — Sidebar de color no se repinta en página 2+
**Fix (sidebar gradient painter):** El renderer detecta el sidebar (primer hijo con backgroundColor sólido) y mueve su color al background del root como `linear-gradient`. Chrome pinta el background del root en cada página automáticamente.

---

## Reglas críticas del CSS (NO revertir)

- **NO tocar** `.resume-pages > div { min-height: 0; height: auto }` — fue eliminado intencionalmente. El JS gestiona el snapping exacto.
- `.resume-pages` (wrapper) sí tiene `min-height: 0; height: auto` — correcto.
- El JS en `resume.ts` aplica `height: N*pagePx` al root del template, NO al wrapper.

---

## Mejoras de seguridad/robustez implementadas

- **Cookie whitelist:** `cookie-forwarder.ts` solo reenvía cookies `next-auth.*`, `__Secure-next-auth.*`, `NEXT_LOCALE`. El resto se descarta.
- **Rate limit:** `/api/resumes/[id]/pdf` → `checkRateLimit(userId, "pdf-export", 20)` — 20/hr por usuario Pro.
- **Font timeout logging:** `waitForFonts` loggea si las fuentes no cargan en 3s.

---

## Bug pendiente (SIN RESOLVER)

Chrome flex bug en page boundary: cuando un entry de `.resume-entry` se corta exactamente en el boundary de página, el siguiente entry puede renderizarse en Y=0 de la siguiente página con texto superpuesto. `break-inside: avoid` mitiga pero no elimina completamente en todos los templates. Root cause: bug de Chrome en columnas flex + print. No hay workaround CSS puro conocido sin Paged.js.
