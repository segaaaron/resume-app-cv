"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FileText, Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { useScrollReveal } from "@/hooks/useScrollReveal"
import LocaleSwitcher from "@/components/marketing/LocaleSwitcher"

const SCENES: Record<string, { bg: string; text: "light" | "dark" }> = {
  "act-entry":     { bg: "#FFFFFF", text: "dark" },
  "act-problem":   { bg: "#0f0f1a", text: "light" },
  "act-reveal":    { bg: "#1e1b4b", text: "light" },
  "act-fill":      { bg: "#2e1065", text: "light" },
  "act-bullets":   { bg: "#1e1b4b", text: "light" },
  "act-summary":   { bg: "#2d1b69", text: "light" },
  "act-ats":       { bg: "#052e16", text: "light" },
  "act-cover":     { bg: "#172554", text: "light" },
  "act-review":    { bg: "#431407", text: "light" },
  "act-templates": { bg: "#1c1917", text: "light" },
  "act-climax":    { bg: "#FFFFFF", text: "dark" },
}

interface Props {
  children: React.ReactNode
  locale: string
}

export default function CinematicHomepage({ children, locale }: Props) {
  const [scene, setScene] = useState("act-entry")
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations("cinematic")
  const nav = useTranslations("nav")
  const { data: session } = useSession()
  useScrollReveal()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const s = entry.target.getAttribute("data-scene")
            if (s) setScene(s)
          }
        }
      },
      { threshold: 0.4 }
    )
    document.querySelectorAll("[data-scene]").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const current = SCENES[scene] ?? SCENES["act-entry"]
  const isLight = current.text === "light"

  const fg = isLight ? "#FFFFFF" : "#0f172a"
  const fgMuted = isLight ? "rgba(255,255,255,0.70)" : "rgba(15,23,42,0.60)"
  const pillBg = isLight ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"
  const pillBorder = isLight ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(0,0,0,0.12)"

  const navLinks = [
    { href: `/${locale}/templates`,  label: nav("templates"), special: false },
    { href: `/${locale}/pro-disenos`, label: nav("pro_designs"), special: true },
    { href: `/${locale}/guide`,      label: nav("guide"), special: false },
    { href: `/${locale}/pricing`,    label: nav("pricing"), special: false },
    { href: `/${locale}/faq`,        label: nav("faq"), special: false },
  ]

  return (
    <>
      {/* Fixed animated background */}
      <div
        className="fixed inset-0 -z-10 transition-[background-color] ease-in-out"
        style={{ backgroundColor: current.bg, transitionDuration: "700ms" }}
      />

      {/* Cinematic Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-bold text-xl shrink-0 transition-colors duration-700"
          style={{ color: fg }}
        >
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          ReadyCV
        </Link>

        {/* Desktop center links */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium">
          {navLinks.map(({ href, label, special }) =>
            special ? (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "linear-gradient(to right, #8b5cf6, #06b6d4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ✦ {label}
              </Link>
            ) : (
              <Link
                key={href}
                href={href}
                className="transition-colors duration-700 hover:opacity-100"
                style={{ color: fgMuted }}
              >
                {label}
              </Link>
            )
          )}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {/* LocaleSwitcher — invert colors for dark scenes */}
          <span style={{ filter: isLight ? "invert(1) brightness(2)" : "none" }}>
            <LocaleSwitcher />
          </span>
          {session?.user ? (
            <Link
              href={`/${locale}/dashboard/resumes`}
              className="text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300"
              style={{ background: pillBg, color: fg, backdropFilter: "blur(8px)", border: pillBorder }}
            >
              {nav("dashboard")}
            </Link>
          ) : (
            <Link
              href={`/${locale}/register`}
              className="text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300"
              style={{ background: pillBg, color: fg, backdropFilter: "blur(8px)", border: pillBorder }}
            >
              {t("nav_cta")} →
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 ml-auto"
          style={{ color: fg }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="fixed top-16 left-0 right-0 z-40 px-6 py-5 flex flex-col gap-4 text-sm md:hidden"
          style={{
            background: isLight ? "rgba(15,15,26,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(16px)",
            borderBottom: pillBorder,
          }}
        >
          {navLinks.map(({ href, label, special }) =>
            special ? (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className="font-semibold py-1"
                style={{ background: "linear-gradient(to right,#8b5cf6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                ✦ {label}
              </Link>
            ) : (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className="py-1 font-medium"
                style={{ color: isLight ? "rgba(255,255,255,0.8)" : "rgba(15,23,42,0.75)" }}
              >
                {label}
              </Link>
            )
          )}
          <div className="py-1">
            <LocaleSwitcher />
          </div>
          <hr style={{ borderColor: isLight ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
          {session?.user ? (
            <Link href={`/${locale}/dashboard/resumes`} onClick={() => setMobileOpen(false)}
              className="py-1 font-semibold"
              style={{ color: isLight ? "#FFFFFF" : "#0f172a" }}
            >
              {nav("dashboard")}
            </Link>
          ) : (
            <Link href={`/${locale}/register`} onClick={() => setMobileOpen(false)}
              className="py-1 font-semibold"
              style={{ color: isLight ? "#FFFFFF" : "#0f172a" }}
            >
              {t("nav_cta")} →
            </Link>
          )}

        </div>
      )}

      <main>{children}</main>
    </>
  )
}
