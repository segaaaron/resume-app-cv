export function checkOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer")
  if (!origin) return false
  const allowed = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.valhallaresume.com"
  try {
    return new URL(origin).origin === new URL(allowed).origin
  } catch {
    return false
  }
}
