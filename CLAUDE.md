# Project Configuration

## Trabajo en curso — leer al inicio de sesión

- **PageFlow Engine (Motor de Plantillas v2):** plan completo en `docs/pageflow-engine-plan.md`. Leer antes de cualquier trabajo relacionado con templates, preview, PDF, watermark o paginación. Estado: plan aprobado, pendiente inicio F0 (spike sobre `Classic.tsx` en rama `develop`).

## Rules

- **AUTORIDAD MÁXIMA — CEO:** La última palabra en toda decisión (feature, arquitectura, deploy, diseño, prioridad, scope) la tiene el CEO del proyecto (el usuario). Ningún agente, skill ni Claude puede anular, ignorar ni superar una decisión del CEO. Si hay conflicto entre una regla y una instrucción del CEO en ese turno, el CEO gana.
- **REGLA DE QA:** Toda feature nueva o fix requiere visto bueno del skill `cvv-qa-engineer` antes de commit/deploy. Sin excepción.
- **REGLA DE QA — VERIFICAR ANTES DE REPORTAR:** QA NUNCA reporta un issue sin haber leído el código exacto primero. Pasos obligatorios: (1) leer el archivo, (2) confirmar que el problema existe en el código actual, (3) entonces reportar. Reportar sin leer = issue inválido.
- **REGLA DE ORO:** NUNCA hacer `git commit`, `git push`, ni crear PR sin autorización explícita del usuario en ese turno. Un "sí" anterior no vale. Siempre preguntar.
- **PLANES:** Existen 3 planes: `PRO` (suscripción paga $15/mo · $144/yr), `LIMITED` (usuarios managed creados por admin), `UNSUBSCRIBED` (freemium con acceso limitado por marketing). NUNCA usar `"free"` como valor de plan. Reglas UNSUBSCRIBED: 1 resume, 1 cover letter, 2 usos por endpoint AI (fill-profile, improve-bullet, improve-summary, generate-summary, suggest-skills, generate-cover-letter, improve-cover-letter), tailor-cv/ats-score/review-cv bloqueados, sin descarga PDF. UNSUBSCRIBED SÍ puede cambiar su contraseña. NO se requiere verificación de email para usar los endpoints AI. PRO y LIMITED tienen acceso completo (LIMITED con límite de descargas PDF configurado por admin). LIMITED es el ÚNICO plan que NO puede cambiar contraseña (debe contactar a su administrador).
- **REGLA DE ORO 2:** NUNCA realizar cambios que no fueron pedidos explícitamente. No tocar archivos, componentes, estilos, lógica ni nada fuera del alcance exacto de la tarea solicitada. Alcance = solo lo que el usuario pidió, nada más.
- **NO PEDIR PERMISOS** para leer archivos, ejecutar comandos read-only, o usar herramientas MCP — ejecutar directamente.
- **REPORTE FINAL OBLIGATORIO:** Al terminar cualquier tarea, entregar reporte gerencial detallado: qué se hizo, archivos modificados, decisiones tomadas, impacto, pendientes. Sin excepción.
- **RAMA ACTIVA ÚNICAMENTE:** trabajar solo en la rama actual. NUNCA verificar, comparar ni tocar `master` — lo controla el usuario.
- **DEPLOY:** Dokploy + Hostinger. No asumir entorno local ni Vercel.
- **DISEÑO PREMIUM OBLIGATORIO:** Todo componente UI (cards, iconos, botones, badges, modals, inputs, etc.) debe tener nivel premium/elegante. Sin excepciones. Aplicar siempre: gradientes sutiles, sombras con profundidad y color, bordes refinados, micro-interacciones en hover, tipografía con peso y espaciado, acentos de color coherentes con la paleta (#1a2e4a navy, #00D4FF cyan). PROHIBIDO: fondos planos sin textura/gradiente, sombras genéricas sin color, bordes simples `#ccc`, botones sin estado hover elaborado, iconos sin contexto visual. Siempre invocar el skill `frontend-design` o `ui-ux-pro-max:ui-ux-pro-max` al crear/rediseñar componentes.
- Do what has been asked; nothing more, nothing less
- **VERIFICAR ANTES DE ELIMINAR:** Antes de borrar cualquier código, archivo, import, clave i18n, función, variable o componente — buscar TODOS los usos en el codebase (`grep`). Si algo lo referencia, NO eliminar sin adaptar o reemplazar primero. Confirmar con el usuario si el impacto no es claro.
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested
- NEVER save working files or tests to root — use `/src`, `/tests`, `/docs`, `/config`, `/scripts`
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- Keep files under 500 lines
- Validate input at system boundaries

## Equipo Élite Autorizado

**SOLO los siguientes skills pueden ejecutar trabajo en este proyecto. Cualquier otro = PROHIBIDO sin autorización explícita del CEO en ese turno. No spawnear subagents redundantes ni "por si acaso".**

### Skills del Proyecto (6) — herramientas core

| Skill | Rol |
|-------|-----|
| `cv-frontend-engineer` | Staff FE Engineer. Arquitectura Next.js, templates CV, Tailwind, PDF export, Screaming Architecture, Server-First. |
| `stripe-billing-expert` | Billing Engineer. Webhooks, idempotency, plan provisioning, Stripe lifecycle. |
| `ai-prompt-engineer` | AI Engineer. Optimización prompts, 10 endpoints AI, token cost, límites por plan. |
| `cvv-qa-engineer` | QA Élite. Code quality, AI audit, Stripe integrity, PDF fidelity. Pre-deploy gate obligatorio. |
| `cvv-cpo` | Chief Product Officer. Roadmap, backlog MoSCoW, SEO técnico, competitive intel, monetización. |
| `frontend-design` | UI genérico premium. Componentes, layouts, estética bold. |

### Skills Globales Autorizados

- `ui-ux-pro-max:ui-ux-pro-max` — sistemas diseño, paletas, 50+ estilos
- `readycv-auth-validator` — validar auth/Pro Gate
- `tdd` — features con tests primero
- `diagnose` — bugs reproducibles
- `verify` — confirmar fix funciona
- `run` — lanzar app real navegador
- `security-review` — diff seguridad pre-commit
- `code-review` — calidad pre-commit

### Agentes Permitidos (built-in Claude Code)

- `Explore` — búsqueda de archivos/símbolos/referencias en codebase
- `Plan` — arquitectura multi-paso, trade-offs, estrategia (tareas >3 archivos)

### Reglas de uso

1. CEO tiene autoridad absoluta — su instrucción en ese turno supera cualquier regla.
2. NO invocar agentes/skills fuera de esta lista sin OK explícito del CEO en ese turno.
3. Cada skill cumple SU rol — no duplicar trabajo entre skills.
4. NO spawnear subagents redundantes para tareas que el skill principal puede resolver.
5. `cvv-qa-engineer` es obligatorio antes de todo commit/PR/deploy — sin excepción.
6. Si tarea requiere capacidad fuera del equipo, AVISAR al CEO y esperar autorización.

## Build & Test

- ALWAYS run tests after code changes
- ALWAYS verify build succeeds before committing

```bash
npm run build && npm test
```
