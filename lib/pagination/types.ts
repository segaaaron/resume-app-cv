/**
 * PageFlow Engine — tipos del motor de paginación v2 (F0 spike).
 *
 * El motor convierte una secuencia lineal de "átomos" medidos (items de
 * experiencia, filas de skills, bullets, headers de sección) en un
 * `PageLayout`: la distribución de esos átomos en páginas A4 con cortes
 * elegidos por un breaker de programación dinámica que minimiza el
 * "badness" total (inspirado en Knuth-Plass).
 *
 * Este archivo es PURO (sin DOM). El measurement que produce `FlowAtom[]`
 * vive en `measurer.ts` (runtime browser); el breaker que consume estos
 * tipos vive en `breaker.ts` y es determinista + testeable.
 */

/** Unidad atómica e indivisible del flujo de un CV (salvo `splittable`). */
export interface FlowAtom {
  /** Identificador estable por contenido (para cache de alturas). */
  id: string
  /** Altura propia medida en px a 210mm reales (rect, sin márgenes). */
  height: number
  /**
   * Gap vertical REAL hasta el siguiente átomo del flujo (px), medido por
   * posición (top del siguiente − bottom de este). Captura el margen
   * colapsado real sin doble-conteo. `0`/omitido para el último átomo.
   *
   * El breaker suma este gap SOLO entre átomos que caen en la MISMA página;
   * el gap en una frontera de página no se renderiza y se descarta.
   */
  gapAfter?: number
  /**
   * Header de sección: nunca debe quedar como último átomo de una página
   * (huérfano). Penaliza fuerte si el corte lo deja solo al pie.
   */
  keepNext?: boolean
  /**
   * Marca el inicio de una sección nueva. Cortar la página JUSTO antes de
   * un inicio de sección es preferido (bonus): el corte cae en frontera
   * natural en vez de partir el interior de una sección.
   */
  sectionStart?: boolean
  /**
   * Párrafo largo que PODRÍA partirse a nivel de línea. En el spike F0 no
   * partimos átomos (cada uno va entero); se reserva para F6.
   */
  splittable?: boolean
  /** Fuerza que este átomo empiece en una página nueva (pageBreakBefore). */
  forcedBreakBefore?: boolean
}

/** Una página compuesta: los átomos que contiene + su relleno. */
export interface ComposedPage {
  /** Índices (en el array original de átomos) contenidos en esta página. */
  atomIndices: number[]
  /** Altura usada por los átomos (px). */
  usedHeight: number
  /** Espacio muerto al pie de esta página (px) = pageHeight - usedHeight. */
  fillHeight: number
}

/** Resultado del breaker: fuente única de verdad para preview y print. */
export interface PageLayout {
  pages: ComposedPage[]
  /** Altura útil de página usada en el cálculo (px). */
  pageHeight: number
  /** Badness total de la solución elegida (menor = mejor). */
  totalBadness: number
}

/**
 * Pesos del score de badness. Ajustables (F6 hará tuning). Valores por
 * defecto conservadores: prohibiciones = Infinity, penalidades = escala px.
 */
export interface BadnessWeights {
  /** α — header huérfano al pie de página (keepNext último). */
  orphanHeader: number
  /** δ — última página casi vacía (<`underfullRatio` llena). */
  underfullLastPage: number
  /** ε — espacio muerto al pie, por px (páginas no-finales). */
  deadSpacePerPx: number
  /** bonus (se resta) — cortar justo antes de un inicio de sección. */
  sectionBoundaryBonus: number
  /** Umbral [0..1] bajo el cual la última página cuenta como "casi vacía". */
  underfullRatio: number
}

export const DEFAULT_WEIGHTS: BadnessWeights = {
  orphanHeader: 10_000,
  underfullLastPage: 1_500,
  deadSpacePerPx: 1,
  sectionBoundaryBonus: 400,
  underfullRatio: 0.15,
}

/** Altura A4 útil por defecto en px @96dpi (297mm − márgenes). Sobre-escribible. */
export const A4_USABLE_PX = 1030
