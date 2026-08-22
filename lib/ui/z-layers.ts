/**
 * LAS CAPAS DEL EDITOR, EN UN SOLO LUGAR.
 *
 * ── EL DEFECTO QUE ESTO CIERRA (reportado con captura, 2026-08-21) ──────────
 *
 * «Al aplicar habilidades duras creo que se levanta otro modal detrás de este.»
 * Era literal, y peor de lo que parecía.
 *
 * Al apretar «Escribirlo en una viñeta» dentro del modal del ejecutor, cuando el
 * modelo no encuentra dónde colocar la habilidad, la app PREGUNTA a qué puesto
 * pertenece (`JobPickerModal`). Esa pregunta se abría en `z-130`; el modal que
 * la disparó vive en `z-9999`. La pregunta quedaba debajo, invisible.
 *
 * Y como el fondo que la cierra también quedaba debajo, no se podía ni contestar
 * ni cancelar: la aplicación esperaba una respuesta a algo que el usuario no
 * podía ver. Él pagó el uso de IA y se quedó mirando una pantalla quieta.
 *
 * ── POR QUÉ UNA CONSTANTE Y NO UN NÚMERO MÁS ───────────────────────────────
 *
 * La causa de fondo no es el 130: es que cada componente eligió su número solo.
 * En el repo conviven 100, 120, 130, 200, 990, 1000, 1100, 5000 y 9999. Poner
 * «10000» a mano acá sería exactamente el mismo error una vez más, y el próximo
 * modal de seguimiento volvería a nacer debajo.
 *
 * La regla, que es la que importa: **lo que pregunta va SIEMPRE encima de lo que
 * preguntó**. Un modal que nace dentro de otro no es un hermano, es un hijo.
 *
 * ── DEUDA DECLARADA, NO ARREGLADA A ESCONDIDAS ─────────────────────────────
 *
 * Acá viven sólo las dos capas del defecto reportado. Los otros siete valores
 * sueltos siguen sueltos: tocarlos era cambiar pantallas que nadie pidió tocar,
 * y un reordenamiento global de capas no se hace de paso dentro de un arreglo.
 * Queda dicho para que la próxima capa nueva empiece por acá.
 */

/** Un modal a pantalla completa del editor. */
export const Z_MODAL = 9999

/**
 * La pregunta que NACE dentro de un modal y necesita su respuesta para seguir.
 *
 * Encima del modal que la abrió, siempre. Si empatara, el orden lo decidiría el
 * orden del DOM —los dos son portales a `body`— y eso es una moneda al aire.
 */
export const Z_MODAL_FOLLOW_UP = Z_MODAL + 1
