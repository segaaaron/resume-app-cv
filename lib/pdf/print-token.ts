import { createHmac, timingSafeEqual } from "crypto"

const TTL_MS = 90_000 // 90s — enough for Puppeteer render

function secret(): Buffer {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error("AUTH_SECRET not set")
  return Buffer.from(s)
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

export function createPrintToken(userId: string, resourceId: string): string {
  const payload = JSON.stringify({ userId, resourceId, exp: Date.now() + TTL_MS })
  const encoded = Buffer.from(payload).toString("base64url")
  const sig = sign(encoded)
  return `${encoded}.${sig}`
}

export function verifyPrintToken(
  token: string,
  resourceId: string,
): { userId: string } | null {
  try {
    const dot = token.lastIndexOf(".")
    if (dot < 0) return null
    const encoded = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expectedSig = sign(encoded)
    // timing-safe compare
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString()) as {
      userId: string
      resourceId: string
      exp: number
    }
    if (data.exp < Date.now()) return null
    if (data.resourceId !== resourceId) return null
    return { userId: data.userId }
  } catch {
    return null
  }
}
