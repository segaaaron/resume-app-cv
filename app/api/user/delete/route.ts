import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { handleError , apiError } from "@/lib/controllers/shared"
import { userService } from "@/lib/controllers/user-deps"

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError(401, "Unauthorized", { req })
  }
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  try {
    const result = await userService.deleteAccount(session.user.id)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return handleError(err, { req })
  }
}
