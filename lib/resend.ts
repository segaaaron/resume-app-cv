import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  console.warn("[resend] RESEND_API_KEY not set — emails disabled")
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export function emailEnabled(): boolean {
  return !!resend
}
