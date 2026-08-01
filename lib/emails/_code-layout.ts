import type { EmailLocale } from "./locale"

/**
 * Shared shell for the one-time-code emails (registration, password reset, session
 * challenge). They were three byte-identical templates apart from four sentences, each
 * with its own hardcoded Spanish. Keeping the markup here means a fix to the layout —
 * or to the language handling — lands on all three at once.
 */
export interface CodeEmailCopy {
  heading: string
  greeting: (name: string) => string
  intro: string
  /** Sentence under the code. Receives the minutes the code stays valid. */
  footnote: (minutes: number) => string
}

export const CODE_EXPIRY_MINUTES = 10

export function renderCodeEmailHtml(
  locale: EmailLocale,
  copy: CodeEmailCopy,
  { firstName, code }: { firstName: string; code: string },
): string {
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;margin:0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
<tr><td>
  <h2 style="color:#1a1a1a;margin-top:0;">${copy.heading}</h2>
  <p style="color:#374151;">${copy.greeting(firstName)}</p>
  <p style="color:#374151;">${copy.intro}</p>
  <div style="text-align:center;margin:32px 0;">
    <span style="display:inline-block;background:#f3f4f6;border:2px dashed #d1d5db;border-radius:12px;padding:20px 40px;font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1a1a;">${code}</span>
  </div>
  <p style="color:#6b7280;font-size:13px;">${copy.footnote(CODE_EXPIRY_MINUTES)}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Valhalla Resume — valhallaresume.com</p>
</td></tr>
</table>
</body></html>`
}

export function renderCodeEmailText(
  copy: CodeEmailCopy,
  { firstName, code }: { firstName: string; code: string },
): string {
  // Strip the tags the HTML copy carries; the plain-text part shares the same sentences.
  const plain = (s: string) => s.replace(/<[^>]+>/g, "")
  return `${plain(copy.greeting(firstName))}

${plain(copy.intro)}

  ${code}

${plain(copy.footnote(CODE_EXPIRY_MINUTES))}

© ${new Date().getFullYear()} Valhalla Resume`
}

/** "Ana Pérez" → "Ana". Falls back to a neutral word in the reader's language. */
export function firstNameOf(userName: string, locale: EmailLocale): string {
  return userName.split(" ")[0] || (locale === "en" ? "there" : "Usuario")
}
