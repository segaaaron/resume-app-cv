import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { cronService } from "@/lib/controllers/cron-deps"
import { handleError } from "@/lib/controllers/shared"

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const auth = req.headers.get("authorization") ?? ""
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const actual = Buffer.from(auth)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await cronService.purgeStripeEvents()
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
