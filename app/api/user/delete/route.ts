import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { handleError } from "@/lib/controllers/shared"
import { userService } from "@/lib/controllers/user-deps"

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const result = await userService.deleteAccount(session.user.id)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return handleError(err, { req })
  }
}
