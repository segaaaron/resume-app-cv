---
name: PDF Rendering State
description: Arquitectura del microservicio PDF, rama independiente, bugs resueltos, contrato de API
type: project
---

# PDF System — Arquitectura completa (actualizado 2026-06-04)

## CRÍTICO — Estructura de ramas

**El microservicio PDF vive en una rama GIT INDEPENDIENTE llamada `pdf-microservice`.**

- Rama `pdf-microservice` = SOLO el motor PDF. Sin frontend, sin API web, sin Next.js.
- Rama `develop` / `master` = web app. Llama al microservicio vía HTTP. NO contiene el código fuente del microservicio.
- En `develop`, `services/pdf-generator/` solo tiene `node_modules` huérfanos — **esto es normal y esperado**.
- El microservicio se despliega **por separado** en Dokploy como servicio independiente.

**NUNCA asumir que el código del microservicio debe estar en `develop`. SIEMPRE ir a rama `pdf-microservice` para leerlo o modificarlo.**

---

## Arquitectura del microservicio (`pdf-microservice` branch)

### Stack
- **Runtime:** Node 18 + TypeScript
- **HTTP framework:** Fastify 4
- **Browser engine:** Puppeteer Core 22 + Chromium (sistema, no bundled)
- **PDF post-process:** pdf-lib (metadata branding)
- **Thumbnails:** sharp (WebP, ~8-15KB)
- **Puerto:** 3001

### Estructura de archivos (`services/pdf-generator/src/`)

```
index.ts                    — entrypoint, llama startServer()
server.ts                   — valida env vars, pre-calienta Chrome, inicia Fastify
app.ts                      — registra hooks + rutas
contracts.ts                — ÚNICA fuente de verdad: selectores CSS, cookies, tipos, constantes A4
constants.ts                — re-exporta desde contracts.ts (legacy, mantener en sync)
browser/
  lifecycle.ts              — getBrowser(), ensureHealthyBrowser(), restart on crash
  pool.ts                   — concurrencia con MAX_CONCURRENT_PAGES (default 3), cola FIFO
routes/
  auth.hook.ts              — valida Bearer PDF_SERVICE_SECRET en TODAS las rutas
  health.route.ts           — GET /health → { status, activePages, queueDepth }
  generate-pdf.route.ts     — POST /generate-pdf
  generate-screenshot.route.ts — POST /generate-screenshot
renderers/
  resume.ts                 — renderer PDF de CV (stretchPages=true)
  cover-letter.ts           — renderer PDF de carta (stretchPages=false)
  screenshot.ts             — renderer WebP thumbnail
  fix-layout.ts             — JS inline que corre en browser context (fix page boundaries)
  types.ts                  — tipos compartidos entre renderers
page/
  assets.ts                 — waitForImages() con polling 200ms
  capture.ts                — page.pdf() con opciones A4
  navigation.ts             — goto() con timeout GOTO_TIMEOUT_MS (20s)
  setup.ts                  — viewport, media type, emulateMediaType
lib/
  pdf-metadata.ts           — embeds PDF_PRODUCER / PDF_CREATOR via pdf-lib
  timeout.ts                — withTimeout() wrapper
cookie-forwarder.ts         — filtra cookies por ALLOWED_COOKIE_NAMES whitelist
print-base.css              — CSS base inyectado en páginas de impresión
```

### Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Estado del pool: `{ status, activePages, queueDepth }` |
| POST | `/generate-pdf` | Bearer secret | Genera PDF. Body: `{ printUrl, cookies, stretchPages, candidateName?, resumeTitle?, letterTitle? }` |
| POST | `/generate-screenshot` | Bearer secret | Genera WebP thumbnail. Body: `{ printUrl, cookies }` |

### Contrato web app ↔ microservicio (NO romper sin sync)

**`stretchPages: boolean`** = discriminador interno del renderer:
- `true` → `"resume"` renderer (CV multi-página, stretch layout)
- `false` → `"cover-letter"` renderer

**Selectores CSS que el microservicio espera en el HTML del web app:**
- `.resume-pages` — wrapper root del CV (content-ready sentinel)
- `.resume-pages > div` — primer hijo (navigation wait)
- `.resume-entry`, `.resume-section-title` — elementos para fix page boundaries
- `.cover-letter-page` — root de carta de presentación

**Cookies permitidas (whitelist en `contracts.ts`):**
- `authjs.session-token`, `__Secure-authjs.session-token`
- `authjs.csrf-token`, `__Host-authjs.csrf-token`
- `authjs.callback-url`, `__Secure-authjs.callback-url`
- `NEXT_LOCALE`

### Variables de entorno requeridas

| Var | Dónde | Descripción |
|-----|-------|-------------|
| `PDF_SERVICE_SECRET` | microservicio + web app | Shared secret. Web app lo envía como `Authorization: Bearer <secret>` |
| `PDF_SERVICE_URL` | web app | URL interna del microservicio (ej: `http://pdf-generator:3001`) |
| `INTERNAL_APP_URL` | web app | URL interna de la web app que el microservicio abre con Puppeteer |
| `MAX_CONCURRENT_PAGES` | microservicio | Default 3. Limita páginas Chrome simultáneas |
| `PORT` | microservicio | Default 3001 |
| `PUPPETEER_EXECUTABLE_PATH` | microservicio | Path a Chromium. En Docker = `/usr/bin/chromium` |

### Docker

- Multi-stage build: `builder` (compila TS → dist/) + imagen final node:18-slim
- Instala Chromium del sistema (`apt-get install chromium`)
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` — no descarga Chromium extra
- Corre como usuario no-root `pptruser`
- Health check: `curl -sf http://localhost:3001/health`
- Memory limit recomendado: 1GB (`mem_limit: 1g` en docker-compose)

---

## Cómo llama la web app al microservicio

**Archivo:** `lib/pdf/pdf-service-client.ts` (en `develop`)

1. Web app construye `printUrl` con print token temporal (`lib/pdf/print-token.ts`)
2. Llama `POST ${PDF_SERVICE_URL}/generate-pdf` con Bearer secret
3. Microservicio abre `printUrl` con Puppeteer, renderiza, devuelve PDF binario
4. Timeout: 30s en cliente web, 45s en microservicio (`RENDER_TIMEOUT_MS`)
5. Retry: 1 reintento automático en errores 5xx o AbortError

---

## Bugs resueltos (histórico)

### Bug 1 — Padding/espacio arriba en página 2+
**Fix:** CSS `break-after: avoid` en `.resume-section-title` + `orphans/widows: 3`. JS: margin-top reset en elementos en primeros 8px de página nueva (batch collect → batch apply).

### Bug 2 — Espacio blanco al final de última hoja
**Fix:** Threshold 33% → 15%. Altura fijada a `numPages * pagePx` exacto. `FUDGE_PX = 4` absorbe redondeo subpíxel.

### Bug 3 — Sidebar no se repinta en página 2+
**Fix:** Renderer detecta sidebar (primer hijo con backgroundColor sólido), mueve color al background del root como `linear-gradient`. Chrome lo repinta en cada página.

### Bug 4 — Imágenes rotas en screenshots/PDFs (fix: 2026-05-27)
**Fix:** Flags `--disable-web-security` + `--allow-running-insecure-content` en args de Puppeteer. Reemplazado timeout fijo 6s por polling 200ms en `waitForImages()`. Fix race condition TOCTOU en `evaluateImages`. RAF stabilization tick post-`emulateMediaType`.

### Bug 5 — Auth hook bypass
**Fix (branch pdf-microservice):** El auth hook valida Bearer en todas las rutas incluyendo `/health`. Eliminado `--single-process` de args Chromium.

---

## Bug pendiente (SIN RESOLVER)

Chrome flex bug en page boundary: `.resume-entry` cortado exactamente en el boundary → siguiente entry en Y=0 con texto superpuesto. `break-inside: avoid` mitiga. Root cause: bug Chrome en columnas flex + print. Sin workaround CSS puro sin Paged.js.

---

## Reglas críticas (NO revertir)

- NO tocar `.resume-pages > div { min-height: 0; height: auto }` — eliminado intencionalmente. JS gestiona snapping.
- `.resume-pages` wrapper sí tiene `min-height: 0; height: auto` — correcto.
- JS en `resume.ts` aplica `height: N*pagePx` al root del template, NO al wrapper.
- `contracts.ts` es la ÚNICA fuente de verdad de selectores/cookies/tipos. No duplicar en otros archivos.
- Si web app cambia selectores CSS o nombres de cookies → actualizar `contracts.ts` del microservicio en sync.
