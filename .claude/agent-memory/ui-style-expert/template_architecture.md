---
name: Template architecture — CV templates
description: Patrón de código, registro y thumbnails para los templates de CV en ReadyCV
type: project
---

## Patrón de template

- Archivo: `components/resume/templates/<Name>.tsx`
- Props via hooks: `useResumeStore()` → `{ config, sections }` y `useTemplateSectionData()` → `sectionData`
- `config.colorScheme` = color accent (hex string, variable por usuario)
- `config.photoUrl` = URL base64 o null; `config.photoPosition` = número 0–100
- `config.language` = "es" | "en" para texto "Presente"/"Present"
- Inline styles ÚNICAMENTE — no Tailwind en el body del template (no funciona en print)
- `WebkitPrintColorAdjust: "exact"` en cualquier elemento con background de color
- `fmtDesc(description)` para parsear bullet points de experiencia
- `dangerouslySetInnerHTML={{ __html: fmtDesc(...) }}` para descripciones con bullets
- Importar íconos: `Mail, Phone, MapPin, Globe, Link2, GitFork` desde `lucide-react`

## Registro de un nuevo template

1. Crear `components/resume/templates/NombreTemplate.tsx`
2. Agregar el ID al union type `TemplateId` en `types/resume.ts`
3. Agregar `{ id, name, description, columns, hasPhoto }` al array `TEMPLATES` en `types/resume.ts`
4. Importar y agregar al `TEMPLATE_MAP` en `components/resume/ResumePreview.tsx`
5. Crear función `NombreThumb` en `components/editor/TemplateSwitcher.tsx` (SVG viewBox="0 0 80 110")
6. Agregar caso al switch en la función `ResumeThumbnail`
7. Agregar el ID al array `PRO_IDS` en `TemplateSwitcher.tsx` (si es Pro)

## Templates nuevos añadidos (2026-04-29)

- `tokyo` — sidebar casi negro + slash diagonal + borde lateral en entradas
- `apex` — header diagonal clipPath + pill headers + dos columnas
- `nova` — split editorial: nombre gigante + bloque accent + numeración 01·02·03
- `cascade` — gradient sidebar + ola SVG + timeline con dots
- `onyx` — full dark mode + tarjetas de superficie + sidebar neon
- `mosaic` — header bento + chips skill con borde + tile headers cuadrados

## Notas visuales importantes

- Los SVG thumbnails usan viewBox="0 0 80 110" (aspect ratio de A4)
- `<text>` en SVG requiere x/y absolutos; usar `<rect>` para barras y bloques de texto
- Templates con fondo oscuro deben tener todo el texto en colores claros explícitos
- `clipPath` inline en SVG y `clipPath` en CSS funcionan diferente — en templates usar `clipPath: "polygon(...)"` como CSS property
