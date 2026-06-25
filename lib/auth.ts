import NextAuth, { CredentialsSignin } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "@/lib/bcrypt"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"
import { checkAndIncrementRateLimit, checkRateLimit, recordRateLimitFailure } from "@/lib/rate-limit"

const logger = createLogger("auth")

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials" as const
}
class ActiveSessionError extends CredentialsSignin {
  code = "active_session" as const
}
class SessionChallengeBlockedError extends CredentialsSignin {
  code = "session_challenge_blocked" as const
}
class RateLimitedError extends CredentialsSignin {
  code = "rate_limited" as const
}

// Login brute-force rate-limit settings
const LOGIN_RATE_LIMIT_EMAIL_MAX  = 5           // max failed attempts per email
const LOGIN_RATE_LIMIT_IP_MAX     = 10          // max failed attempts per IP (across all accounts)
const LOGIN_RATE_LIMIT_WINDOW_MS  = 15 * 60 * 1000  // 15 minutes

// Pre-computed dummy hash — ensures bcrypt runs even when user doesn't exist,
// equalizing response time and preventing user enumeration via timing.
const DUMMY_HASH = "$2b$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

const CACHE_TTL_MS        = 3 * 60 * 1000         // 3 minutes — short TTL; plan changes invalidate via sessionVersion
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000        // 30 min — used only in authorize stale-session check
const PURGE_INTERVAL_MS   = 5 * 60 * 1000         // opportunistic purge cadence (replaces global setInterval)

interface UserPlanCacheEntry {
  plan:                string
  subscriptionStatus:  string
  subscriptionEndsAt:  Date | null
  role:                string
  emailVerified:       Date | null
  sessionVersion:      number
  activeSessionToken:  string | null
  termsAcceptedAt:     Date | null
  isManaged:           boolean
  managedExpiresAt:    Date | null
  managedBlocked:      boolean
  expiresAt:           number
}

const userPlanCache = new Map<string, UserPlanCacheEntry>()

// Opportunistic purge — runs at most once per PURGE_INTERVAL_MS, triggered by cache reads.
// Avoids global setInterval which leaks timers under HMR / multi-instance deploys.
let lastPurgeAt = 0
function maybePurgeExpired() {
  const now = Date.now()
  if (now - lastPurgeAt < PURGE_INTERVAL_MS) return
  lastPurgeAt = now
  for (const [key, entry] of userPlanCache) {
    if (entry.expiresAt < now) userPlanCache.delete(key)
  }
}

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
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string

        // Extract client IP from trusted proxy headers (Dokploy/Hostinger environment).
        // Falls back to a sentinel so rate-limit still applies per-email even when IP is unavailable.
        const rawIp =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          "unknown"
        const ipKey = `ip:${rawIp}`

        // Pre-check: if the key is already blocked, bail out before touching the DB or running bcrypt.
        const [emailAllowed, ipAllowed] = await Promise.all([
          checkRateLimit(email, "login-password", LOGIN_RATE_LIMIT_EMAIL_MAX),
          checkRateLimit(ipKey,  "login-password", LOGIN_RATE_LIMIT_IP_MAX),
        ])
        if (!emailAllowed || !ipAllowed) {
          logger.warn("authorize: rate limited (pre-check)", { email, ip: rawIp, emailAllowed, ipAllowed })
          throw new RateLimitedError()
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id:                           true,
            email:                        true,
            name:                         true,
            image:                        true,
            password:                     true,
            deletedAt:                    true,
            activeSessionToken:           true,
            lastActiveAt:                 true,
            sessionChallengeBlockedUntil: true,
            plan:               true,
            subscriptionStatus: true,
            subscriptionEndsAt: true,
            role:               true,
            emailVerified:      true,
            sessionVersion:     true,
            isManaged:          true,
            managedExpiresAt:   true,
            managedBlocked:     true,
          },
        })

        if (!user || !user.password) {
          await bcrypt.compare(credentials.password as string, DUMMY_HASH)
          // Count user-not-found against IP only (email is unknown/invalid — no per-email counter).
          await recordRateLimitFailure(ipKey, "login-password")
          throw new InvalidCredentialsError()
        }
        if (user.deletedAt !== null) return null

        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) {
          // Atomically increment both counters and re-check limits.
          const [emailStillAllowed, ipStillAllowed] = await Promise.all([
            checkAndIncrementRateLimit(email, "login-password", LOGIN_RATE_LIMIT_EMAIL_MAX, LOGIN_RATE_LIMIT_WINDOW_MS),
            checkAndIncrementRateLimit(ipKey,  "login-password", LOGIN_RATE_LIMIT_IP_MAX,   LOGIN_RATE_LIMIT_WINDOW_MS),
          ])
          logger.warn("authorize: invalid password", {
            email,
            ip: rawIp,
            emailBlocked: !emailStillAllowed,
            ipBlocked:    !ipStillAllowed,
          })
          if (!emailStillAllowed || !ipStillAllowed) throw new RateLimitedError()
          throw new InvalidCredentialsError()
        }

        // Block if account is challenge-blocked
        if (user.sessionChallengeBlockedUntil && user.sessionChallengeBlockedUntil > new Date()) {
          throw new SessionChallengeBlockedError()
        }

        // Block if another session is active — unless it's stale or the JWT has naturally expired.
        // Token format: "uuid:expiresAt" — expiresAt is the ms timestamp when the JWT expires.
        // This lets authorize() detect natural JWT expiry without a DB migration or extra fields.
        if (user.activeSessionToken) {
          const storedExpiry = Number(user.activeSessionToken.split(":")[1])
          // Tokens without ":timestamp" suffix (old format) are treated as expired.
          const isExpired = isNaN(storedExpiry) || Date.now() > storedExpiry
          const isStale = !user.lastActiveAt ||
            Date.now() - user.lastActiveAt.getTime() > INACTIVITY_LIMIT_MS
          if (!isStale && !isExpired) throw new ActiveSessionError()
          // No need to null the old token separately — single UPDATE below overwrites it.
        }

        // Embed expiry in token so authorize() can detect natural JWT expiry on next login attempt.
        const sessionExpiresAt = Date.now() + 24 * 60 * 60 * 1000  // mirrors session.maxAge
        const activeSessionToken = `${crypto.randomUUID()}:${sessionExpiresAt}`
        await db.user.update({
          where: { id: user.id },
          data: { activeSessionToken, sessionChallengeAttempts: 0, sessionChallengeBlockedUntil: null },
        })

        // Return plan data so jwt() callback can skip the second DB read on fresh login.
        return {
          id:                 user.id,
          email:              user.email,
          name:               user.name,
          image:              user.image,
          activeSessionToken,
          plan:               user.plan,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndsAt: user.subscriptionEndsAt,
          role:               user.role,
          emailVerified:      user.emailVerified,
          sessionVersion:     user.sessionVersion,
          isManaged:          user.isManaged,
          managedExpiresAt:   user.managedExpiresAt,
          managedBlocked:     user.managedBlocked,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id as string },
          select: { termsAcceptedAt: true },
        })
        if (dbUser && !dbUser.termsAcceptedAt) {
          return "/accept-terms"
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      const isFreshLogin = !!user  // user arg only present on sign-in, not token refreshes

      if (user) {
        token.id = user.id
        token.activeSessionToken = (user as { activeSessionToken?: string }).activeSessionToken ?? null

        // Credentials login: authorize() pre-fetches plan data — skip the jwt DB read entirely.
        // Google OAuth users won't have `plan` set on the user object, so they fall through.
        const prefetched = user as {
          plan?: string; subscriptionStatus?: string; subscriptionEndsAt?: Date | null
          role?: string; emailVerified?: Date | null; sessionVersion?: number
          isManaged?: boolean; managedExpiresAt?: Date | null; managedBlocked?: boolean
        }
        if (prefetched.plan !== undefined && user.id) {
          const now = Date.now()
          token.plan               = prefetched.plan
          token.subscriptionStatus = prefetched.subscriptionStatus ?? ""
          token.subscriptionEndsAt = prefetched.subscriptionEndsAt?.toISOString() ?? null
          token.role               = prefetched.role ?? "USER"
          token.emailVerified      = prefetched.emailVerified?.toISOString() ?? null
          token.sessionVersion     = prefetched.sessionVersion ?? 1
          token.isManaged          = prefetched.isManaged ?? false
          token.managedExpiresAt   = prefetched.managedExpiresAt?.toISOString() ?? null
          token.managedBlocked     = prefetched.managedBlocked ?? false
          userPlanCache.set(user.id, {
            plan:               prefetched.plan as string,
            subscriptionStatus: prefetched.subscriptionStatus ?? "",
            subscriptionEndsAt: prefetched.subscriptionEndsAt ?? null,
            role:               prefetched.role ?? "USER",
            emailVerified:      prefetched.emailVerified ?? null,
            sessionVersion:     prefetched.sessionVersion ?? 1,
            activeSessionToken: (token.activeSessionToken as string | null) ?? null,
            termsAcceptedAt:    null,
            isManaged:          prefetched.isManaged ?? false,
            managedExpiresAt:   prefetched.managedExpiresAt ?? null,
            managedBlocked:     prefetched.managedBlocked ?? false,
            expiresAt:          now + CACHE_TTL_MS,
          })
          const uid = user.id as string
          db.user.update({ where: { id: uid }, data: { lastActiveAt: new Date() } })
            .catch((e) => logger.error("lastActiveAt update failed", { userId: uid }, e instanceof Error ? e : undefined))
          return token
        }

        // Google OAuth path: purge cache and fall through to DB read below.
        if (user.id) userPlanCache.delete(user.id)
      }
      if (trigger === "update") {
        const uid = token.id as string | undefined
        if (uid) userPlanCache.delete(uid)
        // Fast path: if termsAcceptedAt was passed in the update() call, set it immediately
        // without a DB roundtrip. The API route already validated + saved it to DB.
        const sessionData = session as { termsAcceptedAt?: string } | undefined
        if (sessionData?.termsAcceptedAt) {
          token.termsAcceptedAt = sessionData.termsAcceptedAt
          return token
        }
      }

      const userId = (token.id ?? user?.id) as string | undefined
      if (!userId) return token

      // Google OAuth fresh login: assign single-session token.
      // Credentials users get this in authorize(); Google users don't, so we set it here.
      if (isFreshLogin && !token.activeSessionToken) {
        const sessionExpiresAt = Date.now() + 24 * 60 * 60 * 1000
        const googleSessionToken = `${crypto.randomUUID()}:${sessionExpiresAt}`
        let assigned = false
        await db.user.update({ where: { id: userId }, data: { activeSessionToken: googleSessionToken } })
          .then(() => { assigned = true })
          .catch((e) => logger.error("Google OAuth: activeSessionToken assign failed", { userId }, e instanceof Error ? e : undefined))
        if (assigned) token.activeSessionToken = googleSessionToken
      }

      maybePurgeExpired()
      const now = Date.now()
      const cached = userPlanCache.get(userId)

      if (cached && cached.expiresAt > now) {
        // Cache hit: if activeSessionToken diverged, the cache may be stale (race between
        // replicas or a concurrent login). Never return null here — bust and re-read from DB.
        if (token.activeSessionToken && cached.activeSessionToken !== token.activeSessionToken) {
          logger.warn("jwt: cache hit token mismatch — busting cache, re-reading DB", {
            userId,
            tokenHas: token.activeSessionToken as string,
            cacheHas: cached.activeSessionToken ?? undefined,
          })
          userPlanCache.delete(userId)
          // fall through to DB read below
        } else {
          // Cross-replica cache invalidation: if webhook incremented sessionVersion in DB, the JWT
          // already carries the new version (set by the replica that processed the webhook).
          // Bust the local cache so this replica also picks up the fresh state (e.g. plan downgrade).
          const tokenVersion = (token.sessionVersion as number | undefined) ?? 0
          if (tokenVersion !== 0 && tokenVersion !== cached.sessionVersion) {
            userPlanCache.delete(userId)
            // fall through to DB read below
          } else {
            token.plan               = cached.plan
            token.subscriptionStatus = cached.subscriptionStatus
            token.subscriptionEndsAt = cached.subscriptionEndsAt?.toISOString() ?? null
            token.role               = cached.role
            token.emailVerified      = cached.emailVerified?.toISOString() ?? null
            token.isManaged          = cached.isManaged
            token.managedExpiresAt   = cached.managedExpiresAt?.toISOString() ?? null
            token.managedBlocked     = cached.managedBlocked ?? false
            return token
          }
        }
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
          termsAcceptedAt:    true,
          isManaged:          true,
          managedExpiresAt:   true,
          managedBlocked:     true,
        },
      })

      if (!dbUser) {
        logger.error("jwt: LOGOUT — user not found in DB", { userId })
        return null
      }
      if (dbUser.deletedAt) {
        logger.error("jwt: LOGOUT — user soft-deleted", { userId })
        return null
      }

      // Admin force-logout: any JWT issued before forceLogoutAt is invalidated immediately
      if (dbUser.forceLogoutAt && token.iat && token.iat * 1000 < dbUser.forceLogoutAt.getTime()) {
        logger.error("jwt: LOGOUT — forceLogoutAt", { userId, forceLogoutAt: dbUser.forceLogoutAt?.toISOString(), iat: token.iat })
        return null
      }

      // Concurrent session guard: if token was replaced (OTP verify or concurrent login), invalidate
      // this JWT. Also clear the DB token so the user can re-login immediately without ActiveSessionError.
      if (
        token.activeSessionToken &&
        dbUser.activeSessionToken !== token.activeSessionToken
      ) {
        logger.error("jwt: LOGOUT — activeSessionToken mismatch (clearing DB token for re-login)", {
          userId,
          tokenHas: token.activeSessionToken as string,
          dbHas: dbUser.activeSessionToken ?? undefined,
        })
        await db.user.update({ where: { id: userId }, data: { activeSessionToken: null } }).catch((err) => {
          logger.error("JWT callback: clear activeSessionToken failed", { userId }, err instanceof Error ? err : undefined)
        })
        purgeUserCache(userId)
        return null
      }

      // sessionVersion drift signals a webhook fired (renewal, purchase, cancellation).
      // Refresh the token data but do NOT invalidate — logging the user out on every
      // Stripe event (which increments sessionVersion) is wrong UX.
      const tokenVersion = (token.sessionVersion as number | undefined) ?? 0
      if (tokenVersion !== 0 && tokenVersion !== dbUser.sessionVersion) {
        logger.info("jwt: sessionVersion refreshed", { userId, from: tokenVersion, to: dbUser.sessionVersion })
        purgeUserCache(userId)
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
        termsAcceptedAt:    (dbUser as { termsAcceptedAt?: Date | null }).termsAcceptedAt ?? null,
        isManaged:          dbUser.isManaged,
        managedExpiresAt:   dbUser.managedExpiresAt,
        managedBlocked:     dbUser.managedBlocked,
        expiresAt:          now + CACHE_TTL_MS,
      })

      token.plan               = dbUser.plan
      token.subscriptionStatus = dbUser.subscriptionStatus
      token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString() ?? null
      token.role               = dbUser.role
      token.emailVerified      = dbUser.emailVerified?.toISOString() ?? null
      token.activeSessionToken = dbUser.activeSessionToken
      token.termsAcceptedAt    = (dbUser as { termsAcceptedAt?: Date | null }).termsAcceptedAt?.toISOString() ?? null
      token.isManaged          = dbUser.isManaged
      token.managedExpiresAt   = dbUser.managedExpiresAt?.toISOString() ?? null
      token.managedBlocked     = dbUser.managedBlocked

      // fire-and-forget lastActiveAt update (runs at most every 5 min per user)
      db.user.update({
        where: { id: userId },
        data:  { lastActiveAt: new Date() },
      }).catch((e) => logger.error("lastActiveAt update failed", { userId }, e instanceof Error ? e : undefined))

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
        session.user.termsAcceptedAt    = token.termsAcceptedAt as string | null | undefined
        session.user.isManaged          = (token.isManaged as boolean | undefined) ?? false
        session.user.managedExpiresAt   = token.managedExpiresAt as string | null | undefined
        session.user.managedBlocked     = (token.managedBlocked as boolean | undefined) ?? false
      }
      return session
    },
  },
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : undefined
      const sub = (token as { sub?: string; id?: string } | null | undefined)?.sub
               ?? (token as { sub?: string; id?: string } | null | undefined)?.id
      if (sub) {
        await db.user.update({
          where: { id: sub },
          data: { activeSessionToken: null },
        }).catch((e) => logger.error("signOut activeSessionToken clear failed — user may be blocked on next login", { userId: sub }, e instanceof Error ? e : undefined))
        purgeUserCache(sub)
      }
    },
  },
})
