import { userService } from "@/lib/controllers/user-deps"
import { AppError } from "@/lib/services/auth/AppError"
import { createLogger } from "@/lib/logger"

const logger = createLogger("unsubscribe")

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("uid")
  const token = searchParams.get("t")

  if (!userId || !token) {
    return new Response("Link inválido o expirado.", { status: 400, headers: { "Content-Type": "text/plain" } })
  }

  try {
    await userService.unsubscribeEmail(userId, token)
  } catch (err) {
    if (err instanceof AppError && err.status === 400) {
      return new Response("Link inválido o expirado.", { status: 400, headers: { "Content-Type": "text/plain" } })
    }
    // Log so the failure lands in the admin Service Errors dashboard (this route
    // returns text/plain, so it can't go through handleError's JSON path).
    logger.error("unsubscribe: email unsubscribe failed", { userId, route: "/api/user/unsubscribe" }, err instanceof Error ? err : undefined)
    return new Response("Error interno.", { status: 500, headers: { "Content-Type": "text/plain" } })
  }

  return new Response(
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Cancelar suscripción — Valhalla Resume</title>
  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f6f8;}
  .card{background:#fff;border-radius:16px;padding:48px 40px;max-width:480px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);}
  h1{color:#111827;font-size:22px;margin-bottom:12px;}p{color:#6b7280;line-height:1.6;}
  a{color:#2a72d7;text-decoration:none;font-weight:600;}</style>
</head>
<body>
  <div class="card">
    <h1>Solicitud recibida</h1>
    <p>Hemos recibido tu solicitud para cancelar la suscripción a correos transaccionales de <strong>Valhalla Resume</strong>.</p>
    <p>Si deseas eliminar tu cuenta o exportar tus datos, puedes hacerlo desde <a href="${`${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.valhallaresume.com"}/dashboard/settings`}">Configuración</a>.</p>
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  )
}

export { GET as HEAD }
