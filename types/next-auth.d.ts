import { DefaultSession, DefaultJWT } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      plan?: string
      subscriptionStatus?: string
      subscriptionEndsAt?: string | null
      role?: string
      emailVerified?: string | null
      sessionVersion?: number
      activeSessionToken?: string | null
      termsAcceptedAt?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    plan?: string
    subscriptionStatus?: string
    subscriptionEndsAt?: string | null
    role?: string
    emailVerified?: string | null
    sessionVersion?: number
    activeSessionToken?: string | null
    termsAcceptedAt?: string | null
  }
}
