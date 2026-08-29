/**
 * LAS CAPAS DE LA APP, EN UN SOLO LUGAR.
 *
 * ── EL DEFECTO QUE ESTO CIERRA (reportado con captura, 2026-08-21) ──────────
 *
 * «Al aplicar habilidades duras creo que se levanta otro modal detrás de este.»
 * Era literal, y peor de lo que parecía.
 *
 * Al apretar «Escribirlo en una viñeta» dentro del modal del ejecutor, cuando el
 * modelo no encuentra dónde colocar la habilidad, la app PREGUNTA a qué puesto
 * pertenece (`JobPickerModal`, que se fue con el motor viejo el 2026-08-29 —
 * queda el caso porque la regla que dejó sigue valiendo). Esa pregunta se abría
 * en `z-130`; el modal que
 * la disparó vive en `z-9999`. La pregunta quedaba debajo, invisible.
 *
 * Y como el fondo que la cierra también quedaba debajo, no se podía ni contestar
 * ni cancelar: la aplicación esperaba una respuesta a algo que el usuario no
 * podía ver. Él pagó el uso de IA y se quedó mirando una pantalla quieta.
 *
 * ── LA CAUSA, Y POR QUÉ AHORA ESTÁN TODAS ACÁ ──────────────────────────────
 *
 * La causa de fondo nunca fue el 130: es que cada componente elegía su número
 * solo. Convivían 30, 40, 50, 60, 100, 120, 200, 990, 1000, 1100, 1200, 5000 y
 * 9999, repartidos por veinte archivos que no se miraban entre sí. La primera
 * vuelta subió sólo las dos capas del defecto reportado y dejó las demás como
 * deuda declarada; el CEO pidió cerrarla («no quiero nada suelto»).
 *
 * **Ningún valor cambió al mudarse.** La escala de abajo es la que ya corría en
 * pantalla, con nombre y orden explícitos: mover el número de sitio no puede
 * mover un píxel. Lo que cambia es que la próxima capa nueva se decide acá,
 * mirando a las demás, en vez de inventarse un número que no choque «por ahora».
 *
 * La regla que ordena todo: **lo que pregunta va SIEMPRE encima de lo que
 * preguntó**. Un modal que nace dentro de otro no es un hermano, es un hijo.
 *
 * ── LO QUE NO VIVE ACÁ, A PROPÓSITO ────────────────────────────────────────
 *
 * Los z pequeños (`z-0`, `z-[1]`, `z-[5]`, `z-10`, `z-20`) que ordenan hijos
 * DENTRO de una tarjeta, un botón o una plantilla no son capas de la app: viven
 * en su propio contexto de apilado y no pueden chocar con nada de acá. Se
 * quedan como utilidades de Tailwind donde están. El guard sólo vigila lo que
 * flota sobre la pantalla (`fixed`, `sticky` y portales), que es lo que se pisa.
 */

/* ── Dentro del marco de una pantalla ──────────────────────────────────── */

/** Barra pegada dentro de un shell con scroll propio (topbar del dashboard). */
export const Z_STICKY_BAR = 30

/** Panel de navegación desplegado sobre el contenido (menú móvil del home). */
export const Z_NAV_PANEL = 40

/** Barra fija de página: navbar del marketing, barras inferiores del editor. */
export const Z_FIXED_BAR = 50

/**
 * Diálogos y menús flotantes del sistema de UI (`Dialog`, `AlertDialog`,
 * `Select`, autocompletado, menú de descarga) y los bloqueos a pantalla
 * completa que nacen de ellos.
 */
export const Z_DIALOG = 50

/** Un popover o indicador que TIENE que pisar una barra fija (`Z_FIXED_BAR`). */
export const Z_POPOVER_OVER_BAR = 60

/* ── El editor ─────────────────────────────────────────────────────────── */

/**
 * Lo que flota sobre una página completa sin ser un modal del editor: el topbar
 * del editor, los controles del preview, el salto al contenido y el diálogo de
 * importar del dashboard.
 */
export const Z_PAGE_OVERLAY = 100

/** Diálogo a pantalla completa del editor (bienvenida, aviso de idioma, import). */
export const Z_SCREEN_DIALOG = 120

/** El diálogo de plan: por encima de cualquier diálogo del editor que lo dispare. */
export const Z_UPGRADE_DIALOG = 200

/* ── El dashboard ──────────────────────────────────────────────────────── */

/** El fondo que oscurece la pantalla detrás del cajón lateral. */
export const Z_DRAWER_SCRIM = 990

/**
 * El cajón lateral y lo que debe quedar por encima de las tarjetas vecinas:
 * el menú de una tarjeta de CV y los bloqueos del listado.
 */
export const Z_DASHBOARD_OVERLAY = 1000

/* ── Navegación entre rutas ────────────────────────────────────────────── */

/** El aviso de «estoy yendo» al hacer clic en el nav (`NavPendingOverlay`). */
export const Z_ROUTE_PENDING = 1100

/**
 * La pantalla de carga de una ruta (`FullScreenLoading`).
 *
 * Un escalón por encima de `Z_ROUTE_PENDING`: cuando el clic termina en una ruta
 * sin esqueleto propio, esta REEMPLAZA al aviso en vez de aparecer debajo.
 */
export const Z_ROUTE_LOADING = Z_ROUTE_PENDING + 100

/* ── El tablero de candidaturas ────────────────────────────────────────── */

/** Tarjeta que se está arrastrando, sobre sus vecinas de la misma columna. */
export const Z_BOARD_DRAG_CARD = 50

/** Los diálogos del tablero (crear, editar, mover una candidatura). */
export const Z_BOARD_DIALOG = 5000

/* ── Lo más alto: los modales de pantalla completa ─────────────────────── */

/** Un modal a pantalla completa del editor, y el confeti que celebra una oferta. */
export const Z_MODAL = 9999

/**
 * La pregunta que NACE dentro de un modal y necesita su respuesta para seguir.
 *
 * Encima del modal que la abrió, siempre. Si empatara, el orden lo decidiría el
 * orden del DOM —los dos son portales a `body`— y eso es una moneda al aire.
 */
export const Z_MODAL_FOLLOW_UP = Z_MODAL + 1
