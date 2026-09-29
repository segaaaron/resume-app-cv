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
  // p1-9 (2026-09-11): `noScoreRule` decía «si devolvés un puntaje, la respuesta
  // entera se descarta», y el motor no descarta nada por eso: el esquema ni
  // tiene el campo. Un prompt que amenaza con algo que el código no hace es una
  // contradicción, y GPT-5 gasta razonamiento en reconciliarlas (guía oficial).
  // p1-10 (2026-09-24): la vacante se lee ENTERA. Medido en producción: las
  // herramientas nombradas en las responsabilidades (GraphQL, Clean Architecture,
  // async/await) no llegaban a ninguna lista, y el plan de habilidades proponía
  // sacarlas del CV. Y `skill` es el NOMBRE de la capacidad, no la oración del
  // aviso: «iOS development experience with Swift» terminaba escrito como una
  // habilidad y nunca podía coincidir con nada.
  // p1-11 (2026-09-24): medido contra la API, la regla 4d en prosa NO alcanzó:
  // el modelo siguió dejando fuera GraphQL, Clean Architecture y Crashlytics, y
  // además RECORTABA las responsabilidades («Own app architecture» sin MVVM).
  // Pasa a ser un recorrido que se hace antes de devolver, y las
  // responsabilidades se copian con sus nombres.
  // p1-12: y el modelo DECLARA en `namedTools` cada nombre propio del aviso; el
  // código completa las listas con lo que falte (ver `JobSpecSchema`).
  // p1-13: cada requisito declara si se EJERCE o se TIENE (`kind`).
  // p1-14: un nombre que ya vive dentro de un requisito («Excel» en «Excel
  // avanzado») no se agrega otra vez. Lo guardado con p1-13 los duplicaba.
  // p1-15: un término vive en una sola lista (ver `JobSpecSchema`).
  P1: "p1-16", // parser de vacante
  // p2-2: la frontera FOUND/IMPLIED es lo que el filtro PUEDE VER, no lo que el
  // modelo entiende. Marcar FOUND por comprensión propia le dice a alguien que
  // está cubierto cuando el filtro lo va a descartar.
  // p2-3: las blandas que el aviso pide se JUZGAN —demostrada con el id del
  // logro, sólo declarada, o ausente—. Antes se extraían y no las miraba nadie.
  // p2-4 (2026-09-09): se retira `titleAlignment`. El cargo lo mide el código
  // —si la cadena que el aviso busca está escrita, que es lo que el filtro
  // compara— con la misma función que emite el hallazgo. El número del modelo no
  // lo leía nadie y contradecía a la tarjeta: con alineación 1 la tarjeta salía
  // prometiendo 0 puntos.
  // p2-5 (2026-09-11): la misma `noScoreRule`, sin la amenaza falsa.
  // p2-6 (2026-09-24): el modelo contesta POR REFERENCIA (M1, N2, S1), no por el
  // nombre que se le ocurra escribir. Medido en producción: sin la lista de
  // blandas del aviso —nunca se le mandaba— devolvió cinco inventadas («crash
  // rate» entre ellas) contra tres pedidas, y el puntaje daba 5/3 = 100% con la
  // tabla mostrando las tres como faltantes. Y juzga TODAS las viñetas: devolvió
  // 12 de 42 y la pantalla dijo «12/12».
  // p2-8 (2026-09-28): vuelve a juzgar viñetas y resumen (p2-7 no lo hacía), y
  // ahora el motor FIJA cada juicio al texto que lo sostiene: una línea que no
  // cambió conserva el suyo entre análisis. Ver `fijarJuicios`.
  // p2-9 (2026-09-28): una viñeta que abre con «Ayudé con…»/«Participé en…» ya
  // no cuenta como verbo de acción (`opensWeakly` corrige el juicio).
  // p2-10 (2026-09-28): IMPLIED exige la línea citada; hasActionVerb cita `WEAK_OPENERS`; la blanda demostrada cita una viñeta, nunca el resumen.
  P2: "p2-11", // auditoría
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
  // p4-8 (2026-09-09): el prompt pedía "máximo un hueco obligatorio" y el CEO
  // especificó la forma contraria — "[x usuarios] … [x%]", dos cifras suyas en
  // la misma línea. Cambia lo que el modelo escribe, así que lo guardado con la
  // versión anterior ya no es la respuesta a esta pregunta.
  // p4-9 (2026-09-09): la petición lleva ahora DOS cosas que nunca viajaron —lo
  // que la tarjeta prometió cerrar sobre esa línea, y las otras viñetas del CV
  // con la orden de no repetir ninguna—. Antes el modelo reescribía a ciegas y
  // el guard lo castigaba por repetir algo que nadie le había mostrado.
  // p4-10 (2026-09-11): sin las dos amenazas falsas —«la reescritura entera se
  // descarta», «la respuesta entera se descarta»— que el código ya no cumple.
  // Y la cifra que la línea ya dice se copia tal cual y no se
  // vuelve hueco, y `variantWithoutMetric` tiene su regla. La regla vieja —«si
  // declarás un tamaño, la línea LLEVA su hueco»— hacía que el modelo cambiara
  // el «30%» del candidato por «[x%]». Reportado con captura.
  // p4-11 (2026-09-28): el idioma de salida se dice. En la pregunta «¿tenés
  // esto?» la persona contesta con sus palabras, y esa respuesta hace de
  // original: medido en Chrome, un CV en inglés recibió «Guardé y protegí los
  // tokens de sesión en Keychain…».
  // p4-12 (2026-09-28): las aperturas prohibidas salen de `WEAK_OPENERS`, no de una
  // copia escrita a mano que ya decía otra cosa («Ayudé a» contra «ayudé»).
  // p4-13 (2026-09-28): lo que la tarjeta promete (términos, verbo a evitar, tamaño) viaja en la primera llamada, y los términos comprometidos quedan fuera de la prueba de la palabra compartida.
  // p4-14 (2026-09-28): un término comprometido con formas « | » se cumple con una.
  // p4-15 (2026-09-28): no se declina con una promesa abierta de la tarjeta.
  // p4-16: el término comprometido tampoco choca con la regla del sector/ámbito.
  // p4-17: el término comprometido no se traduce.
  // p4-18: el término comprometido se integra con naturalidad y con la mayúscula de la oración.
  // p4-19 (2026-09-28): los ejes prometidos viajan estructurados, la persona puede
  // contar el resultado en la tarjeta, y el modelo declara `newBasis` de su línea.
  // p4-20 (CEO, 2026-09-28): la IA escribe resultado, método y términos; sólo las cifras son del candidato.
  // p4-21 (2026-09-28): lo que la línea ya nombra se queda; el término prometido va al lado.
  P4: "p4-25", // reescritura de viñeta
  // p5-2: la PRUEBA muestra un resultado con su tamaño, y el AJUSTE se dice con
  // las palabras del aviso cuando el CV ya lo demuestra.
  // p5-3 (2026-09-11): la misma `noScoreRule`, sin la amenaza falsa.
  // p5-4 (2026-09-28): recibe lo que la tarjeta prometió (el cargo abre la
  // identidad), una sola voz, y ni viñetas pegadas ni oraciones de una palabra.
  // Medido en Chrome: devolvía un resumen sin el cargo, con «Builds…» y un
  // «English.» suelto.
  // p5-5 (2026-09-28): recibe los años medidos sobre las fechas y los términos comprometidos desde la primera llamada.
  // p5-6 (2026-09-28): la tercera persona se prohíbe con el ejemplo del verbo conjugado.
  // p5-7 (2026-09-28): las funciones del resumen sin rótulos que el modelo copie,
  // y las tareas del aviso no son de la persona. Formas del cargo con « | ».
  // p5-8 (2026-09-28): los años son de toda la trayectoria.
  // p5-9 (2026-09-28): la prueba y los términos del ajuste salen de lo que ESTE puesto pide.
  // p5-10: los términos demostrados no se enumeran al final.
  // p5-11: los rótulos del pedido hablan de la persona, no del CV — el modelo copiaba «the CV shows».
  // p5-12: la prueba es el primer logro dado (con cifra); ninguna oración es una lista de términos.
  // p5-13: la prueba elegida se exige con su cifra.
  // p5-14: la prueba llega en su propia sección, no mezclada en una lista.
  // p5-15: la antigüedad del resumen viejo no se exige conservar (se escribe la medida).
  // p5-16: la regla de verdad compartida (truthRule) ahora deja a la IA escribir todo salvo las cifras.
  P5: "p5-16", // resumen
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
  return createHash("sha256").update(parts.join("\u0000")).digest("hex")
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
  /**
   * Todas las variantes normalizadas, de la más larga a la más corta. `sigla`
   * marca la que el aviso escribe en mayúsculas: ver `termCounts`.
   */
  ordered: { canonical: string; needle: string; sigla?: boolean }[]
}

/** «SIN», «IT», «US»: dos a cuatro letras escritas enteras en mayúscula. */
const SIGLA = /^[A-Z]{2,4}$/

/** `normalize` sin bajar a minúsculas: las posiciones coinciden con las suyas. */
function normalizeKeepCase(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
}

/**
 * CUÁNTOS TÉRMINOS DE LA VACANTE SUMA UNA VIÑETA (CEO, 2026-09-28).
 *
 * Una sola respuesta para el motor —cuántos requisitos le asigna a una línea— y
 * para el prompt —cuántos puede agregar—. Medido en producción: una viñeta de
 * Rappi recibió siete («…for AI/ML, automation pipelines, Kanban, agentic AI
 * workflows, CallKit, PushKit, and messaging») y en el banco de oficios el
 * modelo metía los cuatro términos del aviso en cada línea. Los reclutadores y
 * los ATS actuales castigan el relleno de palabras clave.
 */
export const TERMS_PER_BULLET = 2

/**
 * Marca del `detail` de un requisito que NINGUNA viñeta sostiene: la tarjeta lo
 * informa y Tailor no lo escribe, porque sería experiencia que el CV no tiene.
 * La leen el motor (`findingsOf`) y la pantalla (`view-model`).
 */
export const SIN_RESPALDO = "sin_respaldo"
/**
 * Marca del `detail` de un requisito que el CV nombra MAL ESCRITO («Objetive-C»
 * por «Objective-C»): un filtro no lo cuenta y la persona no lo sabe. La tarjeta
 * se lo dice; nadie lo corrige solo. Detalle: `mal_escrito:<como lo escribe el CV>`.
 */
export const MAL_ESCRITO = "mal_escrito"

export function buildTermIndex(terms: TermVariants[]): TermIndex {
  const byKey = new Map<string, string>()
  const ordered: { canonical: string; needle: string }[] = []
  for (const t of terms) {
    /**
     * UN NOMBRE PEGADO ES EL MISMO NOMBRE (2026-09-28, medido en producción):
     * la vacante pedía «CoreData» y el CV decía «Core Data» cinco veces; el panel
     * lo daba por faltante. Sólo se parte en la costura minúscula→Mayúscula entre
     * dos palabras de 3+ letras: «SwiftUI», «iOS» y «GraphQL» no se tocan.
     */
    const pegados = [t.canonical, ...t.variants]
      .map((raw) => raw.replace(/([a-z]{3,})([A-Z][a-z]{2,})/g, "$1 $2"))
      .filter((x, i) => x !== [t.canonical, ...t.variants][i])
    for (const raw of [t.canonical, ...t.variants, ...pegados]) {
      const needle = normalize(raw)
      if (!needle) continue
      /**
       * EL PLURAL ES EL MISMO TÉRMINO (2026-09-28, medido contra la API): el
       * aviso pedía «API» y el CV decía «RESTful APIs»; la tarjeta pedía
       * escribirlo y la IA, que lo veía escrito, se negaba. Se suma la forma con
       * «s» final, que cuenta para el mismo canónico.
       */
      const plural = /[a-z]$/.test(needle) && !needle.endsWith("s") ? `${needle}s` : null
      if (plural && !ordered.some((o) => o.needle === plural && o.canonical === t.canonical)) {
        // Sin marca de sigla: «APIs» no está entero en mayúsculas y la sigla exacta ya la cubre su propia entrada.
        ordered.push({ canonical: t.canonical, needle: plural })
      }
      const key = termKey(raw)
      if (!byKey.has(key)) byKey.set(key, t.canonical)
      if (!ordered.some((o) => o.needle === needle && o.canonical === t.canonical)) {
        ordered.push({ canonical: t.canonical, needle, ...(SIGLA.test(raw.trim()) && { sigla: true }) })
      }
    }
  }
  // Más largo primero: es lo que hace que "react native" reclame la aparición
  // antes de que "react" la vea.
  ordered.sort((a, b) => b.needle.length - a.needle.length)
  return { byKey, ordered }
}


/**
 * CUÁNTAS VECES DICE UN TEXTO CADA TÉRMINO DEL ÍNDICE.
 *
 * Una posición del texto pertenece a UN solo término: el más largo que la cubre.
 *
 * ── UNA SOLA CUENTA PARA TODA LA PANTALLA (2026-09-24) ──────────────────────
 * «¿El CV dice este término?» tenía tres respuestas: ésta para el puntaje, un
 * `veces` propio en la tabla —palabra exacta, sin variantes ni match maximal— y
 * el nombre que el modelo escribía en la auditoría. Medido en producción: la
 * tabla decía «lo decís 0 veces» sobre términos que el puntaje contaba, y al
 * revés. Contar es UNA pregunta, y se contesta acá para el puntaje, la tabla,
 * el plan de habilidades y las tarjetas.
 */
export function termCounts(index: TermIndex, text: string): Map<string, number> {
  const hay = ` ${normalize(text)} `
  /**
   * UNA SIGLA SÓLO CUENTA ESCRITA COMO SIGLA.
   *
   * Medido el 2026-09-28: una vacante boliviana pedía «facturación electrónica
   * (SIN)» —el Servicio de Impuestos— y al comparar en minúsculas cada «sin» del
   * CV la cubría. Lo mismo «IT» contra «it» o «US» contra «us» en inglés. Si el
   * aviso la escribe en mayúsculas, el CV tiene que escribirla igual.
   */
  const conMayusculas = ` ${normalizeKeepCase(text)} `
  const comparable = conMayusculas.length === hay.length
  const taken: [number, number, string][] = []
  const counts = new Map<string, number>()

  for (const { canonical, needle, sigla } of index.ordered) {
    const pat = ` ${needle} `
    let from = 0
    for (;;) {
      const at = hay.indexOf(pat, from)
      if (at === -1) break
      const start = at + 1
      const end = start + needle.length
      if (sigla && comparable && conMayusculas.slice(start, end) !== needle.toUpperCase()) {
        from = at + 1
        continue
      }
      // El término largo reclama lo que NOMBRA DISTINTO: «React Native» no es
      // React. Pero lo que cierra el nombre es el sustantivo: «Xcode Instruments»
      // ES Instruments, «Unit Testing» ES testing. Un término distinto que
      // termina donde termina el largo no se lo roba nadie (medido el
      // 2026-09-28: el CV declaraba «Xcode Instruments» y el panel decía que
      // faltaba Instruments).
      const overlaps = taken.some(
        ([s, e, c]) => start < e && end > s && !(end === e && start > s && c !== canonical),
      )
      if (!overlaps) {
        taken.push([start, end, canonical])
        counts.set(canonical, (counts.get(canonical) ?? 0) + 1)
      }
      from = at + 1
    }
    /**
     * UNA SIGLA CON SU SUFIJO ES LA SIGLA (2026-09-28, medido contra la API): el
     * aviso pedía «REST» y el CV decía «RESTful APIs»; el panel lo daba por
     * faltante y la IA, que lo veía escrito, se negaba a agregarlo — la tarjeta
     * quedaba sin salida. Sólo en mayúsculas y con un sufijo corto en minúsculas.
     */
    if (sigla && comparable && !counts.has(canonical)) {
      const conSufijo = new RegExp(`(?<=\\s)${needle.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z]{2,4}(?=\\s)`, "g")
      const n = (conMayusculas.match(conSufijo) ?? []).length
      if (n > 0) counts.set(canonical, n)
    }
    // Y si la sigla abre un término más largo: «RESTful APIs» dice «REST API».
    // Sin esto la IA tenía que escribir «REST API and RESTful APIs» (medido el
    // 2026-09-28) para que el panel lo diera por escrito.
    const [primera, ...resto] = needle.split(" ")
    const siglaInicial = canonical.split(/\s+/)[0]
    if (resto.length && comparable && !counts.has(canonical) && /^[A-Z]{2,5}$/.test(siglaInicial) && normalize(siglaInicial) === primera) {
      let n = 0
      for (const m of conMayusculas.matchAll(new RegExp(`(?<=\\s)${siglaInicial}[a-z]{2,4}(?= )`, "g"))) {
        if (hay.startsWith(` ${resto.join(" ")} `, (m.index ?? 0) + m[0].length)) n++
      }
      if (n > 0) counts.set(canonical, n)
    }
  }
  return counts
}

/** Qué términos del índice aparecen realmente en un texto. Canónicos. */
export function termsIn(index: TermIndex, text: string): Set<string> {
  return new Set(termCounts(index, text).keys())
}

/**
 * LOS TÉRMINOS QUE LA VACANTE PONE EN JUEGO, con la forma literal del aviso.
 *
 * Vive acá porque lo necesitan el motor, el puntaje y la pantalla, y los tres
 * tienen que contar con las MISMAS variantes: si uno buscara sólo el canónico y
 * otro también la forma del aviso, volverían a discrepar.
 */
export function specTerms(spec: JobSpec): TermVariants[] {
  const out: TermVariants[] = []
  for (const r of [...(spec.mustHave ?? []), ...(spec.niceToHave ?? [])]) {
    // `raw` es una VARIANTE sólo si nombra el término de otra forma («cuadre de
    // caja» para «Arqueo de caja»). Si ya contiene el canónico —P1 pone ahí la
    // oración del aviso, regla 4c—, sólo puede coincidir donde el canónico ya
    // coincide, y por match maximal le ROBA el tramo a sus vecinos: medido el
    // 2026-09-28, «Integrate REST and GraphQL APIs» (raw de REST) dejaba GraphQL
    // en «no lo pude contar», y «…CI/CD pipelines with Fastlane» se comía CI/CD.
    // «Scrum | Kanban» es UN requisito con dos salidas (P1, regla 1b): tener
    // cualquiera lo cumple, así que cada opción es variante. Con « | » y no con
    // « / »: medido el 2026-09-28, pedirle barras hacía que el modelo escribiera
    // «async / await» y «AI / ML», que se leerían como alternativas falsas.
    const opciones = r.skill.split(/\s*\|\s*/).filter((o) => o.trim())
    const variants = [
      ...(` ${normalize(r.raw)} `.includes(` ${normalize(r.skill)} `) ? [] : [r.raw]),
      ...("cvForms" in r && r.cvForms ? r.cvForms : []),
      ...(opciones.length > 1 ? opciones : []),
    ]
    const previo = out.find((o) => normalize(o.canonical) === normalize(r.skill))
    if (previo) previo.variants.push(...variants)
    else out.push({ canonical: r.skill, variants })
  }
  return out
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
  /**
   * ¿SE EJERCE O SE TIENE?
   *
   * `capability` es algo que se HACE en un puesto —una herramienta, una
   * técnica, una tarea— y se demuestra en una viñeta. `credential` es algo que
   * se TIENE —una licencia, un título, una certificación, un idioma, un
   * permiso— y vive en su sección del CV, no en una línea de experiencia.
   *
   * Medido en local el 2026-09-24: sin esta distinción la tarjeta preguntaba
   * «¿Qué hiciste con Licencia de conducir B? ¿En qué puesto va?» y ofrecía
   * redactar una viñeta. El modelo lo DECLARA; sin respuesta, es capacidad —el
   * caso de siempre—.
   */
  kind: z.enum(["capability", "credential"]).optional().catch(undefined),
  /**
   * CÓMO LO ESCRIBE ESTE CV, cuando es lo mismo escrito distinto («CoreData»
   * por «Core Data», «SOLID design principles» por «SOLID principles»). No
   * viene del aviso: lo juzga la auditoría y el motor lo agrega sólo después de
   * comprobar que ese texto está en el CV. Es variante del índice como `raw`,
   * así el puntaje, la tabla y Tailor cuentan lo mismo. Ver `conFormasDelCv`.
   */
  cvForms: z.array(z.string().max(80)).max(4).optional().catch(undefined),
})

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
  /**
   * TODO NOMBRE PROPIO DE HERRAMIENTA, TECNOLOGÍA, NORMA O MÉTODO DEL AVISO.
   *
   * ── POR QUÉ SE DECLARA (medido contra la API el 2026-09-24) ───────────────
   * La regla en prosa —«una herramienta nombrada en las responsabilidades
   * también es un requisito»— no alcanzó en dos corridas: GraphQL, Clean
   * Architecture y Crashlytics quedaban fuera de las dos listas, y en la
   * segunda también Fastlane. Un campo vacío se nota; una regla salteada no deja
   * rastro. El modelo DECLARA lo que nombra el aviso y el código garantiza que
   * nada de eso quede fuera (ver la transformación de abajo).
   */
  namedTools: lista(z.string().max(80), 60),
}).transform(({ namedTools, ...crudo }) => {
  /**
   * UN TÉRMINO VIVE EN UNA SOLA LISTA.
   *
   * Medido en local el 2026-09-24: el modelo puso Swift, SwiftUI y Combine en
   * obligatorios Y en deseables. El puntaje los contaba dos veces en el
   * denominador y la tarjeta caía en la sección que tocara. Si el aviso lo
   * exige, es obligatorio; y una blanda no repite un requisito duro. La regla
   * ya estaba escrita en el prompt («no repite algo que ya pusiste»): un prompt
   * es una petición, esto es el contrato.
   */
  // Cada opción de una alternativa («LLM-based services | Core ML») es también
  // su llave: si el aviso ya la acepta como obligatoria, no se repite abajo
  // como deseable (medido el 2026-09-29: «Core ML» salía en las dos listas).
  const llaves = (rs: { skill: string; raw: string }[]) =>
    new Set(rs.flatMap((r) => [termKey(r.skill), termKey(r.raw), ...r.skill.split(/\s*\|\s*/).map(termKey)]))
  const exigidos = llaves(crudo.mustHave)
  const niceToHave = crudo.niceToHave.filter(
    (r, i, xs) => !exigidos.has(termKey(r.skill)) && xs.findIndex((x) => termKey(x.skill) === termKey(r.skill)) === i,
  )
  const duros = new Set([...exigidos, ...llaves(niceToHave)])
  const spec = {
    ...crudo,
    mustHave: crudo.mustHave.filter((r, i, xs) => xs.findIndex((x) => termKey(x.skill) === termKey(r.skill)) === i),
    niceToHave,
    softSignals: crudo.softSignals.filter((x) => !duros.has(termKey(x))),
  }
  /**
   * LO QUE EL AVISO NOMBRA Y NINGUNA LISTA TRAE, ENTRA COMO DESEABLE.
   *
   * Deseable y no obligatorio: la regla del parser ya dice «ante la duda,
   * deseable», y el tope de peso impide que un deseable valga más que un
   * obligatorio. Se compara con `termKey`, la llave de igualdad del motor, para
   * que «CI/CD» y «ci-cd» no entren dos veces. El campo no viaja más allá: su
   * trabajo termina acá.
   */
  // Un nombre que ya vive DENTRO de un requisito —«Excel» en «Excel avanzado»,
  // medido en local el 2026-09-24— no es un requisito nuevo: agregarlo contaba
  // el mismo pedido dos veces y abría dos tarjetas. Se busca como palabra, con
  // la misma normalización del resto del motor.
  const dichos = [...spec.mustHave, ...spec.niceToHave].map((r) => ` ${normalize(r.skill)} ${normalize(r.raw)} `)
  const yaEsta = (t: string) => dichos.some((d) => d.includes(` ${normalize(t)} `))
  const vistos = new Set<string>()
  const faltan = namedTools
    .map((t) => t.trim())
    .filter((t) => {
      const k = termKey(t)
      if (!k || vistos.has(k) || yaEsta(t)) return false
      vistos.add(k)
      return true
    })
  return {
    ...spec,
    niceToHave: [
      ...spec.niceToHave,
      ...faltan.slice(0, Math.max(0, 40 - spec.niceToHave.length)).map((t) => ({ skill: t, raw: t, years: null, category: null, kind: "capability" as const })),
    ],
  }
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
  /**
   * CÓMO SE CONTACTA A LA PERSONA, sólo para saber si un lector lo encuentra.
   * NO viaja al modelo —`compactTree` elige sus campos uno por uno— ni entra a
   * la huella del CV: es un dato personal y no cambia ningún juicio.
   */
  contact?: { email: string; phone: string }
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
  "soft_not_shown", // la vacante la pide, el CV la declara y nada la respalda
  /**
   * ── LOS DOS QUE COBRABAN SIN REPORTAR (CEO, 2026-09-09) ────────────────────
   * El puntaje descuenta por el cargo que no coincide (0,14 de la relevancia) y
   * por los verbos repetidos (0,10 del impacto), y NINGÚN hallazgo declaraba
   * esos componentes: un puntaje que cobra algo que no enseña a arreglar no es
   * un puntaje, es un reproche con decimales.
   */
  "title_mismatch", // el cargo que la vacante busca no está escrito en el CV
  "verb_repeated", // ese verbo abre más de una viñeta
  "years_short", // la vacante pide más años de los que el CV prueba
  "cliche", // una frase que podría estar en el CV de cualquiera
  "role_too_long", // un puesto con más viñetas de las que se leen
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

/**
 * DE QUÉ TIPO VINO CADA PIEZA DE UN DETALLE FUSIONADO.
 *
 * ── EL DEFECTO QUE ESTO CIERRA (captura del CEO, 2026-09-11) ───────────────
 * La tarjeta decía «2 requirements the posting asks for are missing» y listaba
 * «first or early mobile hire at a startup» y «método». El segundo no era un
 * requisito: era el eje que le faltaba a la viñeta (`no_result`). Al fusionarse
 * en una tarjeta, el detalle se concatenaba y se perdía de qué tipo vino cada
 * pieza, así que la pantalla contó las dos como requisitos y pintó el token
 * crudo, en castellano, dentro de un CV en inglés.
 *
 * Ahora cada pieza fusionada viaja con su tipo, y quien la lee sabe qué es.
 * La marca es un carácter de control: nunca aparece en un CV ni en un aviso.
 */
const TYPE_MARK = "\u001F"

export interface DetailPart {
  type: FindingType
  detail: string
}

/** Las piezas de un detalle. Una sin marca es del tipo del hallazgo. */
export function detailParts(f: { type: FindingType; detail: string }): DetailPart[] {
  return f.detail
    .split(DETAIL_SEPARATOR)
    .map((pieza) => pieza.trim())
    .filter(Boolean)
    .map((pieza) => {
      const corte = pieza.indexOf(TYPE_MARK)
      return corte > 0
        ? { type: pieza.slice(0, corte) as FindingType, detail: pieza.slice(corte + 1) }
        : { type: f.type, detail: pieza }
    })
}

/** El detalle de una tarjeta fusionada, con cada pieza marcada con su tipo. */
export function encodeDetail(parts: DetailPart[]): string {
  const llenas = parts.filter((p) => p.detail.trim())
  if (llenas.length <= 1) return llenas[0]?.detail ?? ""
  return llenas.map((p) => `${p.type}${TYPE_MARK}${p.detail}`).join(DETAIL_SEPARATOR)
}

/**
 * LA IDENTIDAD DE UN HALLAZGO.
 *
 * Nodo más tipo alcanza mientras un emisor produzca UN hallazgo por nodo y tipo,
 * que es lo que hace `push`: dos cosas dichas de la misma línea se fusionan en
 * una tarjeta. Los chequeos de lectura son la excepción y no la vieron: los
 * siete se anclan en el resumen con el tipo `parse_risk`, así que compartían id.
 *
 * Y un id compartido no es un detalle cosmético: `loyalty` empareja por él para
 * saber qué ya se arregló. Con siete hallazgos bajo una sola huella, cerrar uno
 * marcaba los otros seis como REGRESIÓN —«lo arreglaste y lo volviste a
 * romper»— sobre chequeos que el usuario nunca tocó.
 *
 * `matiz` es lo que distingue a dos hallazgos que comparten nodo y tipo. Se
 * omite en todos los emisores menos ése, y omitirlo devuelve el id de siempre:
 * los registros de resolución ya guardados siguen emparejando.
 */
export function findingId(nodeId: NodeId, type: FindingType, matiz?: string): string {
  return (matiz ? sha256(nodeId, type, RUBRIC_VERSION, matiz) : sha256(nodeId, type, RUBRIC_VERSION)).slice(0, 16)
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
   * Hubo un `add_skill` —agregar un término suelto a Habilidades— y se retiró el
   * 2026-09-09: la lista entera la decide `skillPlan` con el techo de veinte y
   * los pesos del aviso, así que un remedio por término era la mitad de esa
   * respuesta dada por otro dueño.
   *
   * ── LOS DOS QUE FALTABAN (2026-09-24, medido en producción) ──────────────
   * Con un solo remedio, todo hallazgo terminaba en «reescribí esta línea», y
   * eso mentía en dos casos:
   *
   *   ask  — la vacante pide algo de lo que el CV no tiene NINGÚN rastro. Pedir
   *          una reescritura es pedirle al modelo que lo afirme: escribió
   *          «applying security best practices for fintech apps» sobre un
   *          puesto de 2015 que no era fintech. El hecho lo pone la persona —se
   *          le pregunta si lo tiene y dónde— y recién ahí se redacta, por el
   *          camino de una línea nueva en el puesto que la persona elige.
   *   none — lo arregla un dato del documento (las fechas, el orden), no una
   *          redacción. El botón de la tarjeta de fechas reescribía el RESUMEN.
   */
  remedy: "rewrite" | "none"
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
// SUGERENCIAS
// ─────────────────────────────────────────────────────────────────────────────

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
  /**
   * LOS TRES EJES DE LA LÍNEA NUEVA, declarados por quien la escribió.
   *
   * La tarjeta promete ejes —«no dice en qué terminó»— y viajaban como prosa:
   * el modelo, sin un resultado verdadero que escribir, rellenaba con una
   * palabra de la vacante («Resolví reclamos de clientes con atención al
   * cliente», medido el 2026-09-28) y nada lo veía. Declarados, el motor
   * compara contra lo prometido y, si falta el resultado, se le pide el dato a
   * la persona en vez de entregar relleno. Omitido, cuenta como no cumplido.
   */
  newBasis: z
    .object({
      hasActionVerb: bandera(),
      hasResult: bandera(),
      hasMethod: bandera(),
    })
    .nullish(),
})
export type Suggestion = z.infer<typeof SuggestionSchema>
/** Los ejes de una viñeta, con el nombre con el que el motor los marca en un hallazgo. */
export type Axis = "verbo" | "resultado" | "método"

/** Lo que el motor le agrega a una sugerencia. El modelo no lo puede escribir. */
export interface AnchoredSuggestion extends Suggestion {
  /** El hash del nodo sobre el que se pensó. Si no coincide al aplicar, STALE. */
  basedOnHash: string
  /** El texto que reemplaza. Sin esto, "aplicar" escribe sobre la línea de al lado. */
  originalText: string
  /**
   * LA LÍNEA DEL CV A LA QUE ESTA PROPUESTA SE PARECE, si se parece.
   *
   * Era un rechazo —«ya lo dice otra línea, no se escribió»— y pasó a aviso
   * (CEO, 2026-09-11): la propuesta llega igual y la ventana nombra la línea
   * parecida, para que el usuario decida con las dos a la vista.
   */
  similarTo?: string
}

// Acá vivía un `delta`. Su comentario decía «medido recalculando sobre una
// copia» y `anchor` le pasaba 0 en los dos caminos; nadie lo leía nunca. La
// medición de verdad la hace `applySuggestion`, que escribe en una copia, vuelve
// a puntuar y resta — y ESE número sí lo lee la hoja de confirmación. Un campo
// que vale cero y promete una medición en su comentario es peor que no tenerlo:
// el día que alguien lo conecte, le cree.

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
  /**
   * CON QUÉ NOMBRE SE CERRÓ, Y QUÉ QUEDÓ ESCRITO.
   *
   * El motor no los lee: son para que la pantalla pueda volver a dibujar
   * «Hechas» después de recargar. Sin ellos ese registro vivía en memoria y se
   * perdía con un F5 —reportado— porque el hallazgo ya no existe cuando la
   * lista lo necesita.
   *
   * Opcionales a propósito: lo escrito con la forma vieja sigue siendo legible.
   */
  title?: string
  kind?: "applied" | "dropped" | "dismissed"
  before?: string
  after?: string
}

export const ResolutionSchema = z.object({
  findingId: z.string().max(64),
  nodeId: z.string().max(64),
  nodeHashAtResolution: z.string().max(64),
  resolvedBy: z.enum(["AI_SUGGESTION", "USER_EDIT", "DISMISSED"]),
  resolvedAt: z.string().max(40),
  /**
   * CON QUÉ NOMBRE SE CERRÓ, Y QUÉ QUEDÓ ESCRITO.
   *
   * ── EL DEFECTO QUE ESTO CIERRA (CEO, 2026-09-09) ──────────────────────────
   * «Hechas» vivía SÓLO en la memoria de la pantalla: recargabas y el registro
   * de todo lo que habías resuelto desaparecía. El motor ya guardaba la
   * resolución —para no volver a señalar lo mismo— pero guardaba lo mínimo para
   * ESA pregunta: un id y un hash. Con eso no se puede volver a dibujar la
   * lista, porque el hallazgo ya no existe cuando la pantalla la necesita.
   *
   * Son opcionales a propósito: lo escrito con la forma vieja sigue siendo
   * legible y esas filas se muestran con lo que tienen. Un registro que se
   * rompe con lo ya guardado no es un registro.
   */
  title: texto(160).optional(),
  kind: z.enum(["applied", "dropped", "dismissed"]).optional(),
  before: texto(600).optional(),
  after: texto(600).optional(),
})

export const ResolutionLogSchema = z.array(ResolutionSchema).max(500)
