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
  const t = await getTranslations({ locale, namespace: "metadata.privacy" })
  return { title: t("title") }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("privacy_page")

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1>{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("last_updated")}</p>

          {locale === "en" ? (
            <>
              <h2>1. Data Controller</h2>
              <p>
                READY CV is responsible for processing the personal data it collects through its platform.
                You can contact us at <a href="mailto:soporte@readycv.app">soporte@readycv.app</a>.
              </p>

              <h2>2. Data We Collect</h2>
              <ul>
                <li><strong>Account data:</strong> name, email address and password (stored encrypted).</li>
                <li><strong>CV profile data:</strong> all information you enter in your documents (experience, education, skills, photo, etc.).</li>
                <li><strong>Payment data:</strong> processed exclusively by Stripe; READY CV does not store credit card data.</li>
                <li><strong>Usage data:</strong> activity and error logs to improve the service.</li>
              </ul>

              <h2>3. Purpose of Processing</h2>
              <p>We use your data to:</p>
              <ul>
                <li>Provide and improve the READY CV service.</li>
                <li>Manage your account and subscription.</li>
                <li>Send you transactional communications (confirmations, account alerts).</li>
                <li>Comply with legal obligations.</li>
              </ul>

              <h2>4. Legal Basis</h2>
              <p>Processing is based on the execution of the service contract you accept when registering, as well as our legitimate interest in improving the platform.</p>

              <h2>5. Data Sharing</h2>
              <p>We do not sell your data to third parties. We may share it with service providers necessary to operate the platform (Stripe for payments, hosting services), who are obligated to protect it.</p>

              <h2>6. Data Retention</h2>
              <p>We retain your data while your account is active. Upon account deletion, we will erase your data within 30 days, unless legally required to retain it.</p>

              <h2>7. Your Rights</h2>
              <p>You have the right to access, rectify, erase, port and object to the processing of your data. To exercise these rights, write to us at <a href="mailto:soporte@readycv.app">soporte@readycv.app</a>.</p>

              <h2>8. Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your data, including encryption in transit (HTTPS) and at rest.</p>

              <h2>9. Cookies</h2>
              <p>We use essential cookies for session functionality. We do not use third-party tracking cookies for advertising purposes.</p>

              <h2>10. Changes to this Policy</h2>
              <p>We may update this policy. We will notify you of relevant changes by email or through a notice on the platform.</p>
            </>
          ) : (
            <>
              <h2>1. Responsable del Tratamiento</h2>
              <p>
                READY CV es responsable del tratamiento de los datos personales que recopila a través de su plataforma.
                Puedes contactarnos en <a href="mailto:soporte@readycv.app">soporte@readycv.app</a>.
              </p>

              <h2>2. Datos que Recopilamos</h2>
              <ul>
                <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña (almacenada de forma cifrada).</li>
                <li><strong>Datos de perfil de CV:</strong> toda la información que introduces en tus documentos (experiencia, educación, habilidades, foto, etc.).</li>
                <li><strong>Datos de pago:</strong> procesados exclusivamente por Stripe; READY CV no almacena datos de tarjetas de crédito.</li>
                <li><strong>Datos de uso:</strong> registros de actividad y errores para mejorar el servicio.</li>
              </ul>

              <h2>3. Finalidad del Tratamiento</h2>
              <p>Utilizamos tus datos para:</p>
              <ul>
                <li>Prestar y mejorar el servicio de READY CV.</li>
                <li>Gestionar tu cuenta y suscripción.</li>
                <li>Enviarte comunicaciones transaccionales (confirmaciones, alertas de cuenta).</li>
                <li>Cumplir con obligaciones legales.</li>
              </ul>

              <h2>4. Base Legal</h2>
              <p>El tratamiento se basa en la ejecución del contrato de servicio que aceptas al registrarte, así como en nuestro interés legítimo para mejorar la plataforma.</p>

              <h2>5. Compartición de Datos</h2>
              <p>No vendemos tus datos a terceros. Podemos compartirlos con proveedores de servicios necesarios para operar la plataforma (Stripe para pagos, servicios de hosting), quienes están obligados a protegerlos.</p>

              <h2>6. Conservación de Datos</h2>
              <p>Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, borraremos tus datos en un plazo de 30 días, salvo obligación legal de conservarlos.</p>

              <h2>7. Tus Derechos</h2>
              <p>Tienes derecho a acceder, rectificar, suprimir, portar y oponerte al tratamiento de tus datos. Para ejercer estos derechos, escríbenos a <a href="mailto:soporte@readycv.app">soporte@readycv.app</a>.</p>

              <h2>8. Seguridad</h2>
              <p>Implementamos medidas técnicas y organizativas adecuadas para proteger tus datos, incluyendo cifrado en tránsito (HTTPS) y en reposo.</p>

              <h2>9. Cookies</h2>
              <p>Utilizamos cookies esenciales para el funcionamiento de la sesión. No utilizamos cookies de seguimiento de terceros con fines publicitarios.</p>

              <h2>10. Cambios en esta Política</h2>
              <p>Podemos actualizar esta política. Te notificaremos sobre cambios relevantes por correo electrónico o mediante aviso en la plataforma.</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
