---
name: User Story AI Profile Fill (Ayúdate con la IA)
description: Feature de relleno automático de summary + jobTitle + skills desde prompt libre del usuario en pestaña Contenido
type: project
---

Feature analizada en abril 2026. Should Have. ~3-4 días de desarrollo.

**Why:** Reduce drásticamente el tiempo-to-value (target: primer CV publicado <15 min). Usuario en blanco no sabe por dónde empezar — un prompt libre desbloquea el editor.

**How to apply:** Va en pestaña "Contenido" del FormPanel, sección colapsable al final (después de todas las secciones). Endpoint nuevo `/api/ai/fill-profile`. Pro Gate con AIProGate wrapper.

## Contrato de API

`POST /api/ai/fill-profile`

Input:
```typescript
{
  prompt: string          // máx 500 chars — descripción libre del perfil
  sectionData: ResumeSections  // contexto completo del CV actual
}
```

Output:
```typescript
{
  summary?: string              // solo si el actual está vacío o el usuario lo acepta
  jobTitle?: string             // solo si personalDetails.jobTitle está vacío
  suggestedSkills: string[]     // siempre, máx 8, solo nombres (sin nivel)
}
```

## Reglas de scope

- Solo enriquece campos vacíos o casi vacíos — NO sobreescribe datos existentes sin confirmación
- summary y jobTitle: si ya existen en el store, el frontend muestra diff y pide confirmación
- suggestedSkills: se muestran como chips con checkbox — el usuario elige cuáles agregar
- El prompt se valida con `validateAIInput` (máx 500 chars, detección de injection)
- Temperatura: 0.5 (más creativo que otros endpoints — el usuario da contexto abierto)
- Máx 8 skills sugeridas para no abrumar

## Ubicación en el UI

- Pestaña "Contenido" del FormPanel, sección colapsable al final
- Header: icono Sparkles + "Ayúdate con la IA" + badge PRO
- Colapsada por defecto para no interrumpir el flujo normal
- Wrapper: AIProGate (misma arquitectura que ATSScorePanel y CVReviewPanel)

## Riesgos

- jobTitle/summary inventados si el prompt es vago: disclaimer visible "Revisa y ajusta el contenido generado"
- Skills irrelevantes: el usuario las selecciona una a una antes de aplicar — nunca auto-aplica skills
- Prompt off-topic: sistema message restrictivo + 422 con toast específico
- Usuario con CV ya completo lo usa innecesariamente: la UI debe detectar si summary y jobTitle existen y mostrar aviso "Ya tienes estos campos — ¿quieres reemplazarlos?"
