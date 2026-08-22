import { getTranslations } from "next-intl/server"

/**
 * Placeholder a dashboard tab paints while its page runs on the server.
 *
 * Every dashboard page is `force-dynamic`, and Next can only prefetch a dynamic
 * route up to its `loading.tsx` boundary — with no boundary, prefetch stored
 * nothing and each click paid the full round trip with the OLD page still on
 * screen. Each `loading.tsx` in (dashboard) renders this, which both swaps the
 * screen instantly and gives prefetch something to cache.
 *
 * Server Component on purpose: a loading state that ships JavaScript would have
 * to download before it could reassure anybody.
 */

type Variant = "documents" | "gallery" | "board" | "panel" | "table"

function Bar({ w, h = 12, className = "" }: { w: string; h?: number; className?: string }) {
  return <div className={`dash-skel ${className}`} style={{ width: w, height: h }} />
}

function Head() {
  return (
    <div className="mb-7">
      <Bar w="86px" h={9} className="mb-[10px]" />
      <Bar w="240px" h={30} className="mb-[10px] !rounded-lg" />
      <Bar w="320px" h={12} />
    </div>
  )
}

function Card({ h }: { h: number }) {
  return (
    <div className="rounded-xl border border-dash-border bg-white p-4 shadow-[0_1px_2px_rgba(15,25,45,0.04)]">
      <div className="dash-skel w-full !rounded-lg" style={{ height: h }} />
      <Bar w="70%" h={13} className="mt-4" />
      <Bar w="45%" h={10} className="mt-[10px]" />
    </div>
  )
}

const VARIANTS: Record<Variant, () => React.ReactElement> = {
  documents: () => (
    <>
      <div className="dash-skel w-full !rounded-xl mb-6" style={{ height: 74 }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="dash-skel !rounded-xl" style={{ height: 104 }} />
        <div className="dash-skel !rounded-xl" style={{ height: 104 }} />
      </div>
      <Bar w="200px" h={18} className="mb-5 !rounded-lg" />
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {[0, 1, 2, 3, 4].map((i) => (
          <Card key={i} h={168} />
        ))}
      </div>
    </>
  ),

  // Same grid as `documents`, but headed by a title instead of the stat cards —
  // painting cards a page does not have would shift the layout when data lands.
  gallery: () => (
    <>
      <div className="dash-skel w-full !rounded-xl mb-6" style={{ height: 74 }} />
      <Head />
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {[0, 1, 2].map((i) => (
          <Card key={i} h={168} />
        ))}
      </div>
    </>
  ),

  board: () => (
    <>
      <Head />
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {[0, 1, 2, 3].map((col) => (
          <div key={col} className="rounded-xl border border-dash-border bg-white p-3">
            <Bar w="55%" h={11} className="mb-4" />
            {[0, 1, 2].map((row) => (
              <div key={row} className="dash-skel w-full !rounded-lg mb-[10px]" style={{ height: 66 }} />
            ))}
          </div>
        ))}
      </div>
    </>
  ),

  panel: () => (
    <>
      <Head />
      <div className="flex flex-col gap-5 max-w-[760px]">
        {[132, 190, 108].map((h, i) => (
          <div key={i} className="dash-skel w-full !rounded-xl" style={{ height: h }} />
        ))}
      </div>
    </>
  ),

  table: () => (
    <>
      <Head />
      <div className="rounded-xl border border-dash-border bg-white overflow-hidden">
        <div className="dash-skel w-full !rounded-none" style={{ height: 46 }} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-[14px] border-t border-dash-border-s">
            <Bar w="30%" h={11} />
            <Bar w="22%" h={11} />
            <Bar w="16%" h={11} />
            <Bar w="12%" h={11} className="ml-auto" />
          </div>
        ))}
      </div>
    </>
  ),
}

export default async function DashboardSkeleton({ variant }: { variant: Variant }) {
  const t = await getTranslations("dashboard.nav")
  const Body = VARIANTS[variant]

  return (
    <div role="status" aria-busy="true" aria-label={t("loading")} className="animate-none">
      <Body />
    </div>
  )
}
