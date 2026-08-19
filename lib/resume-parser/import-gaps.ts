/**
 * import-gaps — qué NO pudo leerse del documento, dicho en voz alta.
 *
 * POR QUÉ EXISTE. La importación era capaz de terminar bien y devolver un CV sin
 * nombre. La ruta calculaba el nombre para una sola cosa —titular el currículum—
 * y, si no había, lo titulaba con el nombre del archivo y lo guardaba igual:
 *
 *     const name  = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
 *     const title = name ? `CV de ${name}` : `CV importado — ${file.name}`
 *
 * Nadie avisaba, no quedaba registrado, y el usuario se enteraba mirando la
 * pantalla. Eso pasó con un CV real cuyo encabezado estaba dibujado como trazos
 * en vez de escrito con letras (ver `actual-text.ts`).
 *
 * Ese caso ya está arreglado, pero es UNA causa de un problema más grande: un PDF
 * escaneado, uno que dibuja su texto sin declararlo, o un productor cuya
 * estructura no sabemos leer terminan todos igual de callados. El extractor no
 * puede prometer que va a leer cualquier documento del mundo; lo que sí puede
 * prometer es no fingir que leyó.
 *
 * QUÉ CUENTA COMO HUECO, y la lista es corta a propósito. Sólo lo que hace que un
 * CV no sirva: sin nombre no es de nadie, sin ningún medio de contacto no se
 * puede responder, y sin un solo puesto no hay currículum. Ciudad, cargo,
 * habilidades o formación pueden faltar legítimamente en un CV real, y avisar de
 * cada ausencia convierte el aviso en ruido que la gente aprende a ignorar.
 *
 * Determinista y sin modelo: es una lectura de lo que ya se extrajo.
 */

export type ImportGap = "name" | "contact" | "experience"

interface PersonalDetails {
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  phone?: unknown
}

const filled = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0

/**
 * Los datos imprescindibles que el documento no entregó.
 *
 * Vacío = la importación trajo lo que hacía falta. El orden es el de importancia
 * para quien lee el aviso.
 */
export function findImportGaps(sectionData: Record<string, unknown> | null | undefined): ImportGap[] {
  if (!sectionData) return ["name", "contact", "experience"]
  const pd = (sectionData.personalDetails ?? {}) as PersonalDetails
  const work = Array.isArray(sectionData.workExperience) ? sectionData.workExperience : []

  const gaps: ImportGap[] = []
  if (!filled(pd.firstName) && !filled(pd.lastName)) gaps.push("name")
  // Uno alcanza: mucha gente pone sólo el teléfono, o sólo el correo.
  if (!filled(pd.email) && !filled(pd.phone)) gaps.push("contact")
  // Una entrada sin NADA dentro es lo mismo que ninguna: el documento se leyó y
  // no se entendió, que es justo lo que hay que decir.
  const hasRealJob = work.some((j) => {
    const row = (j ?? {}) as { jobTitle?: unknown; employer?: unknown; description?: unknown }
    return filled(row.jobTitle) || filled(row.employer) || filled(row.description)
  })
  if (!hasRealJob) gaps.push("experience")
  return gaps
}
