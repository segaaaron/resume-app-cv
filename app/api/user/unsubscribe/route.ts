import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  if (!email) {
    return new Response("Missing email parameter.", { status: 400, headers: { "Content-Type": "text/plain" } })
  }

  await db.user.updateMany({
    where: { email },
    data: { emailOptOut: true },
  })

  return new Response(
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Cancelar suscripción — READY CV</title>
  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f6f8;}
  .card{background:#fff;border-radius:16px;padding:48px 40px;max-width:480px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);}
  h1{color:#111827;font-size:22px;margin-bottom:12px;}p{color:#6b7280;line-height:1.6;}
  a{color:#2a72d7;text-decoration:none;font-weight:600;}</style>
</head>
<body>
  <div class="card">
    <h1>Solicitud recibida</h1>
    <p>Hemos recibido tu solicitud para cancelar la suscripción a correos transaccionales de <strong>READY CV</strong>.</p>
    <p>Si deseas eliminar tu cuenta o exportar tus datos, puedes hacerlo desde <a href="https://www.readycvv.com/dashboard/settings">Configuración</a>.</p>
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
