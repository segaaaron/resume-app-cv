import { auth } from "@/lib/auth"
import { handleError , apiError } from "@/lib/controllers/shared"
import { userService } from "@/lib/controllers/user-deps"
import { AppError } from "@/lib/services/auth/AppError"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError(401, "Unauthorized", { req })
  }

  try {
    const exportData = await userService.exportData(session.user.id)
    const json = JSON.stringify(exportData, null, 2)

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="valhalla-resume-data-export.json"',
      },
    })
  } catch (err) {
    if (err instanceof AppError && err.status === 429) {
      return apiError(429, "Solo puedes exportar tus datos una vez por hora.", { req })
    }
    return handleError(err, { route: "/api/user/data-export" })
  }
}
