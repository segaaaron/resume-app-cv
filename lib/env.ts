/**
 * Startup environment validation.
 * Import this in lib/db.ts or any server-side entry point.
 * Throws at boot if a required variable is missing — fail fast, not silently.
 */

const REQUIRED_SERVER = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXTAUTH_URL",
] as const

const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_APP_URL",
] as const

export function validateEnv() {
  const missing: string[] = []

  for (const key of REQUIRED_SERVER) {
    if (!process.env[key]) missing.push(key)
  }

  for (const key of REQUIRED_PUBLIC) {
    if (!process.env[key]) missing.push(key)
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables:\n  ${missing.join("\n  ")}\n` +
      `Check your .env file or deployment configuration.`
    )
  }
}
