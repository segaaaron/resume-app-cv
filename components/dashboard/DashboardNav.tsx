"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { clearSessionToken } from "@/lib/actions/logout"
import { toast } from "sonner"
import { FileText, Mail, Briefcase, Settings, LogOut, Shield, Gift } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTranslations, useLocale } from "next-intl"
import { NavItem, SectionLabel, NavSeparator } from "./_nav-sub"
import LocaleSwitcher from "@/components/marketing/LocaleSwitcher"
import ImportResumeButton from "./ImportResumeButton"

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
  isPro?: boolean
  isManaged?: boolean
  resumeCount?: number
  letterCount?: number
  drawerOpen?: boolean
  onDrawerClose?: () => void
}

export default function DashboardNav({
  user,
  isPro = false,
  isManaged = false,
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
      isNew: false,
    },
  ]

  // Managed users (plan=LIMITED) cannot access referrals — hide entire section.
  const recompensas = isManaged
    ? []
    : [
        {
          label: t("referrals"),
          href: `/${locale}/dashboard/referrals`,
          icon: Gift,
          proOnly: false,
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

  // Same derivation the topbar uses, so the drawer's Import shows on exactly
  // the same page the topbar's does.
  const isResumesSection = (pathname.split("/dashboard/")[1]?.split("/")[0] ?? "") === "resumes"

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5 border-b border-dash-border-s shrink-0">
        <Link
          href={`/${locale}`}
          onClick={onDrawerClose}
          className="flex items-center gap-3 no-underline"
        >
          {/* Logo icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Valhalla Resume"
            width={38}
            height={38}
            className="rounded-[10px] shrink-0 block"
          />
          {/* Brand text */}
          <span className="[font-family:var(--dash-serif)] text-[15px] font-bold text-dash-navy tracking-[-0.02em] leading-none">
            Valhalla Resume
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-px overflow-y-auto px-[10px] py-[14px] [scrollbar-width:thin] [scrollbar-color:var(--dash-subtle)_transparent]">
        <SectionLabel label={t("section_documents")} />
        {documentos.map((item) => (
          <NavItem key={item.href} {...item} locked={item.proOnly && !isPro} active={isActive(item.href)} onClick={onDrawerClose} />
        ))}

        <NavSeparator />
        <SectionLabel label={t("section_applications")} />
        {candidaturas.map((item) => (
          <NavItem key={item.href} {...item} locked={item.proOnly && !isPro} active={isActive(item.href)} onClick={onDrawerClose} />
        ))}

        {recompensas.length > 0 && (
          <>
            <NavSeparator />
            <SectionLabel label={t("section_rewards")} />
            {recompensas.map((item) => (
              <NavItem key={item.href} {...item} locked={item.proOnly && !isPro} active={isActive(item.href)} onClick={onDrawerClose} />
            ))}
          </>
        )}

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
          className={`relative cursor-pointer no-underline flex items-center gap-[10px] px-[11px] py-[9px] rounded-md text-[13.5px] transition-all duration-150 border ${
            settingsActive
              ? "font-semibold text-dash-cyan bg-[var(--dash-cyan-dim)] border-[var(--dash-cyan-border)]"
              : "font-medium text-dash-muted bg-transparent border-transparent hover:bg-[rgba(0,212,255,0.08)] hover:text-dash-navy hover:border-[rgba(0,212,255,0.15)]"
          }`}
        >
          {settingsActive && (
            <span className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-dash-cyan rounded-[0_2px_2px_0]" />
          )}
          <Settings
            className={`shrink-0 transition-opacity duration-150 w-4 h-4 ${settingsActive ? "opacity-100" : "opacity-60"}`}
          />
          <span className="flex-1">{t("settings")}</span>
        </Link>

        {/* Import a CV — topbar only shows this from sm up, so on a phone the
            drawer is the only place it can live. */}
        {isResumesSection && (
          <div className="lg:hidden">
            <NavSeparator />
            <SectionLabel label={t("section_import")} />
            <div className="px-[11px] py-[6px]" onClick={onDrawerClose}>
              <ImportResumeButton locked={!isPro} />
            </div>
          </div>
        )}

        {/* Import + language — drawer only (desktop has both in the topbar).
            The topbar hides Import below 640px with `hidden sm:block`, and it
            lived nowhere else: on a phone the feature was simply unreachable. */}
        <div className="lg:hidden">
          <NavSeparator />
          <SectionLabel label={t("section_language")} />
          <div className="px-[11px] py-[6px]">
            <LocaleSwitcher />
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="flex items-center gap-[10px] px-4 py-[14px] border-t border-dash-border-s shrink-0">
        {/* Avatar */}
        <div className="flex items-center justify-center shrink-0 rounded-full text-white font-bold text-xs w-[34px] h-[34px] [font-family:var(--dash-serif)] bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] border-2 border-[rgba(0,212,255,0.3)] shadow-[0_2px_8px_rgba(0,212,255,0.12)]">
          {initials}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-dash-navy whitespace-nowrap overflow-hidden text-ellipsis">
            {user.name ?? user.email}
          </div>
          {isPro && (
            <div className="inline-flex items-center gap-1 rounded-[4px] px-[6px] py-[2px] text-[8px] font-bold tracking-[0.06em] uppercase mt-[2px] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] text-[#10B981]">
              PRO
            </div>
          )}
        </div>

        {/* Logout button */}
        <AlertDialog>
          <AlertDialogTrigger
            onClick={onDrawerClose}
            className="flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150 rounded-[6px] w-[28px] h-[28px] border border-dash-border bg-transparent text-dash-muted hover:bg-dash-surface2 hover:text-dash-navy hover:border-dash-cyan"
          >
            <LogOut className="w-[13px] h-[13px]" />
          </AlertDialogTrigger>
          <AlertDialogContent className="p-0 overflow-hidden rounded-2xl max-w-[400px] border border-dash-border shadow-[0_40px_100px_rgba(0,212,255,0.08)]">
            {/* Head */}
            <div className="relative text-center px-7 pt-[30px] pb-4 border-b border-dash-border-s bg-gradient-to-b from-dash-surface to-white">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />
              {/* Icon */}
              <div className="flex items-center justify-center w-[60px] h-[60px] mx-auto mb-[14px] rounded-full relative text-dash-cyan bg-gradient-to-br from-[rgba(0,212,255,0.12)] to-[rgba(0,168,204,0.04)] border-[1.5px] border-[rgba(0,212,255,0.25)]">
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                  <path d="M10 22H5.5A1.5 1.5 0 014 20.5v-15A1.5 1.5 0 015.5 4H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M17 18l5-5-5-5M22 13H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-[22px] font-bold text-dash-navy tracking-[-0.03em] mb-[6px] [font-family:var(--dash-serif)]">
                {t("logout_confirm_title")}
              </div>
              <div className="text-[13px] text-dash-muted leading-[1.5] max-w-[280px] mx-auto">
                {t("logout_confirm_desc")}
              </div>
            </div>
            {/* Actions */}
            <div className="flex gap-[10px] px-6 pt-[18px] pb-[22px]">
              <AlertDialogCancel className="flex-1 flex justify-center px-4 py-[11px] text-[13px] font-medium">
                {t("logout_cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  const result = await clearSessionToken()
                  if (!result.ok) toast.error(t("logout_error"))
                  signOut({ callbackUrl: `/${locale}` })
                }}
                className="flex-1 flex justify-center px-4 py-[11px] text-[13px] font-semibold text-white cursor-pointer border-none bg-gradient-to-br from-[#DC2626] to-[#B91C1C] shadow-[0_2px_8px_rgba(220,38,38,0.25)]"
              >
                {t("logout_confirm_action")}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — hidden on ≤1024px */}
      <aside className="lg:flex hidden flex-col w-[240px] shrink-0 h-full overflow-hidden border-r border-dash-border bg-gradient-to-b from-[#FAFBFD] to-dash-surface">
        {sidebarContent}
      </aside>

      {/* Mobile drawer — off-canvas, shown on ≤1024px */}
      <aside
        className="lg:hidden fixed top-0 left-0 bottom-0 w-[290px] z-[1000] flex flex-col overflow-hidden isolation-isolate border-r border-dash-border bg-[#FAFBFD] shadow-[8px_0_32px_rgba(15,25,45,0.18)]"
        style={{
          transform: drawerOpen ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
