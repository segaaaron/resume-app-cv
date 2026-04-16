# CVV Pro — Documentación de Desarrollo

## Descripción General

CVV Pro es una aplicación web de construcción de currículums vitae y cartas de presentación con seguimiento de candidaturas laborales. Construida con Next.js 16 (App Router), Prisma/PostgreSQL, NextAuth v5, Zustand y TailwindCSS 4.

---

## Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| Framework | Next.js 16.2.3 (App Router) |
| UI | React 19, TailwindCSS 4, shadcn/ui |
| Auth | NextAuth v5 (beta) + @auth/prisma-adapter |
| Base de datos | PostgreSQL + Prisma 7 |
| Estado | Zustand + Immer |
| Validación | Zod + react-hook-form |
| Notificaciones | Sonner (toasts) |
| Drag & Drop | @dnd-kit |
| Pagos | Stripe (configurado, pendiente implementación) |

---

## Estructura del Proyecto

```
cvv-pro-app/
├── app/
│   ├── (auth)/              # Login, Register
│   ├── (dashboard)/         # Dashboard protegido
│   │   └── dashboard/
│   │       ├── resumes/     # Lista de CVs
│   │       ├── cover-letters/ # Lista de cartas
│   │       ├── applications/  # Kanban de candidaturas
│   │       ├── jobs/          # Bolsa de trabajo (stub Fase 3)
│   │       └── settings/      # Configuración de cuenta
│   ├── (editor)/            # Editor de CV
│   │   └── editor/[id]/
│   ├── cover-letter/[id]/   # Editor de carta de presentación
│   ├── resume/[id]/print/   # Página de impresión/PDF
│   ├── api/
│   │   ├── auth/            # NextAuth handlers + register
│   │   ├── resumes/         # CRUD + duplicate endpoint
│   │   ├── cover-letters/   # CRUD completo
│   │   ├── applications/    # CRUD completo
│   │   ├── user/profile/    # PATCH nombre de usuario
│   │   └── export/pdf/      # Stub (redirigir a /print)
│   ├── pricing/             # Página de precios (marketing)
│   └── templates/           # Galería de plantillas (marketing)
├── components/
│   ├── auth/                # LoginForm, RegisterForm
│   ├── cover-letter/        # CoverLetterEditor
│   ├── dashboard/           # DashboardNav, ResumesDashboard,
│   │                        # CoverLettersDashboard, SettingsForm
│   ├── editor/              # EditorLayout, FormPanel, PreviewPanel,
│   │                        # EditorTopBar, DesignPanel, TemplateSwitcher
│   │                        # + secciones (PersonalDetails, WorkExperience, etc.)
│   ├── kanban/              # Board, Column (drag & drop)
│   ├── marketing/           # Navbar, Hero, Features, etc.
│   ├── resume/
│   │   ├── ResumePreview.tsx  # Selector de template dinámico
│   │   ├── PrintLayout.tsx    # Layout de impresión/PDF
│   │   └── templates/         # 12 templates implementados
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth.ts              # Configuración NextAuth
│   └── db.ts                # Singleton Prisma client
├── stores/
│   ├── resumeStore.ts       # Estado global del editor de CV
│   └── applicationStore.ts  # Estado del tablero kanban
├── types/
│   └── resume.ts            # Zod schemas + TypeScript types + constantes
└── prisma/
    └── schema.prisma        # Modelos: User, Resume, CoverLetter, Application
```

---

## Variables de Entorno Requeridas

Crear `.env` en la raíz con:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cvvpro"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generado con openssl rand -base64 32>"

GOOGLE_CLIENT_ID="<de Google Cloud Console>"
GOOGLE_CLIENT_SECRET="<de Google Cloud Console>"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_TRIAL="price_..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Setup Local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env con las variables anteriores

# 3. Crear base de datos y aplicar schema
npx prisma migrate dev --name init

# 4. (Opcional) Abrir Prisma Studio
npx prisma studio

# 5. Iniciar servidor de desarrollo
npm run dev
```

---

## Autenticación

**Providers configurados:**
- Email/password con bcryptjs
- Google OAuth

**Flujo de registro:** `POST /api/auth/register` → bcrypt hash → Prisma create

**Rutas protegidas** (via `middleware.ts`):
- `/dashboard/*` → redirige a `/login` si no autenticado
- `/editor/*` → redirige a `/login` si no autenticado
- `/cover-letter/*` → redirige a `/login` si no autenticado

**Planes de usuario:** `FREE | TRIAL | PRO` (campo en modelo `User`)

---

## Plantillas de CV

12 plantillas implementadas en `components/resume/templates/`:

| ID | Nombre | Estilo | Columnas | Foto |
|----|--------|--------|----------|------|
| `classic` | Clásico | Limpio y minimalista | 1 col | No |
| `modern` | Moderno | Sidebar colorido | 2 col | Sí |
| `professional` | Profesional | Header band + sidebar | 2 col | Sí |
| `elegant` | Elegante | Centrado, tipografía fina | 1 col | No |
| `circular` | Circular | Header curvo | 3 col | Sí |
| `vertical` | Vertical | Sidebar izquierda ancha | 2 col | Sí |
| `horizontal` | Horizontal | Header completo, skills-bar | 2 col | No |
| `simple` | Simple | Ultra minimalista | 1 col | No |
| `chrono` | Chrono | Timeline cronológico | 1 col | No |
| `casual` | Casual | Cards coloridas | 2 col | Sí |
| `luxurious` | Lujoso | Header oscuro + cuerpo claro | 3 col | Sí |
| `metro` | Metro | Metro/tiles, tipografía bold | 2 col | No |

**Cómo añadir un template nuevo:**
1. Crear `components/resume/templates/NuevoTemplate.tsx`
2. Usar `useResumeStore()` para leer datos
3. Importar y registrar en `components/resume/ResumePreview.tsx` → `TEMPLATE_MAP`
4. Agregar metadatos en `types/resume.ts` → array `TEMPLATES`

---

## Editor de CV

**Flujo de datos:**

```
DB (Prisma) → Server Component (page.tsx) → EditorLayout → useResumeStore
                                                              ↓
                                                    FormPanel + PreviewPanel
```

**Estado global (`resumeStore`):**
- `resumeId`, `title`, `sections[]`, `sectionData`, `config`
- `isDirty`, `isSaving`, `lastSaved`
- Auto-guardado manual (botón Guardar) y dirty tracking

**Secciones disponibles:** personalDetails, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references, hobbies

---

## Exportación PDF

**Método implementado:** Página de impresión del navegador (`window.print()`)

- URL: `/resume/[id]/print`
- Renderiza el CV completo en tamaño A4
- Botón "Imprimir / Guardar PDF" → `window.print()`
- CSS `@media print` oculta la barra de herramientas
- `@page { size: A4; margin: 0; }` para página exacta

**Cómo usar desde el editor:** Botón "PDF" en la barra superior del editor.

---

## Cartas de Presentación

**API:**
- `GET /api/cover-letters` — listar cartas del usuario
- `POST /api/cover-letters` — crear nueva carta
- `GET /api/cover-letters/[id]` — obtener carta
- `PATCH /api/cover-letters/[id]` — actualizar (title, content, colorScheme, fontFamily)
- `DELETE /api/cover-letters/[id]` — eliminar

**Estructura del `content` (JSON):**
```json
{
  "recipientName": "string",
  "recipientTitle": "string",
  "company": "string",
  "body": "string",
  "closing": "string"
}
```

**Editor:** `/cover-letter/[id]` — panel de formulario + preview A4 en tiempo real

---

## Seguimiento de Candidaturas (Kanban)

**Estados:** `WISHLIST → APPLIED → INTERVIEW → OFFER → REJECTED`

**API:**
- `GET/POST /api/applications` — listar y crear
- `PATCH/DELETE /api/applications/[id]` — actualizar estado/datos y eliminar

**Drag & Drop:** `@dnd-kit` con `DndContext` + `SortableContext`

---

## API Routes Completas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro con email/password |
| GET | `/api/resumes` | Listar CVs del usuario |
| POST | `/api/resumes` | Crear nuevo CV |
| GET | `/api/resumes/[id]` | Obtener CV |
| PATCH | `/api/resumes/[id]` | Actualizar CV |
| DELETE | `/api/resumes/[id]` | Eliminar CV |
| POST | `/api/resumes/[id]/duplicate` | Duplicar CV |
| GET | `/api/cover-letters` | Listar cartas |
| POST | `/api/cover-letters` | Crear carta |
| GET | `/api/cover-letters/[id]` | Obtener carta |
| PATCH | `/api/cover-letters/[id]` | Actualizar carta |
| DELETE | `/api/cover-letters/[id]` | Eliminar carta |
| GET | `/api/applications` | Listar candidaturas |
| POST | `/api/applications` | Crear candidatura |
| PATCH | `/api/applications/[id]` | Actualizar candidatura |
| DELETE | `/api/applications/[id]` | Eliminar candidatura |
| PATCH | `/api/user/profile` | Actualizar nombre de usuario |

---

## Pendiente / Roadmap

### Fase 2 (Próximo)
- [ ] Integración Stripe para planes Pro/Trial
- [ ] Lógica de límites según plan (ej: máx 3 CVs en plan FREE)
- [ ] Upload de foto de perfil en CV (actualmente solo URL)
- [ ] Importar CV desde LinkedIn/PDF

### Fase 3 (Futuro)
- [ ] Bolsa de trabajo (`/dashboard/jobs`) — actualmente stub
- [ ] Análisis ATS del CV
- [ ] Colaboración en tiempo real
- [ ] Historial de versiones del CV
- [ ] Exportación a Word (.docx)
- [ ] Soporte multi-idioma con next-intl (ya instalado)

### Bugs conocidos (pre-existentes)
- `lib/db.ts` — error de tipo con Prisma v7 (funciona en runtime)
- `lib/auth.ts` — property `plan` en AdapterUser (funciona en runtime con cast)
- `SectionBlock.tsx`, `Board.tsx` — `asChild` prop typing con shadcn versión actual

---

## Decisiones de Arquitectura

1. **Zustand sobre Context API:** Mejor rendimiento, devtools, menos re-renders
2. **Immer middleware:** Mutaciones inmutables más legibles
3. **PDF vía `window.print()`:** Más simple y fiel al diseño que @react-pdf/renderer que requería componentes separados sin hooks
4. **Server Components para carga inicial:** Los editores cargan datos en el servidor y los pasan como props al store del cliente
5. **`personalDetails` como JSON único:** Almacena todas las secciones en un solo campo JSON en Prisma para flexibilidad de schema evolution
