import { createHmac } from "crypto"

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? process.env.NEXTAUTH_SECRET ?? ""

export function generateUnsubscribeToken(userId: string): string {
  return createHmac("sha256", SECRET).update(userId).digest("hex")
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(userId)
  // timing-safe compare
  if (expected.length !== token.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  }
  return diff === 0
}
