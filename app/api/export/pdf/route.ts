import { NextResponse } from "next/server"

// Stub: PDF export is handled by /api/resumes/[id]/pdf
export async function POST() {
  return NextResponse.json({ error: "Use /resume/[id]/pdf for PDF export" }, { status: 501 })
}
