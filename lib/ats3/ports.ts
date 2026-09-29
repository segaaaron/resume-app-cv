// lib/ats3/ports.ts
//
// LOS PUERTOS DEL MOTOR: lo que el motor le pide a la IA y al almacén, y las
// claves con que el almacén guarda cada respuesta. El motor no importa el
// módulo de IA: recibe estos contratos, y así se prueba sin red (ver engine.ts).

import { PROMPT_VERSION, RUBRIC_VERSION, normalize, sha256, type Axis, type JobSpec, type NodeId, type ResumeTree, type Suggestion } from "@/lib/ats3/contracts"
import { type Ledger } from "@/lib/ats3/ledger"
import { type AuditFacts } from "@/lib/ats3/score"

// ─────────────────────────────────────────────────────────────────────────────
// PUERTOS
// ─────────────────────────────────────────────────────────────────────────────

/** Las seis preguntas que sólo un modelo puede contestar. Ya validadas. */
export interface AtsAi {
  parseJob(jdText: string, language: "es" | "en"): Promise<JobSpec>
  audit(tree: ResumeTree, spec: JobSpec): Promise<AuditFacts>
  rewriteBullet(input: RewriteInput): Promise<Suggestion>
  rewriteSummary(input: SummaryInput): Promise<Suggestion>
}

export interface RewriteInput {
  original: string
  /**
   * LO QUE ESTA LÍNEA TIENE QUE RESOLVER, dicho UNA vez.
   *
   * Es el `detail` de la tarjeta que apretó el usuario — la única tarjeta que
   * esa línea puede tener— con todo adentro: el eje que falta, el término
   * enterrado, la blanda sin demostrar. Antes el modelo reescribía A CIEGAS:
   * recibía el CV, la vacante y el ledger, y NADA de lo que el panel le había
   * prometido al usuario. Por eso podía volver con una línea que no cerraba lo
   * que la tarjeta decía, y el usuario leía el panel contradiciéndose.
   *
   * Va acá y en ningún otro lado: una sola tarjeta, una sola instrucción, una
   * sola reescritura.
   */
  focus?: string
  bulletId: NodeId
  roleContext: string
  /** Las otras viñetas del CV: no puede devolver ninguna calcada. */
  siblings?: string[]
  spec: JobSpec
  ledger: Ledger
  declaredSkills: string[]
  /**
   * LO QUE LA TARJETA PROMETIÓ, EN LA PRIMERA LLAMADA Y NO SÓLO EN EL REINTENTO.
   *
   * Viajaban nada más como corrección del reintento: el modelo no sabía en la
   * primera llamada que tenía que escribir el término, esquivar un verbo o
   * dejar el hueco de la cifra, así que fallaba siempre una vez y se pagaba una
   * segunda llamada por algo que nadie le había dicho (2026-09-28).
   */
  mustWrite?: string[]
  avoidOpener?: string
  wantsSize?: boolean
  /** Los ejes que la tarjeta dice que faltan: la línea nueva tiene que tenerlos. */
  axes?: Axis[]
  /** Lo que la persona contó en la tarjeta sobre esta línea (en qué terminó, cómo). */
  told?: string
  /** Qué falló del intento anterior. Vacío la primera vez. */
  nudge?: string
}

export interface SummaryInput {
  current: string
  /**
   * TODO LO QUE EL CV DICE: cada viñeta y el resto de sus secciones (idiomas,
   * educación, certificaciones). Con sólo tres viñetas el modelo pegaba una tal
   * cual y afirmaba que el CV no decía un idioma que estaba en Idiomas
   * (medido el 2026-09-28).
   */
  cvLines: string[]
  otherSections: string
  /** Lo que la tarjeta prometió cerrar sobre el resumen, como en las viñetas. */
  focus?: string
  /** Lo que la tarjeta prometió escribir tal cual —el cargo—, desde la primera llamada. */
  mustWrite?: string[]
  /**
   * AÑOS DE EXPERIENCIA MEDIDOS SOBRE LAS FECHAS, completos y sin redondear
   * hacia arriba. La identidad del resumen dice cuántos años lleva la persona,
   * y el modelo los sacaba sumando períodos a ojo. null si no hay fechas.
   */
  yearsOfExperience: number | null
  spec: JobSpec
  topBullets: string[]
  /** Lo que la vacante pide y el CV ya demuestra, en su orden de peso (`provenTermsOf`). */
  provenTerms: string[]
  ledger: Ledger
  declaredSkills: string[]
  nudge?: string
}

/** Memoria. La implementa quien tenga base de datos; el motor no la conoce. */
export interface AtsStore {
  read(kind: CacheKind, hash: string): Promise<unknown | null>
  write(kind: CacheKind, hash: string, payload: unknown): Promise<void>
}

export type CacheKind = "ats3-jd" | "ats3-audit" | "ats3-fix" | "ats3-log" | "ats3-lock"

// ─────────────────────────────────────────────────────────────────────────────
// CLAVES DE CACHÉ
//
// Cada una nombra TODO de lo que depende su respuesta. Una clave incompleta es
// peor que no tener caché: sirve la respuesta de otra pregunta.
// ─────────────────────────────────────────────────────────────────────────────

export const cacheKey = {
  /** La vacante no depende del CV: dos usuarios con el mismo aviso comparten. */
  jd: (jdText: string, model: string) => sha256(normalize(jdText), PROMPT_VERSION.P1, model),

  /**
   * Por CV COMPLETO, no por nodo — y el comentario anterior decía lo contrario.
   *
   * La auditoría es UNA llamada que mira el documento entero: necesita ver todas
   * las viñetas juntas para detectar logros repetidos entre puestos. Partirla
   * por nodo costaría catorce llamadas para ahorrar una.
   *
   * Editar una línea invalida la auditoría entera y cuesta esa única llamada.
   * El documento habla de "reauditar sólo ese nodo": acá no aplica, porque el
   * precio de la pieza completa es el mismo que el de una sola.
   */
  audit: (nodeHashValue: string, jdHash: string, model: string) =>
    sha256(nodeHashValue, jdHash, RUBRIC_VERSION, PROMPT_VERSION.P2, model),

  /** Lleva la firma del ledger: si otra viñeta gastó ese verbo, esto ya no vale. */
  fix: (nodeId: NodeId, nodeHashValue: string, jdHash: string, ledgerSig: string, model: string, focus = "") =>
    // El foco entra a la clave porque entra al prompt: sin él, pedir «le falta
    // el método» y «tejé este término» sobre la misma línea devolvía la primera
    // respuesta guardada para las dos.
    // Las dos versiones: el resumen lo escribe P5 y se guarda acá igual que una
    // viñeta. Sólo con P4, un cambio del prompt del resumen no llegaba nunca —
    // se servía el resumen viejo (medido el 2026-09-28).
    sha256(nodeId, nodeHashValue, jdHash, ledgerSig, PROMPT_VERSION.P4, PROMPT_VERSION.P5, model, focus),

  /** El registro de lo resuelto, por CV y vacante. */
  log: (resumeId: string, jdHash: string) => sha256(resumeId, jdHash),

  /** Los juicios fijados al texto que los sostiene, por CV. Ver `fijarJuicios`. */
  lock: (resumeId: string, model: string) => sha256("lock", resumeId, RUBRIC_VERSION, PROMPT_VERSION.P2, model),
}
