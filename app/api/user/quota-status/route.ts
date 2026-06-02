// app/api/user/quota-status/route.ts
//
// Returns the freemium / PRO quota snapshot for the current user.
// Used by editor + dashboard to render counters, badges and AI button disabled states.

import { NextResponse } from "next/server"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { getQuotaStatusPayload } from "@/lib/free-quota-status"

export async function GET(req: Request) {
  const authResult = await requireUser(req, {})
  if (authResult instanceof NextResponse) return authResult

  try {
    const payload = await getQuotaStatusPayload(authResult.userId, authResult.user.plan)
    // Short private cache: quota changes on every AI/resume/cover-letter action; staleness
    // capped to avoid UI flicker but kept low to reflect server enforcement promptly.
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" },
    })
  } catch (err) {
    return handleError(err)
  }
}
