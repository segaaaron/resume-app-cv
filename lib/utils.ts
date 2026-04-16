import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Normalize a job/edu description for safe HTML rendering.
 *  Converts plain newlines to <br> so manually-typed multi-line
 *  descriptions display correctly alongside parsed ones. */
export function fmtDesc(text: string): string {
  return text.replace(/\n/g, "<br>")
}
