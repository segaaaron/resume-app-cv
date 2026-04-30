export function checkOrigin(req: Request): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return true
  const allowed = process.env.NEXT_PUBLIC_APP_URL ?? "https://readycvv.com"
  try {
    return new URL(origin).origin === new URL(allowed).origin
  } catch {
    return false
  }
}
