"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { clearSessionToken } from "@/lib/actions/logout"
import { toast } from "sonner"
import { FileText, Mail, Briefcase, Settings, LogOut, Shield } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTranslations, useLocale } from "next-intl"
import { NavItem, SectionLabel, NavSeparator } from "./_nav-sub"

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
  isPro?: boolean
  resumeCount?: number
  letterCount?: number
  drawerOpen?: boolean
  onDrawerClose?: () => void
}

export default function DashboardNav({
  user,
  isPro = false,
  resumeCount,
  letterCount,
  drawerOpen = false,
  onDrawerClose,
}: Props) {
  const pathname = usePathname()
  const t = useTranslations("dashboard.nav")
  const locale = useLocale()

  const documentos = [
    {
      label: t("cvs"),
      href: `/${locale}/dashboard/resumes`,
      icon: FileText,
      proOnly: false,
      count: resumeCount && resumeCount > 0 ? resumeCount : (null as number | null),
      isNew: false,
    },
    {
      label: t("letters"),
      href: `/${locale}/dashboard/cover-letters`,
      icon: Mail,
      proOnly: false,
      count: letterCount && letterCount > 0 ? letterCount : (null as number | null),
      isNew: false,
    },
  ]

  const candidaturas = [
    {
      label: t("jobs"),
      href: `/${locale}/dashboard/applications`,
      icon: Briefcase,
      proOnly: true,
      count: null as number | null,
      isNew: true,
    },
  ]

  const sistema =
    user.role === "SUPER_ADMIN"
      ? [
          {
            label: t("admin"),
            href: `/${locale}/dashboard/admin`,
            icon: Shield,
            proOnly: false,
            count: null as number | null,
            isNew: false,
          },
        ]
      : []

  const isActive = (href: string) => {
    const segment = href.split("/dashboard/")[1]
    return pathname.includes(`/dashboard/${segment}`)
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U"

  // ── Settings item ────────────────────────────────────────────────────────────
  const settingsHref = `/${locale}/dashboard/settings`
  const settingsActive = isActive(settingsHref)

  // ── Sidebar content ───────────────────────────────────────────────────────────
  const sidebarContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid var(--dash-border-s)",
          flexShrink: 0,
        }}
      >
        <Link
          href={`/${locale}`}
          onClick={onDrawerClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          {/* Logo ring */}
          <div
            style={{
              width: "38px",
              height: "38px",
              border: "2px solid var(--dash-cyan)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
              background:
                "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,212,255,0.03) 100%)",
              boxShadow: "0 0 0 1px rgba(0,212,255,0.1)",
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--dash-cyan)",
                letterSpacing: "0.02em",
                lineHeight: 1,
              }}
            >
              RC
            </span>
          </div>
          {/* Brand text */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--dash-navy)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              ReadyCV
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--dash-cyan)",
              }}
            >
              Studio
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "1px",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--dash-subtle) transparent",
        }}
      >
        <SectionLabel label={t("section_documents")} />
        {documentos.map((item) => (
          <NavItem key={item.href} {...item} locked={item.proOnly && !isPro} active={isActive(item.href)} onClick={onDrawerClose} />
        ))}

        <NavSeparator />
        <SectionLabel label={t("section_applications")} />
        {candidaturas.map((item) => (
          <NavItem key={item.href} {...item} locked={item.proOnly && !isPro} active={isActive(item.href)} onClick={onDrawerClose} />
        ))}

        {sistema.length > 0 && (
          <>
            <NavSeparator />
            <SectionLabel label={t("section_system")} />
            {sistema.map((item) => (
              <NavItem key={item.href} {...item} locked={item.proOnly && !isPro} active={isActive(item.href)} onClick={onDrawerClose} />
            ))}
          </>
        )}

        <NavSeparator />

        {/* Settings item */}
        <Link
          href={settingsHref}
          onClick={onDrawerClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 11px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "13.5px",
            fontWeight: settingsActive ? 600 : 500,
            color: settingsActive ? "var(--dash-cyan)" : "var(--dash-muted)",
            backgroundColor: settingsActive ? "var(--dash-cyan-dim)" : "transparent",
            border: settingsActive
              ? "1px solid var(--dash-cyan-border)"
              : "1px solid transparent",
            transition: "all 0.15s ease",
            position: "relative",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            if (!settingsActive) {
              const el = e.currentTarget as HTMLElement
              el.style.backgroundColor = "rgba(0,212,255,0.08)"
              el.style.color = "var(--dash-navy)"
              el.style.borderColor = "rgba(0,212,255,0.15)"
            }
          }}
          onMouseLeave={(e) => {
            if (!settingsActive) {
              const el = e.currentTarget as HTMLElement
              el.style.backgroundColor = "transparent"
              el.style.color = "var(--dash-muted)"
              el.style.borderColor = "transparent"
            }
          }}
        >
          {settingsActive && (
            <span
              style={{
                position: "absolute",
                left: "-1px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "18px",
                background: "var(--dash-cyan)",
                borderRadius: "0 2px 2px 0",
              }}
            />
          )}
          <Settings
            style={{
              width: 16,
              height: 16,
              flexShrink: 0,
              opacity: settingsActive ? 1 : 0.6,
              transition: "opacity 0.15s ease",
            }}
          />
          <span style={{ flex: 1 }}>{t("settings")}</span>
        </Link>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid var(--dash-border-s)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "12px",
            fontWeight: 700,
            color: "white",
            flexShrink: 0,
            border: "2px solid rgba(0,212,255,0.3)",
            boxShadow: "0 2px 8px rgba(0,212,255,0.12)",
          }}
        >
          {initials}
        </div>

        {/* User info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--dash-navy)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.name ?? user.email}
          </div>
          {isPro && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "8px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#10B981",
                marginTop: "2px",
              }}
            >
              PRO
            </div>
          )}
        </div>

        {/* Logout button */}
        <AlertDialog>
          <AlertDialogTrigger
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              border: "1px solid var(--dash-border)",
              background: "transparent",
              color: "var(--dash-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "var(--dash-surface2)"
              el.style.color = "var(--dash-navy)"
              el.style.borderColor = "var(--dash-cyan)"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "transparent"
              el.style.color = "var(--dash-muted)"
              el.style.borderColor = "var(--dash-border)"
            }}
          >
            <LogOut style={{ width: 13, height: 13 }} />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logout_confirm_title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("logout_confirm_desc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("logout_cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  const result = await clearSessionToken()
                  if (!result.ok) toast.error(t("logout_error"))
                  signOut({ callbackUrl: `/${locale}` })
                }}
              >
                {t("logout_confirm_action")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — hidden on ≤1024px */}
      <aside
        className="lg:flex hidden flex-col"
        style={{
          width: "240px",
          flexShrink: 0,
          background: "linear-gradient(180deg, #FAFBFD 0%, #F5F7FB 100%)",
          borderRight: "1px solid var(--dash-border)",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer — off-canvas, shown on ≤1024px */}
      <aside
        className="lg:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "290px",
          zIndex: 960,
          transform: drawerOpen ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "8px 0 32px rgba(15,25,45,0.18)",
          background: "linear-gradient(180deg, #FAFBFD 0%, #F5F7FB 100%)",
          borderRight: "1px solid var(--dash-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
