import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Normalize a job/edu description for safe HTML rendering.
 *  Escapes HTML entities first, then converts newlines to <br>.
 *  This prevents XSS from user-supplied content. */
export function fmtDesc(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
  return escaped.replace(/\n/g, "<br>")
}
