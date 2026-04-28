import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

/** Normalize a job/edu description for safe HTML rendering.
 *  Lines starting with • or - are rendered as <ul><li> items.
 *  Continuation lines (no bullet prefix) are merged into the previous bullet
 *  so mid-bullet Enter presses don't produce orphaned lines. */
export function fmtDesc(text: string): string {
  const normalized = text.replace(/<br\s*\/?>/gi, "\n")
  const lines = normalized.split("\n")
  const hasBullets = lines.some((l) => /^[•\-]\s/.test(l.trim()))

  if (!hasBullets) {
    return lines.map((l) => escapeHtml(l)).join("<br>")
  }

  const bullets: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (/^[•\-]\s/.test(line)) {
      bullets.push(escapeHtml(line.replace(/^[•\-]\s*/, "")))
    } else if (bullets.length > 0) {
      bullets[bullets.length - 1] += " " + escapeHtml(line)
    } else {
      bullets.push(escapeHtml(line))
    }
  }

  return `<ul style="list-style-type:disc;padding-left:1.1em;margin:0">${bullets.map((b) => `<li style="margin-bottom:0.15em">${b}</li>`).join("")}</ul>`
}
