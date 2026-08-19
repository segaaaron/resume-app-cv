/**
 * Cómo se lee UNA página de una lista paginada del API. Un solo lector, porque
 * el defecto que lo motivó fue exactamente que cada pantalla tuviera el suyo.
 *
 * LO QUE PASÓ, DOS VECES. Nuestras rutas de lista devuelven un objeto con la
 * página y el cursor. Los clientes, en cambio, preguntaban `Array.isArray(d)` —
 * cierto cuando la ruta devolvía un array pelado, falso para siempre desde que
 * dejó de hacerlo:
 *
 *   - El panel de usuarios managed mostró "Aún no hay usuarios managed" durante
 *     tres semanas, con clientes LIMITED activos y pagos dentro.
 *   - El selector de CV de la carta de presentación estuvo vacío desde mayo, así
 *     que TODA carta se generó sin el currículum del usuario.
 *
 * Ninguno de los dos falló: 200, JSON válido, y una pantalla vacía dibujada con
 * total normalidad. Una forma que cambia no rompe nada en JavaScript; deja de
 * coincidir, y el silencio es indistinguible de "no hay datos".
 *
 * DE AHÍ LAS DOS DECISIONES DE ESTE ARCHIVO:
 *
 * 1. `null` significa "no entendí la respuesta", y NUNCA "está vacío". Quien
 *    llama tiene que poder decirlo en pantalla: un cero se lee como "no hay
 *    nada", que es la conclusión opuesta a la verdad.
 * 2. Se aceptan las tres formas que el proyecto emite hoy — `{ data }` (CVs,
 *    cartas, postulaciones), `{ items }` (managed) y el array suelto de las
 *    rutas anteriores a la paginación. No es laxitud: es que un despliegue puede
 *    quedar a medias, con el cliente nuevo hablándole a la ruta vieja.
 *
 * Que las rutas usen dos nombres distintos para lo mismo es deuda conocida.
 * Unificarla toca tres servicios y una ruta de admin, y el riesgo de eso NO es
 * el que causó estos dos bugs: lo que los causó fue que cada pantalla dedujera
 * la forma por su cuenta. Eso es lo que este archivo cierra.
 */

export interface ListPage<T> {
  items: T[]
  /** Siguiente página, o null si esta era la última. */
  nextCursor: string | null
}

/**
 * `null` = la respuesta no tiene una forma que conozcamos. Nunca confundir con
 * una página legítimamente vacía, que es `{ items: [], nextCursor: null }`.
 */
export function parseListPage<T>(payload: unknown): ListPage<T> | null {
  // La forma previa a la paginación.
  if (Array.isArray(payload)) return { items: payload as T[], nextCursor: null }

  if (!payload || typeof payload !== "object") return null
  const row = payload as { data?: unknown; items?: unknown; nextCursor?: unknown }

  const rows = Array.isArray(row.data) ? row.data : Array.isArray(row.items) ? row.items : null
  if (!rows) return null

  return {
    items: rows as T[],
    nextCursor: typeof row.nextCursor === "string" && row.nextCursor.length > 0 ? row.nextCursor : null,
  }
}
