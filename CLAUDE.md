@AGENTS.md

## Resumen del proyecto

App SaaS de CVs en Next.js. Planes: Free y Pro (Mensual $15/mo · Anual $144/yr).

---

## Stripe — Pagos

- Planes: `monthly` y `annual`. No existe trial.
- Price IDs en `.env`: `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_ANNUAL`
- Los Price IDs se leen **dentro del handler**, no a nivel de módulo (evita error "No such price" en build)
- Webhook en `/api/stripe/webhook` maneja: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `charge.refunded`
- `invoice.paid` es el evento que setea `subscriptionEndsAt` y envía el email de confirmación
- Webhook secret en `.env`: `STRIPE_WEBHOOK_SECRET`
- **Idempotencia persistente:** se guarda el `event.id` en la tabla `StripeEvent` de la BD antes de retornar. Migración: `20260427194813_add_stripe_event_idempotency`

---

## Sesión — Plan en tiempo real

- El JWT callback en `lib/auth.ts` consulta la BD en **cada request** para obtener `plan`, `subscriptionStatus`, `subscriptionEndsAt` frescos
- Esto evita que el plan quede cacheado tras un pago

---

## Flujo de compra para usuarios sin cuenta

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
- Templates:
  - `lib/emails/subscriptionConfirmation.ts` — se envía en `invoice.paid`
  - `lib/emails/renewalReminder.ts` — se envía desde el cron job
  - `lib/emails/applicationReminder.ts` — se envía desde el cron job de candidaturas
  - `lib/emails/referralReward.ts` — se envía desde `lib/referral-rewards.ts` al alcanzar cada tier o completar ciclo

---

## Cron job — Recordatorio de renovación

- Endpoint: `GET /api/cron/renewal-reminder`
- Protegido con `Authorization: Bearer <CRON_SECRET>`
- Busca usuarios con `subscriptionEndsAt` entre +36h y +60h (ventana de 48h ± 12h)
- **Configurar en Dokploy:** `0 9 * * *` → `https://readycvv.com/api/cron/renewal-reminder` con header `Authorization: Bearer <CRON_SECRET>`

---

## Migraciones de base de datos

Cuando necesites agregar un campo nuevo al schema de Prisma:

1. Edita `prisma/schema.prisma` con el nuevo campo
2. Crea la migración con:
   ```bash
   npm run migration:create nombre_del_campo
   ```
3. Abre el archivo generado en `prisma/migrations/<timestamp>_nombre/migration.sql` y escribe el SQL
4. Haz commit y push — en producción se aplica automáticamente al hacer deploy vía `prisma migrate deploy` (incluido en el script `start` de `package.json`)

**No uses `prisma db push` en producción.** El flujo siempre es: script → SQL → commit → push → deploy.

---

## Estado de implementación del roadmap

### Mes 1 — Editor sólido (abril 2026)

| Feature | Estado | Archivos clave |
|---------|--------|----------------|
| Autosave (debounce 2.5s) | ✅ Listo | `components/editor/EditorLayout.tsx` |
| Historial de versiones (últimas 10) | ✅ Listo | `app/api/resumes/versions/route.ts`, `app/api/resumes/versions/restore/route.ts`, `components/editor/EditorTopBar.tsx`, migración `20260425005554_add_resume_versions` |
| Mejora de bullets con IA (gpt-4o-mini) | ✅ Listo | `app/api/ai/improve-bullet/route.ts`, `components/resume/sections/WorkExperience.tsx` |
| Generador de resumen profesional con IA | ✅ Listo | `app/api/ai/generate-summary/route.ts`, `components/resume/sections/Summary.tsx` |
| Duplicado de secciones | 🔽 Baja prioridad | Owner: impacto de negocio casi nulo |

### Mes 2 — Exportación premium (mayo 2026)

| Feature | Estado |
|---------|--------|
| PDF con múltiples diseños | ✅ Completado (print page con todos los templates) |
| Exportación Word (.docx) | ✅ Completado (`app/api/export/docx/route.ts`, botón en PrintLayout, Pro only) |
| Vista previa antes de descargar | ✅ Completado (print page es la vista previa) |
| PDF watermark para Free | ✅ Completado (`components/resume/PrintLayout.tsx`, prop `isPro` desde print page) |

**Notas Mes 2:**
- Word export usa el paquete `docx` (npm). Genera documento con secciones: nombre, contacto, resumen, experiencia, educación, habilidades, idiomas, certificaciones, proyectos.
- El botón "Word (.docx)" aparece en la barra de la página de impresión (`/resume/[id]/print`).
- Pro only: devuelve 403 si el usuario no tiene plan activo.

### Mes 3 — IA ATS Score (junio 2026)
| Feature | Estado |
|---------|--------|
| ATS Score contra descripción de trabajo | ✅ Completado (`app/api/ai/ats-score/route.ts`, panel ATS en editor) |
| Sugerir habilidades según rol/industria | ✅ Completado (`app/api/ai/suggest-skills/route.ts`, botón "Sugerir con IA" en SkillsSection) |

**Notas Mes 3:**
- ATS Score usa `gpt-4o-mini`. Recibe el CV del store + descripción del puesto. Devuelve: score (0-100), label, fortalezas, brechas, keywords faltantes, sugerencias.
- Panel ATS accesible desde nueva pestaña "ATS" en el FormPanel del editor.
- Componente: `components/editor/ATSScorePanel.tsx` — incluye anillo SVG animado con score.
- Suggest Skills usa `gpt-4o-mini`. Recibe `jobTitle` de `personalDetails` + skills existentes. Devuelve 8-10 skills con nivel. Botón "Sugerir con IA" en `SkillsSection.tsx`.
- Pro only: devuelve 403 si no es plan activo.

### Mes 4 — Tracker de candidaturas (julio 2026)
| Feature | Estado |
|---------|--------|
| Pipeline visual (Aplicado → Entrevista → Oferta) | ✅ Completado (Kanban board en `/dashboard/applications`, store `applicationStore.ts`) |
| Recordatorios de candidaturas | ✅ Completado (`app/api/cron/application-reminders/route.ts`, campo followUpAt en kanban) |

**Notas Mes 4:**
- Kanban con 5 columnas: WISHLIST → APPLIED → INTERVIEW → OFFER → REJECTED.
- API CRUD completo: `app/api/applications/route.ts` (GET/POST) + `app/api/applications/[id]/route.ts` (PATCH/DELETE).
- Modelo `Application` en Prisma con campos: jobTitle, company, status, notes, url, salary, appliedAt.
- Componentes: `components/kanban/Board.tsx` + `components/kanban/Column.tsx`.

### Mes 5 — Carta de presentación IA (agosto 2026)
| Feature | Estado |
|---------|--------|
| Generación automática personalizada | ✅ Completado (`app/api/ai/generate-cover-letter/route.ts`, botón en editor de carta) |
| Mejora de carta existente con IA | ✅ Completado (`app/api/ai/improve-cover-letter/route.ts`, botón en textarea del cuerpo) |
| 3 plantillas profesionales de carta | ✅ Completado (`components/cover-letter/templates/`) |
| Autofill de datos del candidato desde CV | ✅ Completado (página carga `personalDetails` del CV más reciente) |

**Notas Mes 5:**
- Genera el cuerpo de la carta con `gpt-4o-mini` en tono formal/equilibrado/creativo.
- Opcionalmente toma datos de un CV existente del usuario (selector de resume).
- Botón "Generar con IA" en el panel izquierdo del `CoverLetterEditor`.
- Pro only. Guarda en mismo `content.body` para edición posterior.
- **Mejorar carta con IA** (`improve-cover-letter`): toma el cuerpo actual de la carta + contexto (empresa, puesto, cargo del destinatario) y devuelve 3 versiones mejoradas con tonos Formal · Equilibrada · Dinámica. Botón "Mejorar con IA" junto al label del textarea. Panel de versiones con disclaimer de placeholders ámbar. Al editar manualmente el textarea, el panel desaparece. Off-topic → 422 + toast.
- **3 plantillas de carta** (`components/cover-letter/templates/`):
  - `SidebarTemplate.tsx` — sidebar 28% con fondo `colorScheme`, foto circular, íconos de contacto; columna derecha con título "CARTA DE PRESENTACIÓN" en accent, destinatario, cuerpo, firma. Pro only.
  - `ElegantTemplate.tsx` — una columna, nombre grande `font-light tracking-[0.15em] uppercase`, separador decorativo con diamante en `colorScheme`, sin foto. Para perfiles senior.
  - `SplitTemplate.tsx` — header ancho completo con fondo `colorScheme`, foto + nombre + contacto; cuerpo blanco debajo. Pro only.
  - Selector de plantillas: grid 3 thumbnails SVG en el panel izquierdo con borde activo y ring en `primary`.
  - El `templateId` se guarda en el campo existente `CoverLetter.templateId` (default `"classic"` → mapea a `"elegant"`). Sin migración de schema.
- **Autofill de datos del candidato**: la página carga el CV más reciente del usuario (`db.resume.findFirst`) y extrae `personalDetails`. Respeta datos ya guardados en la carta — no sobrescribe si el usuario los editó. Datos almacenados en el JSON `content` con prefijo `candidate`.
- **Panel "Tus datos"** colapsable en el editor: 8 campos editables (nombre, cargo, email, teléfono, dirección, linkedin, sitio web, foto). Pre-poblados desde el CV.
- **i18n**: 31 claves nuevas en `cover_letter_editor` (es + en). Todos los strings hardcodeados del componente anterior migrados.
- **Rich text (Tiptap)** (`components/cover-letter/RichTextEditor.tsx`): editor completo con toolbar Bold · Italic · Underline · Lista · Lista numerada · Alinear izq/centro/justificar. Packages: `@tiptap/extension-underline` + `@tiptap/extension-text-align`. El `content.body` ahora almacena HTML y se renderiza con `dangerouslySetInnerHTML` en los 3 templates. Botones de toolbar usan `onMouseDown` (no `onClick`) para no quitar el foco del editor. Sincroniza cambios externos via `useEffect` (e.g. AI aplica versión). ✅ Completado.
- **Foto del candidato** (`CoverLetterEditor.tsx`): uploader opcional en el panel "Tus datos". Click en el círculo o botón abre file picker. Convierte a base64 con `FileReader` — sin subida a servidor. Preview circular inmediato. Botón "Quitar foto" limpia el campo. Se renderiza en `SidebarTemplate` y `SplitTemplate`; `ElegantTemplate` no usa foto por diseño. i18n: 4 claves `candidate_photo*` (es + en).
- **Campos opcionales**: empresa, cargo del destinatario, nombre del destinatario y foto son todos opcionales. API `generate-cover-letter` eliminó la validación `if (!company) → 400`. El prompt omite dinámicamente los campos vacíos. Los templates ya condicionaban con `{field && ...}`.
- **Tiptap packages**: `@tiptap/extension-underline` y `@tiptap/extension-text-align` instalados en `package.json`.

### Mes 6 — Viralidad (septiembre 2026)
| Feature | Estado |
|---------|--------|
| Programa de referidos | ✅ Completado (`/api/referrals`, `components/dashboard/ReferralCard.tsx`) |
| CV público compartible con link | ✅ Completado (`/api/resumes/share`, `/cv/[slug]`, botón en EditorTopBar) |

**Notas Mes 6:**
- Toggle "Compartir/Público" en el EditorTopBar (solo Pro). Al activarlo genera `publicSlug` único con nanoid y copia el link al portapapeles.
- Página pública en `app/[locale]/cv/[slug]/page.tsx` — sin autenticación, renderiza el CV con el mismo template.
- Migración `20260425013730_add_resume_public_share`: campos `isPublic BOOLEAN DEFAULT false` + `publicSlug TEXT UNIQUE`.
- El banner de la página pública incluye CTA traducida (ver `public_cv.create_cta` en messages).
- **Programa de referidos:** cada usuario recibe `referralCode` (nanoid 8) al registrarse. Link: `/register?ref=<code>`. El registro resuelve el código y guarda `referredBy` (userId del referrer). Stats en `GET /api/referrals`: `totalReferred` + `paidReferrals` + `rewardTier` + `nextTier`. UI en `ReferralCard` dentro de Settings con barra de progreso y tiers visuales. Migración: `20260427200035_add_referral_system`.
- **Recompensas por ciclo** (`lib/referral-rewards.ts`): sistema de ciclos repetibles. Tiers basados en `cycleCount` (referidos Pro desde el último reset). Rangos: 3–4 → 30% ($4.50), 5–8 → 50% (+$3.00), 9–10 → 100% (+$7.50 = $15 mes gratis). Al completar tier 3 el ciclo se resetea (`referralCycleOffset = totalPaid`, `referralRewardTier = 0`) para que el usuario pueda volver a ganar. Créditos aplicados vía `stripe.customers.createBalanceTransaction`. Se dispara desde `checkout.session.completed`. Migraciones: `20260427201625_add_referral_reward_tier`, `20260427202111_add_referral_cycle_offset`.
- **Email de recompensa** (`lib/emails/referralReward.ts`): se envía automáticamente al referrer cuando alcanza un nuevo tier o completa el ciclo. Incluye: tier alcanzado, crédito aplicado, total acumulado, referidos del ciclo. Si el ciclo se completa, el email incluye aviso de reinicio y CTA a seguir refiriendo. Color del header varía por tier (ámbar/azul/púrpura). Texto plano incluido para clientes sin HTML.

---

### Sesión 2026-04-28 — Mejoras de calidad y UX

| Cambio | Archivos clave |
|--------|----------------|
| Niveles de idioma CEFR (A1–C2 + Nativo) reemplaza niveles descriptivos | `types/resume.ts`, `components/resume/sections/Languages.tsx`, todos los templates |
| Compresión de fotos client-side antes de guardar en BD (~90% reducción) | `lib/compressImage.ts`, `components/editor/DesignPanel.tsx`, `components/cover-letter/CoverLetterEditor.tsx` |
| PDF via `window.print()` reemplaza html2canvas/jsPDF (fix error de descarga) | `components/resume/PrintLayout.tsx` |
| Merge Pro Diseños + Ultra Diseños → una sola sección "Pro Diseños" | `components/editor/TemplateSwitcher.tsx`, `app/[locale]/templates/page.tsx` |
| SVG thumbnails únicos por template en el selector (igual que cartas) | `components/editor/TemplateSwitcher.tsx` |
| i18n: todos los toast y strings hardcodeados en español migrados | `ATSScorePanel`, `AIProfileFillPanel`, `UpgradeModal`, `PricingButtons`, `Skills`, 13 templates de carta |
| Fix: `export default function` faltante en 12 templates de carta (bug del agente) | `components/cover-letter/templates/*.tsx` |
| Fix: `Loader2` import faltante en PrintLayout | `components/resume/PrintLayout.tsx` |

**Notas sesión:**
- `lib/compressImage.ts`: Canvas resize a 600px max, JPEG 88%, `imageSmoothingQuality="high"`. Fallback a FileReader si Canvas no disponible. Límite servidor subido a 300KB.
- Niveles CEFR usan `.catch("b1")` en Zod — datos viejos en BD no rompen.
- `window.print()` usa CSS `@page` ya configurado + clases `print:hidden` + watermark para Free.
- Thumbnails SVG en TemplateSwitcher: `viewBox="0 0 80 110"`, 31 diseños únicos, mismo patrón que `CoverLetterEditor.tsx`.
- i18n: namespaces afectados: `editor.ats` (+4 claves), `editor.ai_profile_fill` (+19 claves), `editor.upgrade` (+1), `editor.sections_form` (+1), `pricing` (+1), `cover_letter_editor` (+13 claves toolbar/export/salutation).

---

### Mes 7 — Revisión General del CV con IA (octubre 2026)
| Feature | Estado |
|---------|--------|
| Feedback general del CV + consulta libre | ✅ Completado (`app/api/ai/review-cv/route.ts`, `components/editor/ATSScorePanel.tsx`) |
| Aplicar sugerencias directamente al CV | ✅ Completado (`components/editor/SuggestionDiffModal.tsx`, `ATSScorePanel.tsx`) |
| "Ayúdate con la IA" en pestaña Contenido | ✅ Completado (`app/api/ai/fill-profile/route.ts`, `components/editor/AIProfileFillPanel.tsx`) |

**Notas Mes 7:**
- El panel ATS/Consulta CV tiene detección automática de modo: texto corto o con `?` → consulta libre (`review-cv`); texto largo → ATS Score (`ats-score`). Badge visual "Consulta" o "ATS" en tiempo real.
- `CVReviewPanel` fue eliminado — la funcionalidad de consulta libre se integró directamente en `ATSScorePanel`.

**Consulta libre del CV (`review-cv`):**
- Output renovado: `{ summary, strengths: ReviewItem[], improvements: ReviewItem[], answer }` donde `ReviewItem = { text, suggestion? }`.
- `suggestion` incluye: `{ field, type, preview, reason, targetId? }`. Validado con Zod + whitelist de 7 campos. Previews sanitizados (sin markdown).
- Cada item con `suggestion` muestra botón "Aplicar" (icono Wand2). Al clic abre `SuggestionDiffModal` con diff antes/después. Al confirmar aplica via `updateSectionData()`. Estado `applied` local por item.
- Campos accionables: `summary`, `personalDetails.jobTitle`, `skills`, `workExperience.description`, `workExperience.jobTitle`, `languages`, `certifications`.
- `languages` y `certifications`: no se aplican automáticamente — toast guía al usuario a la sección del editor.
- Pro only. Off-topic → 422. i18n: `editor.cv_review` (+7 claves: `apply_button`, `applying`, `applied`, `diff_title`, `diff_before`, `diff_after`, `diff_confirm`, `diff_cancel`).

**"Ayúdate con la IA" (`fill-profile`):**
- Panel colapsable al final de la pestaña "Contenido" del FormPanel. Header violeta, icono Sparkles.
- El usuario describe su perfil en lenguaje libre (máx. 500 chars). La IA genera: `summary`, `jobTitle`, `suggestedSkills[]` (máx. 8).
- Endpoint: `POST /api/ai/fill-profile`. Input: `{ prompt, sectionData }`. Output: `{ summary, jobTitle, suggestedSkills[] }`. Temperatura 0.5.
- Off-topic: si los 3 campos vienen null/vacíos → 422. No inventa datos factuales.
- UX: 3 bloques independientes. Summary y jobTitle muestran diff inline si ya existe contenido (checkbox "Reemplazar" visual). Skills: chips con checkbox, pre-seleccionados, botón "Agregar seleccionadas (N)".
- Skills existentes en el CV se pasan al prompt para evitar duplicados. Skills ya en el CV aparecen con `✓` y deshabilitadas.
- Pro only via `AIProGate`. i18n: namespace `editor.ai_profile_fill` (16 claves, es + en).

---

## Seguridad IA — Restricción de temas

Todos los endpoints de IA tienen un `system` message que restringe las respuestas a contenido de CV/empleo:

| Endpoint | Restricción | Respuesta off-topic | HTTP |
|----------|-------------|---------------------|------|
| `improve-bullet` | Solo descripciones de experiencia laboral | `{"versions": []}` | 422 |
| `generate-summary` | Solo perfiles y resúmenes profesionales | `{"versions": []}` | 422 |
| `ats-score` | Solo CVs vs job descriptions reales | `{"label": "off_topic"}` | 422 |
| `generate-cover-letter` | Solo cartas de presentación laborales | `{"body": ""}` | 422 |
| `improve-cover-letter` | Solo cuerpos de cartas de presentación laborales | `{"versions": []}` | 422 |
| `review-cv` | Solo preguntas sobre CV y búsqueda de empleo | `{"answer": "off_topic"}` | 422 |
| `fill-profile` | Solo descripciones de perfil profesional real | `{"summary": null, "jobTitle": null, "suggestedSkills": []}` → 422 | 422 |

Los clientes muestran un toast específico al recibir 422 (ej: "Solo puedo generar resúmenes sobre experiencia y perfil profesional").

---

## Internacionalización (i18n)

- **2 idiomas:** `es` y `en` en `messages/es.json` y `messages/en.json`
- **Regla:** cero strings hardcodeados en componentes — todo texto visible al usuario debe ir en los archivos de mensajes
- **Namespaces nuevos agregados en esta sesión:**
  - `editor.ai` — textos de IA en editor (13 claves)
  - `editor.history` — panel historial de versiones (10 claves)
  - `editor.share` — botón compartir / CV público (7 claves)
  - `editor.print` — página de impresión (5 claves)
  - `editor.ats` — panel ATS Score (13 claves)
  - `editor.form.ats_tab` — tab ATS en FormPanel
  - `kanban` — tracker de candidaturas (14 claves)
  - `cover_letter_editor` — IA en carta de presentación (31 claves: templates, candidate fields, improve AI, save states)
  - `editor.ai_gate` — Pro gate banner en editor (3 claves)
  - `public_cv` — página pública del CV (2 claves)
  - `editor.cv_review` — panel Revisión IA del CV (16 claves)
  - `editor.upgrade` — modal de upgrade (1 clave toast)
  - `editor.ai_profile_fill` — panel "Ayúdate con la IA" (35 claves totales tras sesión 2026-04-28)
  - `cover_letter_editor` — expandido con salutation, body placeholder, toolbar, export labels

---

## Pro Gate — Restricción de acceso a IA

Todos los features de IA son exclusivos del plan Pro. No existe ningún feature de IA gratuito (excepto los beneficios del programa de referidos).

**Arquitectura:**
- `components/editor/EditorContext.tsx` — React Context que provee `isPro: boolean` y `openUpgrade: () => void`. Monta `UpgradeModal` internamente. Envuelto en `EditorLayout.tsx` con `<EditorProvider isPro={hasAccess}>`.
- `components/editor/AIProGate.tsx` — wrapper para cualquier feature de IA en el editor. Si `isPro === false`, muestra banner con candado (`<Lock>`) y botón "Ver planes Pro" en lugar del feature.
- En `FormPanel.tsx`: `ATSScorePanel` envuelto con `<AIProGate>` en tab "ATS". `AIProfileFillPanel` envuelto con `<AIProGate>` al final del tab "Contenido".
- `CVReviewPanel` eliminado — funcionalidad integrada en `ATSScorePanel`.
- En `Summary.tsx` y `WorkExperience.tsx`: botones de IA usan `useEditorPro()` para detectar si es Pro, y llaman `openUpgrade()` si no lo es.
- En `CoverLetterEditor.tsx`: recibe `isPro` como prop desde la página y monta su propio `UpgradeModal`.
- i18n: `editor.ai_gate` (3 claves: title, description, cta).

---

## Notificaciones Toast — Configuración visual

- Posición: `top-center` (en `app/layout.tsx`)
- Biblioteca: Sonner (`components/ui/sonner.tsx`)
- Estilos por tipo vía `toastOptions.classNames`:
  - Success: fondo `green-50`, texto `green-900`, borde `green-700`
  - Error: fondo `red-50`, texto `red-900`, borde `red-700`
  - Warning: fondo `amber-50`, texto `amber-900`, borde `amber-700`
  - Info: fondo `blue-50`, texto `blue-900`, borde `blue-700`
- Bordes `2px` (`!border-2`), esquinas `xl`, sombra `xl`.

---

## UX de IA — Guías de uso y disclaimers

### Panel ATS Score (`components/editor/ATSScorePanel.tsx`)
- Requiere pegar el **texto completo de una oferta de empleo** (título, responsabilidades, requisitos). No acepta preguntas ni instrucciones libres.
- Hint visible debajo del textarea: "Copia y pega el texto de la oferta de empleo tal como aparece en LinkedIn, Indeed u otro portal."
- Placeholder actualizado para dejar claro qué tipo de texto se espera.
- Error off-topic (422): muestra `ATSErrorBlock` con borde rojo explicando que el texto no es una vacante real.
- La restricción es intencional: el ATS Score necesita una job description real para calcular compatibilidad. No es un chat general.

### Disclaimer de métricas (todos los paneles de versiones IA)
- Todos los paneles que muestran versiones generadas por IA incluyen un aviso ámbar:
  > ⚠ Los números entre corchetes como [X%] son marcadores de posición. Sustitúyelos con tus métricas reales.
- Aplica en: `WorkExperience.tsx`, `Summary.tsx`, `CoverLetterEditor.tsx` (panel de mejora)

---

### Infraestructura (no código)

| Tarea | Estado |
|-------|--------|
| Agregar `OPENAI_API_KEY` en Dokploy | ✅ Listo |
| Configurar cron job en Dokploy `0 9 * * *` → `/api/cron/renewal-reminder` | ✅ Listo |
| Configurar cron job en Dokploy `0 8 * * *` → `/api/cron/application-reminders` | ✅ Listo |
| Reenviar evento `invoice.paid` en Stripe para setear `subscriptionEndsAt` | ✅ Listo |

---

## Roadmap de producto — 6 meses (desde abril 2026)

Objetivo: justificar y aumentar el valor percibido del plan Pro ($15/mo · $144/yr).

> **Nota de arquitectura:** el orden de los meses es deliberado. No adelantar features de meses posteriores — cada mes construye sobre el anterior para maximizar retención.

| Mes | Objetivo | Features | Métrica de éxito |
|-----|----------|----------|-----------------|
| **1** | Editor sólido | Historial de versiones del CV (últimas 10), duplicado de secciones, guardado automático | Reducir abandono del editor 20% |
| **2** | Exportación premium | PDF con múltiples diseños, exportación Word (.docx), vista previa antes de descargar | 40% de usuarios Pro descarga en primeros 3 días |
| **3** | IA — ATS Score | Análisis de compatibilidad CV con descripciones de trabajo, sugerencias de keywords | NPS +15, retención mes 3 >65% |
| **4** | Tracker de candidaturas | Pipeline visual (Aplicado → Entrevista → Oferta), recordatorios | DAU +30%, sesiones más largas |
| **5** | Carta de presentación IA | Generación automática personalizada por empresa/rol usando el CV del usuario | Conversión Free→Pro +25% |
| **6** | Viralidad | Programa de referidos, CV público compartible con link, feedback de terceros | CAC reducido 30%, referidos >15% nuevos usuarios |

**SDK de IA disponible:** `@anthropic-ai/sdk` ya está instalado. Usar para Mes 3 (ATS Score) y Mes 5 (carta IA). Quick wins: mejorar bullets de experiencia y generar resumen profesional se pueden lanzar en Mes 1.

---

## IA — Configuración centralizada

- **`lib/ai-client.ts`** — módulo compartido para todos los endpoints de IA. Exporta:
  - `getOpenAI()` — cliente lazy (nunca a nivel de módulo)
  - `AI_MODEL = "gpt-4o-mini"` — modelo único para todo el proyecto
  - `AI_TEMPERATURE = 0.4` — temperatura estándar (balance determinismo/creatividad)
  - `checkRateLimit(ip, limit?)` — rate limiter en memoria (20 req/IP/hr por defecto). **Limitación conocida:** se resetea en cada deploy (in-memory). Migrar a BD por `userId` antes de 500 usuarios Pro activos.
  - `buildResumeContext(sectionData)` — extrae texto plano del CV completo (incluye idiomas, certificaciones, proyectos) para enviar al prompt
- Todos los endpoints de IA usan este módulo — **nunca duplicar `getOpenAI()` o `checkRateLimit()` en los routes**
- `improve-bullet` acepta campos adicionales opcionales: `employer` e `industry` para dar más contexto al prompt

## IA — Configuración de tokens por endpoint

Optimizado 2026-04-28. Valores calibrados para eliminar tokens de output desperdiciados sin impacto en calidad.

| Endpoint | max_tokens | Razón |
|----------|------------|-------|
| `improve-bullet` | 600 | 3 bullets × 30 words ≈ 150 tokens reales. 600 = 4x headroom. |
| `generate-summary` | 500 | 3 resúmenes × 80 words ≈ 300 tokens + JSON overhead. |
| `improve-summary` | 700 | Igual que generate-summary + contexto adicional del usuario. |
| `generate-cover-letter` | 900 | 1 carta × 250 words ≈ 325 tokens + JSON. |
| `improve-cover-letter` | 1000 | 3 cartas × 200 words ≈ 780 tokens + JSON. Prompt incluye "máx 200 palabras/versión". |
| `ats-score` | 800 | Output JSON estructurado: score + 3-5 items por campo ≈ 600-700 tokens. |
| `review-cv` | 900 | JSON estructurado con strengths/improvements/answer ≈ 700 tokens. |
| `fill-profile` | 700 | summary + jobTitle + 8 skills + section updates ≈ 500 tokens. |
| `suggest-skills` | 400 | 10 skills con niveles ≈ 150 tokens. 400 = 2.5x headroom. |

**Regla:** No subir `max_tokens` sin justificación en PR. El modelo no genera más calidad con más tokens — solo más relleno.

**`ats-score` — truncado server-side:** el input `jobDescription` se trunca a **6,000 chars** antes de enviarse al modelo. Cubre el 95%+ de job descriptions reales sin pérdida de calidad (las secciones descartadas son disclaimers legales y "About Our Culture", no requisitos). La validación `validateAIInput` acepta hasta 6,000 chars.

## IA — Costos estimados por llamada (GPT-4o-mini, abril 2026)

Pricing: $0.15/1M input tokens · $0.60/1M output tokens

| Endpoint | Costo/llamada | Costo 10x/mes |
|----------|---------------|---------------|
| `improve-bullet` | ~$0.00040 | $0.0040 |
| `generate-summary` | ~$0.00043 | $0.0043 |
| `improve-summary` | ~$0.00055 | $0.0055 |
| `ats-score` | ~$0.00099 | $0.0099 |
| `generate-cover-letter` | ~$0.00070 | $0.0070 |
| `improve-cover-letter` | ~$0.00076 | $0.0076 |
| `review-cv` | ~$0.00063 | $0.0063 |
| `fill-profile` | ~$0.00052 | $0.0052 |
| `suggest-skills` | ~$0.00033 | $0.0033 |

**Costo por usuario/mes:** casual $0.003 · regular $0.009 · power user $0.027. A 1,000 usuarios Pro: ~$13/mes en IA vs $15,000 MRR. Costo no es el problema hoy.

**Deuda técnica pendiente (en orden de prioridad):**
1. Migrar rate limiter de IP → `userId` en BD (antes de 500 usuarios Pro activos)
2. Agregar tabla `UsageLog` en Prisma para visibilidad por usuario/endpoint
3. Revisar si `ats-score` necesita bajar `max_tokens` de 800 → 600 tras datos reales

---

## Historial de versiones — Seguridad de snapshots

- El snapshot guardado en `ResumeVersion` se valida con Zod (`snapshotSchema` en `app/api/resumes/versions/route.ts`) antes de persistir y antes de restaurar
- Si un snapshot está corrupto en DB, el restore devuelve 422 en lugar de escribir datos inválidos
- El schema define la estructura exacta del snapshot: `{ title, sections, sectionData, config }`

---

## Historia de Usuario — Auto-ajuste de contenido entre plantillas

**Historia:** Como usuario Pro, quiero que mi contenido se adapte automáticamente cuando cambio de plantilla, para no tener que reescribir ni reorganizar mi CV manualmente.

**Estimación:** 13 story points. Hacer spike técnico de 2 días antes de comprometer en sprint — el riesgo principal es el `templateAdapter` con 30 plantillas.

**Criterios de aceptación (Given/When/Then):**

1. **Dado** que tengo un CV completo, **cuando** cambio de plantilla, **entonces** todos los campos aparecen sin pérdida de datos.
2. **Dado** que la nueva plantilla tiene menos espacio para la bio, **cuando** el texto supera el límite, **entonces** se trunca visualmente con indicador de overflow sin eliminar el contenido real.
3. **Dado** que cambio a una plantilla sin sección de foto, **cuando** tenía foto cargada, **entonces** la foto se oculta pero se conserva para plantillas que sí la soporten.
4. **Dado** que la plantilla destino tiene secciones en distinto orden, **cuando** aplico el cambio, **entonces** el contenido respeta el orden de la nueva plantilla.
5. **Dado** que cambio de plantilla, **cuando** el cambio ocurre, **entonces** se muestra un preview antes de confirmar.
6. **Dado** que confirmo el cambio, **cuando** algo no encaja bien, **entonces** puedo deshacer con un clic.

**Definición de Done:** Tests de integración para las 30 plantillas · Sin regresiones en guardado · Accesible por teclado · Tiempo de cambio <800ms.

---

## Análisis IA — Bot para CV profesional

El SDK `@anthropic-ai/sdk ^0.88.0` ya está instalado pero sin uso. Viabilidad: **Alta**.

Features por complejidad:

| Feature | Complejidad | Impacto | Mes en roadmap |
|---------|-------------|---------|----------------|
| Mejorar redacción de bullet de experiencia | Baja | Alto | ✅ Mes 1 |
| Generar resumen profesional desde el CV | Baja | Alto | ✅ Mes 1 |
| Sugerir habilidades según rol/industria | Media | Alto | ⏳ Mes 3 |
| ATS Score contra descripción de trabajo | Media | Muy alto | ✅ Mes 3 |
| CV completo desde cero con entrevista guiada | Alta | Muy alto | Mes 5+ |

**Activar solo para usuarios Pro** — refuerza el valor de la suscripción directamente.
