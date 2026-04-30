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

### Sesión 2026-04-29 — 40 nuevas plantillas Pro + fixes de calidad

#### Templates eliminados (irrelevantes)
9 templates Pro removidos del sistema: `helix`, `prism`, `nautical`, `cobalt`, `duality`, `obsidian`, `lisbon`, `havana`, `tokyo`.
Archivos afectados: `types/resume.ts` (TemplateId union + TEMPLATES array), `components/resume/ResumePreview.tsx` (imports + TEMPLATE_MAP), `components/editor/TemplateSwitcher.tsx` (PRO_IDS + thumbs + switch cases).

#### Fixes en templates existentes

| Fix | Archivos |
|-----|---------|
| Eliminar barras decorativas de metadatos (`VOL. 26 · NO. 04`, etc.) | `DataDriven.tsx`, `SwissGrid.tsx`, `MagazineSpread.tsx`, `EditorialSerif.tsx` |
| CharcoalClassic: sidebar oscuro → crema claro (fondo `ink` eliminado, texto dark) | `CharcoalClassic.tsx` |
| CharcoalClassic: añadir sección hobbies + bullets con `fmtDesc` + clase `.cc-desc` | `CharcoalClassic.tsx`, `app/globals.css` |
| Bullets inline (•) no se mostraban como lista: fix en `fmtDesc` (regex + globals CSS) | `lib/utils.ts`, `app/globals.css` |
| DataDriven: añadir bullets `fmtDesc` + alinear año/barra con título (`alignItems: "flex-start"`) | `DataDriven.tsx` |
| MagazineSpread: mostrar todos los bullets (eliminado `.slice(0, 120)`) | `MagazineSpread.tsx` |
| IOSAppCV: cálculo incorrecto de años (`.slice(0,4)` en `"04/2015"` → `parseInt`=4) → fix con `.match(/\d{4}/)` | `IOSAppCV.tsx` |
| IOSAppCV: añadir bullets `fmtDesc` en experiencia | `IOSAppCV.tsx` |
| Slider crash: `thumbIndex` → `index` (base-ui v1.3) | `components/ui/slider.tsx` |
| DndContext hydration mismatch: `id="form-panel-dnd"` fijo | `components/editor/FormPanel.tsx` |
| 8 templates nuevos sin `fmtDesc`: añadido en SwissGrid, SageBotanical, NeoBrutalist, NavyExecutive, EditorialSerif, CoralSidebar, ClassicMono, BoldBlock | múltiples `*.tsx` |

**Fix crítico `fmtDesc` (`lib/utils.ts`):**
- Bullets inline `"texto • item1 • item2"` en una sola línea no se convertían a `<ul><li>`
- Nuevo regex: `normalized.replace(/([^\n])\s*•\s+/g, "$1\n• ")` — split inline bullets antes de parsear
- CSS `globals.css` con `!important` necesario — Tailwind preflight sobreescribía `list-style: none`

**Regla para TODOS los templates:** usar `fmtDesc(job.description)` con `dangerouslySetInnerHTML` y clase `resume-desc` (o alias) en descriptions. Nunca renderizar `job.description` directamente.

#### 40 nuevas plantillas Pro implementadas

8 packs de 5 templates cada uno. Todos en `components/resume/templates/`. Todos registrados en `types/resume.ts`, `ResumePreview.tsx` y `TemplateSwitcher.tsx` con SVG thumbnail único.

| Pack | IDs |
|------|-----|
| Creative | `risodesigner`, `uxtokens`, `sketchbookillustrator`, `blueprintcv`, `contactsheet` |
| Business | `annualreport`, `financeterminal`, `campaignposter`, `salespitch`, `ledgercv` |
| Health | `medicalchart`, `vitalsigns`, `vetcv`, `notebookcv`, `fieldjournal` |
| Legal/Edu | `legalbrief`, `engraved`, `chalkboard`, `academiccv`, `psychologist` |
| Hospitality | `chefmenu`, `sommelier`, `hotelcv`, `bartendercv`, `postcardcv` |
| Engineering | `codeeditor`, `civileng`, `mechanical`, `devopsterminal`, `processflow` |
| Arts | `frontpage`, `vinylcv`, `callsheet`, `copywritermag`, `animatorcv` |
| Other | `pilotlog`, `onboardingform`, `athletecard`, `translatorcv`, `herbariumcv` |

**Fixes post-registro:**
- `AnnualReport.tsx`: `job.country` no existe en tipo WorkExperience → removido, queda `job.city`
- `TemplateSwitcher.tsx`: 4 thumb functions usaban `<>` fragment en `.map()` sin key → error "Rendered more hooks than during the previous render". Fix: reemplazado `<>` por `<g key={i}>` (SVG group) en `AnnualReportThumb`, `FinanceTerminalThumb`, `SalesPitchThumb`, `LedgerCVThumb`

**Total plantillas Pro activas tras sesión:** 71 (anteriores) + 40 nuevas = ~111 plantillas (incluyendo las básicas Free)

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
| Configurar cron job en Dokploy `0 3 * * 0` → `/api/cron/purge-stripe-events` (domingo 3am, limpia StripeEvent > 90 días) | ⏳ Pendiente |

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

---

## Sesión 2026-04-29 — Website Marketing Overhaul (Sprint 1–3)

### Objetivo
Actualizar todo el copy del sitio para reflejar la realidad del producto: 40+ plantillas, 7 herramientas de IA, análisis ATS. Tres sprints completos (33 story points).

---

### Sprint 1 — Conversión (16 pts)

#### SEO metadata actualizada
Archivos: `messages/es.json`, `messages/en.json`

| Página | Cambio clave |
|--------|-------------|
| Home | "29 plantillas" → "40+ plantillas + IA + ATS" en title/description/og |
| Templates | "29 Diseños" → "40+ Diseños para todos los sectores" |
| Pricing | Feature list en beneficios, menciona IA y ATS Score |

#### Hero rewrite
- ES: "Crea el CV que consigue **la entrevista**"
- EN: "Build the CV that gets **the interview**"
- Subtitle menciona 40+ plantillas + 7 herramientas de IA + análisis ATS
- CTA primario: "Empezar gratis" / "Start free"
- `no_credit_card`: "Gratis para empezar · Sin tarjeta de crédito"

#### Nuevo componente: `components/marketing/AIFeatures.tsx`
- Sección con 7 herramientas de IA en 3 clusters: "Escribe mejor" · "Vence el algoritmo" · "Consigue la oferta"
- Badge "Pro" en cada card
- CTA al final → `/pricing`
- Wired en `app/[locale]/page.tsx` después de `FeatureCards`
- i18n: namespace `ai_features` (30 claves, es + en)

#### Nuevo componente: `components/marketing/ATSSection.tsx`
- Sección educativa ATS: "75% de CVs rechazados antes de llegar a un recruiter"
- Flujo visual 3 pasos: Aplicas → ATS escanea → Solo coincidencias llegan
- SVG mockup del ring ATS (score 72/100)
- CTA → `/pricing` con anchor `#ats-score`
- Wired en `app/[locale]/page.tsx` después de `AIFeatures`
- i18n: namespace `ats_section` (8 claves, es + en)

#### Pricing page restructure
- Features extendidas de 8 → 12 items, todas reescritas en lenguaje de beneficios
- `cancel_anytime`: "Cancela cuando quieras · Tus CVs siempre son tuyos"
- Nuevo `feature9` → `feature12`: historial versiones, CV compartible, import, cancel note
- `components/marketing/ComparisonTable.tsx` añadido al final de la página de precios

#### Nuevo componente: `components/marketing/ComparisonTable.tsx`
- Tabla Free vs Pro con 13 filas
- Checkmarks para Pro, guiones para Free (nunca ❌)
- Valores especiales para CVs (1 vs Unlimited), Templates (5 vs 40+), PDF (watermark vs clean)
- i18n: namespace `comparison_table` (21 claves, es + en)

#### JSON-LD homepage actualizado
- `featureList`: 8 items actualizados (40+ plantillas, ATS, IA, etc.)
- Precio oferta Pro: $10 → $15
- Descripción con IA + ATS

#### Features section (FeatureCards)
- 5 cards actualizadas: AI card → "7 Herramientas de IA", Templates → "40+", cover letter → "con IA"
- `how_it_works`: steps actualizados para mencionar IA y ATS

---

### Sprint 2 — Galería + T&C (11 pts)

#### Template gallery restructure (`app/[locale]/templates/page.tsx`)
- `PRO_IDS` corregido: 77 templates Pro (estaba con lista obsoleta de 15 IDs — incluía helix, prism, nautical, cobalt, duality, obsidian que fueron eliminados)
- Templates agrupados por 10 categorías dentro de la sección Pro:

| Categoría | IDs incluidos |
|-----------|--------------|
| Destacados | aurora, lumiere, consul, rose, minimal, wave, banner, vertex, prestige, apex, nova, cascade, onyx, mosaic, larsson, thompson, classicmono, editorialserif, boldblock, timelinevertical, swissgrid |
| Ciudad | kyoto, geneva, windsor, vienna, berlin, seoul, copenhagen, genevanoir, reykjavik |
| Creative | risodesigner, uxtokens, sketchbookillustrator, blueprintcv, contactsheet, charcoalclassic, navyexecutive, coralsidebar, neobrutalist, sagebotanical |
| Business | annualreport, financeterminal, campaignposter, salespitch, ledgercv, datadriven, boardingpass, magazinespread, terminalcv, iosappcv |
| Health & Science | medicalchart, vitalsigns, vetcv, fieldjournal |
| Legal & Academia | legalbrief, engraved, chalkboard, academiccv, psychologist |
| Hostelería | chefmenu, sommelier, hotelcv, bartendercv, postcardcv |
| Ingeniería & Tech | codeeditor, civileng, mechanical, devopsterminal, processflow, neon, sharp, bauhaus |
| Artes & Medios | frontpage, vinylcv, callsheet, copywritermag, animatorcv |
| Otros | pilotlog, onboardingform, athletecard, translatorcv, herbariumcv |

- Badge de categoría: `text-xs font-semibold uppercase tracking-widest` separador horizontal entre grupos
- `templates_page.badge`: "29 plantillas" → "40+ plantillas"
- `templates_page.title/subtitle`: actualizados con listado de sectores

#### T&C visual redesign (`app/[locale]/terms/page.tsx`)
- Layout dos columnas desktop: sidebar TOC (w-52, sticky top-8) + contenido (max-w-[680px])
- Container: `max-w-3xl` → `max-w-5xl` con flex gap-12
- Sidebar TOC en inglés y español: 18 secciones con anchor links `#terms-N`
- `id="terms-1"` ... `id="terms-18"` en todas las secciones, ambos idiomas
- Mobile: sidebar oculto (`hidden lg:block`), single-column como antes
- Cero cambios al contenido legal — solo layout

---

### Sprint 3 — SEO Blog (4 pts)

#### Blog index (`app/[locale]/blog/page.tsx`)
- Lista de 4 artículos con tag, tiempo de lectura, título y descripción por idioma
- Metadata SEO: namespace `metadata.blog_index`

#### 4 artículos SEO completos

| Artículo | URL | Keywords objetivo |
|----------|-----|------------------|
| ATS | `/blog/que-es-ats-y-por-que-rechaza-tu-cv` | "ats resume", "que es ats" |
| Bullets | `/blog/como-escribir-bullets-de-cv` | "bullets cv", "como escribir cv" |
| Free vs Paid | `/blog/constructores-de-cv-gratuitos-vs-pago` | "mejor constructor cv gratis vs pago" |
| Cover Letter | `/blog/carta-de-presentacion-2026` | "carta de presentacion 2026" |

Cada artículo tiene:
- Metadata SEO completa (title < 60 chars, description < 155 chars, OG, canonical)
- Contenido real (no placeholder) — 5-6 secciones por artículo, ~800-1000 palabras
- Bilingüe (es + en) en el mismo componente con flag `isEn`
- CTA al final → `/register` o `/pricing` según el ángulo del artículo
- Breadcrumb "← Volver al blog"
- `getTranslations("blog")` para textos UI (back, cta)

#### i18n nuevas claves en metadata
- `metadata.blog_index`, `metadata.blog_ats`, `metadata.blog_bullets`, `metadata.blog_free_vs_paid`, `metadata.blog_cover_letter` — en es.json y en.json
- Namespace `blog` (6 claves: back, published, reading_time, cta_title, cta_desc, cta_btn) — en es.json y en.json

---

### Regla: PRO_IDS en templates/page.tsx debe mantenerse sincronizada con TemplateSwitcher.tsx

La lista de IDs Pro está duplicada en dos archivos:
- `components/editor/TemplateSwitcher.tsx` — fuente de verdad (línea ~2533)
- `app/[locale]/templates/page.tsx` — copia que debe mantenerse igual

Si se añaden o eliminan templates Pro, actualizar ambos.

---

## Sesión 2026-04-29 — CV Examples showcase + limpieza de "Free"

### Limpieza de referencias a plan Free/Gratis

App es solo Pro ($15/mo · $144/yr) — no existe plan gratuito. Eliminadas todas las referencias:

| Archivo | Cambio |
|---------|--------|
| `components/marketing/ComparisonTable.tsx` | Eliminado (tabla Free vs Pro) |
| `app/[locale]/pricing/page.tsx` | Removida import + render de ComparisonTable |
| `app/[locale]/page.tsx` JSON-LD | Eliminada offer "price: 0" / "Plan gratuito" |
| `app/[locale]/templates/page.tsx` | `"plantillas cv gratis"` → `"plantillas cv profesionales"` |
| `es/en.json` hero CTA | `"Empezar gratis"/"Start free"` → `"Crear mi CV"/"Create my CV"` |
| `es/en.json` no_credit_card | Removido "Gratis para empezar" |
| `es/en.json` blog CTA | Removido "Gratis para empezar" del desc + btn |
| `es/en.json` plan_free | `"Básico"` → `"Sin plan activo"` |
| `es/en.json` feature3 | `"PDF sin marca de agua"` → `"Exportación PDF en alta calidad"` |
| `es/en.json` watermark_upgrade | Removida referencia a plan Free |
| `es/en.json` metadata.home.description | Removido "Gratis para empezar" |

### CV Examples showcase

Nuevo componente `components/marketing/CVExamples.tsx` en la homepage entre `ATSSection` y `TemplateGallery`.

**Arquitectura:**
- Server component. Usa `next/image` con imágenes estáticas en `public/examples/`.
- 5 ejemplos: tech (Nova), diseño (EditorialSerif), legal (Consul), salud (ClassicMono), hostelería (ChefMenu).
- Grid responsive: 2 cols mobile → 3 cols sm → 5 cols lg.
- CTA al final → `/register`.
- i18n: namespace `cv_examples` (7 claves: title, subtitle, 5 badges, cta).

**Screenshots pendientes (tarea del usuario):**
Los archivos de imagen deben crearse manualmente en el editor y guardarse como WebP optimizado en `public/examples/`:
- `cv-example-tech.webp`
- `cv-example-design.webp`
- `cv-example-legal.webp`
- `cv-example-health.webp`
- `cv-example-hospitality.webp`

Hasta que existan los archivos, el componente está listo pero no muestra imágenes.
