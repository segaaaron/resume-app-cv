// Shared helpers for the cover-letter premium templates (set of 30).
// Keeps each template file lean and consistent.

export function initials(name?: string, max = 2): string {
  if (!name) return ""
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].slice(0, max).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).slice(0, max).toUpperCase()
}

export function firstInitial(name?: string): string {
  if (!name) return ""
  const t = name.trim()
  return t ? t[0].toUpperCase() : ""
}

export function formatDate(locale = "es"): string {
  try {
    return new Date().toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return new Date().toDateString()
  }
}

// Font-family stacks. Project only loads Plus Jakarta Sans + Playfair Display via next/font/google,
// so all "exotic" source fonts gracefully fall back to system equivalents documented per template.
export const FF = {
  // Loaded in app/layout.tsx
  jakarta: "var(--font-jakarta), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  playfair: "var(--font-playfair), Georgia, 'Times New Roman', serif",
  // System fallbacks for source-requested fonts (NOT loaded — documented fallback chains)
  systemSans: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', system-ui, Arial, sans-serif",
  systemSerif: "Georgia, 'Times New Roman', Times, serif",
  systemMono: "'SF Mono', 'JetBrains Mono', 'Courier New', Courier, monospace",
  // For "elegant serif w/ small caps" needs (Cormorant, EB Garamond, Lora, Crimson Pro, Playfair, Libre Baskerville)
  elegantSerif: "var(--font-playfair), Georgia, 'Times New Roman', serif",
}
