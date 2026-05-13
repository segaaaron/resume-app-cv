import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { handleError } from "@/lib/controllers/shared"
import { userService } from "@/lib/controllers/user-deps"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const result = await userService.updateProfile(session.user.id, body as { name: string })
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
