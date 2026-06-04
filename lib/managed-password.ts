import { randomBytes } from "crypto"

const PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+"
const PASSWORD_LENGTH = 16

/**
 * Generates a cryptographically random 16-char password with at least one upper,
 * one lower, one digit and one symbol guaranteed.
 *
 * Lives in `lib/` (not under `app/api/.../route.ts`) so it can be safely imported
 * cross-route without coupling consumers to a Next.js route module.
 */
export function generateManagedPassword(): string {
  const bytes = randomBytes(PASSWORD_LENGTH)
  let password = ""
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    password += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length]
  }
  const categories = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "!@#$%^&*()-_=+",
  ]
  const arr = password.split("")
  for (let i = 0; i < categories.length; i++) {
    const src = categories[i]
    arr[i] = src[randomBytes(1)[0] % src.length]
  }
  return arr.join("")
}
