import NextAuth, { CredentialsSignin } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

class UserNotFoundError extends CredentialsSignin {
  code = "user_not_found" as const
}
class InvalidPasswordError extends CredentialsSignin {
  code = "invalid_password" as const
}
class ActiveSessionError extends CredentialsSignin {
  code = "active_session" as const
}
class SessionChallengeBlockedError extends CredentialsSignin {
  code = "session_challenge_blocked" as const
}

// Pre-computed dummy hash — ensures bcrypt runs even when user doesn't exist,
// equalizing response time and preventing user enumeration via timing.
const DUMMY_HASH = "$2b$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface UserPlanCacheEntry {
  plan:                string
  subscriptionStatus:  string
  subscriptionEndsAt:  Date | null
  role:                string
  emailVerified:       Date | null
  sessionVersion:      number
  activeSessionToken:  string | null
  expiresAt:           number
}

const userPlanCache = new Map<string, UserPlanCacheEntry>()

export function purgeUserCache(userId: string) {
  userPlanCache.delete(userId)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          await bcrypt.compare(credentials.password as string, DUMMY_HASH)
          throw new UserNotFoundError()
        }
        if (user.deletedAt !== null) return null

        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) throw new InvalidPasswordError()

        // Block if account is challenge-blocked
        if (user.sessionChallengeBlockedUntil && user.sessionChallengeBlockedUntil > new Date()) {
          throw new SessionChallengeBlockedError()
        }

        // Block if another session is active — unless it's stale (last activity > inactivity limit)
        if (user.activeSessionToken) {
          const isStale = !user.lastActiveAt ||
            Date.now() - user.lastActiveAt.getTime() > INACTIVITY_LIMIT_MS
          if (!isStale) throw new ActiveSessionError()
          // Stale session: JWT already dead server-side — clear token and proceed
          await db.user.update({ where: { id: user.id }, data: { activeSessionToken: null } })
        }

        // Generate and persist new active session token
        const activeSessionToken = crypto.randomUUID()
        await db.user.update({
          where: { id: user.id },
          data: { activeSessionToken, sessionChallengeAttempts: 0, sessionChallengeBlockedUntil: null },
        })

        return { id: user.id, email: user.email, name: user.name, image: user.image, activeSessionToken }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const isFreshLogin = !!user  // user arg only present on sign-in, not token refreshes

      if (user) {
        token.id = user.id
        token.activeSessionToken = (user as { activeSessionToken?: string }).activeSessionToken ?? null
        if (user.id) userPlanCache.delete(user.id)
      }
      if (trigger === "update") {
        const uid = token.id as string | undefined
        if (uid) userPlanCache.delete(uid)
      }

      const userId = (token.id ?? user?.id) as string | undefined
      if (!userId) return token

      const now = Date.now()
      const cached = userPlanCache.get(userId)

      if (cached && cached.expiresAt > now) {
        // Concurrent session guard on cache hit
        if (token.activeSessionToken && cached.activeSessionToken !== token.activeSessionToken) {
          return null
        }
        token.plan               = cached.plan
        token.subscriptionStatus = cached.subscriptionStatus
        token.subscriptionEndsAt = cached.subscriptionEndsAt?.toISOString() ?? null
        token.role               = cached.role
        token.emailVerified      = cached.emailVerified?.toISOString() ?? null
        return token
      }

      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          plan:               true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          role:               true,
          deletedAt:          true,
          emailVerified:      true,
          sessionVersion:     true,
          forceLogoutAt:      true,
          lastActiveAt:       true,
          activeSessionToken:  true,
        },
      })

      if (!dbUser)          return null
      if (dbUser.deletedAt) return null

      // Admin force-logout: any JWT issued before forceLogoutAt is invalidated immediately
      if (dbUser.forceLogoutAt && token.iat && token.iat * 1000 < dbUser.forceLogoutAt.getTime()) return null

      // Concurrent session guard: if token was replaced (OTP verify), invalidate this JWT
      if (
        token.activeSessionToken &&
        dbUser.activeSessionToken !== token.activeSessionToken
      ) {
        return null
      }

      // sessionVersion drift signals a webhook fired (renewal, purchase, cancellation).
      // Refresh the token data but do NOT invalidate — logging the user out on every
      // Stripe event (which increments sessionVersion) is wrong UX.
      const tokenVersion = (token.sessionVersion as number | undefined) ?? 0
      if (tokenVersion !== 0 && tokenVersion !== dbUser.sessionVersion) {
        console.info(`[auth] sessionVersion refreshed for ${userId}: ${tokenVersion} → ${dbUser.sessionVersion}`)
      }
      token.sessionVersion = dbUser.sessionVersion

      userPlanCache.set(userId, {
        plan:               dbUser.plan,
        subscriptionStatus: dbUser.subscriptionStatus,
        subscriptionEndsAt: dbUser.subscriptionEndsAt,
        role:               dbUser.role,
        emailVerified:      dbUser.emailVerified,
        sessionVersion:     dbUser.sessionVersion,
        activeSessionToken: dbUser.activeSessionToken,
        expiresAt:          now + CACHE_TTL_MS,
      })

      token.plan               = dbUser.plan
      token.subscriptionStatus = dbUser.subscriptionStatus
      token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString() ?? null
      token.role               = dbUser.role
      token.emailVerified      = dbUser.emailVerified?.toISOString() ?? null
      token.activeSessionToken = dbUser.activeSessionToken

      // fire-and-forget lastActiveAt update (runs at most every 5 min per user)
      db.user.update({
        where: { id: userId },
        data:  { lastActiveAt: new Date() },
      }).catch(() => {})

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id                 = token.id as string
        session.user.plan               = token.plan as string
        session.user.subscriptionStatus = token.subscriptionStatus as string | undefined
        session.user.subscriptionEndsAt = token.subscriptionEndsAt as string | null | undefined
        session.user.role               = token.role as string | undefined
        session.user.emailVerified      = (token.emailVerified ?? null) as unknown as (Date & string) | null
        session.user.sessionVersion     = token.sessionVersion as number | undefined
      }
      return session
    },
  },
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : undefined
      const sub = (token as { sub?: string } | null | undefined)?.sub
      if (sub) {
        await db.user.update({
          where: { id: sub },
          data: { activeSessionToken: null },
        }).catch(() => {})
        purgeUserCache(sub)
      }
    },
  },
})
