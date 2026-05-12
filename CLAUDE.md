@AGENTS.md

## Resumen del proyecto

App SaaS de CVs en Next.js. Solo plan Pro ($15/mo · $144/yr). No existe plan gratuito.

---

## Stripe — Pagos

- Planes: `monthly` y `annual`. No existe trial.
- Price IDs en `.env`: `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_ANNUAL`
- Los Price IDs se leen **dentro del handler**, no a nivel de módulo (evita error "No such price" en build)
- Webhook en `/api/stripe/webhook` maneja: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `charge.refunded`
- `invoice.paid` es el evento que setea `subscriptionEndsAt` y envía el email de confirmación
- Webhook secret en `.env`: `STRIPE_WEBHOOK_SECRET`
- **Idempotencia persistente:** se guarda el `event.id` en la tabla `StripeEvent` de la BD. Migración: `20260427194813_add_stripe_event_idempotency`

---

## Sesión — Plan en tiempo real

- El JWT callback en `lib/auth.ts` usa caché en memoria de 5 min por `userId` para evitar N+1 queries.
- Caché se invalida en nuevo login (`user` presente en token).
- Pro check usa patrón `hasActiveAccess`: requiere `plan === "PRO"` + `subscriptionStatus === "ACTIVE"` + `subscriptionEndsAt` no expirado.

---

## Flujo de compra

1. `/pricing` → clic en plan → `/register?plan=X` (si no autenticado)
2. Se registra/loguea → redirige a `/checkout?plan=X`
3. `/checkout` dispara el checkout y redirige a Stripe
4. Stripe redirige a `/dashboard?upgraded=true`
5. Dashboard muestra banner de bienvenida al detectar `?upgraded=true`

---

## Emails con Resend

- Cliente en `lib/resend.ts` — degrada si no hay `RESEND_API_KEY`
- Dominio verificado: `readycvv.com` (DKIM, SPF, MX, DMARC en Hostinger)
- From: `READY CV <no-reply@readycvv.com>`
- Templates: `subscriptionConfirmation.ts` (invoice.paid), `renewalReminder.ts` (cron), `applicationReminder.ts` (cron), `referralReward.ts` (referral tiers)

---

## Cron jobs

| Cron | Endpoint | Frecuencia |
|------|----------|-----------|
| Recordatorio renovación | `GET /api/cron/renewal-reminder` | `0 9 * * *` |
| Recordatorio candidaturas | `GET /api/cron/application-reminders` | `0 8 * * *` |
| Purge StripeEvents >90d | `GET /api/cron/purge-stripe-events` | `0 3 * * 0` ⏳ pendiente config |

Todos protegidos con `Authorization: Bearer <CRON_SECRET>`.

---

## Migraciones de base de datos

1. Edita `prisma/schema.prisma`
2. `npm run migration:create nombre_del_campo`
3. Escribe el SQL en el archivo generado en `prisma/migrations/`
4. Commit + push → deploy aplica `prisma migrate deploy` automáticamente

**No uses `prisma db push` en producción.**

---

## Estado del roadmap — Todo completado

| Mes | Features | Archivos clave |
|-----|----------|----------------|
| 1 — Editor | Autosave, historial 10 versiones, mejora bullets IA, resumen IA | `EditorLayout.tsx`, `versions/route.ts`, `improve-bullet`, `generate-summary` |
| 2 — Export | PDF (window.print), Word (.docx), watermark Free | `PrintLayout.tsx`, `export/docx/route.ts` |
| 3 — ATS | ATS Score, sugerir habilidades IA | `ats-score/route.ts`, `suggest-skills/route.ts`, `ATSScorePanel.tsx` |
| 4 — Kanban | Pipeline WISHLIST→APPLIED→INTERVIEW→OFFER→REJECTED, recordatorios | `applications/route.ts`, `kanban/Board.tsx` |
| 5 — Cover Letter | Generar carta IA, mejorar carta IA, 3 plantillas, Tiptap rich text | `generate-cover-letter`, `improve-cover-letter`, `cover-letter/templates/` |
| 6 — Viralidad | Referidos (tiers 3→30%/5→50%/10→100%), CV público con slug | `referrals/route.ts`, `ReferralCard.tsx`, `cv/[slug]/page.tsx` |
| 7 — Review IA | Revisión CV libre, aplicar sugerencias diff, "Ayúdate con la IA" | `review-cv/route.ts`, `fill-profile/route.ts`, `SuggestionDiffModal.tsx` |

**Templates Pro activos:** ~111 (incluye 40 nuevas en sesión 2026-04-29 en 8 packs)

---

## Seguridad IA — Restricción de temas

Todos los endpoints tienen `system` message que restringe a contenido de CV/empleo:

| Endpoint | Respuesta off-topic | HTTP |
|----------|---------------------|------|
| `improve-bullet` | `{"versions": []}` | 422 |
| `generate-summary` | `{"versions": []}` | 422 |
| `ats-score` | `{"label": "off_topic"}` | 422 |
| `generate-cover-letter` | `{"body": ""}` | 422 |
| `improve-cover-letter` | `{"versions": []}` | 422 |
| `review-cv` | `{"answer": "off_topic"}` | 422 |
| `fill-profile` | `{}` vacío | 422 |

Clientes muestran toast específico al recibir 422.

---

## IA — Configuración centralizada (`lib/ai-client.ts`)

- `getOpenAI()` — cliente lazy (nunca a nivel de módulo)
- `AI_MODEL = "gpt-4o-mini"` — modelo único para todo el proyecto
- `AI_TEMPERATURE = 0.4` — temperatura estándar
- `checkRateLimit(userId, endpoint, limit?)` — rate limiter DB-backed (`AIRateLimit` model), 20 req/hr por defecto
- `logAIUsage(userId, endpoint)` — fire-and-forget, escribe en `AIUsageLog`
- `buildResumeContext(sectionData)` — texto plano del CV completo para prompts

**Nunca duplicar `getOpenAI()` o `checkRateLimit()` en los routes.**

## IA — Tokens por endpoint

| Endpoint | max_tokens |
|----------|-----------|
| `improve-bullet` | 600 |
| `generate-summary` | 500 |
| `improve-summary` | 700 |
| `generate-cover-letter` | 900 |
| `improve-cover-letter` | 1000 |
| `ats-score` | 800 |
| `review-cv` | 900 |
| `fill-profile` | 700 |
| `suggest-skills` | 400 |

No subir `max_tokens` sin justificación. `ats-score` trunca `jobDescription` a 6,000 chars server-side.

---

## Internacionalización (i18n)

- **2 idiomas:** `es` y `en` en `messages/es.json` y `messages/en.json`
- **Regla:** cero strings hardcodeados en componentes — todo texto visible al usuario en archivos de mensajes
- Namespaces principales: `editor.ai`, `editor.history`, `editor.share`, `editor.ats`, `editor.cv_review`, `editor.ai_profile_fill`, `editor.ai_gate`, `editor.template_switch`, `kanban`, `cover_letter_editor`, `public_cv`, `ai_features`, `ats_section`, `cv_examples`, `blog`

---

## Pro Gate — Restricción de acceso a IA

Todos los features de IA son exclusivos del plan Pro.

- `components/editor/EditorContext.tsx` — provee `isPro: boolean` y `openUpgrade: () => void`
- `components/editor/AIProGate.tsx` — wrapper que muestra lock banner si `isPro === false`
- En `Summary.tsx` y `WorkExperience.tsx`: botones IA usan `useEditorPro()` + llaman `openUpgrade()` si no Pro
- En `CoverLetterEditor.tsx`: recibe `isPro` como prop, monta su propio `UpgradeModal`

---

## Templates — Reglas críticas

**`fmtDesc`:** usar siempre `fmtDesc(job.description)` con `dangerouslySetInnerHTML` y clase `resume-desc` en descriptions. Nunca renderizar `job.description` directamente.

**PRO_IDS duplicado:** la lista de IDs Pro existe en dos archivos — mantenerlos sincronizados:
- `components/editor/TemplateSwitcher.tsx` — fuente de verdad (~línea 2533)
- `app/[locale]/templates/page.tsx` — copia

**Auto-ajuste de plantillas:** implementado en `stores/resumeStore.ts` (`setTemplateWithAdapt`, `adaptSectionsForTemplate`) + `TemplateSwitchModal.tsx`. Single-column: mueve secciones side→main. Double-column: restaura DEFAULT_SECTIONS layout.

---

## Historial de versiones — Seguridad de snapshots

- Snapshot validado con Zod (`snapshotSchema`) antes de persistir y antes de restaurar
- Schema: `{ title, sections, sectionData, config }`
- Snapshot corrupto → restore devuelve 422

---

## Notificaciones Toast

- Posición: `top-center` (`app/layout.tsx`)
- Biblioteca: Sonner (`components/ui/sonner.tsx`)
- Success: `green-50/900/700` · Error: `red-50/900/700` · Warning: `amber-50/900/700` · Info: `blue-50/900/700`
- Bordes `!border-2`, esquinas `xl`, sombra `xl`

---

## UX de IA

**Panel ATS Score:** requiere texto completo de oferta de empleo. No acepta preguntas. Off-topic → `ATSErrorBlock` con borde rojo.

**Disclaimer de métricas:** todos los paneles de versiones IA muestran aviso ámbar: `[X%]` son placeholders. Aplica en `WorkExperience.tsx`, `Summary.tsx`, `CoverLetterEditor.tsx`.

**"Ayúdate con la IA":** panel colapsable al final de pestaña Contenido. Usuario describe perfil libre (máx. 500 chars). Genera `summary`, `jobTitle`, `suggestedSkills[]`, `workExperienceUpdates`, `workExperienceNew`, `educationUpdates`, etc.

**Revisión CV:** modo auto-detectado — texto corto/con `?` → `review-cv`; texto largo → `ats-score`. Output `review-cv`: `{ summary, strengths[], improvements[], answer }`. Cada item con `suggestion` tiene botón "Aplicar" → `SuggestionDiffModal`.

---

## Seguridad — Patrones establecidos (audit 2026-04-29)

**CSRF:** importar `checkOrigin` de `lib/csrf.ts` en todo nuevo endpoint POST/PATCH/DELETE que cambie estado. No aplica a webhooks externos (Stripe verifica firma propia).

**Idempotencia Stripe:** siempre `create` el registro al INICIO del handler. P2002 = duplicado, return 200. Nunca al final.

**Photos/uploads:** solo `data:image/(png|jpeg|webp|gif);base64,...` — regex estricto en schema Zod. Magic-byte validation en endpoint de upload. No URLs http(s).

**AI HTML output:** todo texto de IA que se wrappee en HTML → `escapeHtml()` antes de insertar en `<p>`/`<br>`.

**Auth:** `lib/auth.ts` bloquea `deletedAt !== null` — no agregar lógica duplicada en endpoints.

**Referral rewards:** `ReferralConversion` table es el ledger (P2002 = ya contado). `emailVerified !== null` requerido. Migración: `20260429222951_add_referral_conversion`.

**Proxy/middleware:** `config.matcher` en `proxy.ts` excluye `/api/` intencionalmente — los API routes manejan su propio auth/rate-limit. No agregar lógica de `/api/` en el middleware.

**Pendientes de seguridad:** ver `memory/security_audit.md` para lista de fixes no implementados.

---

## Marketing — Estado

- Hero, FeatureCards, AIFeatures, ATSSection, CVExamples, blog (4 artículos SEO) — todos implementados
- JSON-LD homepage actualizado (40+ plantillas, $15, IA + ATS)
- Templates gallery agrupada en 10 categorías
- **CV Examples:** imágenes pendientes del usuario en `public/examples/*.webp` (tech, design, legal, health, hospitality)
- Todas las referencias a plan "Free/Gratis" eliminadas del sitio
