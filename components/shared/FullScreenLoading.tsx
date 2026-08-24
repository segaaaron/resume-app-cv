import { getTranslations } from "next-intl/server"
import BrandLoadingScreen from "@/components/shared/BrandLoadingScreen"

/**
 * La pantalla de carga mientras el SERVIDOR arma la ruta que pediste.
 *
 * Next sólo prefetchea una ruta dinámica hasta su `loading.tsx` más cercano; sin
 * boundary el navegador sigue pintando la página VIEJA hasta que el servidor
 * contesta, y la app parece trabada: las páginas de auth son `force-dynamic` y
 * llaman `auth()` (sesión + DB) antes de pintar un píxel.
 *
 * Server Component a propósito: una pantalla de carga que enviara JavaScript
 * tendría que descargarse antes de poder tranquilizar a nadie.
 *
 * El dibujo vive en `BrandLoadingScreen`, que comparte con `PendingScreen` — la
 * misma pantalla cuando lo que falta no es el servidor sino una acción del
 * usuario todavía en vuelo.
 */
export default async function FullScreenLoading() {
  const t = await getTranslations("common")
  return <BrandLoadingScreen label={t("loading")} />
}
