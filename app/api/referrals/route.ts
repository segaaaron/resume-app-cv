import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { handleError } from "@/lib/controllers/shared"
import { referralService } from "@/lib/controllers/referral-deps"

// GET /api/referrals — get current user's referral code, stats, cycle count and reward tier
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await referralService.getStatus(session.user.id)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
