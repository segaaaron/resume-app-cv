import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos de Servicio — READY CV",
}

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1>Términos de Servicio</h1>
          <p className="text-muted-foreground text-sm">Última actualización: abril 2026</p>

          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar READY CV, aceptas quedar vinculado por estos Términos de Servicio. Si no estás de
            acuerdo con alguno de los términos, no debes utilizar el servicio.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            READY CV es una plataforma en línea que permite a los usuarios crear, editar y descargar currículums
            vitae y cartas de presentación. El servicio se ofrece bajo modalidad de suscripción.
          </p>

          <h2>3. Cuentas de Usuario</h2>
          <p>
            Para utilizar las funcionalidades del servicio, debes crear una cuenta con información veraz y
            actualizada. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las
            actividades que ocurran bajo tu cuenta.
          </p>

          <h2>4. Planes y Pagos</h2>
          <p>
            READY CV ofrece planes gratuitos y de pago. Los pagos se procesan de forma segura a través de Stripe.
            Los planes de pago se renuevan automáticamente a menos que canceles antes de la fecha de renovación.
            No se realizan reembolsos salvo en los casos exigidos por la ley aplicable.
          </p>

          <h2>5. Uso Aceptable</h2>
          <p>Aceptas no utilizar el servicio para:</p>
          <ul>
            <li>Actividades ilegales o fraudulentas.</li>
            <li>Enviar spam o contenido malicioso.</li>
            <li>Intentar vulnerar la seguridad de la plataforma.</li>
            <li>Revender o redistribuir el servicio sin autorización expresa.</li>
          </ul>

          <h2>6. Propiedad Intelectual</h2>
          <p>
            Todo el contenido, diseños y código de READY CV son propiedad de sus respectivos titulares. Los
            documentos que crees pertenecen a ti; READY CV no reclama derechos sobre tu contenido.
          </p>

          <h2>7. Limitación de Responsabilidad</h2>
          <p>
            READY CV se proporciona &quot;tal cual&quot;. No garantizamos que el servicio sea ininterrumpido o libre de
            errores. En ningún caso seremos responsables de daños indirectos, incidentales o consecuentes.
          </p>

          <h2>8. Modificaciones</h2>
          <p>
            Podemos actualizar estos Términos en cualquier momento. Te notificaremos sobre cambios significativos
            por correo electrónico o mediante un aviso en la plataforma.
          </p>

          <h2>9. Contacto</h2>
          <p>
            Si tienes preguntas sobre estos Términos, puedes contactarnos en{" "}
            <a href="mailto:soporte@readycv.app">soporte@readycv.app</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
