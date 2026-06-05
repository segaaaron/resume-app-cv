---
name: PDF Microservice — Arquitectura y Estado
description: Arquitectura del microservicio pdf-generator (services/pdf-generator/), bugs resueltos, invariantes críticos y reglas de testing. Leer antes de tocar cualquier archivo del microservicio.
type: project
---

# PDF Microservice — Estado post-refactor 2026-06-04

**Rama:** `pdf-microservice`  
**Ruta:** `services/pdf-generator/`  
**Regla:** Nunca modificar esta carpeta desde la rama `develop`. Ver AGENTS.md.

---

## Arquitectura (post-refactor)

### Entry point
```
dist/index.js → require("./server").startServer()
```

### Módulos principales
| Módulo | Responsabilidad |
|--------|----------------|
| `src/server.ts` | Valida env vars, arranca Fastify, pre-warm Chrome |
| `src/app.ts` | Construye la app Fastify (routes + hooks) |
| `src/browser/lifecycle.ts` | Singleton de Chrome, reconnect automático en crash/OOM |
| `src/browser/pool.ts` | Semáforo de páginas concurrentes (MAX_CONCURRENT_PAGES) |
| `src/routes/auth.hook.ts` | Bearer token con `timingSafeEqual` (timing-safe) |
| `src/routes/generate-pdf.route.ts` | POST /generate-pdf |
| `src/routes/generate-screenshot.route.ts` | POST /generate-screenshot |
| `src/routes/health.route.ts` | GET /health |
| `src/renderers/resume.ts` | Render CV → PDF |
| `src/renderers/cover-letter.ts` | Render carta → PDF |
| `src/renderers/fix-layout.ts` | Sidebar gradient painter + spacers + height snap |
| `src/page/setup.ts` | setA4Viewport, emulateMediaType |
| `src/page/navigation.ts` | gotoAndWaitForContent (networkidle0 + waitForSelector) |
| `src/page/assets.ts` | waitForFonts, waitForImages |
| `src/page/capture.ts` | capturePdf (full-bleed o header-footer) |
| `src/lib/pdf-metadata.ts` | embedPdfMetadata con pdf-lib |
| `src/lib/timeout.ts` | withTimeout |
| `src/contracts.ts` | Fuente de verdad de selectores CSS y cookies |

### Archivos huérfanos (NO importar)
- ~~`dist/browser-pool.js`~~ → borrado 2026-06-04 (tenía `--single-process` ya eliminado)
- ~~`dist/print-helpers.js`~~ → borrado 2026-06-04 (reemplazado por módulos en `page/`)

---

## Invariantes críticos

### 1. `RESUME_CONTENT_SELECTOR` requiere `data-print-layout`
```ts
// contracts.ts
RESUME_CONTENT_SELECTOR = ".resume-pages > div[data-print-layout]"
```
**Por qué:** El selector espera el template real, no el `TemplateSkeleton` que se renderiza antes de que el dynamic import termine. Sin `[data-print-layout]`, `gotoAndWaitForContent` haría timeout y el PDF fallaría con 500.

**Todos los templates** (128 en `components/resume/templates/`) deben tener `data-print-layout="single-column|sidebar-left|sidebar-right"` en su `<div>` raíz dentro de `.resume-pages`.

**Enforcement:** Test automático en `src/__tests__/template-invariants.test.ts` — falla con lista de archivos si algún template lo omite.

### 2. Captura PDF — modo full-bleed
Ambos renderers (resume y cover-letter) usan `capturePdf(page, { mode: "full-bleed" })`:
- Puppeteer margin = 0 en todos los lados
- La web (CSS + template) controla todo el padding/margen interno
- `printBackground: true` siempre — necesario para fondos de color e imágenes de fondo

### 3. Cookie whitelist centralizada en `contracts.ts`
`ALLOWED_COOKIE_NAMES` y `SESSION_COOKIE_NAMES` son la fuente de verdad. Si NextAuth cambia de nombre de cookies, actualizar solo `contracts.ts`.

Fallback: si no hay session cookie en la whitelist → se reenvían TODAS las cookies con `console.warn`. Comportamiento pre-existente, no es regresión.

### 4. Auth con timing-safe
`routes/auth.hook.ts` usa `crypto.timingSafeEqual` — no reemplazar con comparación directa de strings.

---

## Bugs resueltos en esta sesión (2026-06-04)

### Fix 1 — Selector de content-ready demasiado amplio
**Síntoma:** PDFs con imágenes rotas / renders prematuros (el renderer capturaba el skeleton de carga).  
**Root cause:** `RESUME_CONTENT_SELECTOR = ".resume-pages > div"` hacía match con el skeleton antes de que el template real montara.  
**Fix:** Cambiado a `.resume-pages > div[data-print-layout]`. El skeleton no tiene ese atributo; el template real sí.  
**Archivo:** `src/contracts.ts`

### Fix 2 — `requestAnimationFrame` en page.evaluate
**Síntoma:** Tests de renderers fallaban con `ReferenceError: requestAnimationFrame is not defined`.  
**Root cause:** Los mocks de tests capturaban el callback de `page.evaluate()` y lo ejecutaban en contexto Node.js, donde `requestAnimationFrame` no existe.  
**Fix:** Reemplazado por `setTimeout(resolve, 0)` — logra el mismo "yield al siguiente tick" del event loop del browser, y funciona en ambos contextos.  
**Archivos:** `src/renderers/cover-letter.ts`, `src/renderers/resume.ts`  
**Nota:** En producción con Chrome real, ambos eran equivalentes. La diferencia solo importa en testing.

### Fix 3 — Test `waitForImages` timeout colgado
**Síntoma:** Test `"warns and resolves on timeout"` excedía el timeout de Jest (5s).  
**Root cause:** Implementación usa `while (Date.now() < deadline) { await page.evaluate() }`. Con fake timers, `jest.runAllTimers()` no desbloquea un `await` pendiente — el loop quedaba colgado en el primer `await`.  
**Fix:** Test reescrito sin fake timers: usa `timeoutMs=50` real + mock que devuelve `false` en la primera llamada.  
**Archivo:** `src/__tests__/page/assets.test.ts`

---

## Reglas de testing

### Mocks de `page.evaluate`
`page.evaluate(fn, ...args)` ejecuta `fn` en el browser. En tests:
- El mock por defecto devuelve `Promise.resolve(undefined)` sin ejecutar `fn` ✓
- Si capturas `fn` con `mockImplementationOnce` y la llamas en Node.js, debe funcionar en Node.js
- `requestAnimationFrame` NO existe en Node.js — usar `setTimeout` en su lugar
- Para capturar el callback correcto cuando hay múltiples `evaluate` calls, usar múltiples `mockImplementationOnce` en orden

### `waitForImages` — testear timeout path
No usar `jest.useFakeTimers()` — el `while + await` no es compatible con fake timers.  
Usar timeout real pequeño (50ms) con mock que devuelve `false` en la primera llamada.

### Coverage threshold
Jest está configurado con `coverageThreshold: { lines: 90, functions: 90, branches: 75, statements: 90 }`.  
`src/index.ts`, `src/server.ts`, `src/renderers/fix-layout.ts` excluidos del coverage (ver `jest.config.js`).

---

## Estado de tests (2026-06-04)

```
Test Suites: 14 passed, 14 total
Tests:       92 passed, 92 total
Build:       tsc → exit 0
```

---

## Variables de entorno requeridas

| Var | Descripción |
|-----|-------------|
| `PDF_SERVICE_SECRET` | Bearer token para autenticar requests al microservicio |
| `PUPPETEER_EXECUTABLE_PATH` | Path absoluto al binario de Chrome/Chromium |
| `PORT` | Puerto HTTP (default: 3001) |
| `MAX_CONCURRENT_PAGES` | Máximo de páginas Puppeteer simultáneas (default: 3) |

---

## Qué NO hacer

- **NO importar** desde `dist/browser-pool.js` ni `dist/print-helpers.js` — borrados, son huérfanos
- **NO añadir** templates sin `data-print-layout` en el `<div>` raíz — el test `template-invariants.test.ts` fallará
- **NO usar** `requestAnimationFrame` dentro de `page.evaluate()` si el test necesita capturar el callback
- **NO usar** `jest.useFakeTimers()` con funciones que tienen `while + await page.evaluate()` en el loop
- **NO tocar** `services/pdf-generator/` desde la rama `develop`
