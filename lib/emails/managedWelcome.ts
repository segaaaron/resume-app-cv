import { pickEmailLocale, type EmailLocale } from "./locale"

interface ManagedWelcomeProps {
  password: string
  expiresAt: Date
  downloadLimit: number | null
  loginUrl: string
  /** Reader's language. Sent from a normal request, so the caller always knows it. */
  locale?: string | null
}

const COPY = {
  es: {
    subject: "Tu acceso a Valhalla Resume está listo",
    title: "Tu acceso a Valhalla Resume está listo",
    heroSub: "Tu cuenta Premium ha sido configurada.",
    labelPassword: "Contraseña temporal",
    labelExpires: "Acceso válido hasta",
    labelDownloads: "Descargas de CV incluidas",
    changeNote: "Puedes cambiar tu contraseña en cualquier momento desde la configuración de tu cuenta una vez que hayas iniciado sesión.",
    cta: "Iniciar sesión &rarr;",
    rights: "Todos los derechos reservados",
    privacy: "Privacidad",
    terms: "Términos",
  },
  en: {
    subject: "Your Valhalla Resume access is ready",
    title: "Your Valhalla Resume access is ready",
    heroSub: "Your Premium account has been set up.",
    labelPassword: "Temporary password",
    labelExpires: "Access valid until",
    labelDownloads: "CV downloads included",
    changeNote: "You can change your password at any time from your account settings once you've signed in.",
    cta: "Sign in &rarr;",
    rights: "All rights reserved",
    privacy: "Privacy",
    terms: "Terms",
  },
} as const

/**
 * Subject in the reader's language. This used to be an exported CONSTANT string in
 * Spanish, so the caller could not have localised it even if it wanted to.
 */
export function managedWelcomeSubjectFor(locale?: string | null): string {
  return COPY[pickEmailLocale(locale)].subject
}

/** Defensive HTML escape — the password is randomly generated and may include `<`, `>`, `&`, etc. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatDate(date: Date, locale: EmailLocale): string {
  return date.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", { day: "numeric", month: "long", year: "numeric" })
}

export const managedWelcomeSubject = "Tu acceso a Valhalla Resume está listo"

export function managedWelcomeHtml({ password, expiresAt, downloadLimit, loginUrl, locale }: ManagedWelcomeProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  const expiresStr = formatDate(expiresAt, lang)
  const safePassword = escapeHtml(password)

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="https://www.valhallaresume.com" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:800;color:#2a72d7;letter-spacing:-0.5px;">Valhalla Resume</span>
              </a>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#2a72d7 0%,#1e56b0 100%);padding:36px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">
                      ${t.title}
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
                      ${t.heroSub}
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px;">

                    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
                      Bienvenido a Valhalla Resume. Tu acceso ha sido habilitado y puedes comenzar a usar la plataforma de inmediato.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #dbeafe;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <p style="margin:0 0 16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                            Datos de acceso
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelPassword}</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <code style="font-size:14px;font-weight:700;color:#111827;background:#e8f0fe;padding:3px 10px;border-radius:6px;letter-spacing:0.5px;">${safePassword}</code>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;${downloadLimit !== null ? "border-bottom:1px solid #e5edff;" : ""}">
                                <span style="font-size:14px;color:#6b7280;">${t.labelExpires}</span>
                              </td>
                              <td align="right" style="padding:10px 0;${downloadLimit !== null ? "border-bottom:1px solid #e5edff;" : ""}">
                                <span style="font-size:14px;font-weight:700;color:#2a72d7;">${expiresStr}</span>
                              </td>
                            </tr>
                            ${downloadLimit !== null ? `
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelDownloads}</span>
                              </td>
                              <td align="right" style="padding:10px 0 0;">
                                <span style="font-size:14px;font-weight:700;color:#111827;">${downloadLimit}</span>
                              </td>
                            </tr>` : ""}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.7;">
                      ${t.changeNote}
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}"
                            style="display:inline-block;background:#2a72d7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                            ${t.cta}
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding:28px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} Valhalla Resume &middot; ${t.rights}
              </p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">
                <a href="https://www.valhallaresume.com/privacy" style="color:#9ca3af;text-decoration:none;">${t.privacy}</a>
                &nbsp;&middot;&nbsp;
                <a href="https://www.valhallaresume.com/terms" style="color:#9ca3af;text-decoration:none;">${t.terms}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function managedWelcomeText({ password, expiresAt, downloadLimit, loginUrl, locale }: ManagedWelcomeProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  const expiresStr = formatDate(expiresAt, lang)
  const downloadLine = downloadLimit !== null ? `${t.labelDownloads}: ${downloadLimit}\n` : ""
  const accessHeader = lang === "en" ? "ACCESS DETAILS" : "DATOS DE ACCESO"
  const signIn = lang === "en" ? "Sign in" : "Iniciar sesión"

  return `${t.title}

${t.heroSub}

${accessHeader}
---------------
${t.labelPassword}: ${password}
${t.labelExpires}: ${expiresStr}
${downloadLine}
${t.changeNote}

${signIn}: ${loginUrl}

© ${new Date().getFullYear()} Valhalla Resume`
}
