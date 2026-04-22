import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidad — READY CV",
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1>Política de Privacidad</h1>
          <p className="text-muted-foreground text-sm">Última actualización: abril 2026</p>

          <h2>1. Responsable del Tratamiento</h2>
          <p>
            READY CV es responsable del tratamiento de los datos personales que recopila a través de su plataforma.
            Puedes contactarnos en <a href="mailto:soporte@readycv.app">soporte@readycv.app</a>.
          </p>

          <h2>2. Datos que Recopilamos</h2>
          <ul>
            <li>
              <strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña (almacenada de forma
              cifrada).
            </li>
            <li>
              <strong>Datos de perfil de CV:</strong> toda la información que introduces en tus documentos
              (experiencia, educación, habilidades, foto, etc.).
            </li>
            <li>
              <strong>Datos de pago:</strong> procesados exclusivamente por Stripe; READY CV no almacena datos de
              tarjetas de crédito.
            </li>
            <li>
              <strong>Datos de uso:</strong> registros de actividad y errores para mejorar el servicio.
            </li>
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
          <p>
            El tratamiento se basa en la ejecución del contrato de servicio que aceptas al registrarte, así como
            en nuestro interés legítimo para mejorar la plataforma.
          </p>

          <h2>5. Compartición de Datos</h2>
          <p>
            No vendemos tus datos a terceros. Podemos compartirlos con proveedores de servicios necesarios para
            operar la plataforma (Stripe para pagos, servicios de hosting), quienes están obligados a protegerlos.
          </p>

          <h2>6. Conservación de Datos</h2>
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, borraremos tus datos en
            un plazo de 30 días, salvo obligación legal de conservarlos.
          </p>

          <h2>7. Tus Derechos</h2>
          <p>Tienes derecho a acceder, rectificar, suprimir, portar y oponerte al tratamiento de tus datos.
          Para ejercer estos derechos, escríbenos a <a href="mailto:soporte@readycv.app">soporte@readycv.app</a>.</p>

          <h2>8. Seguridad</h2>
          <p>
            Implementamos medidas técnicas y organizativas adecuadas para proteger tus datos, incluyendo cifrado
            en tránsito (HTTPS) y en reposo.
          </p>

          <h2>9. Cookies</h2>
          <p>
            Utilizamos cookies esenciales para el funcionamiento de la sesión. No utilizamos cookies de
            seguimiento de terceros con fines publicitarios.
          </p>

          <h2>10. Cambios en esta Política</h2>
          <p>
            Podemos actualizar esta política. Te notificaremos sobre cambios relevantes por correo electrónico o
            mediante aviso en la plataforma.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
