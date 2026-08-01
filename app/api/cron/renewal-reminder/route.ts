import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { cronService } from "@/lib/controllers/cron-deps"
import { handleError , apiError } from "@/lib/controllers/shared"
import { recordCronRun } from "@/lib/services/cron/cronRunner"

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return apiError(401, "Unauthorized", { req })
  const auth = req.headers.get("authorization") ?? ""
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const actual = Buffer.from(auth)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return apiError(401, "Unauthorized", { req })
  }

  try {
    const result = await recordCronRun("renewal-reminder", () => cronService.sendRenewalReminders())
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof Error && err.message === "Email not configured") {
      return apiError(503, "Email not configured", { req })
    }
    return handleError(err, { req })
  }
}
