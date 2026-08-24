import FullScreenLoading from "@/components/shared/FullScreenLoading"

/**
 * Red de seguridad del dashboard: la pestaña que no declare la suya cae acá.
 * Una sola forma de decir «cargando» en toda la app, a pantalla completa.
 */
export default function Loading() {
  return <FullScreenLoading />
}
