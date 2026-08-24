import BrandMark from "@/components/shared/BrandMark"
import { Z_ROUTE_LOADING } from "@/lib/ui/z-layers"

/**
 * LA PANTALLA DE CARGA, UNA SOLA VEZ.
 *
 * La misma imagen la piden dos dueños distintos, y por eso el dibujo vive acá y
 * no dentro de ninguno de los dos:
 *
 *  - `FullScreenLoading` (Server Component) la monta como boundary de ruta:
 *    mientras el servidor arma la página que pediste.
 *  - `PendingScreen` (Client Component) la monta mientras una acción del
 *    usuario está en vuelo y todavía no cambió la ruta — entrar con la
 *    contraseña, con Google, verificar el código.
 *
 * Sin hooks ni `"use client"`: la usan los dos por igual. Recibe el texto ya
 * traducido porque el servidor y el cliente lo obtienen por caminos distintos
 * (`getTranslations` vs `useTranslations`), y eso es lo único que cambia.
 *
 * Cero JavaScript propio: todo el movimiento es CSS, y `prefers-reduced-motion`
 * lo apaga con la regla global de globals.css.
 */
export default function BrandLoadingScreen({
  label,
  zIndex = Z_ROUTE_LOADING,
  className = "",
}: {
  label: string
  /** Sólo para el aviso de navegación, que va un peldaño por debajo. */
  zIndex?: number
  /** La animación de entrada retardada del aviso de navegación. */
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`fixed inset-0 flex flex-col items-center justify-center gap-6 bg-[#F4F7FB] ${className}`}
      style={{
        zIndex,
        backgroundImage:
          "radial-gradient(900px 520px at 50% 8%, rgba(0,212,255,0.10) 0%, transparent 62%), radial-gradient(700px 460px at 50% 100%, rgba(26,46,74,0.08) 0%, transparent 60%)",
      }}
    >
      {/* La marca dentro de un anillo que gira */}
      <span className="relative flex items-center justify-center w-[92px] h-[92px]" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border-[3px] border-[rgba(0,212,255,0.16)]" />
        <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#00D4FF] [animation:dp-ring-spin_0.85s_linear_infinite]" />
        <span className="absolute inset-[10px] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.16)_0%,transparent_70%)] [animation:brandLoaderPulse_1.8s_ease-in-out_infinite]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          width={42}
          height={42}
          className="relative rounded-[11px] shadow-[0_10px_28px_rgba(42,114,215,0.32)]"
        />
      </span>

      {/* El anillo ya lleva la marca: acá va sólo el nombre */}
      <BrandMark size="lg" tone="light" mark={false} />

      {/* Riel indeterminado: dice «sigo trabajando» sin inventar un porcentaje */}
      <span
        className="relative block w-[168px] h-[3px] rounded-full overflow-hidden bg-[rgba(26,46,74,0.10)]"
        aria-hidden="true"
      >
        <span className="absolute top-0 left-0 h-full w-1/3 rounded-full bg-[linear-gradient(90deg,transparent,#00D4FF,transparent)] [animation:brandLoaderBar_1.25s_ease-in-out_infinite]" />
      </span>

      <span className="text-[12.5px] font-semibold tracking-[0.02em] text-[#5A6B80]">{label}</span>
    </div>
  )
}
