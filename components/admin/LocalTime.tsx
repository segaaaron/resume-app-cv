"use client"

/**
 * Fecha y hora en la zona de QUIEN MIRA, no la del servidor.
 *
 * Existe porque el panel que la usa es un Server Component: allí `toLocaleString()` se
 * resuelve con la zona del VPS (UTC) y habría mostrado horas corridas respecto al resto
 * del admin, que son componentes de cliente y sí usan la del navegador.
 *
 * El `suppressHydrationWarning` es a propósito: el HTML del servidor y el del cliente
 * difieren por diseño en este nodo, que es justamente el punto.
 */
export default function LocalTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso).toLocaleString()}
    </time>
  )
}
