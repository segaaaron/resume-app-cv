import { NextResponse } from "next/server"
import { checkOrigin } from "@/lib/csrf"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { clearErrors } from "@/lib/services/error/errorLog"

/**
 * Wipe every captured error (SUPER_ADMIN only). Lets the admin clear a board of
 * already-reviewed failures so the panel shows the CURRENT state, not a growing
 * history. New errors keep being captured normally afterwards.
 */
export async function POST(req: Request) {
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

  const cleared = await clearErrors()
  return NextResponse.json({ ok: true, cleared })
}
