---
name: User Story CV Suggestions Apply
description: Feature de aplicar sugerencias de IA directamente al CV desde el panel CVReview — contrato de API, UX, riesgos y MoSCoW
type: project
---

Feature decidida en abril 2026. Should Have para el ciclo actual. ~7 días de desarrollo.

**Why:** Cierra el gap entre "la IA te dice qué mejorar" y "la IA lo mejora con un clic". Alto impacto en NPS y retención mes 3+.

**How to apply:** Al diseñar o revisar el panel CVReview, asumir que este feature está en el backlog y priorizado. No agregar otras formas de edición asistida por IA hasta que este esté completo.

## Contrato de API

Endpoint `POST /api/ai/review-cv` agrega campo `suggestions: CVSuggestion[]` (puede ser `[]`).

```typescript
type CVSuggestion = {
  id: string                   // nanoid del backend
  type: "replace" | "append"
  field: SuggestionField       // whitelist estricta
  targetId?: string            // para arrays: id del item a modificar
  label: string                // texto del botón
  preview: string              // valor nuevo listo para usar
  reason: string               // máx 15 palabras
}

type SuggestionField =
  | "summary"
  | "personalDetails.jobTitle"
  | "skills"
  | "workExperience.description"
  | "workExperience.jobTitle"
  | "languages"
  | "certifications"
```

## Reglas de scope v1

- Solo campos donde el valor es reemplazar o agregar texto
- Nunca datos factuales que la IA no tiene: nombre, email, teléfono, fechas, empresas
- `projects[]` excluido en v1 — riesgo de datos inventados
- Máximo 4 sugerencias por respuesta
- Prompt debe especificar: texto plano, sin markdown, sin HTML

## Priorización MoSCoW

- US-01 Ver sugerencias con botones: Must Have
- US-02 Confirmar antes de aplicar (modal con diff): Must Have
- US-03 Deshacer cambio aplicado: Should Have
- Diff visual rojo/verde: Could Have
- Sugerencias para projects[]: Won't Have v1

## Riesgos críticos

- `field` fuera de whitelist: validar con Zod en handler, descartar silenciosamente
- `targetId` apunta a item borrado: verificar existencia en store antes de mostrar botón
- `suggestions: null` del modelo: parsear con `suggestions ?? []` siempre
- Latencia >8s: medir en staging, considerar streaming si supera umbral

## Arquitectura final acordada (abril 2026)

**Decisión de diseño clave:** NO crear endpoint `/api/ai/apply-improvement` separado.
- `review-cv` devuelve directamente `suggestions: CVSuggestion[]` enriquecidas
- Cada suggestion tiene `preview` (valor final listo para usar) — no hay segunda llamada IA
- El modal diff es puramente frontend: muestra `before` (valor actual del store) vs `preview` (valor de la suggestion)
- Al confirmar: `updateSectionData()` directo desde el modal, sin llamada de red

**Por qué:** Evita latencia extra, simplifica el flujo, reduce surface de error. El costo es que el prompt de review-cv crece (~200 tokens más).
