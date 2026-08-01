import { NextResponse } from "next/server"
import { requireAuth, handleError , apiError } from "@/lib/controllers/shared"
import { userService } from "@/lib/controllers/user-deps"

export async function PATCH(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError(400, "Invalid JSON", { req })
  }

  try {
    const result = await userService.updateProfile(authResult.userId, body as { name: string })
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
