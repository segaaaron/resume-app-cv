// lib/ats3/cv.ts
//
// EL CV DE IDA Y VUELTA: se lee el documento como lo guarda la aplicación, se
// mide lo que un lector automático puede leer, y se escribe de vuelta sin tocar
// lo que no cambió.

import { bulletIdFor, nodeHash, rolDeNueva, roleIdFor, type NodeId, type ResumeTree } from "@/lib/ats3/contracts"
import { ABIERTO, FECHA_ABIERTA, mes, type Mes, type ParseChecks } from "@/lib/ats3/score"

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA DEL CV
//
// Las viñetas se guardan dentro de una sola cadena por puesto. El separador es
// del documento, no del motor: se aceptan los tres que un usuario produce
// escribiendo (viñeta, guion y salto de línea) y se conserva el texto tal cual.
// ─────────────────────────────────────────────────────────────────────────────

interface RawRole {
  jobTitle?: string
  employer?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface RawResume {
  summary?: string
  workExperience?: RawRole[]
  skills?: { name?: string }[]
  /** Todo lo demás en texto plano: participa del puntaje, no se reescribe. */
  otherText?: string
  /** Email y teléfono: sólo se mira que un lector los encuentre. */
  contact?: { email?: string; phone?: string }
}

/**
 * EL LECTOR DE VIÑETAS DE ESTE MOTOR, Y ES SUYO.
 *
 * Una descripción se guarda con su marca —«• », un guion o nada— y este motor la
 * parte acá, sin pedirle nada al motor viejo ni a sus módulos compartidos: la
 * regla del CEO es que el ATS v3 no se cuelgue de nada de aquello. Se aceptan
 * los tres separadores que un usuario produce escribiendo, y el texto se
 * conserva tal cual.
 *
 * LO QUE NO HACE, dicho para que nadie lo descubra tarde: no colapsa líneas
 * repetidas al escribir de vuelta. El motor las trata antes —`duplicate_claim`
 * es uno de los doce guards— así que una repetición se caza donde se decide, no
 * al guardar.
 */
export function readBullets(description: string): string[] {
  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[•·\-*•]\s*/, "").trim())
    .filter((line) => line.length > 0)
}

/**
 * El CV como árbol, con ids estables.
 *
 * Los ids se derivan del TEXTO dentro de su puesto, no de la posición. Aplicar
 * un arreglo reordena las líneas, y un id posicional convertiría cada hallazgo
 * guardado en un puntero a la línea equivocada — el defecto que este proyecto ya
 * pagó tres veces.
 */
export function buildTree(raw: RawResume): ResumeTree {
  const seen = new Set<NodeId>()
  // Los puestos también se desempatan: dos idénticos con el mismo id hacen que
  // uno pise al otro al escribir de vuelta, y se pierde un trabajo entero.
  const seenRoles = new Set<NodeId>()
  const roles = (raw.workExperience ?? []).map((r) => {
    const title = r.jobTitle ?? ""
    const company = r.employer ?? ""
    const startDate = r.startDate ?? ""
    const id = roleIdFor(title, company, startDate, seenRoles)
    return {
      id,
      title,
      company,
      startDate,
      endDate: r.endDate ?? "",
      bullets: readBullets(r.description ?? "").map((text) => ({
        id: bulletIdFor(id, text, seen),
        text,
        hash: nodeHash(text),
        origin: "USER" as const,
      })),
    }
  })
  const summary = raw.summary ?? ""
  return {
    roles,
    summary: { id: "summary", text: summary, hash: nodeHash(summary), origin: "USER" },
    declaredSkills: (raw.skills ?? []).map((s) => s.name ?? "").filter(Boolean),
    otherText: raw.otherText ?? "",
    ...(raw.contact ? { contact: { email: raw.contact.email ?? "", phone: raw.contact.phone ?? "" } } : {}),
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// ¿SE LEE BIEN? — lo que el motor puede medir por su cuenta
//
// El panel mandaba un objeto vacío y el pilar entero quedaba sin medir. Con el
// reparto de peso eso ya no roba puntos, pero un pilar vacío tampoco INFORMA
// nada: el usuario no se entera de que su CV tiene fechas ilegibles.
//
// Estas seis se derivan del propio documento, sin plantilla y sin PDF. Las que
// necesitan el archivo renderizado (fuentes incrustadas, texto dentro de una
// imagen, una sola columna) las mide quien tenga el PDF y llegan por `checks`;
// mientras no lleguen viajan como `null`, que significa NO MEDIDO y sale del
// denominador. Castigar por algo que nadie miró es fabricar un defecto.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Las formas de fecha que un CV produce de verdad.
 *
 * La primera versión sólo aceptaba "2024", "03/2024" y "marzo 2024" — y el
 * formato que ESTA aplicación guarda es "2021-03". Medido con el CV de prueba:
 * marcaba las fechas como ilegibles en TODOS los currículums. Un chequeo que
 * falla siempre no informa nada: acusa.
 */
const MES_ANIO = /^\s*(\d{4}([-/]\d{1,2})?|\d{1,2}[-/]\d{4}|[a-záéíóúñ]{3,}\.?\s+(de\s+)?\d{4})\s*$/i

export function readableChecks(tree: ResumeTree): ParseChecks {
  const roles = tree.roles
  const bullets = roles.flatMap((r) => r.bullets)
  const fechas = roles.flatMap((r) => [r.startDate, r.endDate]).filter((d) => d.trim())

  return {
    // Un puesto sin fechas legibles se ordena mal en cualquier buscador interno.
    fechas_legibles: fechas.length === 0 ? null : fechas.every((d) => MES_ANIO.test(d) || FECHA_ABIERTA.test(d)),
    // Del más reciente al más viejo: es el orden que espera quien lee.
    orden_cronologico: ordenCronologico(roles),
    // Un puesto sin una sola línea no dice qué hizo la persona ahí.
    puestos_con_contenido: roles.length === 0 ? null : roles.every((r) => r.bullets.length > 0),
    // Es la primera línea que lee cualquiera, humano o máquina.
    resumen_presente: tree.summary.text.trim().length > 0,
    // Un símbolo decorativo al principio de la línea se arrastra al texto extraído.
    sin_simbolos_raros: bullets.length === 0 ? null : bullets.every((b) => !/^[^\p{L}\p{N}"'(¿¡]/u.test(b.text.trim())),
    // Una línea de más de 400 caracteres es un párrafo disfrazado de viñeta.
    lineas_en_rango: bullets.length === 0 ? null : bullets.every((b) => b.text.trim().length <= 400),
    /**
     * TRAYECTORIA SIN HUECOS SIN EXPLICAR NI FECHAS SUPERPUESTAS.
     *
     * Las dos son de las primeras cosas que mira quien lee, y las dos se
     * calculan con las fechas que el CV ya tiene: cero tokens. Un hueco corto
     * no cuenta —cambiar de trabajo lleva tiempo—; el umbral son seis meses,
     * que es donde una pausa deja de leerse como transición.
     *
     * Se miden juntas porque son la misma pregunta —¿la línea de tiempo se
     * entiende?— y dos avisos sobre lo mismo se leen como que el panel insiste.
     */
    trayectoria_continua: continuidad(roles),
    /**
     * LO PRIMERO QUE UN ATS EXTRAE: CÓMO CONTACTARTE (CEO, 2026-09-28).
     *
     * Un CV sin un email o un teléfono que el lector reconozca no llega a nadie,
     * por bueno que sea. `null` cuando no llegó el dato: no se castiga lo que
     * no se pudo mirar.
     */
    contacto_email: tree.contact ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(tree.contact.email.trim()) : null,
    contacto_telefono: tree.contact ? tree.contact.phone.replace(/\D/g, "").length >= 7 : null,
  }
}

/**
 * ¿La línea de tiempo se lee sin tropezar?
 *
 * `null` cuando no hay con qué medir: un CV de un solo puesto no tiene huecos
 * entre puestos, y castigarlo por eso sería inventar un defecto.
 */
function continuidad(roles: ResumeTree["roles"]): boolean | null {
  const periodos = roles
    .map((r) => ({
      desde: mes(r.startDate),
      hasta: r.endDate.trim() && !FECHA_ABIERTA.test(r.endDate) ? mes(r.endDate) : ABIERTO,
    }))
    .filter((p): p is { desde: Mes; hasta: Mes } => p.desde !== null && p.hasta !== null)
  if (periodos.length < 2) return null
  const orden = [...periodos].sort((a, b) => a.desde.min - b.desde.min)
  for (let i = 1; i < orden.length; i++) {
    const previo = orden[i - 1]
    const actual = orden[i]
    if (previo.hasta === ABIERTO) continue
    /**
     * SÓLO LO QUE ES SEGURO.
     *
     * Un año sin mes es un RANGO de doce meses, no enero. Medido en producción
     * el 2026-09-24: «2015–2016» seguido de «2017–2020» se leía enero-2016 →
     * enero-2017, doce meses de hueco, y la tarjeta acusaba «más de seis meses
     * sin explicar» sobre una trayectoria que puede no tener ni uno. Se marca un
     * hueco sólo si ni en el mejor caso baja de seis meses, y un solape sólo si
     * ni en el mejor caso deja de haberlo.
     */
    // Superpuestas: aun empezando lo más tarde posible, empieza antes de que
    // el anterior pueda haber terminado. Un mes de solape es un cambio de
    // trabajo, no una contradicción.
    if (actual.desde.max < previo.hasta.min - 1) return false
    // Hueco: aun con el fin más tardío y el comienzo más temprano posibles,
    // quedan más de seis meses en medio.
    if (actual.desde.min - previo.hasta.max > 6) return false
  }
  return true
}

/**
 * ¿Los puestos van del más reciente al más viejo?
 *
 * Comparaba las fechas COMO TEXTO. Medido en local el 2026-09-24 sobre un CV
 * real: «06/2024» quedaba antes que «2023» (el «0» ordena antes que el «2») y
 * un puesto sin fecha de inicio comparaba «» contra todo. El chequeo acusaba un
 * orden que estaba bien. Se leen con el mismo lector que la línea de tiempo, y
 * un puesto sin fecha legible no opina: no se puede decir que esté fuera de
 * lugar.
 */
function ordenCronologico(roles: ResumeTree["roles"]): boolean | null {
  const inicios = roles.map((r) => mes(r.startDate)).filter((m): m is Mes => m !== null)
  if (inicios.length < 2) return null
  // Fuera de orden sólo si es seguro: el anterior empieza, en el mejor caso,
  // antes de que el siguiente pueda haber empezado.
  return inicios.every((m, i) => i === 0 || inicios[i - 1].max >= m.min)
}


/** Escribe un nodo devolviendo un árbol NUEVO. El original no se toca. */
export function writeInto(tree: ResumeTree, nodeId: NodeId, text: string): ResumeTree {
  if (nodeId === tree.summary.id) {
    return { ...tree, summary: { ...tree.summary, text, hash: nodeHash(text), origin: "AI_ACCEPTED" } }
  }
  // La viñeta nueva entra al final de su puesto.
  const rol = rolDeNueva(nodeId)
  if (rol) {
    const nueva = { id: `b_nueva_${nodeHash(text).slice(0, 10)}`, text, hash: nodeHash(text), origin: "AI_ACCEPTED" as const }
    return { ...tree, roles: tree.roles.map((r) => (r.id === rol ? { ...r, bullets: [...r.bullets, nueva] } : r)) }
  }
  return {
    ...tree,
    roles: tree.roles.map((r) => ({
      ...r,
      bullets: r.bullets.map((b) =>
        b.id === nodeId ? { ...b, text, hash: nodeHash(text), origin: "AI_ACCEPTED" as const } : b,
      ),
    })),
  }
}

/** El CV de vuelta al formato en que la aplicación lo guarda. */
export function writeBack(tree: ResumeTree, raw: RawResume): RawResume {
  const byRole = new Map(tree.roles.map((r) => [r.id, r]))
  // El MISMO desempate que al leer, recorriendo en el mismo orden: es lo que
  // hace que cada puesto del documento encuentre exactamente su propio nodo.
  const seenRoles = new Set<NodeId>()
  return {
    ...raw,
    summary: tree.summary.text,
    workExperience: (raw.workExperience ?? []).map((r) => {
      const node = byRole.get(roleIdFor(r.jobTitle ?? "", r.employer ?? "", r.startDate ?? "", seenRoles))
      if (!node) return r
      return { ...r, description: node.bullets.map((b) => `• ${b.text}`).join("\n") }
    }),
  }
}
