import { getTranslations } from "next-intl/server"
import BrandMark from "@/components/shared/BrandMark"

/**
 * Full-screen placeholder painted while a route runs on the server.
 *
 * Next can only prefetch a dynamic route up to its nearest `loading.tsx`; with
 * no boundary the browser keeps painting the OLD page until the server answers,
 * so a click on "Sign in" looked frozen — the auth pages are `force-dynamic`
 * and call `auth()` (session + DB) before they render a single pixel.
 *
 * Server Component on purpose: a loading screen that shipped JavaScript would
 * have to download before it could reassure anybody. Zero JS, pure CSS.
 *
 * z-1200 sits one step above the dashboard's NavPendingOverlay (1100): when a
 * nav click resolves into a route WITHOUT its own skeleton, this replaces that
 * overlay instead of appearing under it.
 * `prefers-reduced-motion` is honoured by the global rule in globals.css.
 */
export default async function FullScreenLoading() {
  const t = await getTranslations("common")

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t("loading")}
      className="fixed inset-0 z-[1200] flex flex-col items-center justify-center gap-6 bg-[#F4F7FB]"
      style={{
        backgroundImage:
          "radial-gradient(900px 520px at 50% 8%, rgba(0,212,255,0.10) 0%, transparent 62%), radial-gradient(700px 460px at 50% 100%, rgba(26,46,74,0.08) 0%, transparent 60%)",
      }}
    >
      {/* Mark inside a spinning cyan ring */}
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

      {/* The mark already spins above — the wordmark alone below it */}
      <BrandMark size="lg" tone="light" mark={false} />

      {/* Indeterminate rail — says "still working" without faking a percentage */}
      <span
        className="relative block w-[168px] h-[3px] rounded-full overflow-hidden bg-[rgba(26,46,74,0.10)]"
        aria-hidden="true"
      >
        <span className="absolute top-0 left-0 h-full w-1/3 rounded-full bg-[linear-gradient(90deg,transparent,#00D4FF,transparent)] [animation:brandLoaderBar_1.25s_ease-in-out_infinite]" />
      </span>

      <span className="text-[12.5px] font-semibold tracking-[0.02em] text-[#5A6B80]">
        {t("loading")}
      </span>
    </div>
  )
}
