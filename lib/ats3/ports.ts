// lib/ats3/ports.ts
//
// LOS PUERTOS DEL MOTOR: lo que el motor le pide a la IA y al almacén, y las
// claves con que el almacén guarda cada respuesta. El motor no importa el
// módulo de IA: recibe estos contratos, y así se prueba sin red (ver engine.ts).

import { PROMPT_VERSION, RUBRIC_VERSION, normalize, sha256, type JobSpec, type NodeId, type ResumeTree, type Suggestion } from "@/lib/ats3/contracts"
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

/**
 * LO QUE TAILOR RECIBE PARA UNA VIÑETA (CEO, 2026-09-29): la decisión del ATS
 * tal cual, la línea, los hechos de ese puesto y lo que contó la persona.
 */
export interface RewriteInput {
  original: string
  bulletId: NodeId
  /** Cargo y empresa del puesto. */
  roleContext: string
  /** Las otras viñetas de ESE puesto: hechos de la persona que se pueden usar. */
  roleLines?: string[]
  /** Todas las demás viñetas del CV: la nueva no puede ser casi igual a ninguna. */
  siblings?: string[]
  /** Por qué el ATS pide mejorarla. */
  reason?: string
  /** Las skills del puesto que el ATS decidió escribir en esta línea. */
  terms?: string[]
  /** Este puesto necesita la cifra de este logro: va el hueco para la persona. */
  needsFigure?: boolean
  /** Lo que la persona contestó a la pregunta del ATS, si la hubo. */
  told?: string
  /** Skill que pide la vacante y el CV no muestra: la IA escribe el trabajo con ella en esta línea; la persona confirma si es verdad. */
  propone?: boolean
  /** Viñeta nueva: no hay línea original que conservar (se agrega o reemplaza a la señalada). */
  nueva?: boolean
  /** Idioma del CV. */
  language: "es" | "en"
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
  declaredSkills: string[]
  /**
   * LA TRAYECTORIA: cargo, empresa y fechas de cada puesto (2026-10-02). Sin esto
   * el resumen sólo veía viñetas sueltas y no podía saber cuánto duró cada
   * especialidad: medido en local, «React Native Developer con 7 años» en un CV
   * con React Native de 2017 a 2020.
   */
  career?: { title: string; company: string; from: string; to: string }[]
  nudge?: string
}

/** Memoria. La implementa quien tenga base de datos; el motor no la conoce. */
export interface AtsStore {
  read(kind: CacheKind, hash: string): Promise<unknown | null>
  write(kind: CacheKind, hash: string, payload: unknown): Promise<void>
}

export type CacheKind = "ats3-jd" | "ats3-audit" | "ats3-fix" | "ats3-log" | "ats3-judge"

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

  /** La reescritura: la línea, la vacante y TODO lo que la tarjeta le pasa a Tailor. */
  fix: (nodeId: NodeId, nodeHashValue: string, jdHash: string, model: string, pedido = "") =>
    // Las dos versiones: el resumen lo escribe P5 y se guarda acá igual que una viñeta.
    sha256(nodeId, nodeHashValue, jdHash, PROMPT_VERSION.P4, PROMPT_VERSION.P5, model, pedido),

  /** El registro de lo resuelto, por CV y vacante. */
  log: (resumeId: string, jdHash: string) => sha256(resumeId, jdHash),

  /**
   * Lo que el ATS juzgó de cada línea, por su texto, para este CV y esta vacante.
   * Con la versión del diagnóstico: un juicio fijado con un prompt viejo no puede
   * tapar lo que el prompt nuevo corrigió.
   */
  judge: (resumeId: string, jdHash: string) => sha256("judge", resumeId, jdHash, PROMPT_VERSION.P2),

}
