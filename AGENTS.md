<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Regla de ramas

- `develop` = frontend + backend (Next.js app)
- `pdf-microservice` = motor PDF (`services/pdf-generator/`)
- Cualquier cambio en el microservicio: hacer `git checkout pdf-microservice` PRIMERO. NUNCA modificar `services/pdf-generator/` desde `develop`.
