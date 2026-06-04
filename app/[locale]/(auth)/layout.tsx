import Link from "next/link"
import { FileText, CheckCircle2 } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("auth.layout")

  const features = [
    t("feature_1"),
    t("feature_2"),
    t("feature_3"),
    t("feature_4"),
  ]

  return (
    <div className="min-h-dvh flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0f1e33 0%,#1a2e4a 50%,#0d2240 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(0,212,255,0.12) 0%,transparent 70%)" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(0,180,255,0.08) 0%,transparent 70%)" }} />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }} />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105"
              style={{ background: "linear-gradient(135deg,#00D4FF,#0099CC)", boxShadow: "0 4px 14px rgba(0,212,255,0.35)" }}>
              <FileText className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-[-0.02em]">
              Ready<span style={{ color: "#00D4FF" }}>CV</span>
            </span>
          </Link>

          {/* Main copy */}
          <div className="mt-auto mb-auto pt-20" suppressHydrationWarning>
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase mb-4"
              style={{ color: "#00D4FF" }}>
              {t("tagline")}
            </p>
            <h2 className="text-[clamp(26px,3vw,36px)] font-extrabold text-white leading-[1.2] tracking-[-0.02em] mb-5">
              {t("headline_1")}<br />{t("headline_2")}<br />
              <span style={{ color: "#00D4FF" }}>{t("headline_accent")}</span>
            </h2>
            <p className="text-[14px] leading-[1.65] mb-8"
              style={{ color: "rgba(255,255,255,0.55)" }}>
              {t("headline_sub")}
            </p>

            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#00D4FF" }} />
                  <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {f}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom copyright */}
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} ReadyCV — readycvv.com
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col bg-[#F8FAFC]">
        {/* Mobile logo */}
        <div className="lg:hidden px-6 pt-6 pb-2">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#00D4FF,#0099CC)", boxShadow: "0 3px 10px rgba(0,212,255,0.3)" }}>
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-[#1a2e4a] font-bold text-base tracking-[-0.01em]">
              Ready<span style={{ color: "#00D4FF" }}>CV</span>
            </span>
          </Link>
        </div>

        <main className="flex-1 flex items-center justify-center px-6 py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
