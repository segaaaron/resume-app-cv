// lib/ats/personal-data.ts
//
// FOTO Y DATOS PERSONALES: LO QUE ES NORMAL EN UN PAÍS DESCARTA EN OTRO.
//
// ── POR QUÉ ESTO INFORMA Y NO ARREGLA (orden del CEO, 2026-08-22) ──────────
//
//   «Agregá esta parte pero sólo como información, sin que se pueda ejecutar
//    algún cambio.»
//
// Y es la decisión correcta, no una limitación. Los datos de mercado (2026):
// el 68% de las empresas con presencia global prefiere CVs sin foto incluso
// donde la costumbre local la acepta; en EE.UU. y Reino Unido se descarta por
// precaución legal —Title VII, ADEA—, porque recibir una foto los expone a un
// reclamo por sesgo. En México, Brasil y Argentina la foto es estándar y sacarla
// puede leerse como un CV incompleto.
//
// O sea: NO existe una respuesta correcta que el producto pueda aplicar solo. La
// misma foto es un acierto o un descarte según a dónde se postule, y eso lo sabe
// el candidato, no nosotros. Un botón de «quitar la foto» estaría adivinando el
// país del reclutador; una nota que le dice el dato lo deja decidir con la
// información que hoy no tiene.
//
// Por eso estos hallazgos viajan como INFORMATIVOS: sin botón, sin peso en el
// puntaje, y sin la frase de «esto sólo lo sabés vos», que promete cerrar un
// chequeo que acá no se cierra nunca — porque no hay nada que cerrar.

/** Un dato personal que en varios mercados se pide NO poner. */
export type SensitiveKind = "birth_date" | "age" | "marital_status" | "nationality" | "id_number" | "gender"

export interface PersonalDataFindings {
  /** El CV lleva foto cargada. */
  hasPhoto: boolean
  /** Los datos sensibles encontrados, sin repetir. */
  sensitive: SensitiveKind[]
}

/**
 * Patrones por dato, en los dos idiomas.
 *
 * Se busca la ETIQUETA, no el valor: «Fecha de nacimiento:» es inequívoco,
 * mientras que un número de ocho dígitos suelto puede ser cualquier cosa. Buscar
 * el valor daría falsos positivos sobre el trabajo del candidato, que es el
 * error caro: un aviso equivocado sobre datos personales asusta.
 */
const PATTERNS: Array<{ kind: SensitiveKind; re: RegExp }> = [
  { kind: "birth_date", re: /\b(fecha\s+de\s+nacimiento|nacid[oa]\s+el|date\s+of\s+birth|d\.?o\.?b\.?)\b/i },
  { kind: "age", re: /\b(edad\s*:|\d{2}\s*años\b|age\s*:|\d{2}\s*years\s+old\b)/i },
  { kind: "marital_status", re: /\b(estado\s+civil|marital\s+status|casad[oa]\b|solter[oa]\b|married\b|single\b\s*\||divorciad[oa]\b)/i },
  { kind: "nationality", re: /\b(nacionalidad|nationality)\s*:/i },
  /**
   * El documento se busca COMO ETIQUETA, nunca como palabra suelta.
   *
   * La primera versión marcaba cualquier «cédula» y disparó sobre una viñeta que
   * describía el trabajo del candidato: «Gestioné la cédula de identidad digital
   * del municipio para 20.000 vecinos». Un aviso equivocado sobre datos
   * personales asusta, y encima sobre la línea que cuenta lo que hizo. Lo cazó el
   * test antes de salir. Ahora se exige la forma de dato: dos puntos, o el número
   * pegado.
   */
  { kind: "id_number", re: /\b(?:d\.?n\.?i\.?|c\.?i\.|r\.?u\.?t\.?|curp|c[eé]dula|passport|social\s+security)\s*(?:n[°º]|no\.?|number|nro\.?)?\s*[:#]\s*\S|\b(?:d\.?n\.?i\.?|curp|r\.?u\.?t\.?)\s+[\d.,-]{6,}/i },
  { kind: "gender", re: /\b(g[eé]nero|sexo|gender)\s*:/i },
]

/**
 * El texto donde estos datos aparecen de verdad.
 *
 * Casi siempre llegan de un CV IMPORTADO: el extractor no supo mapear «Datos
 * personales» y lo dejó en una sección propia, o quedó dentro del resumen. La
 * experiencia laboral se incluye porque un import mal cortado puede haber
 * empujado la cabecera adentro del primer puesto.
 */
function personalText(sectionData: Record<string, unknown>): string {
  const parts: string[] = []
  const pd = sectionData.personalDetails as { address?: string } | undefined
  if (pd?.address) parts.push(pd.address)
  if (typeof sectionData.summary === "string") parts.push(sectionData.summary)
  if (typeof sectionData.hobbies === "string") parts.push(sectionData.hobbies)

  const custom = Array.isArray(sectionData.customSections)
    ? (sectionData.customSections as Array<{ title?: string; items?: Array<{ title?: string; subtitle?: string; description?: string }> }>)
    : []
  for (const c of custom) {
    parts.push(c.title ?? "")
    for (const i of c.items ?? []) parts.push(i.title ?? "", i.subtitle ?? "", i.description ?? "")
  }

  const work = Array.isArray(sectionData.workExperience)
    ? (sectionData.workExperience as Array<{ description?: string }>)
    : []
  for (const j of work) parts.push(j.description ?? "")

  return parts.filter(Boolean).join("\n")
}

export function findPersonalData(
  sectionData: Record<string, unknown>,
  hasPhoto: boolean,
): PersonalDataFindings {
  const text = personalText(sectionData)
  const sensitive: SensitiveKind[] = []
  for (const { kind, re } of PATTERNS) {
    if (re.test(text) && !sensitive.includes(kind)) sensitive.push(kind)
  }
  return { hasPhoto, sensitive }
}
