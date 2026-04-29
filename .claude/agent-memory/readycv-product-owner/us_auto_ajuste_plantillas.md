---
name: US Auto-ajuste de contenido entre plantillas
description: Historia de usuario para adaptar contenido del CV al cambiar entre las 30 plantillas disponibles. 13 story points.
type: project
---

Feature programada para Mes 2 (Junio 2026). Plan Pro exclusivo.

**Why:** El cambio de plantilla es un momento de alta friccion. Si el usuario pierde datos o tiene que reconfigurar, abandona la feature y percibe menos valor en Pro.

**How to apply:** Al refinar tecnicamente esta US, recordar que el `templateAdapter.ts` es el componente central y la inmutabilidad del `cvData` en DB es condicion de rechazo del sprint.

## Detalles clave
- Story points: 13 (Fibonacci)
- Componente critico: `templateAdapter.ts` (5 SP)
- `templateConfig` necesita campos: `sectionOrder`, `minFontSize`, `maxItemsPerSection`, `supportedSections`
- Preview en hover: target < 800ms
- Reversion: 30 segundos post-cambio, solo estado de sesion (no DB)
- 8 criterios de aceptacion definidos (AC-1 a AC-8)
- 6 casos limite documentados
