import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.terms" })
  return { title: t("title") }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("terms_page")

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1>{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("last_updated")}</p>

          {locale === "en" ? (
            <>
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing and using READY CV, you agree to be bound by these Terms of Service. If you disagree with any of the terms, you should not use the service.</p>

              <h2>2. Description of Service</h2>
              <p>READY CV is an online platform that allows users to create, edit and download resumes and cover letters. The service is offered on a subscription basis.</p>

              <h2>3. User Accounts</h2>
              <p>To use the service features, you must create an account with truthful and up-to-date information. You are responsible for maintaining the confidentiality of your password and all activities that occur under your account.</p>

              <h2>4. Plans and Payments</h2>
              <p>READY CV offers free and paid plans. Payments are processed securely through Stripe. Paid plans renew automatically unless you cancel before the renewal date. No refunds are made except as required by applicable law.</p>

              <h2>5. Acceptable Use</h2>
              <p>You agree not to use the service for:</p>
              <ul>
                <li>Illegal or fraudulent activities.</li>
                <li>Sending spam or malicious content.</li>
                <li>Attempting to breach platform security.</li>
                <li>Reselling or redistributing the service without express authorization.</li>
              </ul>

              <h2>6. Intellectual Property</h2>
              <p>All content, designs and code of READY CV are the property of their respective owners. The documents you create belong to you; READY CV makes no claim over your content.</p>

              <h2>7. Limitation of Liability</h2>
              <p>READY CV is provided &quot;as is&quot;. We do not guarantee that the service will be uninterrupted or error-free. In no event shall we be liable for indirect, incidental or consequential damages.</p>

              <h2>8. Modifications</h2>
              <p>We may update these Terms at any time. We will notify you of significant changes by email or through a notice on the platform.</p>

              <h2>9. Contact</h2>
              <p>If you have questions about these Terms, you can contact us at <a href="mailto:soporte@readycv.app">soporte@readycv.app</a>.</p>
            </>
          ) : (
            <>
              <h2>1. Aceptación de los Términos</h2>
              <p>Al acceder y utilizar READY CV, aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguno de los términos, no debes utilizar el servicio.</p>

              <h2>2. Descripción del Servicio</h2>
              <p>READY CV es una plataforma en línea que permite a los usuarios crear, editar y descargar currículums vitae y cartas de presentación. El servicio se ofrece bajo modalidad de suscripción.</p>

              <h2>3. Cuentas de Usuario</h2>
              <p>Para utilizar las funcionalidades del servicio, debes crear una cuenta con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.</p>

              <h2>4. Planes y Pagos</h2>
              <p>READY CV ofrece planes gratuitos y de pago. Los pagos se procesan de forma segura a través de Stripe. Los planes de pago se renuevan automáticamente a menos que canceles antes de la fecha de renovación. No se realizan reembolsos salvo en los casos exigidos por la ley aplicable.</p>

              <h2>5. Uso Aceptable</h2>
              <p>Aceptas no utilizar el servicio para:</p>
              <ul>
                <li>Actividades ilegales o fraudulentas.</li>
                <li>Enviar spam o contenido malicioso.</li>
                <li>Intentar vulnerar la seguridad de la plataforma.</li>
                <li>Revender o redistribuir el servicio sin autorización expresa.</li>
              </ul>

              <h2>6. Propiedad Intelectual</h2>
              <p>Todo el contenido, diseños y código de READY CV son propiedad de sus respectivos titulares. Los documentos que crees pertenecen a ti; READY CV no reclama derechos sobre tu contenido.</p>

              <h2>7. Limitación de Responsabilidad</h2>
              <p>READY CV se proporciona &quot;tal cual&quot;. No garantizamos que el servicio sea ininterrumpido o libre de errores. En ningún caso seremos responsables de daños indirectos, incidentales o consecuentes.</p>

              <h2>8. Modificaciones</h2>
              <p>Podemos actualizar estos Términos en cualquier momento. Te notificaremos sobre cambios significativos por correo electrónico o mediante un aviso en la plataforma.</p>

              <h2>9. Contacto</h2>
              <p>Si tienes preguntas sobre estos Términos, puedes contactarnos en <a href="mailto:soporte@readycv.app">soporte@readycv.app</a>.</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
