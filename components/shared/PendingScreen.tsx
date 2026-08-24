"use client"

import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import BrandLoadingScreen from "@/components/shared/BrandLoadingScreen"

/**
 * LA MISMA PANTALLA DE CARGA, PARA LO QUE EL BOUNDARY DE RUTA NO VE.
 *
 * ── EL DEFECTO (reportado por el CEO, 2026-08-24) ──────────────────────────
 *
 * «¿Por qué el login no tiene un loading en toda la pantalla?»
 *
 * El `loading.tsx` cubre LLEGAR a una página: el servidor está armando la ruta.
 * No cubre SALIR de ella. Al apretar «Sign in», entre la contraseña y el
 * dashboard pasan tres cosas —verificar, `signIn`, `router.push`— y en todas
 * ellas la ruta sigue siendo el login: no hay boundary que se dispare. Lo único
 * que se movía era un spinner de 16px dentro del botón, con el formulario
 * entero todavía en pantalla, mientras el dashboard cargaba detrás.
 *
 * ── POR QUÉ SE MONTA EN UN PORTAL Y NO DONDE SE USA ────────────────────────
 *
 * Los formularios viven dentro de la mitad derecha del layout de auth. Un
 * `fixed` ahí adentro cubre esa mitad, no la pantalla: el panel de la marca
 * seguiría a la vista. Portado a `body` tapa todo, que es lo que se pidió.
 *
 * ── LA BANDERA NO SE APAGA SOLA ────────────────────────────────────────────
 *
 * Quien la enciende antes de `router.push` NO la apaga: la navegación desmonta
 * el formulario. Apagarla en un `finally` la bajaría en el instante exacto en
 * que empieza la espera larga — el usuario vería el formulario otra vez, quieto,
 * justo cuando cree que ya entró.
 */
export default function PendingScreen({ show }: { show: boolean }) {
  const t = useTranslations("common")

  if (!show || typeof document === "undefined") return null

  return createPortal(<BrandLoadingScreen label={t("loading")} />, document.body)
}
