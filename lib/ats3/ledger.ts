// lib/ats3/ledger.ts
//
// LOS TOPES DEL DOCUMENTO: cuántas viñetas de un puesto se leen y cuántas
// habilidades muestra una plantilla. La memoria entre viñetas que vivía acá se
// retiró (CEO, 2026-09-29): Tailor ejecuta la decisión del ATS, que ya ve el CV
// entero, y la memoria empujaba términos y verbos por su cuenta.

/**
 * VIÑETAS QUE SE LEEN DE UN PUESTO (orden del CEO, 2026-09-09).
 *
 * «Si ves viñetas a mejorar y ya tenés 6, sugerí eliminar la más débil.» Seis es
 * lo que un reclutador lee de un mismo puesto antes de saltear; a partir de ahí,
 * una línea más no agrega, TAPA a las que valen.
 *
 * Es un techo del documento, no del rubro: el mismo número que el producto ya
 * usaba antes de v3.
 */
export const BULLETS_PER_ROLE_MAX = 6

/**
 * VIÑETAS QUE UN PUESTO NECESITA PARA ENTENDERSE (orden del CEO, 2026-09-09).
 *
 * «Un máximo de 6 por experiencia y 3 como mínimo»; subido a 4 (CEO, 2026-09-30):
 * «a no ser que ya esté todo bien puesto» — un puesto que ya trae menos no se
 * rellena, sólo no se recorta por debajo de 4. Es un umbral del documento,
 * igual que el techo, y por eso vive al lado.
 */
export const BULLETS_PER_ROLE_MIN = 4

/**
 * HABILIDADES QUE ENTRAN A LA PLANTILLA (orden del CEO, 2026-09-09).
 *
 * «Las plantillas con ATS pueden recibir hasta 20 skills; si tenés 100, sólo las
 * necesarias entran.» Es el mismo 20 que el CEO fijó el 2026-08-27 para los
 * requisitos duros que el motor mide, y por eso no es un número nuevo: una lista
 * de cien términos no se lee, y el filtro tampoco la premia — cuenta cada uno
 * una vez.
 *
 * Cuáles son «las necesarias» lo decide `skillPlan`, con los pesos medidos sobre
 * el aviso. Sin vacante no hay respuesta, y por eso este tope NO vive en la
 * plantilla: ahí sería «las primeras veinte que escribiste».
 */
export const SKILLS_MAX = 20
