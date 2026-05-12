import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Cookie Policy — READY CV" : "Política de Cookies — READY CV",
  }
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const isEn = locale === "en"

  const tocEn = [
    [1, "What Are Cookies?"],
    [2, "Staying Logged In"],
    [3, "During Checkout"],
    [4, "What We Don't Track"],
    [5, "How to Disable"],
    [6, "Policy Changes"],
    [7, "Contact"],
  ]

  const tocEs = [
    [1, "¿Qué son las cookies?"],
    [2, "Mantener tu sesión"],
    [3, "Durante el pago"],
    [4, "Lo que NO rastreamos"],
    [5, "Cómo desactivarlas"],
    [6, "Cambios en la política"],
    [7, "Contacto"],
  ]

  const toc = isEn ? tocEn : tocEs

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">

        {/* Hero header */}
        <div className="border-b bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Legal
            </span>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isEn ? "Cookie Policy" : "Política de Cookies"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEn ? "Last updated: April 27, 2026" : "Última actualización: 27 de abril de 2026"} · MS Saravia Tech Stack LLC
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex gap-12 items-start">

            {/* Sticky sidebar TOC */}
            <aside className="hidden lg:block w-52 shrink-0">
              <div className="sticky top-8 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {isEn ? "Contents" : "Contenido"}
                </p>
                {toc.map(([num, label]) => (
                  <a
                    key={num}
                    href={`#cookie-${num}`}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 pl-2 rounded hover:bg-muted/50"
                  >
                    <span className="w-4 text-right shrink-0 text-primary/60 font-medium">{num}.</span>
                    <span className="truncate">{label}</span>
                  </a>
                ))}
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0 max-w-[680px] space-y-2">

              {/* Intro card */}
              <div className="rounded-xl border bg-card p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed">
                  {isEn
                    ? <>This Cookie Policy explains what cookies are, which ones <strong className="text-foreground">READY CV</strong> uses, and how you can control them.</>
                    : <>Esta Política de Cookies explica qué son las cookies, cuáles utiliza <strong className="text-foreground">READY CV</strong> y cómo puedes controlarlas.</>
                  }
                </p>
              </div>

              {/* Section 1 */}
              <section id="cookie-1" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                  {isEn ? "What Are Cookies?" : "¿Qué son las cookies?"}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isEn
                    ? "Cookies are small text files stored on your device by your browser when you visit a website. They allow the website to remember your preferences and session state across page loads."
                    : "Las cookies son pequeños archivos de texto que tu navegador almacena en tu dispositivo cuando visitas un sitio web. Permiten que el sitio recuerde tus preferencias y el estado de tu sesión entre cargas de página."
                  }
                </p>
              </section>

              {/* Section 2 */}
              <section id="cookie-2" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                  {isEn ? "Cookies to Keep You Logged In" : "Cookies para mantener tu sesión"}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isEn
                    ? <>When you sign in to READY CV, we store a small cookie on your browser so you stay logged in as you navigate the platform. Without it, you would be logged out every time you change pages. This cookie contains no personal data — it only identifies your active session.</>
                    : <>Cuando inicias sesión en READY CV, guardamos una pequeña cookie en tu navegador para que permanezcas conectado mientras navegas por la plataforma. Sin ella, cerrarías sesión cada vez que cambies de página. Esta cookie no contiene datos personales — solo identifica tu sesión activa.</>
                  }
                </p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {(isEn ? [
                    ["Purpose", "Keeps you logged in during your visit."],
                    ["Duration", "Ends when you close your browser, or stays up to 30 days if you choose \"Remember me\"."],
                    ["Who sets it", "READY CV — stored only on your device."],
                  ] : [
                    ["Propósito", "Mantenerte conectado durante tu visita."],
                    ["Duración", "Se elimina al cerrar el navegador, o dura hasta 30 días si eliges «Recordarme»."],
                    ["Quién la establece", "READY CV — almacenada solo en tu dispositivo."],
                  ]).map(([label, value]) => (
                    <li key={String(label)} className="flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span><strong className="text-foreground">{label}:</strong> {value}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 3 */}
              <section id="cookie-3" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                  {isEn ? "Cookies During Checkout" : "Cookies durante el pago"}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isEn
                    ? <>When you subscribe to READY CV Pro, the payment is processed by a certified and secure payment provider. As part of that process, a cookie may be placed on your browser to verify that the transaction is legitimate and protect you from fraud. This cookie is managed entirely by the payment provider and is never accessible to READY CV.</>
                    : <>Cuando te suscribes a READY CV Pro, el pago lo procesa un proveedor de pagos certificado y seguro. Como parte de ese proceso, puede guardarse una cookie en tu navegador para verificar que la transacción es legítima y protegerte del fraude. Esta cookie la gestiona exclusivamente el proveedor de pagos y READY CV nunca tiene acceso a ella.</>
                  }
                </p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {(isEn ? [
                    ["Purpose", "Protects you from payment fraud."],
                    ["Who sets it", "Our payment provider — governed by their own privacy policy."],
                    ["Does READY CV see it?", "No. It is completely outside our control."],
                  ] : [
                    ["Propósito", "Protegerte del fraude en el pago."],
                    ["Quién la establece", "Nuestro proveedor de pagos — se rige por su propia política de privacidad."],
                    ["¿READY CV la ve?", "No. Está completamente fuera de nuestro control."],
                  ]).map(([label, value]) => (
                    <li key={String(label)} className="flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span><strong className="text-foreground">{label}:</strong> {value}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 4 */}
              <section id="cookie-4" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                  {isEn ? "What We Do NOT Track" : "Lo que NO rastreamos"}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isEn
                    ? "We believe your data is yours. READY CV does not use cookies to track your behaviour, profile you, or share information with advertisers."
                    : "Creemos que tus datos son tuyos. READY CV no utiliza cookies para rastrear tu comportamiento, crear perfiles ni compartir información con anunciantes."
                  }
                </p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {(isEn ? [
                    "We do not show you ads based on your activity.",
                    "We do not track which pages you visit across the web.",
                    "We do not share your data with social media platforms.",
                    "We do not use analytics tools that monitor your browsing behaviour.",
                  ] : [
                    "No te mostramos anuncios basados en tu actividad.",
                    "No rastreamos qué páginas visitas en la web.",
                    "No compartimos tus datos con redes sociales.",
                    "No usamos herramientas de analítica que monitoreen tu comportamiento de navegación.",
                  ]).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 5 */}
              <section id="cookie-5" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
                  {isEn ? "How to Disable Cookies" : "Cómo desactivar las cookies"}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isEn
                    ? "You can configure your browser to refuse or alert you to cookies. Note: disabling session cookies will prevent you from logging in to READY CV."
                    : "Puedes configurar tu navegador para rechazar cookies o recibir alertas. Ten en cuenta que desactivar las cookies de sesión te impedirá iniciar sesión en READY CV."
                  }
                </p>
                <ul className="space-y-2 text-sm">
                  {(isEn ? [
                    ["Google Chrome", "https://support.google.com/chrome/answer/95647"],
                    ["Mozilla Firefox", "https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"],
                    ["Safari", "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"],
                    ["Microsoft Edge", "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"],
                  ] : [
                    ["Google Chrome", "https://support.google.com/chrome/answer/95647"],
                    ["Mozilla Firefox", "https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-"],
                    ["Safari", "https://support.apple.com/es-es/guide/safari/sfri11471/mac"],
                    ["Microsoft Edge", "https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"],
                  ]).map(([browser, url]) => (
                    <li key={browser} className="flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:opacity-80">
                        {browser}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 6 */}
              <section id="cookie-6" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">6</span>
                  {isEn ? "Changes to This Policy" : "Cambios en esta política"}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isEn
                    ? "We may update this Cookie Policy from time to time. We will notify you of significant changes by posting a notice on the platform or sending you an email."
                    : "Podemos actualizar esta Política de Cookies periódicamente. Te notificaremos sobre cambios significativos mediante un aviso en la plataforma o por correo electrónico."
                  }
                </p>
              </section>

              {/* Section 7 */}
              <section id="cookie-7" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">7</span>
                  {isEn ? "Contact" : "Contacto"}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isEn
                    ? <>Questions about our cookie use? Email us at <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a>.</>
                    : <>¿Preguntas sobre el uso de cookies? Escríbenos a <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a>.</>
                  }
                </p>
              </section>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
