"use client"

import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import DashboardNav from "./DashboardNav"
import LocaleSwitcher from "@/components/marketing/LocaleSwitcher"
import ImportResumeButton from "./ImportResumeButton"
import { apiFetch } from "@/lib/apiFetch"

interface DashboardShellProps {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
  isPro: boolean
  pastDueBanner?: React.ReactNode
  resumeCount?: number
  letterCount?: number
  children: React.ReactNode
}

// ── Shared button base styles ────────────────────────────────────────────────
const btnGoldStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
  border: "none",
  whiteSpace: "nowrap",
  lineHeight: 1,
  background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
  color: "white",
  letterSpacing: "0.005em",
  boxShadow: "0 2px 8px rgba(0,212,255,0.25)",
}

const btnGhostStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.18s ease",
  whiteSpace: "nowrap",
  lineHeight: 1,
  background: "transparent",
  border: "1px solid var(--dash-border)",
  color: "var(--dash-muted)",
}

// ── Topbar action buttons ─────────────────────────────────────────────────────

function TopbarNewCVButton({ locale, isPro }: { locale: string; isPro: boolean }) {
  const t = useTranslations("dashboard.shell")
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function createResume() {
    if (!isPro) { router.push(`/${locale}/pricing`); return }
    setCreating(true)
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
      style={{ ...btnGoldStyle, opacity: creating ? 0.6 : 1 }}
      onMouseEnter={(e) => {
        if (!creating) {
          const el = e.currentTarget
          el.style.boxShadow = "0 4px 16px rgba(0,212,255,0.35)"
          el.style.transform = "translateY(-1px)"
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = "0 2px 8px rgba(0,212,255,0.25)"
        el.style.transform = "translateY(0)"
      }}
    >
      {creating ? (
        <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
      ) : (
        <Plus style={{ width: 12, height: 12 }} />
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
    if (!isPro) { router.push(`/${locale}/pricing`); return }
    setCreating(true)
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
      style={{ ...btnGoldStyle, opacity: creating ? 0.6 : 1 }}
      onMouseEnter={(e) => {
        if (!creating) {
          const el = e.currentTarget
          el.style.boxShadow = "0 4px 16px rgba(0,212,255,0.35)"
          el.style.transform = "translateY(-1px)"
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = "0 2px 8px rgba(0,212,255,0.25)"
        el.style.transform = "translateY(0)"
      }}
    >
      {creating ? (
        <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
      ) : (
        <Plus style={{ width: 12, height: 12 }} />
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
      style={btnGoldStyle}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = "0 4px 16px rgba(0,212,255,0.35)"
        el.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = "0 2px 8px rgba(0,212,255,0.25)"
        el.style.transform = "translateY(0)"
      }}
    >
      <Plus style={{ width: 12, height: 12 }} />
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
      style={btnGoldStyle}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = "0 4px 16px rgba(0,212,255,0.35)"
        el.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = "0 2px 8px rgba(0,212,255,0.25)"
        el.style.transform = "translateY(0)"
      }}
    >
      <Plus style={{ width: 12, height: 12 }} />
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
      style={btnGhostStyle}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.background = "var(--dash-surface2)"
        el.style.borderColor = "var(--dash-cyan)"
        el.style.color = "var(--dash-navy)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.background = "transparent"
        el.style.borderColor = "var(--dash-border)"
        el.style.color = "var(--dash-muted)"
      }}
    >
      {t("save_changes")}
    </button>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function DashboardShell({
  user,
  isPro,
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
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(0,212,255,0.02) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,165,116,0.01) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Drawer backdrop ── */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(8,10,16,0.55)",
          zIndex: 990,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.24s ease",
        }}
      />

      {/* ── App layout ── */}
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
          backgroundColor: "var(--dash-surface)",
        }}
      >
        {/* Sidebar / drawer */}
        <DashboardNav
          user={user}
          isPro={isPro}
          resumeCount={resumeCount}
          letterCount={letterCount}
          drawerOpen={drawerOpen}
          onDrawerClose={() => setDrawerOpen(false)}
        />

        {/* Main column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Topbar */}
          <header
            style={{
              height: "56px",
              flexShrink: 0,
              borderBottom: "1px solid var(--dash-border)",
              display: "flex",
              alignItems: "center",
              padding: "0 28px",
              gap: "14px",
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              zIndex: 30,
            }}
          >
            {/* Mobile burger — visible on ≤1024px */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("open_menu")}
              className="flex lg:hidden"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                border: "1px solid var(--dash-border)",
                background: "white",
                color: "var(--dash-navy)",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.18s ease",
                boxShadow: "0 1px 2px rgba(15,25,45,0.04)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = "var(--dash-cyan)"
                el.style.color = "var(--dash-cyan)"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = "var(--dash-border)"
                el.style.color = "var(--dash-navy)"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            {/* Page title */}
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontFamily: "var(--dash-serif)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--dash-navy)",
                  letterSpacing: "-0.025em",
                }}
              >
                {pageTitle}
              </span>
            </div>

            {/* Right side */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {/* Lang switcher */}
              <div className="hidden sm:flex">
                <LocaleSwitcher />
              </div>

              {/* Segment-specific actions */}
              {segment === "resumes" && (
                <>
                  <div className="hidden sm:block">
                    <ImportResumeButton disabled={!isPro} />
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
            style={{
              flex: 1,
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "var(--dash-subtle) transparent",
            }}
          >
            {pastDueBanner}
            <div
              style={{
                padding: "30px 28px 60px",
              }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
