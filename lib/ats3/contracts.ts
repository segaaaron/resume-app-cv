// lib/ats3/contracts.ts
//
// EL VOCABULARIO DEL MOTOR v3. Nadie define un tipo, un id, una clave de caché
// ni una forma de comparar texto fuera de este archivo.
//
// ── POR QUÉ NO HAY UNA SOLA LISTA CURADA ACÁ ────────────────────────────────
// La especificación v3 propone un "diccionario de skills con alias y familias"
// escrito a mano (k8s = kubernetes, postgres = postgresql). Una tabla curada
// sólo cubre lo que alguien se acordó de escribir: sirve para el rubro de quien
// la escribió y deja afuera al soldador, a la peluquera y al veterinario. Este
// proyecto ya pagó ese error dos veces (la lista de verbos débiles que siempre
// llegaba tarde, y el diccionario de erratas que hubo que revertir).
//
// Acá los alias se DERIVAN en tiempo de ejecución de dos fuentes que sí son del
// usuario: lo que el aviso dice (P1 devuelve el nombre canónico junto al texto
// crudo con el que la vacante lo escribió) y lo que el candidato declaró en su
// CV. La única regla escrita en código es morfológica —mayúsculas, acentos,
// puntuación, separadores— y esa vale igual en cualquier oficio y en los dos
// idiomas.
//
// Sin dependencias del motor viejo: este archivo no importa nada de `lib/ats/`
// ni de `lib/services/ai/`. Sólo zod y node:crypto.

import { createHash } from "node:crypto"
import { z } from "zod"
// SÓLO TIPO: se borra al compilar, así que no crea un ciclo en ejecución con
// `score.ts`, que sí importa este archivo.
import type { ComponentKey } from "./score"

/**
 * Un arreglo que puede llegar vacío, omitido o en null.
 *
 * ── LA CONTRADICCIÓN QUE ESTO CIERRA, MEDIDA CONTRA LA API ─────────────────
 * El prompt le ordena al modelo: "un campo sin dato va en null, NUNCA se
 * omite" — y el modelo obedece, devolviendo `"placeholders": null` cuando la
 * línea no necesita ninguno. El esquema exigía un arreglo y descartaba la
 * respuesta ENTERA: la reescritura era correcta, la cuota estaba gastada y el
 * usuario no veía nada.
 *
 * Dos archivos que se contradicen los paga siempre el usuario. Acá el contrato
 * acepta las tres formas de "no hay nada" y las normaliza a la misma.
 */
/**
 * Un texto que puede llegar vacío, omitido o en null.
 *
 * Misma raíz que `lista`: el prompt ordena "un campo sin dato va en null, NUNCA
 * se omite", y el modelo obedece también con las cadenas — mandó
 * `"bulletId": null` y el esquema tiró una reescritura correcta. Arreglarlo
 * campo por campo garantiza que el próximo campo nuevo repita el defecto: el
 * contrato acepta las tres formas de "no hay nada" en un solo lugar.
 */
function texto(max: number) {
  // RECORTA, no rechaza. Estos campos son etiquetas y metadatos: un `claim` de
  // 210 caracteres tiraba una reescritura buena con la cuota ya gastada. Un tope
  // de presentación no puede ser un error fatal.
  //
  // El texto que ENTRA AL CV es la excepción y no usa esta función: recortarlo
  // escribiría una frase partida a la mitad en el currículum de alguien.
  return z
    .string()
    .nullish()
    .transform((v) => (v ?? "").slice(0, max))
}

/**
 * ── POR QUÉ ACÁ NO HAY UN SOLO `.nullable()` ────────────────────────────────
 *
 * `nullable()` acepta `null` y MUERE si el campo llega omitido. El prompt le
 * ordena al modelo no omitir nada, pero un prompt es una petición y no un
 * contrato: medido, el triage devolvió sus decisiones sin `proposedTopic` y la
 * respuesta ENTERA se descartó con la llamada pagada. Todo campo que puede
 * faltar usa `nullish()`, que acepta las tres formas de "no hay nada".
 */

/**
 * Un booleano que puede llegar omitido o en null.
 *
 * Misma raíz que `texto` y `lista`, y hacía falta: el juicio por viñeta son tres
 * booleanos, y con uno en null se caía la auditoría ENTERA — la que corre en
 * cada análisis. El valor por defecto es el conservador: lo que el auditor no
 * afirmó, no está.
 */
export function bandera(porDefecto = false) {
  return z.boolean().nullish().transform((v) => v ?? porDefecto)
}

/**
 * Un número acotado que puede llegar omitido, en null o fuera de rango.
 *
 * Se ACOTA en vez de rechazar: un 1,4 en una razón de 0 a 1 es un desliz de
 * presentación del modelo, y tirar por eso la auditoría del CV entero es
 * cambiar oro por una etiqueta.
 */
export function numero(min: number, max: number, porDefecto: number) {
  return z
    .number()
    .nullish()
    .transform((v) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : porDefecto))
}

function lista<T extends z.ZodTypeAny>(item: T, max: number) {
  // SE DESCARTA EL ELEMENTO, NO LA RESPUESTA. Un requisito sin `skill` o un
  // hueco sin `token` mataban la vacante o la reescritura completas, con la
  // cuota ya gastada y la pantalla vacía. Lo que no se entiende se cae solo; lo
  // que sí, se entrega. Y el tope recorta en vez de rechazar, por lo mismo.
  return z
    .array(z.unknown())
    .nullish()
    .transform((v) =>
      (v ?? []).flatMap((x) => {
        const r = item.safeParse(x)
        return r.success ? [r.data as z.output<T>] : []
      }).slice(0, max),
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSIONES
//
// Toda clave de caché las lleva. Subir una invalida exactamente lo que depende
// de ella y nada más: cambiar la rúbrica no obliga a re-parsear la vacante.
// ─────────────────────────────────────────────────────────────────────────────

/** Sube cuando cambia CÓMO se puntúa. Invalida auditoría y puntajes guardados. */
export const RUBRIC_VERSION = "r1"

/** Sube por prompt, individualmente. Invalida sólo las respuestas de ESE prompt. */
export const PROMPT_VERSION = {
  // p1-2 (2026-08-29): la regla de qué exige el aviso dejó de ser una lista de
  // palabras ("excluyente", "imprescindible"…) y pasó a ser la pregunta —¿sin
  // esto la persona queda descartada?—. Sin subir la versión, el análisis
  // guardado seguiría contestando con la lectura vieja y el cambio no se vería
  // NUNCA: este proyecto ya perdió un día entero mirando una pantalla que no
  // cambiaba porque un prompt cambió y su caché no.
  // p1-3: la sigla y su forma completa son UN requisito, y `raw` conserva la
  // forma literal del aviso — el filtro compara cadenas.
  // p1-6: la vacante declara QUÉ NÚMERO le importa al puesto. La cifra que
  // mueve una candidatura es la que el rol valora, no cualquiera.
  // p1-7: las dos listas vienen ORDENADAS por peso real —lo que el aviso repite
  // y lo que enuncia al abrir pesa más—. El motor atiende en ese orden.
  // p1-8 (2026-08-30): `softSignals` estaba en el esquema y en la plantilla de
  // salida SIN UNA SOLA REGLA en el prompt. El modelo llenaba el campo con lo
  // que le parecía: propiedades del entregable ("pixel-accurate", "accessible")
  // y responsabilidades del puesto ("contribute to iOS engineering practices").
  // Eso llegaba a la pantalla como "las blandas que el aviso pide" y después la
  // auditoría tenía que juzgar si un logro las demuestra — imposible: no hablan
  // de la persona. Un campo declarado sin regla no lo llena nadie, lo llena el
  // azar. Reportado en producción con captura.
  P1: "p1-8", // parser de vacante
  // p2-2: la frontera FOUND/IMPLIED es lo que el filtro PUEDE VER, no lo que el
  // modelo entiende. Marcar FOUND por comprensión propia le dice a alguien que
  // está cubierto cuando el filtro lo va a descartar.
  // p2-3: las blandas que el aviso pide se JUZGAN —demostrada con el id del
  // logro, sólo declarada, o ausente—. Antes se extraían y no las miraba nadie.
  P2: "p2-3", // auditoría
  // p3-2: KEEP exige que la línea sea SUYA. Una correcta pero genérica ocupa el
  // lugar de una que distingue.
  P3: "p3-2", // triage
  // p4-2 (2026-08-29): se sacaron del prompt los ejemplos de oficios (piezas
  // por turno, pacientes por guardia). Cambia lo que el modelo escribe, así que
  // lo guardado con la versión anterior ya no es la respuesta a esta pregunta.
  // p4-3 (2026-08-29): tres reglas nuevas medidas contra la práctica actual —
  // la redacción LITERAL del aviso (el filtro compara cadenas, no ideas), la
  // sigla con su forma completa, y la especificidad como vara. Más la pista del
  // hueco diciendo que un aproximado alcanza.
  // p4-5: declinar se DECLARA. El modelo llena `declineBasis` con los tres ejes
  // de la línea original y el motor comprueba la coherencia: decir "ya está
  // bien" mientras se declara que falta el método es una contradicción que el
  // código puede ver, y se pide una vez más nombrando lo que falta.
  P4: "p4-7", // reescritura de viñeta
  // p5-2: la PRUEBA muestra un resultado con su tamaño, y el AJUSTE se dice con
  // las palabras del aviso cuando el CV ya lo demuestra.
  P5: "p5-2", // resumen
  P6: "p6-1", // validador
} as const

export type PromptId = keyof typeof PROMPT_VERSION

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZACIÓN
//
// Dos formas, y la diferencia importa:
//
//   normalize()  — para LEER: conserva los espacios entre palabras, así que
//                  sirve para buscar un término dentro de una oración.
//   termKey()    — para COMPARAR: colapsa todo separador, así que "CI/CD",
//                  "ci-cd" y "CI CD" son la misma llave. NO sirve para buscar
//                  dentro de un texto (perdería los límites de palabra).
//
// Ninguna de las dos quita plurales ni sufijos: "kubernetes" no puede
// convertirse en "kubernete". Un stemmer acierta en inglés y destroza el
// español, y equivocarse acá significa decirle a alguien que tiene una
// habilidad que no tiene.
// ─────────────────────────────────────────────────────────────────────────────

/** Minúsculas, sin acentos, sin puntuación, espacios colapsados. Conserva palabras. */
export function normalize(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
}

/**
 * La llave de igualdad de un término. Colapsa TODO separador.
 *
 * `+` y `#` sobreviven porque distinguen términos reales que sólo se
 * diferencian en eso (C, C++, C#). Quitarlos los volvería el mismo término y el
 * candidato recibiría cobertura que no tiene.
 */
export function termKey(raw: string): string {
  return normalize(raw).replace(/\s+/g, "")
}

/** sha256 hex. Un solo lugar para no tener dos formas de hashear. */
export function sha256(...parts: string[]): string {
  return createHash("sha256").update(parts.join(" ")).digest("hex")
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESENCIA DE UN TÉRMINO EN UN TEXTO
//
// El error que esta función existe para no cometer: buscar "React" con límites
// de palabra ENCUENTRA "React Native", y entonces un CV que sólo hizo móvil
// figura cubriendo un requisito de web. El documento v3 nombra el problema
// ("React no implica React Native") y lo deja en manos del prompt; resolverlo
// de verdad pide saber qué OTROS términos hay en juego.
//
// Por eso la búsqueda recibe el índice completo: una aparición que un término
// MÁS LARGO del índice ya reclama, no cuenta para el más corto. Es la regla del
// match maximal, y no necesita saber nada de ningún oficio.
// ─────────────────────────────────────────────────────────────────────────────

/** Un término tal como lo nombran la vacante y el CV. */
export interface TermVariants {
  /** Nombre canónico, el que se le muestra al usuario. */
  canonical: string
  /** Cómo lo escribieron el aviso y el CV. El canónico entra siempre. */
  variants: string[]
}

/**
 * Índice de términos en juego. Se construye por análisis, con lo que trajeron
 * la vacante (P1) y las habilidades que el candidato declaró.
 */
export interface TermIndex {
  /** termKey → canónico. */
  byKey: Map<string, string>
  /** Todas las variantes normalizadas, de la más larga a la más corta. */
  ordered: { canonical: string; needle: string }[]
}

export function buildTermIndex(terms: TermVariants[]): TermIndex {
  const byKey = new Map<string, string>()
  const ordered: { canonical: string; needle: string }[] = []
  for (const t of terms) {
    for (const raw of [t.canonical, ...t.variants]) {
      const needle = normalize(raw)
      if (!needle) continue
      const key = termKey(raw)
      if (!byKey.has(key)) byKey.set(key, t.canonical)
      if (!ordered.some((o) => o.needle === needle && o.canonical === t.canonical)) {
        ordered.push({ canonical: t.canonical, needle })
      }
    }
  }
  // Más largo primero: es lo que hace que "react native" reclame la aparición
  // antes de que "react" la vea.
  ordered.sort((a, b) => b.needle.length - a.needle.length)
  return { byKey, ordered }
}


/**
 * Qué términos del índice aparecen realmente en un texto.
 *
 * Devuelve canónicos. Una posición del texto pertenece a UN solo término: el
 * más largo que la cubre.
 */
export function termsIn(index: TermIndex, text: string): Set<string> {
  const hay = ` ${normalize(text)} `
  const taken: [number, number][] = []
  const found = new Set<string>()

  for (const { canonical, needle } of index.ordered) {
    const pat = ` ${needle} `
    let from = 0
    for (;;) {
      const at = hay.indexOf(pat, from)
      if (at === -1) break
      const start = at + 1
      const end = start + needle.length
      const overlaps = taken.some(([s, e]) => start < e && end > s)
      if (!overlaps) {
        taken.push([start, end])
        found.add(canonical)
      }
      from = at + 1
    }
  }
  return found
}

/** ¿Este término concreto aparece en el texto, sin que otro más largo lo reclame? */
export function termPresent(index: TermIndex, canonical: string, text: string): boolean {
  return termsIn(index, text).has(canonical)
}

// ─────────────────────────────────────────────────────────────────────────────
// LA VACANTE ESTRUCTURADA — salida de P1
//
// Todo campo que la vacante no dice viaja como null y NUNCA se deduce. El
// esquema es nulable, no opcional: la API en modo estricto exige que `required`
// nombre todos los campos, y forzar un opcional a obligatorio convierte
// "podés omitir esto" en "tenés que escribirlo" — que es como se inventan datos.
// ─────────────────────────────────────────────────────────────────────────────

export const RequirementSchema = z.object({
  /** Nombre canónico, decidido por el modelo a partir del propio aviso. */
  skill: z.string().min(1).max(80),
  /** Cómo lo escribió la vacante. Es la variante que alimenta el índice. */
  raw: z.string().min(1).max(160),
  years: z.number().int().min(0).max(50).nullish().transform((v) => v ?? null),
  /** Categoría libre, en las palabras del aviso: no hay taxonomía cerrada
   *  porque un aviso de soldadura no habla de "LANGUAGE" ni de "FRAMEWORK". */
  category: z.string().max(40).nullish().transform((v) => v ?? null),
})
export type Requirement = z.infer<typeof RequirementSchema>

export const JobSpecSchema = z.object({
  // El aviso puede no nombrar el cargo, y el prompt ordena "un campo sin dato va
  // en null": el modelo obedeció y el esquema tiraba la vacante ENTERA con un
  // 500 en pantalla. Medido en producción el 2026-08-29 sobre un aviso real.
  roleTitleRaw: texto(160),
  roleTitleCanonical: texto(160),
  seniority: z.string().max(40).nullish().transform((v) => v ?? null),
  yearsRequired: z.number().int().min(0).max(50).nullish().transform((v) => v ?? null),
  domain: z.string().max(60).nullish().transform((v) => v ?? null),
  workMode: z.string().max(40).nullish().transform((v) => v ?? null),
  language: z.enum(["es", "en"]).catch("es"),
  /**
   * QUÉ NÚMERO LE IMPORTA A ESTE PUESTO — volumen, monto, tiempo, rendimiento,
   * personas o crecimiento, en las palabras del propio aviso.
   *
   * Sin esto, el hueco de cifra se deriva de lo que la LÍNEA admite medir, que
   * no es lo mismo que lo que el puesto valora: a un cajero se le puede pedir
   * "clientes por turno" cuando el aviso habla de control de descuadre. La
   * pregunta que se le hace al candidato es la que decide si puede contestarla,
   * y una que no le importa a nadie se abandona.
   *
   * `null` es legítimo: hay avisos que no dicen cómo se mide el éxito, y
   * deducirlo sería inventar la vara.
   */
  metricThatMatters: texto(80),
  mustHave: lista(RequirementSchema, 40),
  niceToHave: lista(RequirementSchema, 40),
  responsibilities: lista(z.string().max(300), 30),
  softSignals: lista(z.string().max(160), 20),
})
export type JobSpec = z.infer<typeof JobSpecSchema>

// ─────────────────────────────────────────────────────────────────────────────
// EL ÁRBOL DEL CV
//
// Genérico a propósito: un puesto es un contenedor con líneas. Nada acá sabe si
// esas líneas hablan de código, de un torno o de una sala de ventas.
// ─────────────────────────────────────────────────────────────────────────────

export type NodeId = string

export interface BulletNode {
  id: NodeId
  text: string
  /**
   * LA VERSIÓN ES EL HASH DEL TEXTO, no un contador.
   *
   * Un contador hay que guardarlo en algún lado, y dos lugares que llevan la
   * cuenta terminan discrepando: el nodo diría "voy por la 4" mientras el texto
   * ya va por otra cosa. El hash no puede mentir —se deriva del contenido— y no
   * necesita una columna nueva en la base.
   *
   * Con esto, "¿el usuario editó esta línea desde que el modelo la leyó?" es una
   * comparación de dos cadenas y nada más.
   */
  hash: string
  /** Marcado cuando el texto lo escribió el motor y el usuario lo aceptó. */
  origin: "USER" | "AI_ACCEPTED"
}

export interface RoleNode {
  id: NodeId
  /** Cargo, empresa y fechas tal como están en el CV. Sólo para dar contexto. */
  title: string
  company: string
  startDate: string
  endDate: string
  bullets: BulletNode[]
}

export interface ResumeTree {
  roles: RoleNode[]
  summary: { id: NodeId; text: string; hash: string; origin: "USER" | "AI_ACCEPTED" }
  /** Habilidades que el candidato declaró. Alimentan el índice de términos y son
   *  la única fuente que autoriza a nombrar una herramienta en una reescritura. */
  declaredSkills: string[]
  /** Texto plano de las secciones que el puntaje mira pero no reescribe. */
  otherText: string
}

// ─────────────────────────────────────────────────────────────────────────────
// IDENTIDAD DE LOS NODOS
//
// Un id derivado de la POSICIÓN se corre en cuanto el usuario aplica algo, y
// entonces un hallazgo guardado apunta a otra línea. Este proyecto ya pagó esa
// clase de defecto tres veces. Acá el id se deriva del TEXTO dentro de su
// puesto, se persiste en el CV la primera vez, y a partir de ahí no se recalcula
// nunca: reordenar no lo mueve y editar tampoco, porque el id viaja con el nodo.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Id estable de un puesto, derivado de lo que lo identifica en el documento.
 *
 * ── POR QUÉ LLEVA `seen`, Y SE DESCUBRIÓ MIDIENDO ──────────────────────────
 * Dos puestos con el mismo cargo, la misma empresa y la misma fecha de inicio
 * —un "Freelance / Independiente" repetido, que en un CV real pasa— derivaban
 * el MISMO id. Medido: al escribir de vuelta, el segundo puesto pisaba al
 * primero y las viñetas de un trabajo entero desaparecían, junto con la
 * reescritura que el usuario acababa de aceptar.
 *
 * Un id repetido no es un detalle de higiene: es pérdida de datos silenciosa.
 * El desempate es por orden de aparición, así que sigue siendo estable entre
 * dos lecturas del mismo documento.
 */
export function roleIdFor(title: string, company: string, startDate: string, seen?: Set<NodeId>): NodeId {
  const base = `r_${sha256(normalize(title), normalize(company), normalize(startDate)).slice(0, 10)}`
  if (!seen) return base
  if (!seen.has(base)) {
    seen.add(base)
    return base
  }
  for (let n = 2; ; n++) {
    const candidate = `${base}_${n}`
    if (!seen.has(candidate)) {
      seen.add(candidate)
      return candidate
    }
  }
}

/**
 * Id estable de una viñeta dentro de su puesto.
 *
 * `seen` lleva los ids ya emitidos en esta siembra: dos líneas idénticas en el
 * mismo puesto derivarían el mismo id, y dos nodos con el mismo id son un
 * hallazgo que se aplica a la línea equivocada.
 */
export function bulletIdFor(roleId: NodeId, text: string, seen: Set<NodeId>): NodeId {
  const base = `b_${sha256(roleId, normalize(text)).slice(0, 10)}`
  if (!seen.has(base)) {
    seen.add(base)
    return base
  }
  for (let n = 2; ; n++) {
    const candidate = `${base}_${n}`
    if (!seen.has(candidate)) {
      seen.add(candidate)
      return candidate
    }
  }
}

/**
 * El hash que decide si un nodo cambió, y por lo tanto si hay que volver a
 * gastar una llamada por él.
 *
 * Se calcula sobre el contenido NORMALIZADO, no sobre el texto crudo. Si se
 * calculara sobre el crudo, borrar un espacio doble o cambiar una coma
 * dispararía una corrida completa y el caché no serviría de nada.
 */
export function nodeHash(text: string): string {
  return sha256(normalize(text)).slice(0, 16)
}

// ─────────────────────────────────────────────────────────────────────────────
// HALLAZGOS
//
// El id NO puede ser aleatorio ni venir del modelo: si cada corrida inventa ids,
// la pantalla no puede saber que un hallazgo es el mismo de la vez pasada y todo
// se ve nuevo. Se deriva del nodo, el tipo y la rúbrica.
// ─────────────────────────────────────────────────────────────────────────────

/** Los tipos son del MOTOR, no de un oficio: describen qué le falta a un texto. */
export const FINDING_TYPES = [
  "missing_requirement", // la vacante lo exige y el CV no lo demuestra
  /**
   * Cubre los TRES ejes de la viñeta —verbo, resultado, método— y `detail` dice
   * cuál falta. Hubo un tiempo `no_method` y `weak_opening` como tipos aparte:
   * nadie los emitía nunca, porque una línea sin verbo o sin método sale por
   * acá. Un tipo que ningún emisor produce es vocabulario muerto con clave i18n
   * y sección asignada — promete una tarjeta que no puede existir.
   */
  "no_result", // le falta alguno de los tres ejes; `detail` dice cuál
  "no_metric", // el logro admite tamaño y no lo declara
  "summary_gap", // al resumen le falta una de sus funciones
  "parse_risk", // algo que un lector automático no va a extraer bien
  "buried_term", // lo demuestra, pero en un puesto viejo: el lector no llega
  "skill_not_listed", // lo demuestra en una línea y no está en Habilidades
  "soft_not_shown", // la vacante la pide, el CV la declara y nada la respalda
] as const
export type FindingType = (typeof FINDING_TYPES)[number]

/**
 * CÓMO SE ENCADENAN LOS DETALLES DE DOS HALLAZGOS FUSIONADOS.
 *
 * Vive acá, con el vocabulario, porque lo escribe el motor al fusionar y lo LEE
 * la pantalla para volver a separarlos: dos requisitos que caen en la misma
 * línea son una sola tarjeta —una sola reescritura los aterriza a los dos— pero
 * siguen siendo dos cosas que nombrar. Con el separador escrito en dos lugares,
 * el día que cambie la pantalla muestra «Combine · async/await» como si fuera el
 * nombre de una sola habilidad.
 */
export const DETAIL_SEPARATOR = " · "

export function findingId(nodeId: NodeId, type: FindingType): string {
  return sha256(nodeId, type, RUBRIC_VERSION).slice(0, 16)
}

export interface Finding {
  id: string
  /**
   * DE QUÉ COMPONENTE DEL PUNTAJE SALE ESTE HALLAZGO.
   *
   * ── LA CLASE DE DEFECTO QUE CIERRA (auditoría del 2026-08-29) ────────────
   * La pantalla agrupaba los hallazgos con un mapa PROPIO (tipo → sección) y
   * pintaba el porcentaje de la sección con OTRO mapa. Los dos podían discrepar
   * y discrepaban: el hallazgo del resumen caía bajo un porcentaje que medía la
   * alineación del cargo, y la sección de redacción mostraba el % de uno solo de
   * sus cuatro componentes. Un número que no habla de lo que lista debajo.
   *
   * Con esto el agrupamiento se DERIVA de la medición: el hallazgo dice de dónde
   * salió su ganancia, y la sección que lo muestra es la del mismo componente.
   * No hay forma de que el número y su contenido se separen.
   */
  component: ComponentKey
  /**
   * CÓMO SE CIERRA ESTE HALLAZGO. Lo dice quien lo emite, no quien lo pinta.
   *
   * ── EL DEFECTO QUE CIERRA (hallado el 2026-08-29, y era mío) ──────────────
   * Un hallazgo declaraba QUÉ está mal y la pantalla adivinaba la acción: todo
   * terminaba en "reescribí esta línea". Con dos tipos nuevos eso pasó a ser
   * una promesa falsa —reescribir la línea vieja no la desentierra, y reescribir
   * la viñeta que ya demuestra un término no lo agrega a Habilidades—. Un botón
   * que no arregla lo que la tarjeta dice es peor que no tener botón.
   *
   * El motor es el único que tiene el CV, la vacante y la auditoría a la vez, y
   * por eso es el único que puede decir qué cierra cada cosa. Acá viaja.
   *
   *   rewrite   — reescribir el nodo señalado
   *   weave     — mencionar `detail` en el nodo señalado, que es una línea del
   *               puesto ACTUAL (el término vive en uno viejo)
   *   add_skill — agregar `detail` a la lista de habilidades. Determinista:
   *               ni una llamada al modelo.
   */
  remedy: "rewrite" | "weave" | "add_skill"
  /**
   * DE QUÉ habla, cuando no habla de la línea.
   *
   * Vacío = habla de la viñeta, y entonces vale "una línea, una tarjeta". Con
   * sujeto —un término de la vacante— tiene tarjeta propia: su remedio es del
   * término, no de la línea, y fusionarlo con otro lo perdía.
   */
  subject?: string
  /** El tipo del que reclamó la línea primero: el que da el título a la tarjeta. */
  type: FindingType
  /**
   * Los tipos que se FUSIONARON en esta misma tarjeta.
   *
   * Una línea tiene UNA tarjeta —dos sobre lo mismo se leen como que el panel se
   * contradice— pero el que llega segundo no se tira: descartarlo silenciaría al
   * emisor entero, y los requisitos que faltan aterrizan casi siempre sobre
   * líneas que ya tienen tarjeta.
   */
  merged: FindingType[]
  nodeId: NodeId
  /** El texto de la línea AL DETECTARLA. El índice es una pista; el texto es la
   *  identidad, y es lo que permite re-anclar si algo se movió. */
  nodeText: string
  /** El hash del texto al detectarlo. Ver BulletNode.hash. */
  nodeHash: string
  /** Cuánto sube el puntaje si se cierra. Lo calcula score.ts, nunca el modelo. */
  gain: number
  detail: string
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDERS TIPADOS
//
// La cifra la escribe el candidato. El modelo propone el HUECO —con su tipo, su
// unidad y el rango que sería creíble— y nunca el número.
//
// Los siete tipos son una taxonomía de MEDIDA, no de oficio: un porcentaje, una
// escala, un tiempo, dinero, un equipo, una frecuencia y un índice de calidad
// existen igual en una cocina, en un taller y en un quirófano. El rango creíble
// NO está escrito acá: lo propone el modelo mirando el trabajo que la persona
// describió, porque un rango por rubro sería exactamente la tabla curada que
// este archivo evita.
// ─────────────────────────────────────────────────────────────────────────────

export const METRIC_TYPES = [
  "PERCENT_DELTA",
  "SCALE",
  "TIME_DELTA",
  "MONEY",
  "TEAM_SIZE",
  "FREQUENCY",
  "QUALITY_SCORE",
] as const
export type MetricType = (typeof METRIC_TYPES)[number]

export const PlaceholderSchema = z.object({
  token: z.string().min(2).max(24),
  // Mismo criterio: un tipo desconocido en un hueco cae a SCALE —"una cantidad"—
  // en vez de tirar la línea entera. El usuario igual escribe su número.
  type: z.enum(METRIC_TYPES).catch("SCALE"),
  label: texto(120),
  hint: texto(240),
  evidenceNeeded: texto(240),
  /**
   * Si el modelo no lo dice, el hueco es OPCIONAL.
   *
   * El valor por defecto no es neutro: `required` apaga el botón de aplicar
   * hasta que el usuario escriba el número. Suponer "obligatorio" ante la duda
   * dejaría a alguien trabado por un dato que quizá no tiene, y la salida sin
   * cifra ya existe para eso.
   */
  required: z.boolean().nullish().transform((v) => v ?? false),
})
export type Placeholder = z.infer<typeof PlaceholderSchema>

// ─────────────────────────────────────────────────────────────────────────────
// TRIAGE Y SUGERENCIAS
// ─────────────────────────────────────────────────────────────────────────────

export const VERDICTS = ["KEEP", "REWRITE", "REPLACE", "DEMOTE", "DROP"] as const
export type Verdict = (typeof VERDICTS)[number]

export const TriageDecisionSchema = z.object({
  bulletId: texto(64),
  verdict: z.enum(VERDICTS),
  reason: texto(240),
  relevance: numero(0, 1, 0.5),
  proposedTopic: z.string().max(200).nullish().transform((v) => v ?? null),
  /** En REPLACE el modelo NUNCA afirma que el candidato hizo algo: pregunta. */
  needsUserConfirm: z.string().max(300).nullish().transform((v) => v ?? null),
})
export type TriageDecision = z.infer<typeof TriageDecisionSchema>

/**
 * ── POR QUÉ CASI TODO ACÁ TIENE UN VALOR POR DEFECTO ────────────────────────
 * El prompt le dice al modelo: "si la línea ya cumple y no hay nada que
 * mejorar, devolvé changed: false y no la toques". El modelo obedece y responde
 * `{"changed": false}` a secas — que es la respuesta CORRECTA.
 *
 * La primera versión exigía `text`, `actionVerb` y `claim` siempre, así que
 * rechazaba esa respuesta entera. Medido contra la API: el reintento devolvía lo
 * mismo (porque lo mismo era lo correcto) y el usuario terminaba con un error y
 * la cuota gastada por decirle la verdad.
 *
 * Un esquema que castiga la respuesta que el prompt pide es una contradicción
 * entre dos archivos, y la paga el usuario.
 */
export const SuggestionSchema = z.object({
  bulletId: texto(64),
  // Sin `changed` la respuesta no dice si tocó la línea; lo conservador es
  // asumir que no, que es la respuesta que no escribe nada en el CV de nadie.
  changed: bandera(false),
  /** El único que NO se recorta: es lo que se escribe en el CV. */
  text: z.string().max(1200).nullish().transform((v) => v ?? ""),
  actionVerb: texto(60),
  keywordsUsed: lista(z.string().max(80), 10),
  claim: texto(200),
  /**
   * El tipo de medida. Un valor fuera de la lista NO tira la respuesta: cae en
   * null y la reescritura se entrega igual.
   *
   * Este campo sólo alimenta la regla de "variá el tipo de métrica" del ledger
   * y la pista que ve el usuario. Perder una reescritura buena porque el modelo
   * escribió "COUNT" en vez de "SCALE" es cambiar oro por una etiqueta.
   */
  metricType: z.enum(METRIC_TYPES).nullish().catch(null).transform((v) => v ?? null),
  /**
   * El tope REAL es dos, y lo hace cumplir el guard — no este esquema.
   *
   * Medido contra la API: el modelo devolvió tres huecos y el esquema descartó
   * la respuesta ENTERA, con la cuota ya gastada y sin nada que mostrar. Un tope
   * duro acá convierte una regla de estilo en un error fatal; en el guard, es un
   * rechazo con motivo y un reintento que le dice al modelo qué pasó.
   *
   * Este proyecto ya pagó ese defecto una vez: "un schema estricto en el lugar
   * equivocado no rechaza lo malo, rechaza todo".
   */
  placeholders: lista(PlaceholderSchema, 8),
  /** La salida del mismo trabajo sin cifra, para quien no tiene el dato. */
  variantWithoutMetric: z.string().max(1200).nullish().transform((v) => v ?? null),

  /**
   * QUÉ SE PUEDE MEDIR DE ESTE TRABAJO, en las palabras del oficio.
   *
   * ── POR QUÉ ES UN CAMPO Y NO UNA INSTRUCCIÓN MÁS ───────────────────────────
   * Medido: con la regla escrita en el prompt —incluso reforzada— el modelo
   * proponía 0 o 1 hueco en quince líneas de cinco oficios. La cifra es la
   * palanca de impacto más grande del producto y no se estaba usando.
   *
   * Pedirle que DECLARE qué es medible lo obliga a mirarlo antes de redactar;
   * una regla en prosa se puede saltear sin dejar rastro, un campo vacío no.
   * Y deja al motor comprobar la coherencia: si dijo que hay un tamaño evidente
   * y no ofreció el hueco, se le pide una vez más.
   *
   * `null` es una respuesta legítima: hay trabajos sin tamaño evidente, y
   * forzar una cifra ahí es peor que no ponerla.
   */
  measurableAspect: z.string().max(160).nullish().transform((v) => v ?? null),

  /**
   * POR QUÉ DECLINA, CUANDO DECLINA — los tres ejes, declarados.
   *
   * ── MEDIDO CONTRA LA API (2026-08-29) ──────────────────────────────────────
   * El modelo devolvió "ya está bien" sobre "Participé en las reuniones con los
   * padres" —una apertura que el propio prompt prohíbe— y sobre "Di la
   * medicación", tres palabras sin resultado ni método. Reforzar la regla en
   * prosa no lo movió: en la corrida siguiente volvió a declinar.
   *
   * Lo que sí mueve a un modelo es pedirle que DECLARE antes de contestar: una
   * regla en prosa se saltea sin dejar rastro, un campo vacío no. Y deja al
   * motor comprobar la coherencia — declinar diciendo que falta el método es
   * una contradicción que el código puede ver y devolver.
   *
   * `null` es legítimo cuando SÍ reescribe: los ejes describen a la original.
   */
  declineBasis: z
    .object({
      hasActionVerb: bandera(),
      hasResult: bandera(),
      hasMethod: bandera(),
    })
    .nullish()
    .transform((v) => v ?? null),
})
export type Suggestion = z.infer<typeof SuggestionSchema>

/** Lo que el motor le agrega a una sugerencia. El modelo no lo puede escribir. */
export interface AnchoredSuggestion extends Suggestion {
  /** El hash del nodo sobre el que se pensó. Si no coincide al aplicar, STALE. */
  basedOnHash: string
  /** El texto que reemplaza. Sin esto, "aplicar" escribe sobre la línea de al lado. */
  originalText: string
  /** Medido recalculando sobre una copia. Nunca lo dice el modelo. */
  delta: number
}

// ─────────────────────────────────────────────────────────────────────────────
// EL REGISTRO DE LO RESUELTO
//
// Sin esto, el motor vuelve a señalar lo que el usuario ya arregló y el producto
// se siente un bucle infinito.
// ─────────────────────────────────────────────────────────────────────────────

export interface Resolution {
  findingId: string
  nodeId: NodeId
  /** El hash del nodo cuando se cerró: es lo que distingue una re-detección
   *  falsa (mismo texto intacto) de una regresión real (lo tocó y lo rompió). */
  nodeHashAtResolution: string
  resolvedBy: "AI_SUGGESTION" | "USER_EDIT" | "DISMISSED"
  resolvedAt: string
}

export const ResolutionSchema = z.object({
  findingId: z.string().max(64),
  nodeId: z.string().max(64),
  nodeHashAtResolution: z.string().max(64),
  resolvedBy: z.enum(["AI_SUGGESTION", "USER_EDIT", "DISMISSED"]),
  resolvedAt: z.string().max(40),
})

export const ResolutionLogSchema = z.array(ResolutionSchema).max(500)
export type ResolutionLog = Resolution[]
