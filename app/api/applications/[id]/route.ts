import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { handleError , apiError } from "@/lib/controllers/shared"
import { applicationService } from "@/lib/controllers/application-deps"
import { applicationPatchSchema } from "@/lib/services/application/ApplicationService"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError(400, "Invalid JSON", { req })
    }

    const parsed = applicationPatchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(422, "Invalid data", { req })
    }

    const { id } = await params
    await applicationService.update(session.user.id, id, parsed.data)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, { req })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  try {
    const { id } = await params
    await applicationService.delete(session.user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, { req })
  }
}
