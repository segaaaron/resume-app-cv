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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          {locale === "en" ? (
            <>
              <h1>Cookie Policy</h1>
              <p className="text-muted-foreground text-sm">Last updated: April 27, 2026</p>

              <p>
                This Cookie Policy explains what cookies are, which ones READY CV uses, and how you can control
                them.
              </p>

              <h2>What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device by your browser when you visit a website. They
                allow the website to remember your preferences and session state across page loads.
              </p>

              <h2>Cookies We Use</h2>

              <h3>Session Cookies (NextAuth)</h3>
              <p>
                READY CV uses <strong>session cookies</strong> managed by NextAuth.js to keep you logged in during
                your visit. These cookies are strictly necessary for the platform to function — without them, you
                cannot access your account or editor.
              </p>
              <ul>
                <li>
                  <strong>Name:</strong> <code>next-auth.session-token</code> (or{" "}
                  <code>__Secure-next-auth.session-token</code> over HTTPS)
                </li>
                <li>
                  <strong>Purpose:</strong> Maintains your authenticated session.
                </li>
                <li>
                  <strong>Duration:</strong> Session (deleted when you close your browser) or up to 30 days if you
                  choose &quot;Remember me&quot;.
                </li>
                <li>
                  <strong>Type:</strong> First-party, HttpOnly, Secure.
                </li>
              </ul>

              <h3>Payment Cookies (Stripe)</h3>
              <p>
                When you visit the checkout page, <strong>Stripe</strong> may set cookies on your device to prevent
                fraud and ensure a secure payment process. These cookies are set by Stripe&apos;s domain and are
                governed by{" "}
                <a
                  href="https://stripe.com/cookie-settings"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe&apos;s Cookie Policy
                </a>
                .
              </p>
              <ul>
                <li>
                  <strong>Purpose:</strong> Fraud prevention and secure payment processing.
                </li>
                <li>
                  <strong>Type:</strong> Third-party (Stripe domain), payment-essential.
                </li>
              </ul>

              <h2>Cookies We Do NOT Use</h2>
              <p>
                READY CV does <strong>not</strong> use:
              </p>
              <ul>
                <li>Third-party advertising or tracking cookies.</li>
                <li>Analytics cookies (e.g., Google Analytics, Facebook Pixel).</li>
                <li>Social media tracking cookies.</li>
              </ul>

              <h2>How to Disable Cookies</h2>
              <p>
                You can configure your browser to refuse all or some cookies, or to alert you when websites set or
                access cookies. Note that disabling session cookies will prevent you from logging in to READY CV.
              </p>
              <p>Instructions for popular browsers:</p>
              <ul>
                <li>
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>

              <h2>Changes to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. We will notify you of significant changes by
                posting a notice on the platform or sending you an email.
              </p>

              <h2>Contact</h2>
              <p>
                If you have questions about our use of cookies, contact us at{" "}
                <a href="mailto:soporte@readycvv.com">soporte@readycvv.com</a>.
              </p>
            </>
          ) : (
            <>
              <h1>Política de Cookies</h1>
              <p className="text-muted-foreground text-sm">Última actualización: 27 de abril de 2026</p>

              <p>
                Esta Política de Cookies explica qué son las cookies, cuáles utiliza READY CV y cómo puedes
                controlarlas.
              </p>

              <h2>¿Qué son las cookies?</h2>
              <p>
                Las cookies son pequeños archivos de texto que tu navegador almacena en tu dispositivo cuando
                visitas un sitio web. Permiten que el sitio recuerde tus preferencias y el estado de tu sesión
                entre cargas de página.
              </p>

              <h2>Cookies que utilizamos</h2>

              <h3>Cookies de sesión (NextAuth)</h3>
              <p>
                READY CV utiliza <strong>cookies de sesión</strong> gestionadas por NextAuth.js para mantenerte
                autenticado durante tu visita. Estas cookies son estrictamente necesarias para el funcionamiento de
                la plataforma — sin ellas, no puedes acceder a tu cuenta ni al editor.
              </p>
              <ul>
                <li>
                  <strong>Nombre:</strong> <code>next-auth.session-token</code> (o{" "}
                  <code>__Secure-next-auth.session-token</code> sobre HTTPS)
                </li>
                <li>
                  <strong>Propósito:</strong> Mantener tu sesión autenticada.
                </li>
                <li>
                  <strong>Duración:</strong> Sesión (se elimina al cerrar el navegador) o hasta 30 días si
                  seleccionas &quot;Recordarme&quot;.
                </li>
                <li>
                  <strong>Tipo:</strong> Propia, HttpOnly, Secure.
                </li>
              </ul>

              <h3>Cookies de pago (Stripe)</h3>
              <p>
                Cuando visitas la página de pago, <strong>Stripe</strong> puede establecer cookies en tu dispositivo
                para prevenir el fraude y garantizar un proceso de pago seguro. Estas cookies las establece el
                dominio de Stripe y se rigen por la{" "}
                <a
                  href="https://stripe.com/cookie-settings"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Política de Cookies de Stripe
                </a>
                .
              </p>
              <ul>
                <li>
                  <strong>Propósito:</strong> Prevención de fraude y procesamiento seguro de pagos.
                </li>
                <li>
                  <strong>Tipo:</strong> Terceros (dominio de Stripe), esenciales para el pago.
                </li>
              </ul>

              <h2>Cookies que NO utilizamos</h2>
              <p>
                READY CV <strong>no</strong> utiliza:
              </p>
              <ul>
                <li>Cookies de publicidad o rastreo de terceros.</li>
                <li>Cookies de analítica (p. ej., Google Analytics, Facebook Pixel).</li>
                <li>Cookies de seguimiento de redes sociales.</li>
              </ul>

              <h2>Cómo desactivar las cookies</h2>
              <p>
                Puedes configurar tu navegador para rechazar todas o algunas cookies, o para que te avise cuando los
                sitios web las establezcan o accedan a ellas. Ten en cuenta que desactivar las cookies de sesión te
                impedirá iniciar sesión en READY CV.
              </p>
              <p>Instrucciones para los navegadores más populares:</p>
              <ul>
                <li>
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>

              <h2>Cambios en esta política</h2>
              <p>
                Podemos actualizar esta Política de Cookies periódicamente. Te notificaremos sobre cambios
                significativos mediante un aviso en la plataforma o enviándote un correo electrónico.
              </p>

              <h2>Contacto</h2>
              <p>
                Si tienes preguntas sobre nuestro uso de cookies, contáctanos en{" "}
                <a href="mailto:soporte@readycvv.com">soporte@readycvv.com</a>.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
