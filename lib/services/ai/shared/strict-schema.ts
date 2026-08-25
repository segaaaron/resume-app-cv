// lib/services/ai/shared/strict-schema.ts
//
// LA FORMA DE LA RESPUESTA, GARANTIZADA EN LA GENERACIÓN.
//
// ── QUÉ CAMBIA (F0.5) ──────────────────────────────────────────────────────
//
// `response_format: json_object` es el modo legado: garantiza que el texto
// PARSEA, nada más. Los campos, los tipos y los faltantes los descubrimos
// después con Zod, cuando la llamada ya está pagada, y el arreglo era reintentar.
//
// `json_schema` con `strict: true` aplica el esquema EN EL MUESTREO: el modelo no
// puede emitir un token que lo viole. Campos obligatorios presentes, tipos
// correctos, nada de más.
//
// ── LAS TRES REGLAS DEL MODO ESTRICTO, QUE NO SON OPCIONALES ───────────────
//
//  1. TODOS los campos son obligatorios. Un opcional se declara «puede ser
//     nulo», no se omite.
//  2. `additionalProperties: false` en todo objeto.
//  3. La raíz es un objeto: no se puede devolver una lista suelta.
//
// Por eso el esquema que se manda NO se deriva a ciegas de cualquier Zod: se
// deriva y después se fuerza, y si algo no cumple se ve acá y no en un 400 de la
// API a mitad de un análisis.
import { z } from "zod"

// MEDIDO CONTRA LA API REAL (2026-08-25), porque acá supuse y me equivoqué:
//
//  · `minLength`, `maxLength`, `pattern`, `format`, `minItems`, `maxItems`,
//    `minimum`, `maximum`, `default` y `$schema`: las diez SE ACEPTAN. Llegué a
//    podarlas creyendo que devolvían 400; no es cierto, y el podado se revirtió.
//    Se mandan tal cual las emite Zod, así que la cota se aplica MIENTRAS el
//    modelo escribe, no sólo al validar después.
//  · `required` SÍ tiene que nombrar todos los campos: omitir uno devuelve
//    «'required' is required to be supplied and to be an array including every
//    key in properties». Por eso lo de abajo no es opcional.

/** Deja que un campo valga `null`, sin repetirlo si ya lo admitía. */
function admitirNulo(node: unknown): unknown {
  if (!node || typeof node !== "object") return node
  const n = { ...(node as Record<string, unknown>) }
  if (Array.isArray(n.anyOf)) {
    const ramas = n.anyOf as Array<Record<string, unknown>>
    if (!ramas.some((r) => r.type === "null")) n.anyOf = [...ramas, { type: "null" }]
    return n
  }
  if (typeof n.type === "string") {
    if (n.type === "null") return n
    n.type = [n.type, "null"]
    return n
  }
  if (Array.isArray(n.type)) {
    if (!(n.type as string[]).includes("null")) n.type = [...(n.type as string[]), "null"]
    return n
  }
  return { anyOf: [n, { type: "null" }] }
}

/** Marca todo objeto como estricto y con todos sus campos obligatorios. */
function enforceStrict(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(enforceStrict)
  if (!node || typeof node !== "object") return node
  const obj = { ...(node as Record<string, unknown>) }
  for (const [k, v] of Object.entries(obj)) obj[k] = enforceStrict(v)
  if (obj.type === "object") {
    obj.additionalProperties = false
    const props = obj.properties as Record<string, unknown> | undefined
    if (props) {
      // UN OPCIONAL NO SE VUELVE OBLIGATORIO: SE VUELVE NULABLE.
      //
      // El modo estricto exige que TODO campo esté en `required`. Forzarlo a
      // secas convierte «podés omitir esto» en «tenés que escribir esto», que
      // es un cambio de contrato silencioso: el modelo se ve obligado a
      // rellenar secciones que no tiene con qué llenar, justo lo que este
      // proyecto prohíbe. La forma que documenta OpenAI para un opcional es
      // dejarlo obligatorio y admitir `null`, así que eso es lo que se hace:
      // los que ya venían obligatorios no se tocan.
      const yaObligatorios = new Set(Array.isArray(obj.required) ? (obj.required as string[]) : [])
      for (const [k, v] of Object.entries(props)) {
        if (yaObligatorios.has(k)) continue
        props[k] = admitirNulo(v)
      }
      obj.required = Object.keys(props)
    }
  }
  return obj
}

/**
 * El `response_format` que exige exactamente esta forma.
 *
 * `name` viaja a la API y aparece en sus errores: se le pone el del endpoint
 * para que un rechazo diga cuál fue sin tener que adivinar.
 */
export function strictJsonFormat(name: string, schema: z.ZodType): {
  type: "json_schema"
  json_schema: { name: string; strict: true; schema: Record<string, unknown> }
} {
  const json = enforceStrict(z.toJSONSchema(schema, { io: "output" })) as Record<string, unknown>
  return { type: "json_schema", json_schema: { name, strict: true, schema: json } }
}
