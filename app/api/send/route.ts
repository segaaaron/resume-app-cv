import { createLogger } from "@/lib/logger"

const logger = createLogger("umami-proxy")

/**
 * Recolector de Umami, proxeado con la IP del visitante intacta.
 *
 * POR QUÉ EXISTE: antes esto era un `rewrite` de next.config.ts. Un rewrite es un proxy
 * ciego: la petición que llega a Umami sale de NUESTRO servidor, así que Umami —que
 * ubica al visitante por su IP— veía siempre la misma dirección interna y archivaba a
 * todo el mundo como "(Unknown)". En el panel eso se ve como 98% desconocido y un solo
 * país real: el de quien entró por otro camino.
 *
 * Un Route Handler puede hacer lo que un rewrite no: reenviar el cuerpo tal cual Y
 * declarar de quién era la petición. Se sigue sirviendo desde nuestro dominio, así que
 * la CSP queda en 'self' y los bloqueadores que filtran por hosts `analytics.*` no lo
 * ven — las dos razones por las que el proxy existe.
 *
 * NO se inventa el país acá: sólo se le pasa a Umami el dato que ya tenía Traefik.
 * Si la cabecera no viene, se manda igual sin ella y el evento cuenta como antes.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPSTREAM = process.env.UMAMI_HOST_URL ?? "https://analytics.yasminmedrano.com"

/**
 * Tope del cuerpo de un evento.
 *
 * La ruta es pública y sin sesión: cualquiera puede postearle lo que quiera. Un evento
 * de Umami pesa menos de 1 KB, así que 16 KB deja margen de sobra para el más grande
 * real y corta el buffer de cualquier cosa enviada para hacer daño — y evita que la
 * reenviemos al recolector con nuestra propia firma.
 */
const MAX_BODY_BYTES = 16 * 1024

/** La primera de la lista es el cliente; las siguientes son los saltos intermedios. */
function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  return req.headers.get("x-real-ip")
}

/**
 * 204 y no 413 a propósito: el que manda esto es nuestro propio script de analítica, no
 * una persona, y un error visible sólo ensuciaría la consola del visitante. Descartar en
 * silencio un evento deforme es exactamente el comportamiento correcto.
 */
function oversize(): Response {
  return new Response(null, { status: 204 })
}

export async function POST(req: Request) {
  // Se mira ANTES de leer: el punto del tope es no bufferear el cuerpo enorme.
  const declared = Number.parseInt(req.headers.get("content-length") ?? "", 10)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return oversize()

  const body = await req.text()
  // Y otra vez después, porque content-length puede mentir o no venir.
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) return oversize()

  const ip = clientIp(req)

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
    // Umami lee el user-agent para navegador y sistema operativo: sin esto, el mismo
    // agujero que el de los países pero en la columna de dispositivos.
    "User-Agent": req.headers.get("user-agent") ?? "",
  }
  if (ip) {
    headers["X-Forwarded-For"] = ip
    headers["X-Real-IP"] = ip
  }

  try {
    const res = await fetch(`${UPSTREAM}/api/send`, { method: "POST", headers, body })
    return new Response(await res.text(), {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "text/plain", "Cache-Control": "no-store" },
    })
  } catch (err) {
    // La analítica NUNCA puede romperle la navegación a un usuario: si el recolector no
    // responde, se pierde el evento y nada más.
    logger.warn("umami collect unreachable", { error: err instanceof Error ? err.message : String(err) })
    return new Response(null, { status: 204 })
  }
}
