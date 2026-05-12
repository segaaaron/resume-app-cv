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
    title: locale === "en" ? "DMCA Policy — READY CV" : "Política DMCA — READY CV",
  }
}

export default async function DmcaPage({
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
              <h1>DMCA Policy</h1>
              <p className="text-muted-foreground text-sm">Last updated: April 27, 2026</p>

              <p>
                MS Saravia Tech Stack LLC (&quot;READY CV&quot;, &quot;we&quot;, &quot;us&quot;) respects intellectual property rights and
                complies with the Digital Millennium Copyright Act (DMCA). This policy explains how to submit a
                takedown request or a counter-notice.
              </p>

              <h2>Filing a DMCA Takedown Request</h2>
              <p>
                If you believe that content on READY CV infringes your copyright, please send a written notice to{" "}
                <a href="mailto:copyright@readycvv.com">copyright@readycvv.com</a> that includes <strong>all</strong>{" "}
                of the following:
              </p>
              <ol>
                <li>
                  <strong>Description of the copyrighted work:</strong> Identify the work you claim has been
                  infringed (e.g., a link to the original work or a description of it).
                </li>
                <li>
                  <strong>Location of the infringing content:</strong> Provide the URL(s) or other specific
                  information identifying where the allegedly infringing content appears on our platform.
                </li>
                <li>
                  <strong>Your contact information:</strong> Your full name, mailing address, telephone number, and
                  email address.
                </li>
                <li>
                  <strong>Good faith statement:</strong> A statement that you have a good faith belief that the
                  disputed use is not authorized by the copyright owner, its agent, or the law.
                </li>
                <li>
                  <strong>Accuracy statement:</strong> A statement that the information in the notification is
                  accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright
                  owner.
                </li>
                <li>
                  <strong>Signature:</strong> Your physical or electronic signature.
                </li>
              </ol>
              <p>
                We will review your notice and, if valid, remove or disable access to the allegedly infringing
                content promptly. We will also notify the user who posted the content.
              </p>

              <h2>Counter-Notice Procedure</h2>
              <p>
                If you believe that content you posted was removed by mistake or misidentification, you may submit a
                counter-notice to <a href="mailto:copyright@readycvv.com">copyright@readycvv.com</a> that includes:
              </p>
              <ol>
                <li>Your physical or electronic signature.</li>
                <li>
                  Identification of the material that was removed and its location before it was removed.
                </li>
                <li>
                  A statement under penalty of perjury that you have a good faith belief that the material was
                  removed or disabled as a result of mistake or misidentification.
                </li>
                <li>
                  Your name, address, and telephone number, and a statement that you consent to the jurisdiction of
                  the federal district court for the judicial district in which your address is located (or, if
                  outside the United States, any judicial district in which READY CV may be found).
                </li>
              </ol>
              <p>
                Upon receipt of a valid counter-notice, we will forward it to the original complainant and may
                restore the content after 10–14 business days unless the complainant seeks a court order.
              </p>

              <h2>Repeat Infringers</h2>
              <p>
                READY CV will terminate the accounts of users who are determined to be repeat infringers of
                intellectual property rights.
              </p>

              <h2>Contact</h2>
              <p>
                All DMCA notices and counter-notices must be sent to:{" "}
                <a href="mailto:copyright@readycvv.com">copyright@readycvv.com</a>
              </p>
            </>
          ) : (
            <>
              <h1>Política DMCA</h1>
              <p className="text-muted-foreground text-sm">Última actualización: 27 de abril de 2026</p>

              <p>
                MS Saravia Tech Stack LLC (&quot;READY CV&quot;, &quot;nosotros&quot;) respeta los derechos de propiedad
                intelectual y cumple con la Ley de Derechos de Autor del Milenio Digital (DMCA). Esta política
                explica cómo presentar una solicitud de eliminación o una contranotificación.
              </p>

              <h2>Cómo presentar una solicitud de eliminación DMCA</h2>
              <p>
                Si crees que algún contenido en READY CV infringe tus derechos de autor, envía un aviso escrito a{" "}
                <a href="mailto:copyright@readycvv.com">copyright@readycvv.com</a> que incluya{" "}
                <strong>todos</strong> los siguientes elementos:
              </p>
              <ol>
                <li>
                  <strong>Descripción de la obra protegida:</strong> Identifica la obra que reclamas ha sido
                  infringida (por ejemplo, un enlace a la obra original o una descripción de la misma).
                </li>
                <li>
                  <strong>Ubicación del contenido infractor:</strong> Proporciona la(s) URL(s) u otra información
                  específica que identifique dónde aparece el contenido presuntamente infractor en nuestra
                  plataforma.
                </li>
                <li>
                  <strong>Tu información de contacto:</strong> Nombre completo, dirección postal, número de
                  teléfono y correo electrónico.
                </li>
                <li>
                  <strong>Declaración de buena fe:</strong> Una declaración de que tienes razones fundadas para
                  creer que el uso disputado no está autorizado por el titular de los derechos de autor, su agente
                  o la ley.
                </li>
                <li>
                  <strong>Declaración de exactitud:</strong> Una declaración de que la información en la
                  notificación es exacta y, bajo pena de perjurio, que estás autorizado para actuar en nombre del
                  titular de los derechos de autor.
                </li>
                <li>
                  <strong>Firma:</strong> Tu firma física o electrónica.
                </li>
              </ol>
              <p>
                Revisaremos tu aviso y, si es válido, eliminaremos o deshabilitaremos el acceso al contenido
                presuntamente infractor con prontitud. También notificaremos al usuario que publicó el contenido.
              </p>

              <h2>Procedimiento de contranotificación</h2>
              <p>
                Si crees que el contenido que publicaste fue eliminado por error o identificación incorrecta, puedes
                enviar una contranotificación a{" "}
                <a href="mailto:copyright@readycvv.com">copyright@readycvv.com</a> que incluya:
              </p>
              <ol>
                <li>Tu firma física o electrónica.</li>
                <li>
                  Identificación del material que fue eliminado y su ubicación antes de ser eliminado.
                </li>
                <li>
                  Una declaración bajo pena de perjurio de que tienes razones fundadas para creer que el material
                  fue eliminado o deshabilitado como resultado de un error o identificación incorrecta.
                </li>
                <li>
                  Tu nombre, dirección y número de teléfono, y una declaración de que consientes la jurisdicción
                  del tribunal federal correspondiente.
                </li>
              </ol>
              <p>
                Tras recibir una contranotificación válida, la reenviaremos al demandante original y podremos
                restaurar el contenido después de 10 a 14 días hábiles, salvo que el demandante solicite una orden
                judicial.
              </p>

              <h2>Infractores reincidentes</h2>
              <p>
                READY CV cancelará las cuentas de los usuarios que sean considerados infractores reincidentes de
                derechos de propiedad intelectual.
              </p>

              <h2>Contacto</h2>
              <p>
                Todos los avisos y contranotificaciones DMCA deben enviarse a:{" "}
                <a href="mailto:copyright@readycvv.com">copyright@readycvv.com</a>
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
