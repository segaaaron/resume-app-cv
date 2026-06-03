# Project Configuration

## Rules

- **REGLA DE QA:** Toda feature nueva o fix requiere visto bueno del agente `readycvv-qa-senior` antes de commit/deploy. Sin excepción.
- **REGLA DE QA — VERIFICAR ANTES DE REPORTAR:** QA NUNCA reporta un issue sin haber leído el código exacto primero. Pasos obligatorios: (1) leer el archivo, (2) confirmar que el problema existe en el código actual, (3) entonces reportar. Reportar sin leer = issue inválido.
- **REGLA DE ORO:** NUNCA hacer `git commit`, `git push`, ni crear PR sin autorización explícita del usuario en ese turno. Un "sí" anterior no vale. Siempre preguntar.
- **SOLO PLAN PRO:** Este proyecto NO tiene plan gratuito. Solo existe el plan PRO ($15/mo · $144/yr). NUNCA usar `"free"` como valor de plan, ni como default, ni en lógica de negocio. Plan sin acceso = string vacío o ausente.
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

**SOLO los siguientes agentes y skills pueden ejecutar trabajo en este proyecto. Cualquier otro = PROHIBIDO sin autorización explícita del usuario en ese turno. No spawnear subagents redundantes ni "por si acaso".**

### Agentes (10) — roles únicos

| Agente | Rol |
|--------|-----|
| `readycvv-qa-senior` | QA Lead. Auditoría templates, Stripe, API, seguridad, pre-deploy. Obligatorio antes commit/PR/deploy. |
| `readycv-product-owner` | Product Owner. Backlog, MoSCoW, user stories, retención, análisis churn/feedback. |
| `frontend-doc-architect` | Document Engineer. Templates CV, PDF/Word export, print layouts, Tailwind avanzado, Next.js components. |
| `backend-dev` | Backend Engineer. API routes, Prisma, Stripe webhooks, endpoints AI, validación Zod. |
| `security-auditor` | Security Lead. Auth, JWT, CSRF, rate-limit, secrets, OWASP, PII. |
| `tester` | Test Engineer. Unit, integration, edge cases, regression. |
| `reviewer` | Code Reviewer. Calidad, smells, patrones, consistency. Pre-PR. |
| `Explore` | Code Search. Localizar archivos, símbolos, referencias. |
| `Plan` | Solution Architect. Diseño multi-paso, trade-offs, estrategia. Tareas >3 archivos. |
| `production-validator` | Deploy Gate. Verificar prod-ready, env vars, build, migraciones. Antes Dokploy deploy. |

### Skills (13) — herramientas autorizadas

- `readycv-auth-validator` — validar auth/Pro Gate
- `frontend-design` — componentes UI premium
- `ui-ux-pro-max:ui-ux-pro-max` — sistemas diseño, paletas, layouts
- `claude-api` — endpoints AI (fill-profile, summary)
- `tdd` — features con tests primero
- `diagnose` — bugs reproducibles
- `systematic-debugging` — bugs complejos
- `verification-before-completion` — verificar antes "done"
- `brainstorming` — pre-implementación features
- `writing-plans` — specs multi-step
- `verify` — confirmar fix funciona
- `run` — lanzar app real navegador
- `security-review` — diff seguridad pre-commit

### Reglas de uso

1. NO invocar agentes/skills fuera de esta lista sin OK explícito del usuario en ese turno.
2. Cada agente cumple SU rol — no duplicar trabajo entre agentes.
3. NO spawnear subagents redundantes para tareas que el agente principal puede resolver.
4. Excepción permitida: `update-config` solo si usuario pide cambiar `settings.json`.
5. Para dudas Claude Code/SDK puede usarse `claude-code-guide` puntualmente.
6. Si tarea requiere capacidad fuera del equipo, AVISAR al usuario y esperar autorización antes de invocar otro agente/skill.

## Build & Test

- ALWAYS run tests after code changes
- ALWAYS verify build succeeds before committing

```bash
npm run build && npm test
```
