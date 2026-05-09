"use client"

import { useEffect } from "react"

export function useScrollReveal(
  selector = ".animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-right"
) {
  useEffect(() => {
    // ── 1. Word-split titles (focus-pull effect) ─────────────────
    document.querySelectorAll<HTMLElement>('[data-animate="title"]').forEach((el) => {
      if (el.classList.contains("words-ready")) return  // idempotency guard
      const text = el.textContent ?? ""
      if (!text.trim()) return
      el.setAttribute("aria-label", text)
      el.innerHTML = text
        .split(" ")
        .filter(Boolean)
        .map(
          (word, i) =>
            `<span class="split-word" style="--w-delay:${i * 65}ms">${word}</span>`
        )
        .join(" ")
      el.classList.add("words-ready")
    })

    // ── 2. Card stagger (3D perspective rise) ────────────────────
    document.querySelectorAll<HTMLElement>('[data-animate="cards"]').forEach((el) => {
      Array.from(el.children).forEach((child, i) => {
        ;(child as HTMLElement).classList.add("card-item")
        ;(child as HTMLElement).style.setProperty("--c-delay", `${i * 90}ms`)
      })
    })

    // ── 3. IntersectionObserver for all animated elements ────────
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view")
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15 }
    )

    const allSelectors = [
      selector,
      ".animate-blur-in",
      '[data-animate="title"]',
      '[data-animate="cards"]',
    ].join(", ")

    document.querySelectorAll(allSelectors).forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [selector])
}
