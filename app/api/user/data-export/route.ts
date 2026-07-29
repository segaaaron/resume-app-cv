import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { handleError } from "@/lib/controllers/shared"
import { userService } from "@/lib/controllers/user-deps"
import { AppError } from "@/lib/services/auth/AppError"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const exportData = await userService.exportData(session.user.id)
    const json = JSON.stringify(exportData, null, 2)

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="readycv-data-export.json"',
      },
    })
  } catch (err) {
    if (err instanceof AppError && err.status === 429) {
      return NextResponse.json({ error: "Solo puedes exportar tus datos una vez por hora." }, { status: 429 })
    }
    return handleError(err, { route: "/api/user/data-export" })
  }
}
