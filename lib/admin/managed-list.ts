/**
 * Cómo se lee la respuesta de `/api/admin/users/managed/list`.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO. La ruta devolvía un array y el panel lo leía como
 * array. El 2026-08-01 la ruta se paginó y pasó a devolver `{ items, nextCursor }`;
 * el panel no se tocó y siguió preguntando `Array.isArray(d)`, que ahora da
 * `false`. La lista quedaba en cero y la pantalla decía "Aún no hay usuarios
 * managed" — con clientes LIMITED vivos dentro, pagos y todo.
 *
 * El defecto duró tres semanas porque NADA falló: la petición devolvía 200, el
 * JSON era válido y el panel dibujaba su estado vacío con total normalidad. Una
 * forma que cambia no rompe nada en JavaScript; simplemente deja de coincidir.
 *
 * Por eso la lectura vive acá, fuera del componente, y devuelve `null` cuando no
 * reconoce lo que llegó. `null` NO es "vacío": es "no entendí", y el panel tiene
 * que decirlo en pantalla en vez de dibujar cero filas. Un cero se lee como "no
 * hay nadie", que es la conclusión opuesta a la verdad.
 */

export interface ManagedListPage<T> {
  items: T[]
  /** Siguiente página, o null si esta era la última. */
  nextCursor: string | null
}

/**
 * `null` = la respuesta no tiene una forma que conozcamos. Nunca confundir con
 * una página legítimamente vacía, que es `{ items: [], nextCursor: null }`.
 */
export function parseManagedListPage<T>(payload: unknown): ManagedListPage<T> | null {
  // La forma vieja, previa a la paginación. Se sigue aceptando porque un
  // despliegue a medias puede tener el panel nuevo contra la ruta anterior.
  if (Array.isArray(payload)) return { items: payload as T[], nextCursor: null }

  if (!payload || typeof payload !== "object") return null
  const row = payload as { items?: unknown; nextCursor?: unknown }
  if (!Array.isArray(row.items)) return null

  return {
    items: row.items as T[],
    nextCursor: typeof row.nextCursor === "string" && row.nextCursor.length > 0 ? row.nextCursor : null,
  }
}
