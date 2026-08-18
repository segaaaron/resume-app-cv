import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * CSV de TODOS los usuarios, para el panel de admin.
 *
 * Existe porque la tabla pasó a paginar en el servidor: antes el botón "Exportar CSV"
 * armaba el archivo con el array completo que el servidor le había mandado, y ese array
 * ya no existe. Sin este endpoint la exportación habría quedado devolviendo sólo la
 * página visible — una regresión silenciosa, que es la peor clase.
 *
 * Se lee por lotes para que una base grande no entre entera en memoria.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BATCH = 500
const HEADERS = ["id", "name", "email", "plan", "subscriptionStatus", "planInterval", "subscriptionEndsAt", "role", "createdAt", "lastActiveAt"] as const

function csvCell(v: unknown): string {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

  const rows: string[] = [HEADERS.join(",")]
  let cursor: string | undefined

  for (;;) {
    const batch = await db.user.findMany({
      where: { deletedAt: null },
      orderBy: { id: "asc" },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true, name: true, email: true, plan: true, subscriptionStatus: true,
        planInterval: true, subscriptionEndsAt: true, role: true, createdAt: true, lastActiveAt: true,
      },
    })
    if (batch.length === 0) break
    for (const u of batch) rows.push(HEADERS.map((h) => csvCell(u[h])).join(","))
    if (batch.length < BATCH) break
    cursor = batch[batch.length - 1].id
  }

  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="usuarios.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
