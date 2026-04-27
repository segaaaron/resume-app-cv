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

  const isEn = locale === "en"

  const sections = isEn
    ? [
        {
          num: 1,
          title: "Data Controller",
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed">
                READY CV is operated by <strong className="text-foreground">MS Saravia Tech Stack LLC</strong>. We are responsible for processing the personal data collected through this platform. Contact us at{" "}
                <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a>.
              </p>
            </>
          ),
        },
        {
          num: 2,
          title: "Data We Collect",
          content: (
            <ul className="space-y-2">
              {[
                ["Account data", "name, email address and password (stored encrypted)."],
                ["CV profile data", "all information you enter in your documents (experience, education, skills, photo, etc.)."],
                ["Payment data", "processed exclusively by Stripe; READY CV does not store credit card data."],
                ["Usage data", "activity and error logs to improve the service."],
              ].map(([bold, rest]) => (
                <li key={bold} className="flex items-start gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">{bold}:</strong> {rest}</span>
                </li>
              ))}
            </ul>
          ),
        },
        {
          num: 3,
          title: "Purpose of Processing",
          content: (
            <ul className="space-y-2">
              {[
                "Provide and improve the READY CV service.",
                "Manage your account and subscription.",
                "Send you transactional communications (confirmations, account alerts).",
                "Comply with legal obligations.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          ),
        },
        {
          num: 4,
          title: "Legal Basis",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              Processing is based on the execution of the service contract you accept when registering, as well as our legitimate interest in improving the platform.
            </p>
          ),
        },
        {
          num: 5,
          title: "Data Sharing & AI Providers",
          highlight: "amber" as const,
          content: (
            <div className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your data to third parties. We may share it with service providers necessary to operate the platform (Stripe for payments, hosting services), who are obligated to protect it.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                When you use AI-powered features, the relevant text from your resume or document is sent to third-party AI providers (such as OpenAI or Anthropic) via their secure APIs.{" "}
                <strong className="text-foreground">No Training:</strong> Our integrations are configured so that the data you send is{" "}
                <strong className="text-foreground">not used to train future AI models</strong> by these providers. Your data is used solely to process your current request.
              </p>
            </div>
          ),
        },
        {
          num: 6,
          title: "Data Retention",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              We retain your data while your account is active. Upon account deletion, we will erase your data within <strong className="text-foreground">30 days</strong>, unless legally required to retain it longer.
            </p>
          ),
        },
        {
          num: 7,
          title: "Your Rights (GDPR)",
          content: (
            <div className="space-y-3">
              <p className="text-muted-foreground">You have the following rights over your personal data:</p>
              <ul className="space-y-2">
                {[
                  ["Access", "Request a copy of your data at any time."],
                  ["Rectification", "Correct inaccurate or incomplete data."],
                  ["Erasure", "Delete your account and all associated data."],
                  ["Portability", "Export your data in machine-readable format."],
                  ["Objection", "Object to certain types of processing."],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex items-start gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-muted-foreground"><strong className="text-foreground">{bold}:</strong> {rest}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-sm">
                To exercise these rights, write to us at{" "}
                <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a>.
              </p>
            </div>
          ),
        },
        {
          num: 8,
          title: "Security",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your data, including encryption in transit (HTTPS) and at rest. However,{" "}
              <strong className="text-foreground">no transmission over the Internet is 100% secure</strong>. By using the Service, you acknowledge that you provide your information at your own risk.
            </p>
          ),
        },
        {
          num: 9,
          title: "Cookies",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              We use <strong className="text-foreground">essential cookies only</strong> for session functionality (NextAuth) and payment processing (Stripe). We do not use third-party tracking cookies for advertising purposes. See our{" "}
              <a href="/cookie-policy" className="text-primary underline underline-offset-4">Cookie Policy</a> for details.
            </p>
          ),
        },
        {
          num: 10,
          title: "Changes to this Policy",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy periodically. We will notify you of relevant changes by email or through a notice on the platform at least <strong className="text-foreground">14 days</strong> before changes take effect.
            </p>
          ),
        },
      ]
    : [
        {
          num: 1,
          title: "Responsable del Tratamiento",
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed">
                READY CV es operado por <strong className="text-foreground">MS Saravia Tech Stack LLC</strong>. Somos responsables del tratamiento de los datos personales que recopilamos a través de esta plataforma. Contáctanos en{" "}
                <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a>.
              </p>
            </>
          ),
        },
        {
          num: 2,
          title: "Datos que Recopilamos",
          content: (
            <ul className="space-y-2">
              {[
                ["Datos de cuenta", "nombre, correo electrónico y contraseña (almacenada de forma cifrada)."],
                ["Datos de perfil de CV", "toda la información que introduces en tus documentos (experiencia, educación, habilidades, foto, etc.)."],
                ["Datos de pago", "procesados exclusivamente por Stripe; READY CV no almacena datos de tarjetas de crédito."],
                ["Datos de uso", "registros de actividad y errores para mejorar el servicio."],
              ].map(([bold, rest]) => (
                <li key={bold} className="flex items-start gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">{bold}:</strong> {rest}</span>
                </li>
              ))}
            </ul>
          ),
        },
        {
          num: 3,
          title: "Finalidad del Tratamiento",
          content: (
            <ul className="space-y-2">
              {[
                "Prestar y mejorar el servicio de READY CV.",
                "Gestionar tu cuenta y suscripción.",
                "Enviarte comunicaciones transaccionales (confirmaciones, alertas de cuenta).",
                "Cumplir con obligaciones legales.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          ),
        },
        {
          num: 4,
          title: "Base Legal",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              El tratamiento se basa en la ejecución del contrato de servicio que aceptas al registrarte, así como en nuestro interés legítimo para mejorar la plataforma.
            </p>
          ),
        },
        {
          num: 5,
          title: "Compartición de Datos y Proveedores de IA",
          highlight: "amber" as const,
          content: (
            <div className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">
                No vendemos tus datos a terceros. Podemos compartirlos con proveedores de servicios necesarios para operar la plataforma (Stripe para pagos, servicios de hosting), quienes están obligados a protegerlos.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Cuando utilizas funcionalidades de inteligencia artificial, el texto relevante de tu CV o documento se envía a proveedores de IA de terceros (como OpenAI o Anthropic) a través de sus APIs seguras.{" "}
                <strong className="text-foreground">Sin Entrenamiento:</strong> Nuestras integraciones están configuradas para que los datos que envíes{" "}
                <strong className="text-foreground">no se utilicen para entrenar futuros modelos de IA</strong> de dichos proveedores. Tus datos se usan únicamente para procesar tu solicitud actual.
              </p>
            </div>
          ),
        },
        {
          num: 6,
          title: "Conservación de Datos",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, borraremos tus datos en un plazo de <strong className="text-foreground">30 días</strong>, salvo obligación legal de conservarlos por más tiempo.
            </p>
          ),
        },
        {
          num: 7,
          title: "Tus Derechos (GDPR)",
          content: (
            <div className="space-y-3">
              <p className="text-muted-foreground">Tienes los siguientes derechos sobre tus datos personales:</p>
              <ul className="space-y-2">
                {[
                  ["Acceso", "Solicitar una copia de tus datos en cualquier momento."],
                  ["Rectificación", "Corregir datos incorrectos o incompletos."],
                  ["Supresión", "Eliminar tu cuenta y todos los datos asociados."],
                  ["Portabilidad", "Exportar tus datos en formato legible por máquina."],
                  ["Oposición", "Oponerte a ciertos tipos de tratamiento."],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex items-start gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-muted-foreground"><strong className="text-foreground">{bold}:</strong> {rest}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-sm">
                Para ejercer estos derechos, escríbenos a{" "}
                <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a>.
              </p>
            </div>
          ),
        },
        {
          num: 8,
          title: "Seguridad",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas técnicas y organizativas adecuadas para proteger tus datos, incluyendo cifrado en tránsito (HTTPS) y en reposo. Sin embargo,{" "}
              <strong className="text-foreground">ninguna transmisión por Internet es 100% segura</strong>. Al utilizar el Servicio, aceptas que proporcionas tu información bajo tu propio riesgo.
            </p>
          ),
        },
        {
          num: 9,
          title: "Cookies",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos <strong className="text-foreground">únicamente cookies esenciales</strong> para el funcionamiento de la sesión (NextAuth) y el procesamiento de pagos (Stripe). No utilizamos cookies de seguimiento de terceros con fines publicitarios. Consulta nuestra{" "}
              <a href="/cookie-policy" className="text-primary underline underline-offset-4">Política de Cookies</a> para más detalles.
            </p>
          ),
        },
        {
          num: 10,
          title: "Cambios en esta Política",
          content: (
            <p className="text-muted-foreground leading-relaxed">
              Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios relevantes por correo electrónico o mediante aviso en la plataforma con al menos <strong className="text-foreground">14 días</strong> de anticipación.
            </p>
          ),
        },
      ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Hero */}
          <div className="text-center space-y-3 pb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              {isEn ? "Legal" : "Legal"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {isEn ? "Privacy Policy" : "Política de Privacidad"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEn
                ? "Last updated: April 27, 2026 · MS Saravia Tech Stack LLC"
                : "Última actualización: 27 de abril de 2026 · MS Saravia Tech Stack LLC"}
            </p>
          </div>

          {/* Intro */}
          <section className="rounded-xl border bg-card p-6">
            <p className="text-muted-foreground leading-relaxed">
              {isEn
                ? "At READY CV, we take your privacy seriously. This policy explains what data we collect, how we use it, and the rights you have over your personal information."
                : "En READY CV nos tomamos tu privacidad en serio. Esta política explica qué datos recopilamos, cómo los usamos y los derechos que tienes sobre tu información personal."}
            </p>
          </section>

          {/* Sections */}
          {sections.map(({ num, title, content, highlight }) => (
            <section
              key={num}
              className={`rounded-xl border bg-card p-6 space-y-3 ${
                highlight === "amber"
                  ? "border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {num}
                </span>
                <h2 className="text-base font-semibold">{title}</h2>
              </div>
              <div>{content}</div>
            </section>
          ))}

          {/* Contact card */}
          <section className="rounded-xl border bg-primary/5 border-primary/20 p-6 space-y-2">
            <h2 className="font-semibold text-base">
              {isEn ? "Questions?" : "¿Preguntas?"}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {isEn
                ? "Contact our privacy team at "
                : "Contacta a nuestro equipo de privacidad en "}
              <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">
                soporte@readycvv.com
              </a>
              {isEn ? "." : "."}
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
