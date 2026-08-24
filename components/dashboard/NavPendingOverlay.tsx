"use client"

import { createPortal } from "react-dom"
import { useLinkStatus } from "next/link"
import { useTranslations } from "next-intl"
import BrandLoadingScreen from "@/components/shared/BrandLoadingScreen"
import { Z_ROUTE_PENDING } from "@/lib/ui/z-layers"

/**
 * Full-screen feedback while a dashboard tab is loading.
 *
 * Every dashboard page is an async Server Component (`auth()` + DB queries), so a
 * click on a nav link fires an RSC request and the browser keeps painting the OLD
 * page until the server answers. Without this the app looks frozen: the user
 * clicks and nothing moves.
 *
 * `useLinkStatus` only works inside a `<Link>` descendant (it returns
 * `{ pending: false }` elsewhere instead of throwing), so this renders as a child
 * of each nav link and portals the overlay to `document.body` to cover the whole
 * viewport — sidebar and topbar included.
 *
 * Two separate jobs, on purpose:
 *  - It BLOCKS CLICKS from the instant the navigation starts. An `opacity-0`
 *    element still captures pointer events, so the repeated impatient taps are
 *    swallowed before the overlay is even visible. Never add pointer-events-none.
 *  - It BECOMES VISIBLE 120ms later, so a navigation that resolves instantly
 *    does not flash a spinner at the user.
 *
 * El dibujo es el MISMO `BrandLoadingScreen` que pinta el boundary de ruta y el
 * de una acción en vuelo: el usuario ve una sola pantalla de carga en toda la
 * app, no tres parecidas encadenadas. Lo único propio de acá es el retardo y la
 * capa, un peldaño por debajo de la pantalla que la reemplaza.
 */
export default function NavPendingOverlay() {
  const { pending } = useLinkStatus()
  const t = useTranslations("dashboard.nav")

  // `pending` can only turn true after a click, so there is nothing to portal
  // during SSR — no mount flag needed, just a guard for the server pass.
  if (!pending || typeof document === "undefined") return null

  return createPortal(
    <BrandLoadingScreen
      label={t("loading")}
      zIndex={Z_ROUTE_PENDING}
      className="opacity-0 [animation:navPendingIn_200ms_ease-out_120ms_forwards]"
    />,
    document.body,
  )
}
