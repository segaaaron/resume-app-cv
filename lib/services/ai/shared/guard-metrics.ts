import { createLogger } from "@/lib/logger"

/**
 * Cuánto valor tiran los guards, medible.
 *
 * Después del modelo hay una cadena de filtros que descarta reescrituras enteras
 * —placeholder, marca no declarada, tercera persona, cifra borrada, edición
 * trivial, reescritura lateral, duplicado—. Cada uno se escribió contra un
 * defecto REAL y medido. Pero un filtro que se aplica de más no avisa: el usuario
 * ve menos sugerencias y nadie sabe si es porque su CV ya está bien o porque le
 * estamos comiendo el trabajo.
 *
 * Los contadores existían desde siempre y salían por `logger.warn`, que sólo va a
 * la consola del contenedor: en la práctica, nadie los leyó nunca. Preguntar
 * "¿cuántas reescrituras buenas está tirando el guard de la cifra?" no tenía
 * respuesta sin medir a mano.
 *
 * SE ESCRIBE EN `ErrorLog` CON SERVICIO `ai-guard`, NO EN UNA TABLA NUEVA. Es el
 * mismo camino que ya usan los rebotes de Resend: el panel de Service Errors
 * lista los servicios que encuentra en los datos, así que aparece solo con su
 * fila y su fecha. Sin migración — una tabla de métricas es la versión limpia y
 * es infra, así que se pide antes de hacerla.
 *
 * SOLO se registra la llamada que DESCARTÓ algo. Una fila por cada corrida sana
 * llenaría el panel de ruido y taparía justo lo que hay que ver.
 *
 * El mensaje es FIJO y los números van en el contexto: `fingerprint` es
 * sha1(service|endpoint|mensaje), así que meter las cifras en el texto daría una
 * huella distinta por corrida y el panel no podría agrupar nada.
 */
const logger = createLogger("ai-guard")

export interface GuardDropReport {
  /** Endpoint que corrió, tal como se lo nombra en las cuotas. */
  endpoint: string
  /** Reescrituras que el modelo propuso, antes de cualquier filtro. */
  offered: number
  /** Las que sobrevivieron y llegan al usuario. */
  kept: number
  /** Placeholder `[X%]` o marca que el candidato no declaró: hecho falso sobre él. */
  hardCoded: number
  /** Borró o alteró una cifra suya. */
  figureLoss: number
  /** Sin cambio real: idéntica, sinónimo, tercera persona, lateral o repetida. */
  trivial: number
  /**
   * Reescrituras que dejaban afuera un término que la vacante pide.
   *
   * El motivo más caro y el último en tener guard: las duras pesan .45, así que
   * una sola pérdida baja el puntaje más que todos los demás motivos juntos.
   * Vigilarlo por separado es lo que permite ver si el PROMPT empezó a comerse
   * términos, en vez de descubrirlo cuando un CV vuelve con menos puntos.
   */
  termLoss: number
}

export function reportGuardDrops(r: GuardDropReport): void {
  const dropped = r.hardCoded + r.figureLoss + r.trivial + r.termLoss
  if (dropped <= 0) return
  logger.error("rewrites dropped by post-model guards", {
    endpoint: r.endpoint,
    offered: r.offered,
    kept: r.kept,
    dropped,
    hardCoded: r.hardCoded,
    figureLoss: r.figureLoss,
    trivial: r.trivial,
    termLoss: r.termLoss,
    // Lo que se mira de un vistazo: si esto se acerca a 1, el guard dejó de
    // proteger y empezó a tapar.
    dropRate: r.offered > 0 ? Math.round((dropped / r.offered) * 100) / 100 : 0,
  })
}
