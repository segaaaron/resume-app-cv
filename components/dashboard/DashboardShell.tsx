"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { track } from "@/lib/analytics/track"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import DashboardNav from "./DashboardNav"
import LocaleSwitcher from "@/components/marketing/LocaleSwitcher"
import ImportResumeButton from "./ImportResumeButton"
import { apiFetch } from "@/lib/apiFetch"

interface DashboardShellProps {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
  isPro: boolean
  isManaged?: boolean
  pastDueBanner?: React.ReactNode
  resumeCount?: number
  letterCount?: number
  children: React.ReactNode
}

// ── Shared Tailwind base classes for topbar action buttons ────────────────────
const btnGoldClass =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-[13px] font-semibold text-white cursor-pointer border-none whitespace-nowrap leading-none tracking-[0.005em] bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] shadow-[0_2px_8px_rgba(0,212,255,0.25)] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,212,255,0.35)] hover:-translate-y-px"

const btnGhostClass =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-[13px] font-medium cursor-pointer whitespace-nowrap leading-none bg-transparent border border-dash-border text-dash-muted transition-all duration-[180ms] hover:bg-dash-surface2 hover:border-dash-cyan hover:text-dash-navy"

// ── Topbar action buttons ─────────────────────────────────────────────────────

function TopbarNewCVButton({ locale, isPro }: { locale: string; isPro: boolean }) {
  const t = useTranslations("dashboard.shell")
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function createResume() {
    // Double-click guard: lock button for 1.5s to prevent accidental dual creation.
    if (creating) return
    setCreating(true)
    setTimeout(() => setCreating(false), 1500)
    if (!isPro) { router.push(`/${locale}/pricing`); return }
    try {
      const res = await apiFetch("/api/resumes", { method: "POST" })
      if (!res.ok) { toast.error(t("error_create_cv")); setCreating(false); return }
      const data = await res.json()
      router.push(`/${locale}/editor/${data.id}?new=1`)
    } catch {
      toast.error(t("error_create_cv"))
      setCreating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={createResume}
      disabled={creating}
      className={`${btnGoldClass} disabled:opacity-60`}
    >
      {creating ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Plus className="w-3 h-3" />
      )}
      {t("new_cv")}
    </button>
  )
}

function TopbarNewLetterButton({ locale, isPro }: { locale: string; isPro: boolean }) {
  const t = useTranslations("dashboard.shell")
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function createLetter() {
    // Double-click guard: lock button for 1.5s to prevent accidental dual creation.
    if (creating) return
    setCreating(true)
    setTimeout(() => setCreating(false), 1500)
    if (!isPro) { router.push(`/${locale}/pricing`); return }
    try {
      const res = await apiFetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t("new_letter_default_title") }),
      })
      if (!res.ok) { toast.error(t("error_create_letter")); setCreating(false); return }
      const data = await res.json()
      router.push(`/${locale}/cover-letter/${data.id}?new=1`)
    } catch {
      toast.error(t("error_create_letter"))
      setCreating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={createLetter}
      disabled={creating}
      className={`${btnGoldClass} disabled:opacity-60`}
    >
      {creating ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Plus className="w-3 h-3" />
      )}
      {t("new_letter")}
    </button>
  )
}

function TopbarAddApplicationButton() {
  const t = useTranslations("dashboard.shell")
  return (
    <button
      type="button"
      onClick={() => document.dispatchEvent(new CustomEvent("kanban-open-add"))}
      className={btnGoldClass}
    >
      <Plus className="w-3 h-3" />
      {t("add_application")}
    </button>
  )
}

function TopbarExportUsersButton() {
  const t = useTranslations("dashboard.shell")
  return (
    <button
      type="button"
      onClick={() => document.dispatchEvent(new CustomEvent("admin-export-users"))}
      className={btnGoldClass}
    >
      <Plus className="w-3 h-3" />
      {t("export_users")}
    </button>
  )
}

function TopbarSaveSettingsButton() {
  const t = useTranslations("dashboard.shell")
  return (
    <button
      type="button"
      onClick={() => document.dispatchEvent(new CustomEvent("settings-save"))}
      className={btnGhostClass}
    >
      {t("save_changes")}
    </button>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function DashboardShell({
  user,
  isPro,
  isManaged = false,
  pastDueBanner,
  resumeCount,
  letterCount,
  children,
}: DashboardShellProps) {
  const t = useTranslations("dashboard.shell")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const locale = useLocale()

  const segment = pathname.split("/dashboard/")[1]?.split("/")[0] ?? ""

  // Fire once per dashboard section entered. Maps the URL segment to the event's
  // enum (hyphen → underscore); admin panels are internal and not tracked.
  useEffect(() => {
    const SECTIONS: Record<string, "resumes" | "cover_letters" | "applications" | "referrals" | "settings" | "jobs"> = {
      resumes: "resumes",
      "cover-letters": "cover_letters",
      applications: "applications",
      referrals: "referrals",
      settings: "settings",
      jobs: "jobs",
    }
    const section = SECTIONS[segment]
    if (section) track("dashboard_viewed", { section })
  }, [segment])

  const segments: Record<string, string> = {
    resumes: t("page_resumes"),
    "cover-letters": t("page_letters"),
    applications: t("page_applications"),
    admin: t("page_admin"),
    settings: t("page_settings"),
  }
  const pageTitle = segments[segment] ?? t("page_dashboard")

  return (
    <>
      {/* ── Ambient background orbs ── */}
      <div
        className="dash-ambient-1"
        aria-hidden="true"
      />
      <div
        className="dash-ambient-2"
        aria-hidden="true"
      />

      {/* ── Body::before radial gradient effect ── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(0,212,255,0.02) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,165,116,0.01) 0%, transparent 50%)",
        }}
      />

      {/* ── Drawer backdrop ── */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className="fixed inset-0 z-[990] transition-opacity duration-[240ms] ease-[ease]"
        style={{
          background: "rgba(8,10,16,0.55)",
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
        }}
      />

      {/* ── App layout ── */}
      <div className="flex h-screen overflow-hidden relative bg-dash-surface">
        {/* Sidebar / drawer */}
        <DashboardNav
          user={user}
          isPro={isPro}
          isManaged={isManaged}
          resumeCount={resumeCount}
          letterCount={letterCount}
          drawerOpen={drawerOpen}
          onDrawerClose={() => setDrawerOpen(false)}
        />

        {/* Main column */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Topbar */}
          <header
            className="h-14 shrink-0 flex items-center gap-[14px] px-4 sm:px-7 border-b border-dash-border z-30 bg-white/85 backdrop-blur-[10px]"
          >
            {/* Mobile burger — visible on ≤1024px */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("open_menu")}
              className="flex lg:hidden w-10 h-10 items-center justify-center rounded-[10px] border border-dash-border bg-white text-dash-navy cursor-pointer shrink-0 transition-all duration-[180ms] shadow-[0_1px_2px_rgba(15,25,45,0.04)] hover:border-dash-cyan hover:text-dash-cyan"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            {/* Page title */}
            <div className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-dash-navy tracking-[-0.025em] [font-family:var(--dash-serif)]">
                {pageTitle}
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/*
                EL IDIOMA, SIEMPRE A LA VISTA — también en teléfono.
                Estaba `hidden sm:flex`, así que por debajo de 640px la única
                forma de cambiarlo era abrir el menú lateral y bajar hasta una
                sección «Idioma» al final de todo. Cambiar de idioma no es una
                preferencia enterrada: en este producto decide en qué idioma
                escribe la IA y en qué idioma se lee el CV. Va donde el usuario
                ya lo busca, que es donde está en escritorio.
                El título de la página cede el espacio (`truncate`), porque el
                título se deduce de dónde estás parado y el idioma no.
              */}
              <div className="flex shrink-0">
                <LocaleSwitcher />
              </div>

              {/* Segment-specific actions */}
              {segment === "resumes" && (
                <>
                  <div className="hidden sm:block">
                    <ImportResumeButton locked={!isPro} />
                  </div>
                  <TopbarNewCVButton locale={locale} isPro={isPro} />
                </>
              )}
              {segment === "cover-letters" && (
                <TopbarNewLetterButton locale={locale} isPro={isPro} />
              )}
              {segment === "applications" && <TopbarAddApplicationButton />}
              {segment === "admin" && <TopbarExportUsersButton />}
              {segment === "settings" && <TopbarSaveSettingsButton />}
            </div>
          </header>

          {/* Content area */}
          <main
            className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--dash-subtle)_transparent]"
          >
            {pastDueBanner}
            <div className="px-4 sm:px-7 pt-[30px] pb-[60px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
