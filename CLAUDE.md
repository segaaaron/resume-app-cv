# Project Configuration

## Rules

- **REGLA DE QA:** Toda feature nueva o fix requiere visto bueno del agente `readycvv-qa-senior` antes de commit/deploy. Sin excepción.
- **REGLA DE ORO:** NUNCA hacer `git commit`, `git push`, ni crear PR sin autorización explícita del usuario en ese turno. Un "sí" anterior no vale. Siempre preguntar.
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

## Build & Test

- ALWAYS run tests after code changes
- ALWAYS verify build succeeds before committing

```bash
npm run build && npm test
```
