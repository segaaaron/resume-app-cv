# Project Configuration

## Rules

- **REGLA DE QA:** Toda feature nueva o fix requiere visto bueno del agente `readycvv-qa-senior` antes de commit/deploy. Sin excepción.
- **REGLA DE ORO:** NUNCA hacer `git commit`, `git push`, ni crear PR sin autorización explícita del usuario en ese turno. Un "sí" anterior no vale. Siempre preguntar.
- **NO PEDIR PERMISOS** para leer archivos, ejecutar comandos read-only, o usar herramientas MCP — ejecutar directamente.
- **REPORTE FINAL OBLIGATORIO:** Al terminar cualquier tarea, entregar reporte gerencial detallado: qué se hizo, archivos modificados, decisiones tomadas, impacto, pendientes. Sin excepción.
- **RAMA ACTIVA ÚNICAMENTE:** trabajar solo en la rama actual. NUNCA verificar, comparar ni tocar `master` — lo controla el usuario.
- **DEPLOY:** Dokploy + Hostinger. No asumir entorno local ni Vercel.
- Do what has been asked; nothing more, nothing less
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
