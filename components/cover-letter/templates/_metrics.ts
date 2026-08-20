/**
 * El ritmo de impresión de una carta. UNA definición para las 55 plantillas.
 *
 * POR QUÉ EXISTE. Medido en navegador: con una carta de 301 palabras —la mitad
 * del rango que el propio prompt le ordena escribir a la IA— 27 de 55 plantillas
 * producían un PDF de DOS páginas, y cuatro (`verso`, `meridian`, `lumen`,
 * `codex`) no sostenían ni 200 palabras. Una carta de presentación de una página
 * es la convención del rubro y es lo que nuestro prompt promete literalmente.
 *
 * Y no era la IA escribiendo de más: era aire. `verso` gastaba `96px 128px` de
 * padding e interlineado 2.1; `lumen`, 1.95 con 72px arriba. Un interlineado de
 * 2.0 en un cuerpo de 10.5pt es un tercio de la hoja regalado — en pantalla se
 * ve elegante, en A4 se come el contenido.
 *
 * LA VARA, y por qué estos números: 1.5 es el mínimo recomendado para texto
 * corrido y sigue siendo cómodo de leer; 10.5pt es el cuerpo estándar de una
 * carta formal. Las dos cosas juntas dejan sitio para 350 palabras —el tope del
 * rango que pedimos— en cualquier plantilla.
 *
 * LO QUE ESTO NO TOCA: color, tipografías, ornamentos, bandas, firmas, bordes.
 * Ahí vive la identidad de cada diseño y no se unifica nada de eso. Lo único
 * compartido es el ritmo vertical, que es lo que decide si la carta cabe.
 */

/** Cuerpo de la carta: tamaño y interlineado. */
export const LETTER_BODY_PT = 10
export const LETTER_BODY_LH = 1.45

/** Separación entre párrafos del cuerpo, en px. */
export const LETTER_PARAGRAPH_GAP = 10

/**
 * Cuántas palabras entran en UNA página, con este contrato, en la plantilla más
 * apretada de las 55. Medido en navegador, no estimado: con 377 palabras ninguna
 * plantilla desborda; con 443 desbordan 32.
 *
 * Vive acá y no en el prompt porque es una propiedad de la HOJA, no del texto: si
 * mañana una plantilla cambia su encabezado, este número cambia con ella y el
 * prompt lo sigue. Antes el prompt pedía "250–350 palabras" y nadie sabía de
 * dónde salía el 350 — resultó ser correcto por casualidad, mientras 40 de 55
 * plantillas no lo sostenían.
 *
 * Es 350 y no 377 a propósito: el margen absorbe una firma larga, un destinatario
 * con cargo y empresa, o un idioma que ocupa más que el medido.
 */
export const LETTER_ONE_PAGE_WORDS = 350
