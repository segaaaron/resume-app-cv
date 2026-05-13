"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { FileText, Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { useScrollReveal } from "@/hooks/useScrollReveal"
import LocaleSwitcher from "@/components/marketing/LocaleSwitcher"

const SCENES: Record<string, { bg: string; text: "light" | "dark"; overlay: number }> = {
  "act-entry":     { bg: "#d4d0cc", text: "dark",  overlay: 0.08 },
  "act-problem":   { bg: "#0f0f1a", text: "light", overlay: 0.25 },
  "act-reveal":    { bg: "#1e1b4b", text: "light", overlay: 0.22 },
  "act-fill":      { bg: "#2e1065", text: "light", overlay: 0.22 },
  "act-bullets":   { bg: "#1e1b4b", text: "light", overlay: 0.22 },
  "act-summary":   { bg: "#2d1b69", text: "light", overlay: 0.22 },
  "act-ats":       { bg: "#052e16", text: "light", overlay: 0.22 },
  "act-cover":     { bg: "#172554", text: "light", overlay: 0.22 },
  "act-review":    { bg: "#431407", text: "light", overlay: 0.22 },
  "act-templates": { bg: "#1c1917", text: "light", overlay: 0.25 },
  "act-climax":    { bg: "#d4d0cc", text: "dark",  overlay: 0.08 },
}

const SCENE_IMAGE: Record<string, string> = {
  "act-entry":     "/images/bg/bg-act-entry.webp",
  "act-problem":   "/images/bg/bg-act-problem.webp",
  "act-reveal":    "/images/bg/bg-act-reveal.webp",
  "act-fill":      "/images/bg/bg-act-fill.webp",
  "act-bullets":   "/images/bg/bg-act-bullets.webp",
  "act-summary":   "/images/bg/bg-act-summary.webp",
  "act-ats":       "/images/bg/bg-act-ats.webp",
  "act-cover":     "/images/bg/bg-act-cover.webp",
  "act-review":    "/images/bg/bg-act-review.webp",
  "act-templates": "/images/bg/bg-act-templates.webp",
  "act-climax":    "/images/bg/bg-act-climax.webp",
}

// Max translateY must stay within image's extra height.
// Image: top -10%, height 120% → extra = 20% of 100vh ≈ 200px. Clamp safely below that.
const PARALLAX_FACTOR = 0.12
const PARALLAX_MAX    = 80 // px

// Strict order: scenes can only advance one step at a time in scroll direction
const SCENE_ORDER = [
  "act-entry", "act-problem", "act-reveal", "act-fill", "act-bullets",
  "act-summary", "act-ats", "act-cover", "act-review", "act-templates", "act-climax",
]

interface Props {
  children: React.ReactNode
  locale: string
}

export default function CinematicHomepage({ children, locale }: Props) {
  const [scene, setScene]       = useState("act-entry")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bgSrc, setBgSrc]       = useState(SCENE_IMAGE["act-entry"])
  const [bgOpacity, setBgOpacity] = useState(1)

  const imgRef        = useRef<HTMLImageElement>(null)
  const displayedSrc  = useRef(SCENE_IMAGE["act-entry"])
  const sceneIndexRef = useRef(0)

  const t   = useTranslations("cinematic")
  const nav = useTranslations("nav")
  const { data: session } = useSession()
  useScrollReveal()

  // Preload all scene images into browser cache on mount
  useEffect(() => {
    Object.values(SCENE_IMAGE).forEach((src) => {
      const img = new window.Image()
      img.src = src
    })
  }, [])

  // Parallax — clamped so image never leaves the fixed container
  useEffect(() => {
    let rafId: number
    const tick = () => {
      const offset = Math.min(window.scrollY * PARALLAX_FACTOR, PARALLAX_MAX)
      if (imgRef.current) imgRef.current.style.transform = `translateY(${offset}px)`
    }
    const onScroll = () => { rafId = requestAnimationFrame(tick) }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(rafId) }
  }, [])

  // Scroll-based scene detection with strict sequential advance.
  // On each scroll tick: find scene whose center is closest to viewport center,
  // then advance sceneIndexRef by exactly ONE step toward it — never jumps multiple scenes.
  useEffect(() => {
    let rafId: number

    const detect = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"))
      if (!els.length) return

      // Find which scene element is most centered in the viewport
      const mid = window.innerHeight / 2
      let target = els[0]
      let bestDist = Infinity
      for (const el of els) {
        const { top, height } = el.getBoundingClientRect()
        const dist = Math.abs(top + height / 2 - mid)
        if (dist < bestDist) { bestDist = dist; target = el }
      }

      const targetName  = target.getAttribute("data-scene") ?? SCENE_ORDER[0]
      const targetIndex = SCENE_ORDER.indexOf(targetName)
      if (targetIndex === -1) return

      const current = sceneIndexRef.current
      if (targetIndex === current) return

      // Advance exactly one step toward target — never skip scenes
      const nextIndex = targetIndex > current ? current + 1 : current - 1
      sceneIndexRef.current = nextIndex
      setScene(SCENE_ORDER[nextIndex])
    }

    const onScroll = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(detect) }
    detect() // set initial scene without waiting for scroll
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(rafId) }
  }, [])

  // Sequential fade: out → wait for image load → swap src → in.
  // Waiting for onload prevents the blank-frame flash when image isn't cached yet.
  useEffect(() => {
    const newSrc = SCENE_IMAGE[scene]
    if (!newSrc || newSrc === displayedSrc.current) return

    let cancelled = false

    const doTransition = () => {
      if (cancelled) return
      setBgOpacity(0)
      setTimeout(() => {
        if (cancelled) return
        setBgSrc(newSrc)
        displayedSrc.current = newSrc
        setBgOpacity(1)
      }, 380)
    }

    // If already in browser cache onload fires synchronously / near-instantly
    const probe = new window.Image()
    probe.onload = doTransition
    probe.onerror = doTransition // still transition even if image fails
    probe.src = newSrc

    return () => { cancelled = true }
  }, [scene])

  const current    = SCENES[scene] ?? SCENES["act-entry"]
  const isLight    = current.text === "light"
  const fg         = isLight ? "#FFFFFF" : "#0f172a"
  const fgMuted    = isLight ? "rgba(255,255,255,0.75)" : "rgba(15,23,42,0.85)"
  const pillBg     = isLight ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)"
  const pillBorder = isLight ? "1px solid rgba(255,255,255,0.30)" : "1px solid rgba(0,0,0,0.20)"

  const navLinks = [
    { href: `/${locale}/templates`,   label: nav("templates"),   special: false },
    { href: `/${locale}/pro-disenos`, label: nav("pro_designs"), special: true  },
    { href: `/${locale}/blog`,        label: nav("blog"),        special: false },
    { href: `/${locale}/guide`,       label: nav("guide"),       special: false },
    { href: `/${locale}/pricing`,     label: nav("pricing"),     special: false },
    { href: `/${locale}/faq`,         label: nav("faq"),         special: false },
  ]

  return (
    <>
      {/* Fixed background — single image slot, parallax clamped */}
      <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={bgSrc}
          alt=""
          aria-hidden="true"
          loading="eager"
          style={{
            position: "absolute",
            top: "-10%",
            left: 0,
            width: "100%",
            height: "120%",
            objectFit: "cover",
            objectPosition: "center",
            willChange: "transform, opacity",
            opacity: bgOpacity,
            transition: "opacity 380ms ease",
          }}
        />

        {/* Single color overlay — brand tint over the image */}
        <div
          className="absolute inset-0 transition-[background-color,opacity] ease-in-out"
          style={{
            backgroundColor: current.bg,
            opacity: current.overlay,
            transitionDuration: "700ms",
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 h-16 flex items-center justify-between gap-6"
        style={{
          background: isLight
            ? "linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, transparent 100%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)",
          backdropFilter: "blur(6px)",
        }}
      >
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

        <div className="hidden md:flex items-center gap-5 text-sm font-medium">
          {navLinks.map(({ href, label, special }) =>
            special ? (
              <Link key={href} href={href}
                className="flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
                style={{ background: "linear-gradient(to right,#8b5cf6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                ✦ {label}
              </Link>
            ) : (
              <Link key={href} href={href}
                className="transition-colors duration-700 hover:opacity-100"
                style={{ color: fgMuted }}
              >
                {label}
              </Link>
            )
          )}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <span style={{ filter: isLight ? "invert(1) brightness(2)" : "none" }}>
            <LocaleSwitcher />
          </span>
          {session?.user ? (
            <Link href={`/${locale}/dashboard/resumes`}
              className="text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300"
              style={{ background: pillBg, color: fg, backdropFilter: "blur(8px)", border: pillBorder }}
            >
              {nav("dashboard")}
            </Link>
          ) : (
            <Link href={`/${locale}/register`}
              className="text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300"
              style={{ background: pillBg, color: fg, backdropFilter: "blur(8px)", border: pillBorder }}
            >
              {t("nav_cta")} →
            </Link>
          )}
        </div>

        <button className="md:hidden p-2 ml-auto" style={{ color: fg }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 px-6 py-5 flex flex-col gap-4 text-sm md:hidden"
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
          <div className="py-1"><LocaleSwitcher /></div>
          <hr style={{ borderColor: isLight ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
          {session?.user ? (
            <Link href={`/${locale}/dashboard/resumes`} onClick={() => setMobileOpen(false)}
              className="py-1 font-semibold" style={{ color: isLight ? "#FFFFFF" : "#0f172a" }}
            >
              {nav("dashboard")}
            </Link>
          ) : (
            <Link href={`/${locale}/register`} onClick={() => setMobileOpen(false)}
              className="py-1 font-semibold" style={{ color: isLight ? "#FFFFFF" : "#0f172a" }}
            >
              {t("nav_cta")} →
            </Link>
          )}
        </div>
      )}

      <main className="relative z-10">{children}</main>
    </>
  )
}
