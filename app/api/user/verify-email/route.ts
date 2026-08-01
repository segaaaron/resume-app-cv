import { NextResponse } from "next/server"
import { handleError , apiError } from "@/lib/controllers/shared"
import { userService } from "@/lib/controllers/user-deps"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token || typeof token !== "string") {
    return apiError(400, "invalid_token", { req })
  }

  try {
    const result = await userService.verifyEmail(token)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
